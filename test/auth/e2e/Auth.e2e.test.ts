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

const VALID_USERNAME = 'validUser123';
const VALID_EMAIL = 'email@email.com';
const VALID_PASSWORD = 'validPassword123!';

const register = (body: object) => request(app).post('/api/auth/register').send(body);
const login = (body: object) => request(app).post('/api/auth/login').send(body);
const refreshToken = (cookies: string[]) =>
  request(app).post('/api/auth/refresh-token').set('Cookie', cookies).send();
const getMe = (accessToken: string) =>
  request(app).get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`);
const logout = (accessToken: string) =>
  request(app).post('/api/auth/logout').set('Authorization', `Bearer ${accessToken}`);
const verifyEmail = (token: string) => request(app).get('/api/auth/verify-email').query({ token });
const resendVerification = (body: object) =>
  request(app).post('/api/auth/resend-verification').send(body);
const forgotPassword = (body: object) => request(app).post('/api/auth/forgot-password').send(body);
const resetPassword = (token: string, body: object) =>
  request(app).post('/api/auth/reset-password').query({ token }).send(body);

describe('Auth E2E Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const res = await register({
        username: VALID_USERNAME,
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
      });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('User registered successfully');
      expect(res.body.data).toMatchObject({
        username: VALID_USERNAME.toLowerCase(),
        email: VALID_EMAIL,
        status: 'PENDING',
      });
    });

    it('should not register a user with an already used email', async () => {
      await register({ username: 'otheruser', email: VALID_EMAIL, password: VALID_PASSWORD });
      const res = await register({
        username: 'anotheruser',
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Email already in use');
    });

    it('should not register a user with an already used username', async () => {
      await register({
        username: VALID_USERNAME,
        email: 'otheremail@email.com',
        password: VALID_PASSWORD,
      });
      const res = await register({
        username: VALID_USERNAME,
        email: 'nekfhrb@gmail.com',
        password: VALID_PASSWORD,
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Username already in use');
    });

    it('should not register a user with invalid email', async () => {
      const res = await register({
        username: 'validusername',
        email: 'invalid-email',
        password: VALID_PASSWORD,
      });
      expect(res.status).toBe(400);
    });

    it('should not register a user with weak password', async () => {
      const res = await register({
        username: 'validusername',
        email: 'email@email.com',
        password: 'weak',
      });
      expect(res.status).toBe(400);
    });

    it('should not register a user with invalid username', async () => {
      const res = await register({
        username: 'invalid username',
        email: 'email@email.com',
        password: VALID_PASSWORD,
      });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login a user with valid credentials', async () => {
      await register({ username: VALID_USERNAME, email: VALID_EMAIL, password: VALID_PASSWORD });
      const res = await login({ email: VALID_EMAIL, password: VALID_PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Login successful');
      expect(res.body).toHaveProperty('accessToken');
    });

    it('should not login with invalid credentials', async () => {
      const res = await login({ email: VALID_EMAIL, password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });

    it('should return 400 with missing body fields', async () => {
      const res = await login({ email: VALID_EMAIL });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should refresh access token with valid refresh token cookie', async () => {
      await register({ username: VALID_USERNAME, email: VALID_EMAIL, password: VALID_PASSWORD });
      const loginRes = await login({ email: VALID_EMAIL, password: VALID_PASSWORD });
      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      const refreshRes = await refreshToken(cookies);
      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body).toHaveProperty('accessToken');
    });

    it('should return 401 without a refresh token cookie', async () => {
      const res = await request(app).post('/api/auth/refresh-token').send();
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return the current user profile', async () => {
      await register({ username: VALID_USERNAME, email: VALID_EMAIL, password: VALID_PASSWORD });
      const loginRes = await login({ email: VALID_EMAIL, password: VALID_PASSWORD });
      const res = await getMe(loginRes.body.accessToken);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User retrieved successfully');
      expect(res.body.data).toMatchObject({
        username: VALID_USERNAME.toLowerCase(),
        email: VALID_EMAIL,
      });
    });

    it('should return 401 without a token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      await register({ username: VALID_USERNAME, email: VALID_EMAIL, password: VALID_PASSWORD });
      const loginRes = await login({ email: VALID_EMAIL, password: VALID_PASSWORD });
      const res = await logout(loginRes.body.accessToken);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logout successful');
    });

    it('should return 401 without a token', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/verify-email', () => {
    it('should verify email with a valid token', async () => {
      await register({ username: VALID_USERNAME, email: VALID_EMAIL, password: VALID_PASSWORD });
      const doc = await UserModel.findOne({ email: VALID_EMAIL });
      const token = doc!.verificationToken!.token;
      const res = await verifyEmail(token);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Email verified successfully');
    });

    it('should return 404 with an invalid token', async () => {
      const res = await verifyEmail('invalid-token-xyz');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    it('should respond silently for an existing PENDING user', async () => {
      await register({ username: VALID_USERNAME, email: VALID_EMAIL, password: VALID_PASSWORD });
      const res = await resendVerification({ email: VALID_EMAIL });
      expect(res.status).toBe(200);
    });

    it('should respond silently for a non-existent email', async () => {
      const res = await resendVerification({ email: 'unknown@email.com' });
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should respond silently for an existing user', async () => {
      await register({ username: VALID_USERNAME, email: VALID_EMAIL, password: VALID_PASSWORD });
      const res = await forgotPassword({ email: VALID_EMAIL });
      expect(res.status).toBe(200);
    });

    it('should respond silently for a non-existent email', async () => {
      const res = await forgotPassword({ email: 'notfound@email.com' });
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset the password with a valid token', async () => {
      await register({ username: VALID_USERNAME, email: VALID_EMAIL, password: VALID_PASSWORD });
      await forgotPassword({ email: VALID_EMAIL });
      const doc = await UserModel.findOne({ email: VALID_EMAIL });
      const token = doc!.passwordResetToken!.token;
      const res = await resetPassword(token, { newPassword: 'newPassword123!' });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Password reset successful');
    });

    it('should return 404 with an invalid token', async () => {
      const res = await resetPassword('invalid-token-xyz', { newPassword: 'newPassword123!' });
      expect(res.status).toBe(404);
    });
  });
});
