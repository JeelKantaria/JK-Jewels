import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import prisma from '../lib/prisma.js';
import { AppError, ErrorCodes } from './error.js';

// Types
export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
}

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        name: string;
    };
}

// Middleware: Authenticate JWT token
export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.slice(7)
            : null;

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
                code: ErrorCodes.UNAUTHORIZED,
            });
            return;
        }

        // Verify token
        let decoded: JwtPayload;
        try {
            decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
        } catch (jwtError) {
            if (jwtError instanceof jwt.TokenExpiredError) {
                res.status(401).json({
                    success: false,
                    message: 'Token has expired. Please login again.',
                    code: ErrorCodes.TOKEN_EXPIRED,
                });
                return;
            }
            if (jwtError instanceof jwt.JsonWebTokenError) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid token format.',
                    code: ErrorCodes.TOKEN_INVALID,
                });
                return;
            }
            if (jwtError instanceof jwt.NotBeforeError) {
                res.status(401).json({
                    success: false,
                    message: 'Token is not yet valid.',
                    code: ErrorCodes.TOKEN_INVALID,
                });
                return;
            }
            throw jwtError;
        }

        // Validate decoded token has required fields
        if (!decoded.userId) {
            res.status(401).json({
                success: false,
                message: 'Invalid token payload.',
                code: ErrorCodes.TOKEN_INVALID,
            });
            return;
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, role: true, name: true },
        });

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User associated with token not found.',
                code: ErrorCodes.USER_NOT_FOUND,
            });
            return;
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        // Log unexpected errors for debugging
        console.error('Authentication error:', error);
        next(error);
    }
};

// Middleware: Optional authentication (for guest users)
export const optionalAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.slice(7)
            : null;

        if (token) {
            try {
                const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
                if (decoded.userId) {
                    const user = await prisma.user.findUnique({
                        where: { id: decoded.userId },
                        select: { id: true, email: true, role: true, name: true },
                    });
                    if (user) {
                        req.user = user;
                    }
                }
            } catch {
                // Token invalid or expired, continue as guest
                // Don't log every guest request
            }
        }
        next();
    } catch (error) {
        // Unexpected error, log and continue as guest
        console.error('Optional auth error:', error);
        next();
    }
};

// Middleware: Require admin role
export const requireAdmin = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required.',
            code: ErrorCodes.UNAUTHORIZED,
        });
        return;
    }

    if (req.user.role !== 'ADMIN') {
        res.status(403).json({
            success: false,
            message: 'Admin access required.',
            code: ErrorCodes.FORBIDDEN,
        });
        return;
    }

    next();
};

// Generate JWT tokens
export const generateTokens = (user: { id: string; email: string; role: string }) => {
    const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
    );

    return { accessToken, refreshToken };
};
