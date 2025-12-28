import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, generateTokens, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';

const router = Router();

// Validation schemas
const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
    try {
        const data = registerSchema.parse(req.body);

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new AppError('Email already registered', 400);
        }

        // Hash password
        const passwordHash = await bcrypt.hash(data.password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: data.email,
                passwordHash,
                name: data.name,
                phone: data.phone,
                authProvider: 'email',
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });

        // Generate tokens
        const tokens = generateTokens(user);

        // Create empty cart for user
        await prisma.cart.create({
            data: { userId: user.id },
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user,
                ...tokens,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error.errors,
            });
            return;
        }
        throw error;
    }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const data = loginSchema.parse(req.body);

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: data.email },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                passwordHash: true,
            },
        });

        if (!user || !user.passwordHash) {
            throw new AppError('Invalid email or password', 401);
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);

        if (!isValidPassword) {
            throw new AppError('Invalid email or password', 401);
        }

        // Generate tokens
        const tokens = generateTokens(user);

        // Remove password hash from response
        const { passwordHash: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userWithoutPassword,
                ...tokens,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error.errors,
            });
            return;
        }
        throw error;
    }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            avatar: true,
            isVerified: true,
            preferences: true,
            createdAt: true,
        },
    });

    res.json({
        success: true,
        data: user,
    });
});

// PUT /api/auth/profile - Update profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
    const { name, phone, avatar } = req.body;

    const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
            ...(name && { name }),
            ...(phone && { phone }),
            ...(avatar && { avatar }),
        },
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            avatar: true,
            role: true,
        },
    });

    res.json({
        success: true,
        message: 'Profile updated',
        data: user,
    });
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (_req: AuthRequest, res: Response) => {
    // In a real app, you'd invalidate the refresh token in Redis
    res.json({
        success: true,
        message: 'Logged out successfully',
    });
});

export default router;
