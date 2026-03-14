import { describe, expect, it, vi } from 'vitest';
import { ExpiringTokenVO } from '../../../src/shared/domain/value-objects/expiringToken.vo';

describe('ExpiringTokenVO', () => {
  describe('generate()', () => {
    it('should generate a token with a hex string value', () => {
      const token = ExpiringTokenVO.generate(15);

      expect(typeof token.value).toBe('string');
      expect(token.value).toHaveLength(64); // 32 bytes = 64 hex chars
    });
    it('should set expiresAt in the future based on expiresInMinutes', () => {
      const before = Date.now();
      const token = ExpiringTokenVO.generate(30);
      const after = Date.now();

      const expectedMin = before + 30 * 60 * 1000;
      const expectedMax = after + 30 * 60 * 1000;
      expect(token.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(token.expiresAt.getTime()).toBeLessThanOrEqual(expectedMax);
    });
    it('should generate unique tokens each time', () => {
      const a = ExpiringTokenVO.generate(15);
      const b = ExpiringTokenVO.generate(15);

      expect(a.value).not.toBe(b.value);
    });
  });

  describe('fromPersistence()', () => {
    it('should reconstruct a token from value and expiresAt', () => {
      const expiresAt = new Date(Date.now() + 60_000);
      const token = ExpiringTokenVO.fromPersistence('abc123', expiresAt);

      expect(token.value).toBe('abc123');
      expect(token.expiresAt).toBe(expiresAt);
    });
  });

  describe('isExpired()', () => {
    it('should return false for a token that has not yet expired', () => {
      const token = ExpiringTokenVO.generate(15);

      expect(token.isExpired()).toBe(false);
    });
    it('should return true for a token whose expiresAt is in the past', () => {
      vi.useFakeTimers();
      const token = ExpiringTokenVO.generate(15);

      vi.advanceTimersByTime(16 * 60 * 1000);

      expect(token.isExpired()).toBe(true);
      vi.useRealTimers();
    });
  });

  describe('matches()', () => {
    it('should return true when the provided token matches', () => {
      const token = ExpiringTokenVO.generate(15);

      expect(token.matches(token.value)).toBe(true);
    });
    it('should return false when the provided token does not match', () => {
      const token = ExpiringTokenVO.generate(15);

      expect(token.matches('wrong-token')).toBe(false);
    });
  });
});
