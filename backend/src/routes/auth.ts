import { Router, Request, Response, RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, generateTokens, AuthRequest } from '../middleware/auth.js';
import { AppError, ErrorCodes } from '../middleware/error.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// Cast authenticate middleware to avoid TypeScript issues
const auth = authenticate as unknown as RequestHandler;

// Validation schemas
const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password cannot exceed 100 characters'),
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name cannot exceed 100 characters'),
    phone: z.string()
        .regex(/^[+]?[\d\s-]+$/, 'Invalid phone number format')
        .optional(),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name cannot exceed 100 characters')
        .optional(),
    phone: z.string()
        .regex(/^[+]?[\d\s-]+$/, 'Invalid phone number format')
        .optional()
        .nullable(),
    avatar: z.string().url('Invalid avatar URL').optional().nullable(),
});

// POST /api/auth/register
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
    // Validate input - throws ZodError if invalid, caught by global handler
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
        throw validationResult.error;
    }

    const data = validationResult.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
        throw new AppError(
            'Email already registered',
            400,
            ErrorCodes.EMAIL_EXISTS
        );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
        data: {
            email: data.email.toLowerCase(),
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
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
    // Validate input
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
        throw validationResult.error;
    }

    const data = validationResult.data;

    // Find user
    const user = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            passwordHash: true,
        },
    });

    if (!user || !user.passwordHash) {
        throw new AppError(
            'Invalid email or password',
            401,
            ErrorCodes.INVALID_CREDENTIALS
        );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);

    if (!isValidPassword) {
        throw new AppError(
            'Invalid email or password',
            401,
            ErrorCodes.INVALID_CREDENTIALS
        );
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
}));

// GET /api/auth/me - Get current user
router.get('/me', auth, asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const user = await prisma.user.findUnique({
        where: { id: authReq.user!.id },
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

    if (!user) {
        throw new AppError(
            'User not found',
            404,
            ErrorCodes.USER_NOT_FOUND
        );
    }

    res.json({
        success: true,
        data: user,
    });
}));

// PUT /api/auth/profile - Update profile
router.put('/profile', auth, asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    // Validate input
    const validationResult = updateProfileSchema.safeParse(req.body);
    if (!validationResult.success) {
        throw validationResult.error;
    }

    const { name, phone, avatar } = validationResult.data;

    // Build update data - only include fields that were provided
    const updateData: { name?: string; phone?: string | null; avatar?: string | null } = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await prisma.user.update({
        where: { id: authReq.user!.id },
        data: updateData,
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
}));

// POST /api/auth/logout
router.post('/logout', auth, asyncHandler(async (_req: Request, res: Response) => {
    // In a real app, you'd invalidate the refresh token in Redis
    res.json({
        success: true,
        message: 'Logged out successfully',
    });
}));

export default router;
