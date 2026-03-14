import { describe, expect, it } from 'vitest';
import { PersonNameVO } from '../../../src/modules/user/domain/value-objects/personName.vo';
import { StringVo } from '../../../src/shared/domain/value-objects/string.vo';
import { AppError } from '../../../src/shared/domain/errors/AppError';

const VALID_NAME = 'John Doe';

describe('PersonName Value Object', () => {
  describe('validate()', () => {
    it('should return true for valid person name', () => {
      const name = PersonNameVO.create(VALID_NAME);
      expect(name).toBeInstanceOf(PersonNameVO);
    });
    it('should return false for person name with numbers', () => {
      expect(() => PersonNameVO.create('John Doe123')).toThrow(AppError);
    });
    it('should return false for person name with special characters', () => {
      expect(() => PersonNameVO.create('John@Doe')).toThrow(AppError);
    });
    it('should return false for empty person name', () => {
      expect(() => PersonNameVO.create('')).toThrow(AppError);
    });
    it('should return false for person name with only spaces', () => {
      expect(() => PersonNameVO.create('   ')).toThrow(AppError);
    });
    it('should be an instance of StringVo', () => {
      const name = PersonNameVO.create(VALID_NAME);
      expect(name).toBeInstanceOf(StringVo);
    });
    it('should return false for person name that is too short (1 char)', () => {
      expect(() => PersonNameVO.create('J')).toThrow(AppError);
    });
  });

  describe('equals()', () => {
    it('should return true when two PersonNameVOs have the same value', () => {
      const a = PersonNameVO.create('John');
      const b = PersonNameVO.create('John');
      expect(a.equals(b)).toBe(true);
    });
    it('should return false when two PersonNameVOs have different values', () => {
      const a = PersonNameVO.create('John');
      const b = PersonNameVO.create('Jane');
      expect(a.equals(b)).toBe(false);
    });
  });
});
