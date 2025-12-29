import { Router, Response, Request, RequestHandler } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError, ErrorCodes } from '../middleware/error.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.use(authenticate as unknown as RequestHandler);

// Validation for productId param
const productIdSchema = z.string().uuid('Invalid product ID format');

// GET /api/wishlist - Get user's wishlist
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
    const wishlist = await prisma.wishlistItem.findMany({
        where: { userId: req.user!.id },
        include: {
            product: {
                include: {
                    category: { select: { name: true, slug: true } },
                    images: {
                        where: { type: { in: ['gallery', 'thumbnail'] } },
                        orderBy: { displayOrder: 'asc' },
                        take: 1,
                    },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    res.json({
        success: true,
        data: wishlist,
    });
}));

// POST /api/wishlist/:productId - Add to wishlist
router.post('/:productId', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId } = req.params;

    // Validate productId format
    const validationResult = productIdSchema.safeParse(productId);
    if (!validationResult.success) {
        throw new AppError(
            'Invalid product ID format',
            400,
            ErrorCodes.VALIDATION_ERROR
        );
    }

    // Check product exists
    const product = await prisma.product.findUnique({
        where: { id: productId, isActive: true },
    });

    if (!product) {
        throw new AppError(
            'Product not found',
            404,
            ErrorCodes.PRODUCT_NOT_FOUND
        );
    }

    // Check if already in wishlist
    const existing = await prisma.wishlistItem.findUnique({
        where: {
            userId_productId: {
                userId: req.user!.id,
                productId,
            },
        },
    });

    if (existing) {
        res.json({
            success: true,
            message: 'Already in wishlist',
        });
        return;
    }

    await prisma.wishlistItem.create({
        data: {
            userId: req.user!.id,
            productId,
        },
    });

    res.status(201).json({
        success: true,
        message: 'Added to wishlist',
    });
}));

// DELETE /api/wishlist/:productId - Remove from wishlist
router.delete('/:productId', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId } = req.params;

    // Validate productId format (optional - deleteMany won't fail on invalid UUID)
    const validationResult = productIdSchema.safeParse(productId);
    if (!validationResult.success) {
        throw new AppError(
            'Invalid product ID format',
            400,
            ErrorCodes.VALIDATION_ERROR
        );
    }

    await prisma.wishlistItem.deleteMany({
        where: {
            userId: req.user!.id,
            productId,
        },
    });

    res.json({
        success: true,
        message: 'Removed from wishlist',
    });
}));

// DELETE /api/wishlist - Clear entire wishlist
router.delete('/', asyncHandler(async (req: AuthRequest, res: Response) => {
    await prisma.wishlistItem.deleteMany({
        where: {
            userId: req.user!.id,
        },
    });

    res.json({
        success: true,
        message: 'Wishlist cleared',
    });
}));

export default router;
