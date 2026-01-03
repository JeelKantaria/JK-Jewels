import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { config } from '../config/index.js';

// Error codes for frontend handling
export const ErrorCodes = {
    // Authentication errors
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    EMAIL_EXISTS: 'EMAIL_EXISTS',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_INVALID: 'TOKEN_INVALID',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',

    // Validation errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',

    // Product errors
    PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
    CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
    VARIANT_NOT_FOUND: 'VARIANT_NOT_FOUND',

    // Cart errors
    CART_ITEM_NOT_FOUND: 'CART_ITEM_NOT_FOUND',
    INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',

    // Order errors
    CART_EMPTY: 'CART_EMPTY',
    ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
    ORDER_CANNOT_CANCEL: 'ORDER_CANNOT_CANCEL',
    INVALID_ADDRESS: 'INVALID_ADDRESS',

    // Promo code errors
    PROMO_NOT_FOUND: 'PROMO_NOT_FOUND',
    PROMO_EXPIRED: 'PROMO_EXPIRED',
    PROMO_MIN_ORDER: 'PROMO_MIN_ORDER',
    PROMO_USAGE_EXCEEDED: 'PROMO_USAGE_EXCEEDED',

    // Database errors
    DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
    FOREIGN_KEY_ERROR: 'FOREIGN_KEY_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',

    // Server errors
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    NOT_FOUND: 'NOT_FOUND',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// Custom error class with error codes
export class AppError extends Error {
    statusCode: number;
    code: ErrorCode;
    isOperational: boolean;
    details?: unknown;

    constructor(
        message: string,
        statusCode: number,
        code: ErrorCode = ErrorCodes.INTERNAL_ERROR,
        details?: unknown
    ) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }
}

// 404 handler
export const notFound = (req: Request, res: Response, next: NextFunction) => {
    const error = new AppError(
        `Not found - ${req.originalUrl}`,
        404,
        ErrorCodes.NOT_FOUND
    );
    next(error);
};

// Format Zod validation errors into user-friendly messages
const formatZodErrors = (error: ZodError): { field: string; message: string }[] => {
    return error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
    }));
};

// Handle Prisma-specific errors
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
    switch (error.code) {
        case 'P2002': {
            // Unique constraint violation
            const target = (error.meta?.target as string[])?.join(', ') || 'field';
            return new AppError(
                `A record with this ${target} already exists`,
                409,
                ErrorCodes.DUPLICATE_ENTRY,
                { target }
            );
        }
        case 'P2025': {
            // Record not found
            return new AppError(
                'The requested record was not found',
                404,
                ErrorCodes.NOT_FOUND
            );
        }
        case 'P2003': {
            // Foreign key constraint failed
            const field = (error.meta?.field_name as string) || 'field';
            return new AppError(
                `Invalid reference: ${field}`,
                400,
                ErrorCodes.FOREIGN_KEY_ERROR,
                { field }
            );
        }
        case 'P2014': {
            // Required relation violation
            return new AppError(
                'This operation would violate a required relation',
                400,
                ErrorCodes.FOREIGN_KEY_ERROR
            );
        }
        default: {
            console.error('Unhandled Prisma error code:', error.code);
            return new AppError(
                'A database error occurred',
                500,
                ErrorCodes.DATABASE_ERROR
            );
        }
    }
};

// Global error handler
export const errorHandler = (
    err: Error | AppError | ZodError | Prisma.PrismaClientKnownRequestError,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    // Log error with request context
    console.error('Error:', {
        message: err.message,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
    });

    if (config.isDev) {
        console.error('Stack:', err.stack);
    }

    // Default error response
    let statusCode = 500;
    let message = 'Internal server error';
    let code: ErrorCode = ErrorCodes.INTERNAL_ERROR;
    let details: unknown = undefined;
    let stack: string | undefined = undefined;

    // Handle different error types
    if (err instanceof AppError) {
        // Custom application error
        statusCode = err.statusCode;
        message = err.message;
        code = err.code;
        details = err.details;
    } else if (err instanceof ZodError) {
        // Zod validation error
        statusCode = 400;
        message = 'Validation failed';
        code = ErrorCodes.VALIDATION_ERROR;
        details = formatZodErrors(err);
    } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // Prisma database error
        const prismaError = handlePrismaError(err);
        statusCode = prismaError.statusCode;
        message = prismaError.message;
        code = prismaError.code;
        details = prismaError.details;
    } else if (err instanceof Prisma.PrismaClientValidationError) {
        // Prisma validation error (e.g., wrong field types)
        statusCode = 400;
        message = 'Invalid data provided';
        code = ErrorCodes.VALIDATION_ERROR;
    } else if (err instanceof Prisma.PrismaClientInitializationError) {
        // Database connection error
        statusCode = 503;
        message = 'Database connection failed';
        code = ErrorCodes.DATABASE_ERROR;
        console.error('Database initialization error:', err.message);
    } else if (err instanceof SyntaxError && 'body' in err) {
        // JSON parse error
        statusCode = 400;
        message = 'Invalid JSON in request body';
        code = ErrorCodes.INVALID_INPUT;
    } else if (err.name === 'JsonWebTokenError') {
        // JWT format error
        statusCode = 401;
        message = 'Invalid token format';
        code = ErrorCodes.TOKEN_INVALID;
    } else if (err.name === 'TokenExpiredError') {
        // JWT expired
        statusCode = 401;
        message = 'Token has expired';
        code = ErrorCodes.TOKEN_EXPIRED;
    }

    // Include stack trace in development
    if (config.isDev) {
        stack = err.stack;
    }

    // Send error response
    const response: {
        success: false;
        message: string;
        code: ErrorCode;
        details?: unknown;
        stack?: string;
    } = {
        success: false,
        message,
        code,
    };

    if (details !== undefined) {
        response.details = details;
    }

    if (stack !== undefined) {
        response.stack = stack;
    }

    res.status(statusCode).json(response);
};
