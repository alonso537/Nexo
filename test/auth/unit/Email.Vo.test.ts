import { describe, expect, it } from "vitest";
import { EmailVo } from '../../../src/modules/user/domain/value-objects/email.vo';
import { UsernameVO } from '../../../src/modules/user/domain/value-objects/username.vo';
import { AppError } from "../../../src/shared/domain/errors/AppError";
import { StringVo } from "../../../src/shared/domain/value-objects/string.vo";

const VALID_EMAIL = 'example@gmail.com'

describe('Email Value Object', () => {
    describe('validate()', () => {
        it('should return true for valid email', () => {
            const email = EmailVo.create(VALID_EMAIL);
            expect(email).toBeInstanceOf(EmailVo);
        })
        it('should return false for invalid email', () => {
            expect(() => EmailVo.create('inavild-email.com')).toThrow(AppError)
        })
        it('should return false for email without @ symbol', () => {
            expect(() => EmailVo.create('invalidemail.com')).toThrow(AppError)
        })
        it('should return false for email without domain', () => {
            expect(() => EmailVo.create('invalid@')).toThrow(AppError)
        })
        it('should return false for empty email', () => {
            expect(() => EmailVo.create('')).toThrow(AppError)
        })
        it('should return false for email with only spaces', () => {
            expect(() => EmailVo.create('   ')).toThrow(AppError)
         })
         it('should be an instance of StringVo', () => {
            const email = EmailVo.create(VALID_EMAIL);
            expect(email).toBeInstanceOf(StringVo);
         })
    })

    describe('equals()', () => {
        it('should return true when two EmailVos have the same value', () => {
            const a = EmailVo.create('test@gmail.com');
            const b = EmailVo.create('test@gmail.com');
            expect(a.equals(b)).toBe(true);
        });
        it('should return false when two EmailVos have different values', () => {
            const a = EmailVo.create('test@gmail.com');
            const b = EmailVo.create('other@gmail.com');
            expect(a.equals(b)).toBe(false);
        });
        it('should return false when compared with a different VO type', () => {
            const email = EmailVo.create('test@gmail.com');
            const username = UsernameVO.create('testuser');
            expect(email.equals(username)).toBe(false);
        });
    })
})