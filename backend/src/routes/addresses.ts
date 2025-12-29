import { Router, Request, Response, RequestHandler } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError, ErrorCodes } from '../middleware/error.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// All address routes require authentication
router.use(authenticate as unknown as RequestHandler);

// Validation schemas
const createAddressSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    phone: z.string().regex(/^[+]?[\d\s-]{10,15}$/, 'Invalid phone number'),
    addressLine1: z.string().min(5, 'Address must be at least 5 characters').max(200),
    addressLine2: z.string().max(200).optional(),
    city: z.string().min(2, 'City is required').max(100),
    state: z.string().min(2, 'State is required').max(100),
    pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
    country: z.string().default('India'),
    isDefault: z.boolean().optional(),
});

const updateAddressSchema = createAddressSchema.partial();

// GET /api/addresses - Get user's addresses
router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    const addresses = await prisma.address.findMany({
        where: { userId: user.id },
        orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'desc' },
        ],
    });

    res.json({
        success: true,
        data: addresses,
    });
}));

// GET /api/addresses/:id - Get single address
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { id } = req.params;

    const address = await prisma.address.findFirst({
        where: { id, userId: user.id },
    });

    if (!address) {
        throw new AppError('Address not found', 404, ErrorCodes.INVALID_ADDRESS);
    }

    res.json({
        success: true,
        data: address,
    });
}));

// POST /api/addresses - Create new address
router.post('/', asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    const validationResult = createAddressSchema.safeParse(req.body);
    if (!validationResult.success) {
        throw validationResult.error;
    }

    const data = validationResult.data;

    // If this is the first address or marked as default, set it as default
    const existingAddresses = await prisma.address.count({
        where: { userId: user.id },
    });

    const shouldBeDefault = data.isDefault || existingAddresses === 0;

    // If setting as default, unset other defaults
    if (shouldBeDefault) {
        await prisma.address.updateMany({
            where: { userId: user.id, isDefault: true },
            data: { isDefault: false },
        });
    }

    const address = await prisma.address.create({
        data: {
            userId: user.id,
            name: data.name,
            phone: data.phone,
            addressLine1: data.addressLine1,
            addressLine2: data.addressLine2,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            country: data.country,
            isDefault: shouldBeDefault,
        },
    });

    res.status(201).json({
        success: true,
        message: 'Address created successfully',
        data: address,
    });
}));

// PUT /api/addresses/:id - Update address
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { id } = req.params;

    const validationResult = updateAddressSchema.safeParse(req.body);
    if (!validationResult.success) {
        throw validationResult.error;
    }

    // Verify ownership
    const existing = await prisma.address.findFirst({
        where: { id, userId: user.id },
    });

    if (!existing) {
        throw new AppError('Address not found', 404, ErrorCodes.INVALID_ADDRESS);
    }

    const data = validationResult.data;

    // If setting as default, unset other defaults
    if (data.isDefault) {
        await prisma.address.updateMany({
            where: { userId: user.id, isDefault: true, id: { not: id } },
            data: { isDefault: false },
        });
    }

    const address = await prisma.address.update({
        where: { id },
        data,
    });

    res.json({
        success: true,
        message: 'Address updated successfully',
        data: address,
    });
}));

// DELETE /api/addresses/:id - Delete address
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.address.findFirst({
        where: { id, userId: user.id },
    });

    if (!existing) {
        throw new AppError('Address not found', 404, ErrorCodes.INVALID_ADDRESS);
    }

    await prisma.address.delete({
        where: { id },
    });

    // If deleted address was default, set another as default
    if (existing.isDefault) {
        const nextAddress = await prisma.address.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
        });

        if (nextAddress) {
            await prisma.address.update({
                where: { id: nextAddress.id },
                data: { isDefault: true },
            });
        }
    }

    res.json({
        success: true,
        message: 'Address deleted successfully',
    });
}));

// PUT /api/addresses/:id/default - Set address as default
router.put('/:id/default', asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.address.findFirst({
        where: { id, userId: user.id },
    });

    if (!existing) {
        throw new AppError('Address not found', 404, ErrorCodes.INVALID_ADDRESS);
    }

    // Unset all defaults for this user
    await prisma.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
    });

    // Set this address as default
    const address = await prisma.address.update({
        where: { id },
        data: { isDefault: true },
    });

    res.json({
        success: true,
        message: 'Default address updated',
        data: address,
    });
}));

export default router;
