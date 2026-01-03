import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { optionalAuth } from '../middleware/auth.js';
import { AppError, ErrorCodes } from '../middleware/error.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// GET /api/products - List products with filters
router.get('/', optionalAuth as any, asyncHandler(async (req: Request, res: Response) => {
    const {
        page = '1',
        limit = '12',
        category,
        metalType,
        purity,
        minPrice,
        maxPrice,
        occasion,
        style,
        sort = 'createdAt',
        order = 'desc',
        search,
        featured,
        newArrivals,
    } = req.query;

    // Parse and validate pagination params
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: Prisma.ProductWhereInput = {
        isActive: true,
    };

    if (category) {
        where.category = { slug: category as string };
    }

    if (metalType) {
        where.metalType = metalType as string;
    }

    if (purity) {
        where.purity = purity as string;
    }

    if (minPrice || maxPrice) {
        where.basePrice = {};
        const parsedMin = parseFloat(minPrice as string);
        const parsedMax = parseFloat(maxPrice as string);

        if (minPrice && !isNaN(parsedMin) && parsedMin >= 0) {
            where.basePrice.gte = parsedMin;
        }
        if (maxPrice && !isNaN(parsedMax) && parsedMax >= 0) {
            where.basePrice.lte = parsedMax;
        }
    }

    if (occasion) {
        where.occasion = { has: occasion as string };
    }

    if (style) {
        where.style = { has: style as string };
    }

    if (featured === 'true') {
        where.isFeatured = true;
    }

    if (newArrivals === 'true') {
        where.isNewArrival = true;
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
        const searchTerm = search.trim();
        where.OR = [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { sku: { contains: searchTerm, mode: 'insensitive' } },
        ];
    }

    // Build order by
    const validSortFields = ['createdAt', 'basePrice', 'name'];
    const sortField = validSortFields.includes(sort as string) ? sort as string : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    // Execute query
    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: { [sortField]: sortOrder },
            include: {
                category: { select: { name: true, slug: true } },
                images: {
                    where: { type: { in: ['gallery', 'thumbnail'] } },
                    orderBy: { displayOrder: 'asc' },
                    take: 2,
                },
                variants: {
                    select: { id: true, size: true, stockQuantity: true },
                    orderBy: { size: 'asc' },
                },
                _count: { select: { reviews: true } },
            },
        }),
        prisma.product.count({ where }),
    ]);

    // Calculate average rating for each product
    const productsWithRating = await Promise.all(
        products.map(async (product) => {
            const avgRating = await prisma.review.aggregate({
                where: { productId: product.id, isApproved: true },
                _avg: { rating: true },
            });
            return {
                ...product,
                avgRating: avgRating._avg.rating || 0,
            };
        })
    );

    res.json({
        success: true,
        data: {
            products: productsWithRating,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        },
    });
}));

// GET /api/products/filters - Get filter counts for metal, purity, occasion
router.get('/filters', asyncHandler(async (_req: Request, res: Response) => {
    // Get counts for each metal type
    const metalCounts = await prisma.product.groupBy({
        by: ['metalType'],
        where: { isActive: true },
        _count: { metalType: true },
    });

    // Get counts for each purity
    const purityCounts = await prisma.product.groupBy({
        by: ['purity'],
        where: { isActive: true },
        _count: { purity: true },
    });

    // Get all active products to count occasions (since it's an array field)
    const products = await prisma.product.findMany({
        where: { isActive: true },
        select: { occasion: true },
    });

    // Count occasions manually (groupBy doesn't work on array fields)
    const occasionCountMap: Record<string, number> = {};
    products.forEach((product) => {
        product.occasion.forEach((occ) => {
            occasionCountMap[occ] = (occasionCountMap[occ] || 0) + 1;
        });
    });

    const occasionCounts = Object.entries(occasionCountMap).map(([occasion, count]) => ({
        occasion,
        count,
    }));

    res.json({
        success: true,
        data: {
            metalTypes: metalCounts.map((m) => ({
                name: m.metalType,
                count: m._count.metalType,
            })),
            purities: purityCounts.map((p) => ({
                name: p.purity,
                count: p._count.purity,
            })),
            occasions: occasionCounts,
        },
    });
}));

// GET /api/products/featured - Get featured products
router.get('/featured', asyncHandler(async (_req: Request, res: Response) => {
    const products = await prisma.product.findMany({
        where: { isActive: true, isFeatured: true },
        take: 8,
        include: {
            category: { select: { name: true, slug: true } },
            images: {
                where: { type: { in: ['gallery', 'thumbnail'] } },
                orderBy: { displayOrder: 'asc' },
                take: 2,
            },
        },
    });

    res.json({
        success: true,
        data: products,
    });
}));

// GET /api/products/new-arrivals - Get new arrivals
router.get('/new-arrivals', asyncHandler(async (_req: Request, res: Response) => {
    const products = await prisma.product.findMany({
        where: { isActive: true, isNewArrival: true },
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
            category: { select: { name: true, slug: true } },
            images: {
                where: { type: { in: ['gallery', 'thumbnail'] } },
                orderBy: { displayOrder: 'asc' },
                take: 2,
            },
        },
    });

    res.json({
        success: true,
        data: products,
    });
}));

// GET /api/products/:slug - Get single product
router.get('/:slug', optionalAuth as any, asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;

    // Validate slug format
    if (!slug || slug.length < 2 || slug.length > 200) {
        throw new AppError(
            'Invalid product slug',
            400,
            ErrorCodes.VALIDATION_ERROR
        );
    }

    const product = await prisma.product.findUnique({
        where: { slug, isActive: true },
        include: {
            category: { select: { id: true, name: true, slug: true } },
            images: { orderBy: { displayOrder: 'asc' } },
            variants: { orderBy: { size: 'asc' } },
            reviews: {
                where: { isApproved: true },
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { name: true, avatar: true } },
                },
            },
        },
    });

    if (!product) {
        throw new AppError(
            'Product not found',
            404,
            ErrorCodes.PRODUCT_NOT_FOUND
        );
    }

    // Get average rating
    const ratingStats = await prisma.review.aggregate({
        where: { productId: product.id, isApproved: true },
        _avg: { rating: true },
        _count: true,
    });

    // Get related products
    const relatedProducts = await prisma.product.findMany({
        where: {
            categoryId: product.categoryId,
            id: { not: product.id },
            isActive: true,
        },
        take: 4,
        include: {
            images: {
                where: { type: { in: ['gallery', 'thumbnail'] } },
                orderBy: { displayOrder: 'asc' },
                take: 1,
            },
        },
    });

    res.json({
        success: true,
        data: {
            ...product,
            avgRating: ratingStats._avg.rating || 0,
            reviewCount: ratingStats._count,
            relatedProducts,
        },
    });
}));

export default router;
