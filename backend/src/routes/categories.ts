import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { AppError, ErrorCodes } from '../middleware/error.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from '../lib/cache.js';

const router = Router();

// GET /api/categories - Get all categories (CACHED)
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
    // Try to get from cache first
    const cached = await getCache<any>(CACHE_KEYS.CATEGORIES);
    if (cached) {
        res.json({ success: true, data: cached });
        return;
    }

    const categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
        include: {
            _count: {
                select: { products: { where: { isActive: true } } },
            },
        },
    });

    // Build tree structure
    const rootCategories = categories.filter((c) => !c.parentId);
    const childCategories = categories.filter((c) => c.parentId);

    const categoriesWithChildren = rootCategories.map((parent) => ({
        ...parent,
        children: childCategories.filter((c) => c.parentId === parent.id),
    }));

    // Cache the result
    await setCache(CACHE_KEYS.CATEGORIES, categoriesWithChildren, CACHE_TTL.CATEGORIES);

    res.json({
        success: true,
        data: categoriesWithChildren,
    });
}));

// GET /api/categories/:slug - Get category by slug
router.get('/:slug', asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;

    // Validate slug format (basic check)
    if (!slug || slug.length < 2 || slug.length > 100) {
        throw new AppError(
            'Invalid category slug',
            400,
            ErrorCodes.VALIDATION_ERROR
        );
    }

    const category = await prisma.category.findUnique({
        where: { slug, isActive: true },
        include: {
            children: {
                where: { isActive: true },
                orderBy: { displayOrder: 'asc' },
            },
            parent: { select: { name: true, slug: true } },
        },
    });

    if (!category) {
        throw new AppError(
            'Category not found',
            404,
            ErrorCodes.CATEGORY_NOT_FOUND
        );
    }

    res.json({
        success: true,
        data: category,
    });
}));

export default router;
