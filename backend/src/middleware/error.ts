import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';

// Custom error class
export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// 404 handler
export const notFound = (req: Request, res: Response, next: NextFunction) => {
    const error = new AppError(`Not found - ${req.originalUrl}`, 404);
    next(error);
};

// Global error handler
export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    // Log error
    console.error('Error:', err.message);
    if (config.isDev) {
        console.error(err.stack);
    }

    // Default error values
    let statusCode = 500;
    let message = 'Internal server error';
    let stack: string | undefined;

    // Handle AppError
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    }

    // Include stack in development
    if (config.isDev) {
        stack = err.stack;
    }

    // Send response
    res.status(statusCode).json({
        success: false,
        message,
        ...(stack && { stack }),
    });
};
