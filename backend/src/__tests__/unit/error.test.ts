/**
 * Unit Tests for Error Utilities
 * 
 * Tests the error handling utilities in isolation
 */

import { AppError, ErrorCodes } from '../../middleware/error';
import { ZodError, z } from 'zod';

describe('AppError', () => {
    it('should create an error with statusCode and code', () => {
        const error = new AppError('Test error', 400, ErrorCodes.VALIDATION_ERROR);

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(AppError);
        expect(error.message).toBe('Test error');
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
        expect(error.isOperational).toBe(true);
    });

    it('should default to INTERNAL_ERROR code', () => {
        const error = new AppError('Internal error', 500);

        expect(error.code).toBe(ErrorCodes.INTERNAL_ERROR);
    });

    it('should include details when provided', () => {
        const details = { field: 'email', reason: 'already exists' };
        const error = new AppError('Conflict', 409, ErrorCodes.DUPLICATE_ENTRY, details);

        expect(error.details).toEqual(details);
    });

    it('should have a stack trace', () => {
        const error = new AppError('Test', 400, ErrorCodes.VALIDATION_ERROR);

        expect(error.stack).toBeDefined();
        expect(error.stack).toContain('Test');
    });
});

describe('ErrorCodes', () => {
    it('should have authentication error codes', () => {
        expect(ErrorCodes.INVALID_CREDENTIALS).toBe('INVALID_CREDENTIALS');
        expect(ErrorCodes.EMAIL_EXISTS).toBe('EMAIL_EXISTS');
        expect(ErrorCodes.TOKEN_EXPIRED).toBe('TOKEN_EXPIRED');
        expect(ErrorCodes.TOKEN_INVALID).toBe('TOKEN_INVALID');
        expect(ErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED');
        expect(ErrorCodes.FORBIDDEN).toBe('FORBIDDEN');
    });

    it('should have resource error codes', () => {
        expect(ErrorCodes.PRODUCT_NOT_FOUND).toBe('PRODUCT_NOT_FOUND');
        expect(ErrorCodes.CATEGORY_NOT_FOUND).toBe('CATEGORY_NOT_FOUND');
        expect(ErrorCodes.ORDER_NOT_FOUND).toBe('ORDER_NOT_FOUND');
        expect(ErrorCodes.CART_ITEM_NOT_FOUND).toBe('CART_ITEM_NOT_FOUND');
    });

    it('should have business logic error codes', () => {
        expect(ErrorCodes.CART_EMPTY).toBe('CART_EMPTY');
        expect(ErrorCodes.INSUFFICIENT_STOCK).toBe('INSUFFICIENT_STOCK');
        expect(ErrorCodes.ORDER_CANNOT_CANCEL).toBe('ORDER_CANNOT_CANCEL');
    });

    it('should have promo code error codes', () => {
        expect(ErrorCodes.PROMO_NOT_FOUND).toBe('PROMO_NOT_FOUND');
        expect(ErrorCodes.PROMO_EXPIRED).toBe('PROMO_EXPIRED');
        expect(ErrorCodes.PROMO_MIN_ORDER).toBe('PROMO_MIN_ORDER');
        expect(ErrorCodes.PROMO_USAGE_EXCEEDED).toBe('PROMO_USAGE_EXCEEDED');
    });
});

describe('Zod Error Formatting', () => {
    it('should format simple validation errors', () => {
        const schema = z.object({
            email: z.string().email(),
            password: z.string().min(8),
        });

        try {
            schema.parse({ email: 'invalid', password: '123' });
        } catch (error) {
            if (error instanceof ZodError) {
                // The error should be a ZodError with formatted issues
                expect(error.errors.length).toBeGreaterThan(0);
                expect(error.errors[0]).toHaveProperty('path');
                expect(error.errors[0]).toHaveProperty('message');
            }
        }
    });

    it('should handle nested validation errors', () => {
        const schema = z.object({
            user: z.object({
                profile: z.object({
                    name: z.string().min(2),
                }),
            }),
        });

        try {
            schema.parse({ user: { profile: { name: 'A' } } });
        } catch (error) {
            if (error instanceof ZodError) {
                expect(error.errors[0].path).toEqual(['user', 'profile', 'name']);
            }
        }
    });
});
