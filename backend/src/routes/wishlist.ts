import { Router, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';

const router = Router();

router.use(authenticate);

// GET /api/wishlist - Get user's wishlist
router.get('/', async (req: AuthRequest, res: Response) => {
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
});

// POST /api/wishlist/:productId - Add to wishlist
router.post('/:productId', async (req: AuthRequest, res: Response) => {
    const { productId } = req.params;

    // Check product exists
    const product = await prisma.product.findUnique({
        where: { id: productId, isActive: true },
    });

    if (!product) {
        throw new AppError('Product not found', 404);
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
});

// DELETE /api/wishlist/:productId - Remove from wishlist
router.delete('/:productId', async (req: AuthRequest, res: Response) => {
    const { productId } = req.params;

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
});

export default router;
