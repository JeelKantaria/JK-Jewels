import { Router, Response, Request, RequestHandler } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError, ErrorCodes } from '../middleware/error.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// Validation schema for promo code validation
const validatePromoSchema = z.object({
    code: z.string().min(1, 'Promo code is required'),
    cartTotal: z.number().min(0, 'Cart total must be positive'),
});

// POST /api/promo/validate - Validate a promo code
router.post('/validate', authenticate as unknown as RequestHandler, asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    const validationResult = validatePromoSchema.safeParse(req.body);
    if (!validationResult.success) {
        throw validationResult.error;
    }

    const { code, cartTotal } = validationResult.data;
    const now = new Date();

    // Find the promo code with usages for this user
    const promoCode = await prisma.promoCode.findUnique({
        where: { code: code.toUpperCase() },
    });

    if (!promoCode) {
        throw new AppError('Invalid promo code', 400, ErrorCodes.PROMO_NOT_FOUND);
    }

    // Get user's usage count for this promo
    const userUsages = await prisma.promoCodeUsage.count({
        where: {
            promoCodeId: promoCode.id,
            userId: user.id,
            orderId: { not: null },
        },
    });

    // Check if active
    if (!promoCode.isActive) {
        throw new AppError('This promo code is no longer active', 400, ErrorCodes.PROMO_EXPIRED);
    }

    // Check validity period
    if (now < promoCode.validFrom) {
        throw new AppError('This promo code is not yet valid', 400, ErrorCodes.PROMO_EXPIRED);
    }

    if (now > promoCode.validUntil) {
        throw new AppError('This promo code has expired', 400, ErrorCodes.PROMO_EXPIRED);
    }

    // Check global usage limit
    if (promoCode.usageLimit && promoCode.usedCount >= promoCode.usageLimit) {
        throw new AppError('This promo code has reached its usage limit', 400, ErrorCodes.PROMO_USAGE_EXCEEDED);
    }

    // Check per-user limit
    if (userUsages >= promoCode.perUserLimit) {
        throw new AppError(`You have already used this promo code ${promoCode.perUserLimit} time(s)`, 400, ErrorCodes.PROMO_USAGE_EXCEEDED);
    }

    // Check minimum order amount
    if (promoCode.minOrderAmount && cartTotal < Number(promoCode.minOrderAmount)) {
        throw new AppError(
            `Minimum order amount of ₹${Number(promoCode.minOrderAmount).toLocaleString()} required`,
            400,
            ErrorCodes.PROMO_MIN_ORDER
        );
    }

    // Check first order only
    if (promoCode.isFirstOrderOnly) {
        const orderCount = await prisma.order.count({
            where: { userId: user.id },
        });
        if (orderCount > 0) {
            throw new AppError('This promo code is valid only for first-time orders', 400, ErrorCodes.PROMO_USAGE_EXCEEDED);
        }
    }

    // Calculate discount
    let discountAmount: number;
    if (promoCode.discountType === 'percentage') {
        discountAmount = (cartTotal * Number(promoCode.discountValue)) / 100;
        // Apply max discount cap
        if (promoCode.maxDiscount && discountAmount > Number(promoCode.maxDiscount)) {
            discountAmount = Number(promoCode.maxDiscount);
        }
    } else {
        // Fixed discount
        discountAmount = Math.min(Number(promoCode.discountValue), cartTotal);
    }

    res.json({
        success: true,
        data: {
            code: promoCode.code,
            description: promoCode.description,
            discountType: promoCode.discountType,
            discountValue: Number(promoCode.discountValue),
            discountAmount: Math.round(discountAmount * 100) / 100,
            minOrderAmount: promoCode.minOrderAmount ? Number(promoCode.minOrderAmount) : null,
            maxDiscount: promoCode.maxDiscount ? Number(promoCode.maxDiscount) : null,
            allowWithOther: promoCode.allowWithOther,
        },
    });
}));

// GET /api/promo/available - Get available promo codes for user
router.get('/available', authenticate as unknown as RequestHandler, asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const now = new Date();

    // Get user's order count for first-order filtering
    const orderCount = await prisma.order.count({
        where: { userId: user.id },
    });

    // Get all active valid promo codes
    const promoCodes = await prisma.promoCode.findMany({
        where: {
            isActive: true,
            validFrom: { lte: now },
            validUntil: { gte: now },
        },
    });

    // Get user's usage for each promo
    const usageCounts = await prisma.promoCodeUsage.groupBy({
        by: ['promoCodeId'],
        where: {
            userId: user.id,
            orderId: { not: null },
        },
        _count: true,
    });

    const usageMap = new Map(usageCounts.map(u => [u.promoCodeId, u._count]));

    // Filter out codes that don't apply to this user
    const availableCodes = promoCodes
        .filter(code => {
            // Check global limit
            if (code.usageLimit && code.usedCount >= code.usageLimit) return false;
            // Check per-user limit
            const userUsed = usageMap.get(code.id) || 0;
            if (userUsed >= code.perUserLimit) return false;
            // Check first order only
            if (code.isFirstOrderOnly && orderCount > 0) return false;
            return true;
        })
        .map(code => ({
            code: code.code,
            description: code.description,
            discountType: code.discountType,
            discountValue: Number(code.discountValue),
            minOrderAmount: code.minOrderAmount ? Number(code.minOrderAmount) : null,
            maxDiscount: code.maxDiscount ? Number(code.maxDiscount) : null,
            validUntil: code.validUntil,
            isFirstOrderOnly: code.isFirstOrderOnly,
        }));

    res.json({
        success: true,
        data: availableCodes,
    });
}));

export default router;
