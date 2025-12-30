import { Router, Response, Request, RequestHandler } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError, ErrorCodes } from '../middleware/error.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// Note: Guest checkout route is defined AFTER schemas are defined (see below)
// Auth middleware is applied AFTER guest checkout route
// Validation schemas
const createOrderSchema = z.object({
    shippingAddressId: z.string().uuid('Invalid address ID format'),
    paymentMethod: z.string().optional(),
    promoCode: z.string().optional(),
    customerNotes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

// Guest checkout schema - contains inline cart and address
const createGuestOrderSchema = z.object({
    guestEmail: z.string().email('Valid email required'),
    guestName: z.string().min(2, 'Name is required'),
    guestPhone: z.string().min(10, 'Valid phone number required'),
    shippingAddress: z.object({
        addressLine1: z.string().min(5, 'Address line 1 is required'),
        addressLine2: z.string().optional(),
        city: z.string().min(2, 'City is required'),
        state: z.string().min(2, 'State is required'),
        pincode: z.string().min(6, 'Valid pincode required'),
        country: z.string().default('India'),
    }),
    items: z.array(z.object({
        productId: z.string().uuid('Invalid product ID'),
        variantId: z.string().uuid('Invalid variant ID').optional(),
        quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    })).min(1, 'At least one item required'),
    promoCode: z.string().optional(),
    customerNotes: z.string().max(500).optional(),
});

const paginationSchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
});

// Generate order number
const generateOrderNumber = (): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `JK${timestamp}${random}`;
};

// Stock validation and deduction
interface OrderItemForStock {
    productId: string;
    variantId?: string | null;
    quantity: number;
    productName?: string;
}

const validateAndDeductStock = async (
    items: OrderItemForStock[],
    prismaClient: typeof prisma
): Promise<void> => {
    // Group items by variantId for efficient stock checking
    for (const item of items) {
        if (item.variantId) {
            // Check variant stock
            const variant = await prismaClient.productVariant.findUnique({
                where: { id: item.variantId },
                include: { product: { select: { name: true } } },
            });

            if (!variant) {
                throw new AppError(
                    `Product variant not found`,
                    400,
                    ErrorCodes.VALIDATION_ERROR
                );
            }

            if (variant.stockQuantity < item.quantity) {
                throw new AppError(
                    `Insufficient stock for "${variant.product.name}" (Size: ${variant.size}). Available: ${variant.stockQuantity}, Requested: ${item.quantity}`,
                    400,
                    'OUT_OF_STOCK' as any
                );
            }

            // Deduct stock
            await prismaClient.productVariant.update({
                where: { id: item.variantId },
                data: { stockQuantity: { decrement: item.quantity } },
            });
        }
    }
};

// Restore stock on cancellation
const restoreStock = async (
    orderId: string,
    prismaClient: typeof prisma
): Promise<void> => {
    const orderItems = await prismaClient.orderItem.findMany({
        where: { orderId },
    });

    for (const item of orderItems) {
        if (item.variantId) {
            await prismaClient.productVariant.update({
                where: { id: item.variantId },
                data: { stockQuantity: { increment: item.quantity } },
            });
        }
    }
};

