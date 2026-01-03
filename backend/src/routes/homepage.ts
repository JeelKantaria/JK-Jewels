import { Router, Request, Response, RequestHandler } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError, ErrorCodes } from '../middleware/error.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// Validation schemas
const addRowSchema = z.object({
    categoryId: z.string().uuid('Invalid category ID'),
    productDisplay: z.enum(['all', 'featured', 'count']).default('all'),
    productCount: z.number().int().min(1).max(50).optional(),
    scrollDirection: z.enum(['left', 'right', 'auto']).default('auto'),
    scrollSpeed: z.number().int().min(5).max(120).optional().nullable(),
});

const updateRowSchema = z.object({
    productDisplay: z.enum(['all', 'featured', 'count']).optional(),
    productCount: z.number().int().min(1).max(50).optional().nullable(),
    scrollDirection: z.enum(['left', 'right', 'auto']).optional(),
    scrollSpeed: z.number().int().min(5).max(120).optional().nullable(),
    isActive: z.boolean().optional(),
});

const updateSettingsSchema = z.object({
    globalScrollSpeed: z.number().int().min(5).max(120),
});

const reorderSchema = z.object({
    order: z.array(z.object({
        id: z.string().uuid(),
        displayOrder: z.number().int().min(0),
    })),
});

// ========================================
// PUBLIC ENDPOINTS
// ========================================

// GET /api/homepage/rows - Get active homepage rows with products
router.get('/rows', asyncHandler(async (_req: Request, res: Response) => {
    // Get global settings
    let settings = await prisma.homepageSettings.findFirst();
    if (!settings) {
        // Create default settings if not exists
        settings = await prisma.homepageSettings.create({
            data: { globalScrollSpeed: 30 },
        });
    }

    // Get active rows with their categories and products
    const rows = await prisma.homepageRow.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
        include: {
            category: {
                include: {
                    products: {
                        where: { isActive: true },
                        include: {
                            images: {
                                orderBy: { displayOrder: 'asc' },
                                take: 1,
                            },
                            variants: {
                                orderBy: { size: 'asc' },
                            },
                        },
                    },
                },
            },
        },
    });

    // Process each row's products based on display settings
    const processedRows = rows.map((row, index) => {
        let products = row.category.products;

        // Filter/limit products based on display mode
        if (row.productDisplay === 'featured') {
            products = products.filter(p => p.isFeatured);
        } else if (row.productDisplay === 'count' && row.productCount) {
            products = products.slice(0, row.productCount);
        }

        // Determine scroll direction
        let scrollDirection = row.scrollDirection;
        if (scrollDirection === 'auto') {
            // Alternate: even index = left, odd index = right
            scrollDirection = index % 2 === 0 ? 'left' : 'right';
        }

        return {
            id: row.id,
            categoryId: row.category.id,
            categoryName: row.category.name,
            categorySlug: row.category.slug,
            scrollDirection,
            scrollSpeed: row.scrollSpeed ?? settings!.globalScrollSpeed,
            products: products.map(p => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                basePrice: Number(p.basePrice),
                image: p.images[0]?.url || null,
                variants: p.variants.map(v => ({
                    id: v.id,
                    size: v.size,
                    stockQuantity: v.stockQuantity,
                })),
            })),
        };
    });

    res.json({
        success: true,
        data: {
            globalScrollSpeed: settings.globalScrollSpeed,
            rows: processedRows,
        },
    });
}));

// ========================================
// ADMIN ENDPOINTS (Require authentication)
// ========================================

// Admin middleware
const requireAdmin = asyncHandler(async (req: AuthRequest, _res: Response, next: any) => {
    if (req.user?.role !== 'ADMIN') {
        throw new AppError('Admin access required', 403, ErrorCodes.UNAUTHORIZED);
    }
    next();
});

// Apply auth to admin routes
router.use('/admin', authenticate as unknown as RequestHandler);
router.use('/admin', requireAdmin as unknown as RequestHandler);

// GET /api/homepage/admin - Get all homepage settings and rows
router.get('/admin', asyncHandler(async (_req: Request, res: Response) => {
    let settings = await prisma.homepageSettings.findFirst();
    if (!settings) {
        settings = await prisma.homepageSettings.create({
            data: { globalScrollSpeed: 30 },
        });
    }

    const rows = await prisma.homepageRow.findMany({
        orderBy: { displayOrder: 'asc' },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    image: true,
                },
            },
        },
    });

    // Get categories not yet on homepage
    const usedCategoryIds = rows.map(r => r.categoryId);
    const availableCategories = await prisma.category.findMany({
        where: {
            isActive: true,
            id: { notIn: usedCategoryIds },
        },
        select: {
            id: true,
            name: true,
            slug: true,
            image: true,
        },
        orderBy: { displayOrder: 'asc' },
    });

    res.json({
        success: true,
        data: {
            settings,
            rows,
            availableCategories,
        },
    });
}));

