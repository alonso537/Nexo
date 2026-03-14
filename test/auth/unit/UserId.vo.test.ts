import { describe, expect, it } from 'vitest';
import { UserIdVO } from '../../../src/modules/user/domain/value-objects/userId.vo';
import { AppError } from '../../../src/shared/domain/errors/AppError';
import { UuidVO } from '../../../src/shared/domain/value-objects/uuid.vo';

describe('UserId Value Object', () => {
  describe('generate()', () => {
    it('should generate a valid UUID', () => {
      const id = UserIdVO.generate();
      expect(id).toBeInstanceOf(UserIdVO);
    });
    it('error when invalid UUID string is provided', () => {
      expect(() => UserIdVO.fromString('invalid-uuid')).toThrow(AppError);
    });
    it('should be an instance of UuidVO', () => {
      const id = UserIdVO.generate();
      expect(id).toBeInstanceOf(UuidVO);
    });
    it('should generate different UUIDs each time', () => {
      const a = UserIdVO.generate();
      const b = UserIdVO.generate();
      expect(a.toString()).not.toBe(b.toString());
    });
  });

  describe('equals()', () => {
    it('should return true when two UserIdVOs have the same value', () => {
      const id = '01965b5e-a3c7-7000-8000-000000000001';
      const a = UserIdVO.fromString(id);
      const b = UserIdVO.fromString(id);
      expect(a.equals(b)).toBe(true);
    });
    it('should return false when two UserIdVOs have different values', () => {
      const a = UserIdVO.generate();
      const b = UserIdVO.generate();
      expect(a.equals(b)).toBe(false);
    });
    it.todo('should return false when compared with a different VO type');
  });

  it('should create a UserIdVO from a valid UUID string', () => {
    const id = UserIdVO.fromString('01965b5e-a3c7-7000-8000-000000000001');
    expect(id).toBeInstanceOf(UserIdVO);
    expect(id.toString()).toBe('01965b5e-a3c7-7000-8000-000000000001');
  });
});
