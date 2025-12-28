import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import prisma from '../lib/prisma.js';

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
                message: 'Access denied. No token provided.'
            });
            return;
        }

        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, role: true, name: true },
        });

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.'
            });
            return;
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
            return;
        }
        res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
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
            const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, email: true, role: true, name: true },
            });
            if (user) {
                req.user = user;
            }
        }
        next();
    } catch {
        // Token invalid, continue as guest
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
            message: 'Authentication required.'
        });
        return;
    }

    if (req.user.role !== 'ADMIN') {
        res.status(403).json({
            success: false,
            message: 'Admin access required.'
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
        { expiresIn: config.jwt.expiresIn }
    );

    const refreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiresIn }
    );

    return { accessToken, refreshToken };
};
