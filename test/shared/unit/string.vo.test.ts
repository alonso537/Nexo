import { describe, expect, it } from 'vitest';
import { EmailVo } from '../../../src/modules/user/domain/value-objects/email.vo';
import { UsernameVO } from '../../../src/modules/user/domain/value-objects/username.vo';
import { AppError } from '../../../src/shared/domain/errors/AppError';
import { StringVo } from '../../../src/shared/domain/value-objects/string.vo';

describe('StringVo (via EmailVo)', () => {
  describe('validate()', () => {
    it('should throw for an empty string', () => {
      expect(() => EmailVo.create('')).toThrow(AppError);
    });

    it('should throw for a whitespace-only string', () => {
      expect(() => EmailVo.create('   ')).toThrow(AppError);
    });
  });

  describe('equals()', () => {
    it('should return true when two VOs have the same value', () => {
      const a = EmailVo.create('test@gmail.com');
      const b = EmailVo.create('test@gmail.com');
      expect(a.equals(b)).toBe(true);
    });

    it('should return false when two VOs have different values', () => {
      const a = EmailVo.create('a@gmail.com');
      const b = EmailVo.create('b@gmail.com');
      expect(a.equals(b)).toBe(false);
    });

    it('should return false when two VOs are of different subclasses', () => {
      const email = EmailVo.create('test@gmail.com');
      const username = UsernameVO.create('testuser');
      expect(email.equals(username)).toBe(false);
    });
  });

  describe('toString()', () => {
    it('should return the underlying string value', () => {
      const email = EmailVo.create('test@gmail.com');
      expect(email.toString()).toBe('test@gmail.com');
    });
  });

  describe('instanceof', () => {
    it('concrete VO should be an instance of StringVo', () => {
      expect(EmailVo.create('test@gmail.com')).toBeInstanceOf(StringVo);
    });
  });
});
