import { Router, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(authenticate);

// Generate order number
const generateOrderNumber = (): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `JK${timestamp}${random}`;
};

// GET /api/orders - Get user's orders
router.get('/', async (req: AuthRequest, res: Response) => {
    const { page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, parseInt(limit as string, 10));
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
});

// GET /api/orders/:orderNumber - Get single order
router.get('/:orderNumber', async (req: AuthRequest, res: Response) => {
    const { orderNumber } = req.params;

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
        throw new AppError('Order not found', 404);
    }

    res.json({
        success: true,
        data: order,
    });
});

// POST /api/orders - Create order from cart
router.post('/', async (req: AuthRequest, res: Response) => {
    const { shippingAddressId, paymentMethod, promoCode, customerNotes } = req.body;

    if (!shippingAddressId) {
        throw new AppError('Shipping address is required', 400);
    }

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
        throw new AppError('Cart is empty', 400);
    }

    // Verify shipping address belongs to user
    const address = await prisma.address.findFirst({
        where: { id: shippingAddressId, userId: req.user!.id },
    });

    if (!address) {
        throw new AppError('Invalid shipping address', 400);
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

    const taxRate = 0.03; // 3% GST
    const taxAmount = subtotal * taxRate;
    const shippingAmount = subtotal > 10000 ? 0 : 99; // Free shipping over ₹10,000

    // Apply promo code if provided
    let discountAmount = 0;
    if (promoCode) {
        const promo = await prisma.promoCode.findUnique({
            where: { code: promoCode, isActive: true },
        });

        if (promo && new Date() >= promo.validFrom && new Date() <= promo.validUntil) {
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

                    // Update promo usage
                    await prisma.promoCode.update({
                        where: { id: promo.id },
                        data: { usedCount: { increment: 1 } },
                    });
                }
            }
        }
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
            promoCode,
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
});

// POST /api/orders/:orderNumber/cancel - Cancel order
router.post('/:orderNumber/cancel', async (req: AuthRequest, res: Response) => {
    const { orderNumber } = req.params;

    const order = await prisma.order.findFirst({
        where: { orderNumber, userId: req.user!.id },
    });

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
        throw new AppError('Order cannot be cancelled', 400);
    }

    await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
    });

    res.json({
        success: true,
        message: 'Order cancelled successfully',
    });
});

export default router;
