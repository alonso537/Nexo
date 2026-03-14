import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { UserRepositoryImpl } from '../../../src/modules/user/infrastructure/db/mongo/repositories/userRepository.impl';
import { UserEntity } from '../../../src/modules/user/domain/entities/user.entity';

let mongoDB: MongoMemoryServer;

beforeAll(async () => {
  mongoDB = await MongoMemoryServer.create();
  await mongoose.connect(mongoDB.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoDB.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

const VALID_USERNAME = 'validUser123';
const VALID_EMAIL = 'email@gmail.com';
const VALID_PASSWORD = 'validPassword123!';

describe('UserRepository Integration Tests', () => {
  let repository: UserRepositoryImpl;

  beforeAll(() => {
    repository = new UserRepositoryImpl();
  });

  describe('save() + findById()', () => {
    it('should save a user and find it by id', async () => {
      const user = await UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD);
      await repository.save(user);

       const found = await repository.findById(user.toPersistence().id as string);

      expect(found).not.toBeNull();
      expect(found!.toPersistence().username).toBe(VALID_USERNAME.toLowerCase());
      expect(found!.toPersistence().email).toBe(VALID_EMAIL);
      expect(found!.status).toBe('PENDING');
    });
    it('should return null if user is not found', async () => {
      const found = await repository.findById('nonexistentId');

      expect(found).toBeNull();
    });
    it('findByEmail() should find user by email', async () => {
      const user = await UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD);
      await repository.save(user);

      const found = await repository.findByEmail(VALID_EMAIL);

      expect(found).not.toBeNull();
      expect(found!.toPersistence().email).toBe(VALID_EMAIL);
      expect(found!.toPersistence().username).toBe(VALID_USERNAME.toLowerCase());
      expect(found!.status).toBe('PENDING');
    });
    it('should return null if is not found by email', async () => {
      const found = await repository.findByEmail('no-existe@email.com');

      expect(found).toBeNull();
    });
    it('findByUsername() should find user by username', async () => {
      const user = await UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD);
      await repository.save(user);

      const found = await repository.findByUsername(VALID_USERNAME.toLowerCase());

      expect(found).not.toBeNull();
      expect(found!.toPersistence().username).toBe(VALID_USERNAME.toLowerCase());
      expect(found!.toPersistence().email).toBe(VALID_EMAIL);
      expect(found!.status).toBe('PENDING');
    });
    it('should return null if is not found by username', async () => {
      const found = await repository.findByUsername('nonexistentuser');
      expect(found).toBeNull();
    });
  });
  describe('save() + upsert', () => {
    it('should update an existing user', async () => {
      const user = await UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD);
      await repository.save(user);

       const original = await repository.findById(user.toPersistence().id as string);
      const createdAtProginal = original!.toPersistence().createdAt as Date;

      // Update some fields
       user.activate((user.toPersistence().verificationToken as { value: string }).value);
      await repository.save(user);

      const updated = await repository.findById(user.toPersistence().id as string);
      const createdAtUpdated = updated!.toPersistence().createdAt as Date;

      expect(createdAtUpdated.getTime()).toBe(createdAtProginal.getTime());
      expect(updated!.status).toBe('ACTIVE');
    });
  });
  describe('delete()', () => {
    it('should delete a user', async () => {
      const user = await UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD);
      await repository.save(user);

         await repository.delete(user.toPersistence().id as string);

      const found = await repository.findById(user.toPersistence().id as string);
      expect(found).toBeNull();
    });
  });
});
