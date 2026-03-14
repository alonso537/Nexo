import { describe, expect, it } from "vitest";
import { PhotoProfileVO } from '../../../src/modules/user/domain/value-objects/photoProfile.vo';
import { AppError } from "../../../src/shared/domain/errors/AppError";
import { StringVo } from "../../../src/shared/domain/value-objects/string.vo";

const VALID_S3_KEY = 'avatars/user-123_photo.jpg';

describe('PhotoProfile Value Object', () => {
    describe('validate()', () => {
        it('should return true for valid photo profile URL', () => {
            // Implement test for valid photo profile URL
            const photoProfile = PhotoProfileVO.create(VALID_S3_KEY);
            expect(photoProfile).toBeInstanceOf(PhotoProfileVO);
        })
        it('should return false for photo profile URL with spaces', () => {
            expect(() => PhotoProfileVO.create('invalid photo.jpg')).toThrow(AppError)
        })
        it('should return false for photo profile URL with invalid characters', () => {
            expect(() => PhotoProfileVO.create('invalid\\photo.jpg')).toThrow(AppError)
        })
        it('should return false for empty photo profile URL', () => {
            expect(() => PhotoProfileVO.create('')).toThrow(AppError)
        })
        it('should be an instance of StringVo', () => {
            const photoProfile = PhotoProfileVO.create(VALID_S3_KEY);
            expect(photoProfile).toBeInstanceOf(StringVo);
        })
    })

    describe('equals()', () => {
        it('should return true when two PhotoProfileVOs have the same value', () => {
            const a = PhotoProfileVO.create('avatars/user.jpg');
            const b = PhotoProfileVO.create('avatars/user.jpg');
            expect(a.equals(b)).toBe(true);
        });
        it('should return false when two PhotoProfileVOs have different values', () => {
            const a = PhotoProfileVO.create('avatars/user.jpg');
            const b = PhotoProfileVO.create('avatars/other.jpg');
            expect(a.equals(b)).toBe(false);
        });
    })
})