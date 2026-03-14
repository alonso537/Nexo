import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../../../src/app';
import request from 'supertest';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { UserModel } from '../../../src/modules/user/infrastructure/db/mongo/models/user';

let mongoD: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
  mongoD = await MongoMemoryServer.create();
  await mongoose.connect(mongoD.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoD.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

const VALID_PASSWORD = 'validPassword123!';

interface AuthSession {
  accessToken: string;
  cookies: string[];
  userId: string;
  username: string;
  email: string;
}

async function registerAndLogin(
  username: string,
  email: string,
  password = VALID_PASSWORD,
): Promise<AuthSession> {
  await request(app).post('/api/auth/register').send({ username, email, password });
  const loginRes = await request(app).post('/api/auth/login').send({ email, password });
  const accessToken: string = loginRes.body.accessToken;
  const cookies = loginRes.headers['set-cookie'] as unknown as string[];
  const meRes = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${accessToken}`);
  return { accessToken, cookies, userId: meRes.body.data.id, username, email };
}

async function registerAdminAndLogin(username: string, email: string): Promise<AuthSession> {
  const session = await registerAndLogin(username, email);
  await UserModel.updateOne({ email }, { $set: { role: 'ADMIN' } });
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password: VALID_PASSWORD });
  const accessToken: string = loginRes.body.accessToken;
  const cookies = loginRes.headers['set-cookie'] as unknown as string[];
  return { ...session, accessToken, cookies };
}

async function registerSuperAdminAndLogin(username: string, email: string): Promise<AuthSession> {
  const session = await registerAndLogin(username, email);
  await UserModel.updateOne({ email }, { $set: { role: 'SUPER_ADMIN' } });
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password: VALID_PASSWORD });
  const accessToken: string = loginRes.body.accessToken;
  const cookies = loginRes.headers['set-cookie'] as unknown as string[];
  return { ...session, accessToken, cookies };
}

describe('User E2E Tests', () => {
  describe('GET /api/user', () => {
    it('should return all users for an admin', async () => {
      await registerAndLogin('regularuser', 'user@email.com');
      const admin = await registerAdminAndLogin('adminuser', 'admin@email.com');

      const res = await request(app)
        .get('/api/user')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Users retrieved successfully');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty('total');
    });

    it('should return 403 for a regular user', async () => {
      const user = await registerAndLogin('regularuser2', 'user2@email.com');

      const res = await request(app)
        .get('/api/user')
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 401 without a token', async () => {
      const res = await request(app).get('/api/user');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/user/:username', () => {
    it('should return a user by username', async () => {
      const user = await registerAndLogin('findmeuser', 'findme@email.com');

      const res = await request(app)
        .get(`/api/user/${user.username}`)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe(user.username.toLowerCase());
    });

    it('should return 404 for a non-existent username', async () => {
      const user = await registerAndLogin('someuser99', 'some99@email.com');

      const res = await request(app)
        .get('/api/user/nonexistentuser99')
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without a token', async () => {
      const res = await request(app).get('/api/user/someuser');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/user/name', () => {
    it('should update the user name', async () => {
      const user = await registerAndLogin('nameuser', 'name@email.com');

      const res = await request(app)
        .patch('/api/user/name')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ name: 'John' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Name updated successfully');
      expect(res.body.data.name).toBe('John');
    });

    it('should return 401 without a token', async () => {
      const res = await request(app).patch('/api/user/name').send({ name: 'John' });
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/user/last-name', () => {
    it('should update the user last name', async () => {
      const user = await registerAndLogin('lastnameuser', 'lastname@email.com');

      const res = await request(app)
        .patch('/api/user/last-name')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ lastName: 'Doe' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Last name updated successfully');
      expect(res.body.data.lastName).toBe('Doe');
    });

    it('should return 401 without a token', async () => {
      const res = await request(app).patch('/api/user/last-name').send({ lastName: 'Doe' });
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/user/username', () => {
    it('should update the username', async () => {
      const user = await registerAndLogin('oldusername', 'username@email.com');

      const res = await request(app)
        .patch('/api/user/username')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ username: 'newusername' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Username updated successfully');
      expect(res.body.data.username).toBe('newusername');
    });

    it('should return 400 when username is already in use', async () => {
      await registerAndLogin('takenusername', 'taken@email.com');
      const user = await registerAndLogin('otherusername', 'other@email.com');

      const res = await request(app)
        .patch('/api/user/username')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ username: 'takenusername' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without a token', async () => {
      const res = await request(app).patch('/api/user/username').send({ username: 'newname' });
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/user/email', () => {
    it('should update the email', async () => {
      const user = await registerAndLogin('emailupdateuser', 'old@email.com');

      const res = await request(app)
        .patch('/api/user/email')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ newEmail: 'new@email.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe(
        'Email updated successfully. Please verify your new email address.',
      );
    });

    it('should return 400 when email is already in use', async () => {
      await registerAndLogin('anotheruser', 'taken@email.com');
      const user = await registerAndLogin('myuser', 'mine@email.com');

      const res = await request(app)
        .patch('/api/user/email')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ newEmail: 'taken@email.com' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without a token', async () => {
      const res = await request(app).patch('/api/user/email').send({ newEmail: 'a@b.com' });
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/user/password', () => {
    it('should update the password with the correct current password', async () => {
      const user = await registerAndLogin('passworduser', 'pwd@email.com');

      const res = await request(app)
        .patch('/api/user/password')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ currentPassword: VALID_PASSWORD, newPassword: 'newPassword456!' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Password updated successfully');
    });

    it('should return 400 with wrong current password', async () => {
      const user = await registerAndLogin('passworduser2', 'pwd2@email.com');

      const res = await request(app)
        .patch('/api/user/password')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ currentPassword: 'WrongPassword!', newPassword: 'newPassword456!' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without a token', async () => {
      const res = await request(app)
        .patch('/api/user/password')
        .send({ currentPassword: VALID_PASSWORD, newPassword: 'newPassword456!' });
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/user/:id/role', () => {
    it('should allow an admin to change a user role to SUPPORT', async () => {
      const user = await registerAndLogin('targetuser', 'target@email.com');
      const admin = await registerAdminAndLogin('adminrole', 'adminrole@email.com');

      const res = await request(app)
        .patch(`/api/user/${user.userId}/role`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ role: 'SUPPORT' });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('SUPPORT');
    });

    it('should return 403 for a regular user', async () => {
      const user1 = await registerAndLogin('user1role', 'user1role@email.com');
      const user2 = await registerAndLogin('user2role', 'user2role@email.com');

      const res = await request(app)
        .patch(`/api/user/${user1.userId}/role`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ role: 'SUPPORT' });

      expect(res.status).toBe(403);
    });

    it('should return 401 without a token', async () => {
      const res = await request(app)
        .patch('/api/user/some-id/role')
        .send({ role: 'SUPPORT' });
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/user/:id/role/admin', () => {
    it('should allow a super admin to assign any role', async () => {
      const user = await registerAndLogin('targetadmin', 'targetadmin@email.com');
      const superAdmin = await registerSuperAdminAndLogin('superadminrole', 'superadminrole@email.com');

      const res = await request(app)
        .patch(`/api/user/${user.userId}/role/admin`)
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ role: 'ADMIN' });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('ADMIN');
    });

    it('should return 403 for a regular admin', async () => {
      const user = await registerAndLogin('targetadmin2', 'targetadmin2@email.com');
      const admin = await registerAdminAndLogin('adminrole2', 'adminrole2@email.com');

      const res = await request(app)
        .patch(`/api/user/${user.userId}/role/admin`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ role: 'ADMIN' });

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/user/:id/status/deactivate', () => {
    it('should allow an admin to deactivate a user', async () => {
      const user = await registerAndLogin('deactivateuser', 'deactivate@email.com');
      await UserModel.updateOne({ email: 'deactivate@email.com' }, { $set: { status: 'ACTIVE' } });
      const admin = await registerAdminAndLogin('admindeact', 'admindeact@email.com');

      const res = await request(app)
        .patch(`/api/user/${user.userId}/status/deactivate`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('INACTIVE');
    });

    it('should return 403 for a regular user', async () => {
      const user1 = await registerAndLogin('deact1', 'deact1@email.com');
      const user2 = await registerAndLogin('deact2', 'deact2@email.com');

      const res = await request(app)
        .patch(`/api/user/${user1.userId}/status/deactivate`)
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/user/:id/status/suspend', () => {
    it('should allow an admin to suspend a user', async () => {
      const user = await registerAndLogin('suspenduser', 'suspend@email.com');
      await UserModel.updateOne({ email: 'suspend@email.com' }, { $set: { status: 'ACTIVE' } });
      const admin = await registerAdminAndLogin('adminsusp', 'adminsusp@email.com');

      const res = await request(app)
        .patch(`/api/user/${user.userId}/status/suspend`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('SUSPENDED');
    });

    it('should return 403 for a regular user', async () => {
      const user1 = await registerAndLogin('susp1', 'susp1@email.com');
      const user2 = await registerAndLogin('susp2', 'susp2@email.com');

      const res = await request(app)
        .patch(`/api/user/${user1.userId}/status/suspend`)
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/user/:id/status/block', () => {
    it('should allow a super admin to block a user', async () => {
      const user = await registerAndLogin('blockuser', 'block@email.com');
      const superAdmin = await registerSuperAdminAndLogin('superadminblock', 'superadminblock@email.com');

      const res = await request(app)
        .patch(`/api/user/${user.userId}/status/block`)
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ reason: 'Policy violation' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('BLOCKED');
    });

    it('should return 403 for a regular admin', async () => {
      const user = await registerAndLogin('blockuser2', 'block2@email.com');
      const admin = await registerAdminAndLogin('adminblock', 'adminblock@email.com');

      const res = await request(app)
        .patch(`/api/user/${user.userId}/status/block`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ reason: 'Policy violation' });

      expect(res.status).toBe(403);
    });

    it('should return 401 without a token', async () => {
      const res = await request(app)
        .patch('/api/user/some-id/status/block')
        .send({ reason: 'Test' });
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/user/avatar', () => {
    it('should return 404 when the user has no avatar', async () => {
      const user = await registerAndLogin('avataruser', 'avatar@email.com');

      const res = await request(app)
        .delete('/api/user/avatar')
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without a token', async () => {
      const res = await request(app).delete('/api/user/avatar');
      expect(res.status).toBe(401);
    });
  });
});
