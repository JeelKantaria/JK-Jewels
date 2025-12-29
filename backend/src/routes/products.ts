import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/products - List products with filters
router.get('/', optionalAuth as any, async (req: Request, res: Response) => {
    try {
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

        const pageNum = Math.max(1, parseInt(page as string, 10));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
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
            if (minPrice) where.basePrice.gte = parseFloat(minPrice as string);
            if (maxPrice) where.basePrice.lte = parseFloat(maxPrice as string);
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

        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { description: { contains: search as string, mode: 'insensitive' } },
                { sku: { contains: search as string, mode: 'insensitive' } },
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
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products',
        });
    }
});

// GET /api/products/filters - Get filter counts for metal, purity, occasion
router.get('/filters', async (_req: Request, res: Response) => {
    try {
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
    } catch (error) {
        console.error('Error fetching filter counts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch filter counts',
        });
    }
});

// GET /api/products/featured - Get featured products
router.get('/featured', async (_req: Request, res: Response) => {
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
});

// GET /api/products/new-arrivals - Get new arrivals
router.get('/new-arrivals', async (_req: Request, res: Response) => {
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
});

// GET /api/products/:slug - Get single product
router.get('/:slug', optionalAuth as any, async (req: Request, res: Response) => {
    const { slug } = req.params;

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
        res.status(404).json({
            success: false,
            message: 'Product not found',
        });
        return;
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
});

export default router;
