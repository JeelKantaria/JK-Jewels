import { Router, Request, Response, RequestHandler } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError, ErrorCodes } from '../middleware/error.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// Product validation schema
const productSchema = z.object({
    name: z.string().min(2, 'Product name must be at least 2 characters').max(200, 'Product name too long'),
    sku: z.string().min(3, 'SKU must be at least 3 characters').max(50, 'SKU too long'),
    slug: z.string().optional(),
    description: z.string().max(5000, 'Description too long').optional(),
    categoryId: z.string().uuid('Invalid category ID'),
    metalType: z.enum(['Gold', 'Silver', 'Platinum']).default('Gold'),
    purity: z.string().min(1, 'Purity is required'),
    basePrice: z.number().min(0, 'Price must be positive'),
    weight: z.number().min(0, 'Weight must be positive').optional(),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    images: z.array(z.object({
        url: z.string().url('Invalid image URL'),
        type: z.string().optional(),
    })).optional(),
    variants: z.array(z.object({
        size: z.string().min(1, 'Size is required'),
        stockQuantity: z.number().int().min(0, 'Stock must be non-negative').default(0),
        additionalPrice: z.number().min(0, 'Additional price must be non-negative').default(0),
    })).optional(),
});

// Admin middleware - check if user is admin
const requireAdmin = asyncHandler(async (req: AuthRequest, res: Response, next: any) => {
    if (req.user?.role !== 'ADMIN') {
        throw new AppError('Admin access required', 403, ErrorCodes.UNAUTHORIZED);
    }
    next();
});

// Apply auth and admin check to all routes
router.use(authenticate as unknown as RequestHandler);
router.use(requireAdmin as unknown as RequestHandler);

// GET /api/admin/dashboard - Get dashboard stats
router.get('/dashboard', asyncHandler(async (req: Request, res: Response) => {
    const LOW_STOCK_THRESHOLD = 10;

    const [
        totalOrders,
        totalRevenue,
        totalProducts,
        totalCustomers,
        pendingOrders,
        recentOrders,
        recentMessages,
        lowStockProducts,
        outOfStockCount,
    ] = await Promise.all([
        prisma.order.count(),
        prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: { paymentStatus: 'COMPLETED' },
        }),
        prisma.product.count({ where: { isActive: true } }),
        prisma.user.count({ where: { role: 'CUSTOMER' } }),
        prisma.order.count({ where: { status: 'PENDING' } }),
        prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true, email: true } },
            },
        }),
        prisma.contactMessage.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
        }),
        // Low stock products (variants with stock < threshold)
        prisma.productVariant.findMany({
            where: {
                stockQuantity: { gt: 0, lte: LOW_STOCK_THRESHOLD },
                product: { isActive: true },
            },
            take: 10,
            orderBy: { stockQuantity: 'asc' },
            include: {
                product: { select: { id: true, name: true, sku: true } },
            },
        }),
        // Out of stock count
        prisma.productVariant.count({
            where: {
                stockQuantity: 0,
                product: { isActive: true },
            },
        }),
    ]);

    res.json({
        success: true,
        data: {
            totalOrders,
            totalRevenue: Number(totalRevenue._sum?.totalAmount || 0),
            totalProducts,
            totalCustomers,
            pendingOrders,
            recentOrders,
            recentMessages,
            // Inventory alerts
            lowStockProducts,
            outOfStockCount,
            lowStockThreshold: LOW_STOCK_THRESHOLD,
        },
    });
}));

// GET /api/admin/orders - Get all orders with filters
router.get('/orders', asyncHandler(async (req: Request, res: Response) => {
    const { page = '1', limit = '20', status, search } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && status !== 'ALL') {
        where.status = status;
    }
    if (search) {
        where.OR = [
            { orderNumber: { contains: search as string, mode: 'insensitive' } },
            { user: { name: { contains: search as string, mode: 'insensitive' } } },
            { guestName: { contains: search as string, mode: 'insensitive' } },
            { guestEmail: { contains: search as string, mode: 'insensitive' } },
        ];
    }

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, name: true, email: true } },
                items: {
                    include: {
                        product: {
                            include: { images: { take: 1 } },
                        },
                    },
                },
                shippingAddress: true,
            },
        }),
        prisma.order.count({ where }),
    ]);

    res.json({
        success: true,
        data: {
            orders,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        },
    });
}));

// PUT /api/admin/orders/:id/status - Update order status
router.put('/orders/:id/status', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
        throw new AppError('Invalid status', 400, ErrorCodes.VALIDATION_ERROR);
    }

    const order = await prisma.order.update({
        where: { id },
        data: { status },
        include: {
            user: { select: { name: true, email: true } },
            items: true,
        },
    });

    res.json({
        success: true,
        message: `Order status updated to ${status}`,
        data: order,
    });
}));