// ========================================
// GUEST CHECKOUT (No authentication required)
// ========================================
router.post('/guest', asyncHandler(async (req: Request, res: Response) => {
    const validationResult = createGuestOrderSchema.safeParse(req.body);
    if (!validationResult.success) {
        throw validationResult.error;
    }

    const { guestEmail, guestName, guestPhone, shippingAddress, items, promoCode, customerNotes } = validationResult.data;

    // Fetch products and variants for the order items
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { variants: true },
    });

    if (products.length !== productIds.length) {
        throw new AppError('One or more products not found', 400, ErrorCodes.PRODUCT_NOT_FOUND);
    }

    // Build order items and calculate totals
    let subtotal = 0;
    const orderItems: {
        productId: string;
        variantId: string | null;
        productName: string;
        productSku: string;
        size: string | null;
        unitPrice: number;
        quantity: number;
        totalPrice: number;
    }[] = [];

    for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (!product) {
            throw new AppError(`Product ${item.productId} not found`, 400, ErrorCodes.PRODUCT_NOT_FOUND);
        }

        let variant = null;
        let additionalPrice = 0;
        if (item.variantId) {
            variant = product.variants.find(v => v.id === item.variantId);
            if (!variant) {
                throw new AppError(`Variant ${item.variantId} not found`, 400, ErrorCodes.VALIDATION_ERROR);
            }
            additionalPrice = Number(variant.additionalPrice);
        }

        const unitPrice = Number(product.basePrice) + additionalPrice;
        const itemTotal = unitPrice * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
            productId: product.id,
            variantId: item.variantId || null,
            productName: product.name,
            productSku: product.sku,
            size: variant?.size || null,
            unitPrice,
            quantity: item.quantity,
            totalPrice: itemTotal,
        });
    }

    // Validate and deduct stock for all items
    await validateAndDeductStock(
        items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
        })),
        prisma
    );

    const taxRate = 0.03;
    const taxAmount = subtotal * taxRate;
    const shippingAmount = subtotal > 10000 ? 0 : 99;

    // Apply promo code if provided
    let discountAmount = 0;
    let appliedPromoCode: string | undefined = undefined;

    if (promoCode) {
        const promo = await prisma.promoCode.findUnique({
            where: { code: promoCode, isActive: true },
        });

        if (promo) {
            const now = new Date();
            if (now >= promo.validFrom && now <= promo.validUntil) {
                if (!promo.minOrderAmount || subtotal >= Number(promo.minOrderAmount)) {
                    if (!promo.usageLimit || promo.usedCount < promo.usageLimit) {
                        if (promo.discountType === 'percentage') {
                            discountAmount = subtotal * (Number(promo.discountValue) / 100);
                            if (promo.maxDiscount) {
                                discountAmount = Math.min(discountAmount, Number(promo.maxDiscount));
                            }
                        } else {
                            discountAmount = Number(promo.discountValue);
                        }
                        await prisma.promoCode.update({
                            where: { id: promo.id },
                            data: { usedCount: { increment: 1 } },
                        });
                        appliedPromoCode = promoCode;
                    }
                }
            }
        }
    }

    const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

    // Create guest order (userId is null for guests)
    const order = await prisma.order.create({
        data: {
            orderNumber: generateOrderNumber(),
            // Guest orders have no userId - store guest info instead
            guestEmail,
            guestName,
            guestPhone,
            // Store guest address directly on order
            guestAddressLine1: shippingAddress.addressLine1,
            guestAddressLine2: shippingAddress.addressLine2,
            guestCity: shippingAddress.city,
            guestState: shippingAddress.state,
            guestPincode: shippingAddress.pincode,
            guestCountry: shippingAddress.country,
            // Amounts
            subtotal,
            taxAmount,
            shippingAmount,
            discountAmount,
            totalAmount,
            promoCode: appliedPromoCode,
            customerNotes,
            items: {
                create: orderItems,
            },
        },
        include: {
            items: true,
        },
    });

    res.status(201).json({
        success: true,
        message: 'Guest order created successfully',
        data: order,
    });
}));

// ========================================
// AUTHENTICATED ROUTES (Require login)
// ========================================
router.use(authenticate as unknown as RequestHandler);

// GET /api/orders - Get user's orders
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where: { userId: req.user!.id },
            skip,
            take: limitNum,
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                images: { where: { type: 'thumbnail' }, take: 1 },
                            },
                        },
                    },
                },
                shippingAddress: true,
            },
        }),
        prisma.order.count({ where: { userId: req.user!.id } }),
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

// GET /api/orders/:orderNumber - Get single order
router.get('/:orderNumber', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orderNumber } = req.params;

    if (!orderNumber || orderNumber.length < 3) {
        throw new AppError(
            'Invalid order number format',
            400,
            ErrorCodes.VALIDATION_ERROR
        );
    }

    const order = await prisma.order.findFirst({
        where: { orderNumber, userId: req.user!.id },
        include: {
            items: {
                include: {
                    product: {
                        include: {
                            images: { take: 1 },
                        },
                    },
                    variant: true,
                },
            },
            shippingAddress: true,
        },
    });

    if (!order) {
        throw new AppError(
            'Order not found',
            404,
            ErrorCodes.ORDER_NOT_FOUND
        );
    }

    res.json({
        success: true,
        data: order,
    });
}));