// PUT /api/homepage/admin/settings - Update global settings
router.put('/admin/settings', asyncHandler(async (req: Request, res: Response) => {
    const validationResult = updateSettingsSchema.safeParse(req.body);
    if (!validationResult.success) {
        throw validationResult.error;
    }

    const { globalScrollSpeed } = validationResult.data;

    let settings = await prisma.homepageSettings.findFirst();
    if (settings) {
        settings = await prisma.homepageSettings.update({
            where: { id: settings.id },
            data: { globalScrollSpeed },
        });
    } else {
        settings = await prisma.homepageSettings.create({
            data: { globalScrollSpeed },
        });
    }

    res.json({
        success: true,
        message: 'Settings updated',
        data: settings,
    });
}));

// POST /api/homepage/admin/rows - Add category to homepage
router.post('/admin/rows', asyncHandler(async (req: Request, res: Response) => {
    const validationResult = addRowSchema.safeParse(req.body);
    if (!validationResult.success) {
        throw validationResult.error;
    }

    const { categoryId, productDisplay, productCount, scrollDirection, scrollSpeed } = validationResult.data;

    // Check if category exists
    const category = await prisma.category.findUnique({
        where: { id: categoryId },
    });
    if (!category) {
        throw new AppError('Category not found', 404, ErrorCodes.CATEGORY_NOT_FOUND);
    }

    // Check if category is already on homepage
    const existingRow = await prisma.homepageRow.findUnique({
        where: { categoryId },
    });
    if (existingRow) {
        throw new AppError('Category is already on homepage', 400, ErrorCodes.VALIDATION_ERROR);
    }

    // Get max display order
    const maxOrder = await prisma.homepageRow.aggregate({
        _max: { displayOrder: true },
    });

    const row = await prisma.homepageRow.create({
        data: {
            categoryId,
            productDisplay,
            productCount: productDisplay === 'count' ? productCount : null,
            scrollDirection,
            scrollSpeed,
            displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
        },
        include: {
            category: {
                select: { id: true, name: true, slug: true, image: true },
            },
        },
    });

    res.status(201).json({
        success: true,
        message: 'Category added to homepage',
        data: row,
    });
}));

// PUT /api/homepage/admin/rows/:id - Update row settings
router.put('/admin/rows/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const validationResult = updateRowSchema.safeParse(req.body);
    if (!validationResult.success) {
        throw validationResult.error;
    }

    const existingRow = await prisma.homepageRow.findUnique({
        where: { id },
    });
    if (!existingRow) {
        throw new AppError('Homepage row not found', 404, ErrorCodes.NOT_FOUND);
    }

    const updateData = validationResult.data;

    // Handle productCount based on productDisplay
    if (updateData.productDisplay && updateData.productDisplay !== 'count') {
        updateData.productCount = null;
    }

    const row = await prisma.homepageRow.update({
        where: { id },
        data: updateData,
        include: {
            category: {
                select: { id: true, name: true, slug: true, image: true },
            },
        },
    });

    res.json({
        success: true,
        message: 'Row updated',
        data: row,
    });
}));

// DELETE /api/homepage/admin/rows/:id - Remove category from homepage
router.delete('/admin/rows/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const existingRow = await prisma.homepageRow.findUnique({
        where: { id },
    });
    if (!existingRow) {
        throw new AppError('Homepage row not found', 404, ErrorCodes.NOT_FOUND);
    }

    await prisma.homepageRow.delete({
        where: { id },
    });

    res.json({
        success: true,
        message: 'Category removed from homepage',
    });
}));

// PUT /api/homepage/admin/rows/reorder - Reorder rows
router.put('/admin/rows/reorder', asyncHandler(async (req: Request, res: Response) => {
    const validationResult = reorderSchema.safeParse(req.body);
    if (!validationResult.success) {
        throw validationResult.error;
    }

    const { order } = validationResult.data;

    // Update all rows in a transaction
    await prisma.$transaction(
        order.map(({ id, displayOrder }) =>
            prisma.homepageRow.update({
                where: { id },
                data: { displayOrder },
            })
        )
    );

    res.json({
        success: true,
        message: 'Rows reordered',
    });
}));

export default router;