// GET /api/admin/products - Get all products with filters
router.get('/products', asyncHandler(async (req: Request, res: Response) => {
    const { page = '1', limit = '20', search, category, isActive } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
        where.OR = [
            { name: { contains: search as string, mode: 'insensitive' } },
            { sku: { contains: search as string, mode: 'insensitive' } },
        ];
    }
    if (category) {
        where.categoryId = category;
    }
    if (isActive !== undefined) {
        where.isActive = isActive === 'true';
    }

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: { createdAt: 'desc' },
            include: {
                category: true,
                images: { take: 1 },
                variants: true,
                _count: { select: { reviews: true } },
            },
        }),
        prisma.product.count({ where }),
    ]);

    res.json({
        success: true,
        data: {
            products,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        },
    });
}));

// GET /api/admin/products/:id - Get single product by ID for editing
router.get('/products/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            category: true,
            images: { orderBy: { displayOrder: 'asc' } },
            variants: true,
        },
    });

    if (!product) {
        throw new AppError('Product not found', 404, ErrorCodes.PRODUCT_NOT_FOUND);
    }

    res.json({
        success: true,
        data: product,
    });
}));

// POST /api/admin/products - Create new product
router.post('/products', asyncHandler(async (req: Request, res: Response) => {
    // Validate with Zod
    const validationResult = productSchema.safeParse(req.body);
    if (!validationResult.success) {
        const errors = validationResult.error.errors.map(e => e.message).join(', ');
        throw new AppError(errors, 400, ErrorCodes.VALIDATION_ERROR);
    }

    const { name, sku, slug, description, categoryId, metalType, purity, basePrice, weight, isActive, isFeatured, images, variants } = validationResult.data;

    // Check if category exists
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
        throw new AppError('Invalid category ID', 400, ErrorCodes.VALIDATION_ERROR);
    }

    // Check if SKU already exists
    const existingSku = await prisma.product.findUnique({ where: { sku } });
    if (existingSku) {
        throw new AppError('SKU already exists. Please use a unique SKU.', 400, ErrorCodes.VALIDATION_ERROR);
    }

    // Check if slug already exists
    const productSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existingSlug = await prisma.product.findUnique({ where: { slug: productSlug } });
    if (existingSlug) {
        throw new AppError('Product URL slug already exists. Please use a unique slug.', 400, ErrorCodes.VALIDATION_ERROR);
    }

    // Create product with relations
    const product = await prisma.product.create({
        data: {
            name,
            sku,
            slug: productSlug,
            description: description || '',
            categoryId,
            metalType: metalType || 'Gold',
            purity: purity || '22K',
            basePrice: basePrice || 0,
            weight: weight || 0,
            isActive: isActive ?? true,
            isFeatured: isFeatured ?? false,
            images: images?.length ? {
                create: images.map((img, index) => ({
                    url: img.url,
                    type: index === 0 ? 'thumbnail' : (img.type || 'gallery'),
                    displayOrder: index,
                })),
            } : undefined,
            variants: variants?.length ? {
                create: variants.map((v) => ({
                    size: v.size,
                    stockQuantity: v.stockQuantity || 0,
                    additionalPrice: v.additionalPrice || 0,
                })),
            } : undefined,
        },
        include: {
            category: true,
            images: true,
            variants: true,
        },
    });

    res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
    });
}));

// PUT /api/admin/products/:id - Update product
router.put('/products/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, sku, slug, description, shortDescription, categoryId, metalType, purity, basePrice, weight, isActive, isFeatured, images, variants } = req.body;

    // Update product with transaction for images and variants
    const product = await prisma.$transaction(async (tx) => {
        // Update main product data
        const updated = await tx.product.update({
            where: { id },
            data: {
                name,
                sku,
                slug,
                description,
                categoryId,
                metalType,
                purity,
                basePrice,
                weight,
                isActive,
                isFeatured,
            },
        });

        // Update images if provided
        if (images !== undefined) {
            await tx.productImage.deleteMany({ where: { productId: id } });
            if (images.length > 0) {
                await tx.productImage.createMany({
                    data: images.map((img: { url: string; type: string }, index: number) => ({
                        productId: id,
                        url: img.url,
                        type: index === 0 ? 'thumbnail' : (img.type || 'gallery'),
                        displayOrder: index,
                    })),
                });
            }
        }

        // Update variants if provided
        if (variants !== undefined) {
            await tx.productVariant.deleteMany({ where: { productId: id } });
            if (variants.length > 0) {
                await tx.productVariant.createMany({
                    data: variants.map((v: { size: string; stockQuantity: number; additionalPrice: number }) => ({
                        productId: id,
                        size: v.size,
                        stockQuantity: v.stockQuantity || 0,
                        additionalPrice: v.additionalPrice || 0,
                    })),
                });
            }
        }

        return updated;
    });

    // Fetch updated product with relations
    const updatedProduct = await prisma.product.findUnique({
        where: { id },
        include: {
            category: true,
            images: true,
            variants: true,
        },
    });

    res.json({
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct,
    });
}));

