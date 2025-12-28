import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// GET /api/categories - Get all categories
router.get('/', async (_req: Request, res: Response) => {
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

    res.json({
        success: true,
        data: categoriesWithChildren,
    });
});

// GET /api/categories/:slug - Get category by slug
router.get('/:slug', async (req: Request, res: Response) => {
    const { slug } = req.params;

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
        res.status(404).json({
            success: false,
            message: 'Category not found',
        });
        return;
    }

    res.json({
        success: true,
        data: category,
    });
});

export default router;
