import { describe, expect, it } from 'vitest';
import { UsernameVO } from '../../../src/modules/user/domain/value-objects/username.vo';
import { AppError } from '../../../src/shared/domain/errors/AppError';

const VALID_USERNAME = 'validUser123';
const TO_SHORT_USERNAME = 'ab';

describe('Username Value Object', () => {
  describe('validate()', () => {
    it('should return true for valid username', () => {
      const username = UsernameVO.create(VALID_USERNAME);
      expect(username).toBeInstanceOf(UsernameVO);
    });
    it('should return false for username that is too short', () => {
      expect(() => UsernameVO.create(TO_SHORT_USERNAME)).toThrow(AppError);
    });
    it('should return false for username with invalid characters', () => {
      expect(() => UsernameVO.create('invalid user')).toThrow(AppError);
      expect(() => UsernameVO.create('invalid$user')).toThrow(AppError);
    });
    it('should return false for username that is too long', () => {
      const longUsername = 'a'.repeat(31);
      expect(() => UsernameVO.create(longUsername)).toThrow(AppError);
    });
    it('should return false for empty username', () => {
      expect(() => UsernameVO.create('')).toThrow(AppError);
    });
  });

  describe('equals()', () => {
    it('should return true when two UsernameVOs have the same value', () => {
      const a = UsernameVO.create('testuser');
      const b = UsernameVO.create('testuser');
      expect(a.equals(b)).toBe(true);
    });
    it('should return false when two UsernameVOs have different values', () => {
      const a = UsernameVO.create('testuser');
      const b = UsernameVO.create('otheruser');
      expect(a.equals(b)).toBe(false);
    });
  });
});