// POST /api/orders - Create order from cart
router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
    // Validate input
    const validationResult = createOrderSchema.safeParse(req.body);
    if (!validationResult.success) {
        throw validationResult.error;
    }

    const { shippingAddressId, paymentMethod, promoCode, customerNotes } = validationResult.data;

    // Get user's cart
    const cart = await prisma.cart.findUnique({
        where: { userId: req.user!.id },
        include: {
            items: {
                include: {
                    product: true,
                    variant: true,
                },
            },
        },
    });

    if (!cart || cart.items.length === 0) {
        throw new AppError(
            'Cart is empty',
            400,
            ErrorCodes.CART_EMPTY
        );
    }

    // Verify shipping address belongs to user
    const address = await prisma.address.findFirst({
        where: { id: shippingAddressId, userId: req.user!.id },
    });

    if (!address) {
        throw new AppError(
            'Invalid shipping address',
            400,
            ErrorCodes.INVALID_ADDRESS
        );
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems: {
        productId: string;
        variantId: string | null;
        productName: string;
        productSku: string;
        size: string | null;
        unitPrice: number;
        quantity: number;
        totalPrice: number;
    }[] = [];

    for (const item of cart.items) {
        const unitPrice = Number(item.product.basePrice) + Number(item.variant?.additionalPrice || 0);
        const itemTotal = unitPrice * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.product.name,
            productSku: item.product.sku,
            size: item.variant?.size || null,
            unitPrice,
            quantity: item.quantity,
            totalPrice: itemTotal,
        });
    }

    // Validate and deduct stock for all items
    await validateAndDeductStock(
        cart.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
        })),
        prisma
    );

    const taxRate = 0.03; // 3% GST
    const taxAmount = subtotal * taxRate;
    const shippingAmount = subtotal > 10000 ? 0 : 99; // Free shipping over ₹10,000

    // Apply promo code if provided
    let discountAmount = 0;
    let appliedPromoCode: string | undefined = undefined;

    if (promoCode) {
        const promo = await prisma.promoCode.findUnique({
            where: { code: promoCode, isActive: true },
        });

        if (!promo) {
            throw new AppError(
                'Promo code not found or inactive',
                400,
                ErrorCodes.PROMO_NOT_FOUND
            );
        }

        const now = new Date();
        if (now < promo.validFrom || now > promo.validUntil) {
            throw new AppError(
                'Promo code has expired',
                400,
                ErrorCodes.PROMO_EXPIRED,
                { validFrom: promo.validFrom, validUntil: promo.validUntil }
            );
        }

        if (promo.minOrderAmount && subtotal < Number(promo.minOrderAmount)) {
            throw new AppError(
                `Minimum order amount of ₹${promo.minOrderAmount} required`,
                400,
                ErrorCodes.PROMO_MIN_ORDER,
                { minOrderAmount: Number(promo.minOrderAmount), currentSubtotal: subtotal }
            );
        }

        if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
            throw new AppError(
                'Promo code usage limit exceeded',
                400,
                ErrorCodes.PROMO_USAGE_EXCEEDED
            );
        }

        // Calculate discount
        if (promo.discountType === 'percentage') {
            discountAmount = subtotal * (Number(promo.discountValue) / 100);
            if (promo.maxDiscount) {
                discountAmount = Math.min(discountAmount, Number(promo.maxDiscount));
            }
        } else {
            discountAmount = Number(promo.discountValue);
        }

        // Update promo usage
        await prisma.promoCode.update({
            where: { id: promo.id },
            data: { usedCount: { increment: 1 } },
        });

        appliedPromoCode = promoCode;
    }

    const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

    // Create order
    const order = await prisma.order.create({
        data: {
            orderNumber: generateOrderNumber(),
            userId: req.user!.id,
            subtotal,
            taxAmount,
            shippingAmount,
            discountAmount,
            totalAmount,
            shippingAddressId,
            paymentMethod,
            promoCode: appliedPromoCode,
            customerNotes,
            items: {
                create: orderItems,
            },
        },
        include: {
            items: true,
            shippingAddress: true,
        },
    });

    // Clear cart
    await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
    });

    res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: order,
    });
}));

// POST /api/orders/:orderNumber/cancel - Cancel order
router.post('/:orderNumber/cancel', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orderNumber } = req.params;

    const order = await prisma.order.findFirst({
        where: { orderNumber, userId: req.user!.id },
    });

    if (!order) {
        throw new AppError(
            'Order not found',
            404,
            ErrorCodes.ORDER_NOT_FOUND
        );
    }

    const cancellableStatuses = ['PENDING', 'CONFIRMED'];
    if (!cancellableStatuses.includes(order.status)) {
        throw new AppError(
            `Order cannot be cancelled. Current status: ${order.status}`,
            400,
            ErrorCodes.ORDER_CANNOT_CANCEL,
            { currentStatus: order.status, cancellableStatuses }
        );
    }

    // Restore stock before cancelling
    await restoreStock(order.id, prisma);

    await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
    });

    res.json({
        success: true,
        message: 'Order cancelled successfully. Stock has been restored.',
    });
}));

export default router;