// DELETE /api/admin/products/:id - Delete product
router.delete('/products/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await prisma.product.delete({
        where: { id },
    });

    res.json({
        success: true,
        message: 'Product deleted successfully',
    });
}));

// GET /api/admin/customers - Get all customers
router.get('/customers', asyncHandler(async (req: Request, res: Response) => {
    const { page = '1', limit = '20', search } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { role: 'CUSTOMER' };
    if (search) {
        where.OR = [
            { name: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } },
        ];
    }

    const [customers, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                createdAt: true,
                _count: { select: { orders: true } },
            },
        }),
        prisma.user.count({ where }),
    ]);

    res.json({
        success: true,
        data: {
            customers,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        },
    });
}));

// GET /api/admin/messages - Get all contact messages
router.get('/messages', asyncHandler(async (req: Request, res: Response) => {
    const { page = '1', limit = '20', unreadOnly = 'false' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = unreadOnly === 'true' ? { isRead: false } : {};

    const [messages, total, unreadCount] = await Promise.all([
        prisma.contactMessage.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.contactMessage.count({ where }),
        prisma.contactMessage.count({ where: { isRead: false } }),
    ]);

    res.json({
        success: true,
        data: {
            messages,
            unreadCount,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        },
    });
}));

// PUT /api/admin/messages/:id/read - Mark message as read
router.put('/messages/:id/read', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const message = await prisma.contactMessage.update({
        where: { id },
        data: { isRead: true },
    });

    res.json({
        success: true,
        data: message,
    });
}));

// DELETE /api/admin/messages/:id - Delete message
router.delete('/messages/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await prisma.contactMessage.delete({
        where: { id },
    });

    res.json({
        success: true,
        message: 'Message deleted successfully',
    });
}));
// ========================================
// INVENTORY MANAGEMENT
// ========================================

// GET /api/admin/inventory - Get all product variants with stock levels
router.get('/inventory', asyncHandler(async (req: Request, res: Response) => {
    const { page = '1', limit = '20', search, filter } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const LOW_STOCK_THRESHOLD = 10;

    const where: any = {
        product: { isActive: true },
    };

    // Filter by stock status
    if (filter === 'out-of-stock') {
        where.stockQuantity = 0;
    } else if (filter === 'low-stock') {
        where.stockQuantity = { gt: 0, lte: LOW_STOCK_THRESHOLD };
    }

    // Search by product name or SKU
    if (search) {
        where.product = {
            ...where.product,
            OR: [
                { name: { contains: search as string, mode: 'insensitive' } },
                { sku: { contains: search as string, mode: 'insensitive' } },
            ],
        };
    }

    const [variants, total, outOfStockCount, lowStockCount] = await Promise.all([
        prisma.productVariant.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: { stockQuantity: 'asc' },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        basePrice: true,
                        images: { where: { type: 'thumbnail' }, take: 1 },
                    },
                },
            },
        }),
        prisma.productVariant.count({ where }),
        prisma.productVariant.count({
            where: { stockQuantity: 0, product: { isActive: true } },
        }),
        prisma.productVariant.count({
            where: {
                stockQuantity: { gt: 0, lte: LOW_STOCK_THRESHOLD },
                product: { isActive: true },
            },
        }),
    ]);

    res.json({
        success: true,
        data: {
            variants,
            stats: {
                outOfStockCount,
                lowStockCount,
                lowStockThreshold: LOW_STOCK_THRESHOLD,
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

// PUT /api/admin/inventory/bulk - Bulk update stock (MUST be before :variantId route)
router.put('/inventory/bulk', asyncHandler(async (req: Request, res: Response) => {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
        throw new AppError('Updates array is required', 400, ErrorCodes.VALIDATION_ERROR);
    }

    const results = await prisma.$transaction(
        updates.map(({ variantId, stockQuantity }: { variantId: string; stockQuantity: number }) =>
            prisma.productVariant.update({
                where: { id: variantId },
                data: { stockQuantity },
            })
        )
    );

    res.json({
        success: true,
        message: `Updated stock for ${results.length} variants`,
        data: { updated: results.length },
    });
}));

// PUT /api/admin/inventory/:variantId - Update variant stock
router.put('/inventory/:variantId', asyncHandler(async (req: Request, res: Response) => {
    const { variantId } = req.params;
    const { stockQuantity } = req.body;

    if (typeof stockQuantity !== 'number' || stockQuantity < 0) {
        throw new AppError('Stock quantity must be a non-negative number', 400, ErrorCodes.VALIDATION_ERROR);
    }

    const variant = await prisma.productVariant.update({
        where: { id: variantId },
        data: { stockQuantity },
        include: {
            product: { select: { name: true, sku: true } },
        },
    });

    res.json({
        success: true,
        message: `Stock updated for ${variant.product.name} (Size: ${variant.size})`,
        data: variant,
    });
}));

export default router;
