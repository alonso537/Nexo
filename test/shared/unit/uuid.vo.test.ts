import { describe, expect, it } from 'vitest';
import { UserIdVO } from '../../../src/modules/user/domain/value-objects/userId.vo';
import { AppError } from '../../../src/shared/domain/errors/AppError';

const VALID_UUID = '01965b5e-a3c7-7000-8000-000000000001';
const ANOTHER_VALID_UUID = '01965b5e-a3c7-7000-8000-000000000002';

describe('UuidVO (via UserIdVO)', () => {
  describe('validate()', () => {
    it('should accept a valid UUID', () => {
      const id = UserIdVO.fromString(VALID_UUID);
      expect(id).toBeInstanceOf(UserIdVO);
    });

    it('should throw for an empty string', () => {
      expect(() => UserIdVO.fromString('')).toThrow(AppError);
    });

    it('should throw for a non-UUID string', () => {
      expect(() => UserIdVO.fromString('not-a-uuid')).toThrow(AppError);
    });

    it('should throw for a UUID with invalid version (version 0)', () => {
      expect(() => UserIdVO.fromString('01965b5e-a3c7-0000-8000-000000000001')).toThrow(AppError);
    });
  });

  describe('generate()', () => {
    it('should generate a valid UUID', () => {
      const id = UserIdVO.generate();
      expect(id).toBeInstanceOf(UserIdVO);
    });

    it('should generate unique UUIDs', () => {
      const a = UserIdVO.generate();
      const b = UserIdVO.generate();
      expect(a.value).not.toBe(b.value);
    });
  });

  describe('toString()', () => {
    it('should return the UUID string', () => {
      const id = UserIdVO.fromString(VALID_UUID);
      expect(id.toString()).toBe(VALID_UUID);
    });
  });

  describe('equals()', () => {
    it('should return true when two UserIdVOs have the same value', () => {
      const a = UserIdVO.fromString(VALID_UUID);
      const b = UserIdVO.fromString(VALID_UUID);
      expect(a.equals(b)).toBe(true);
    });

    it('should return false when two UserIdVOs have different values', () => {
      const a = UserIdVO.fromString(VALID_UUID);
      const b = UserIdVO.fromString(ANOTHER_VALID_UUID);
      expect(a.equals(b)).toBe(false);
    });

    it.todo('should return false when compared with a different UuidVO subclass');
  });
});
