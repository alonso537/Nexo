import { describe, expect, it } from 'vitest';
import { AppError } from '../../../src/shared/domain/errors/AppError';

describe('AppError', () => {
  describe('constructor', () => {
    it('should set message, statusCode, and code correctly', () => {
      const error = new AppError('Something went wrong', 400, 'BAD_REQUEST');

      expect(error.message).toBe('Something went wrong');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
    });
    it('should default statusCode to 500 when not provided', () => {
      const error = new AppError('Oops');

      expect(error.statusCode).toBe(500);
    });
    it('should default code to INTERNAL_SERVER_ERROR when not provided', () => {
      const error = new AppError('Oops');

      expect(error.code).toBe('INTERNAL_SERVER_ERROR');
    });
    it('should set details when provided', () => {
      const details = { field: 'email', issue: 'invalid' };
      const error = new AppError('Validation failed', 422, 'VALIDATION_ERROR', details);

      expect(error.details).toEqual(details);
    });
    it('should be an instance of Error', () => {
      const error = new AppError('Oops', 500, 'ERR');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });
    it('should set name to AppError', () => {
      const error = new AppError('Oops', 500, 'ERR');

      expect(error.name).toBe('AppError');
    });
  });
});
