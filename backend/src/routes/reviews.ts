import { Router, Request, Response, RequestHandler } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth.js';
import { AppError, ErrorCodes } from '../middleware/error.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// Validation schemas
const createReviewSchema = z.object({
    rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
    title: z.string().max(100, 'Title cannot exceed 100 characters').optional(),
    comment: z.string().max(1000, 'Comment cannot exceed 1000 characters').optional(),
});

// GET /api/reviews/product/:productId - Get reviews for a product
router.get('/product/:productId', optionalAuth as any, asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const { page = '1', limit = '10' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Verify product exists
    const product = await prisma.product.findUnique({
        where: { id: productId },
    });

    if (!product) {
        throw new AppError('Product not found', 404, ErrorCodes.PRODUCT_NOT_FOUND);
    }

    const [reviews, total] = await Promise.all([
        prisma.review.findMany({
            where: { productId, isApproved: true },
            include: {
                user: {
                    select: { id: true, name: true, avatar: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum,
        }),
        prisma.review.count({ where: { productId, isApproved: true } }),
    ]);

    // Get rating stats
    const stats = await prisma.review.aggregate({
        where: { productId, isApproved: true },
        _avg: { rating: true },
        _count: { rating: true },
    });

    // Get rating distribution
    const distribution = await prisma.review.groupBy({
        by: ['rating'],
        where: { productId, isApproved: true },
        _count: { rating: true },
    });

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach(d => {
        ratingDistribution[d.rating] = d._count.rating;
    });

    res.json({
        success: true,
        data: {
            reviews,
            stats: {
                averageRating: stats._avg.rating || 0,
                totalReviews: stats._count.rating,
                distribution: ratingDistribution,
            },
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        },
    });
}));

// POST /api/reviews/product/:productId - Create a review
router.post('/product/:productId', authenticate as unknown as RequestHandler, asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { productId } = req.params;

    const validationResult = createReviewSchema.safeParse(req.body);
    if (!validationResult.success) {
        throw validationResult.error;
    }

    const { rating, title, comment } = validationResult.data;

    // Verify product exists
    const product = await prisma.product.findUnique({
        where: { id: productId },
    });

    if (!product) {
        throw new AppError('Product not found', 404, ErrorCodes.PRODUCT_NOT_FOUND);
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findFirst({
        where: { productId, userId: user.id },
    });

    if (existingReview) {
        throw new AppError('You have already reviewed this product', 400, ErrorCodes.VALIDATION_ERROR);
    }

    // Optionally: Check if user has purchased the product
    const hasPurchased = await prisma.orderItem.findFirst({
        where: {
            productId,
            order: {
                userId: user.id,
                status: 'DELIVERED',
            },
        },
    });

    const review = await prisma.review.create({
        data: {
            productId,
            userId: user.id,
            rating,
            title,
            comment,
            isVerified: !!hasPurchased, // Mark as verified if user purchased
            isApproved: true, // Auto-approve for now, can add moderation later
        },
        include: {
            user: {
                select: { id: true, name: true, avatar: true },
            },
        },
    });

    res.status(201).json({
        success: true,
        message: 'Review submitted successfully',
        data: review,
    });
}));

// DELETE /api/reviews/:id - Delete own review
router.delete('/:id', authenticate as unknown as RequestHandler, asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { id } = req.params;

    const review = await prisma.review.findFirst({
        where: { id, userId: user.id },
    });

    if (!review) {
        throw new AppError('Review not found or not authorized', 404, ErrorCodes.VALIDATION_ERROR);
    }

    await prisma.review.delete({
        where: { id },
    });

    res.json({
        success: true,
        message: 'Review deleted successfully',
    });
}));

export default router;
