import { describe, it, expect } from 'vitest';
import { validate, required, maxLength, pattern } from '@/utils/validate';

describe('validate', () => {
    describe('required', () => {
        it('returns error for empty string', () => {
            expect(required()('')).toBe('This field is required');
        });
        it('returns error for whitespace-only', () => {
            expect(required()('   ')).toBe('This field is required');
        });
        it('returns null for non-empty', () => {
            expect(required()('hello')).toBeNull();
        });
        it('supports custom message', () => {
            expect(required('Name is required')('')).toBe('Name is required');
        });
    });

    describe('maxLength', () => {
        it('returns null within limit', () => {
            expect(maxLength(10)('short')).toBeNull();
        });
        it('returns error over limit', () => {
            expect(maxLength(3)('long')).toBe('Max 3 characters');
        });
    });

    describe('pattern', () => {
        it('returns null on match', () => {
            expect(pattern(/^[A-Z]+$/, 'Uppercase only')('ABC')).toBeNull();
        });
        it('returns error on mismatch', () => {
            expect(pattern(/^[A-Z]+$/, 'Uppercase only')('abc')).toBe('Uppercase only');
        });
        it('skips empty string', () => {
            expect(pattern(/^[A-Z]+$/, 'Uppercase only')('')).toBeNull();
        });
    });

    describe('validate (composite)', () => {
        it('returns first error', () => {
            const result = validate('', [required(), maxLength(10)]);
            expect(result).toBe('This field is required');
        });
        it('returns null when all pass', () => {
            const result = validate('NEXUS', [required(), pattern(/^[A-Z][A-Z0-9-]*$/, 'Bad format'), maxLength(10)]);
            expect(result).toBeNull();
        });
        it('catches second rule failure', () => {
            const result = validate('nexus', [required(), pattern(/^[A-Z][A-Z0-9-]*$/, 'Bad format')]);
            expect(result).toBe('Bad format');
        });
    });
});
