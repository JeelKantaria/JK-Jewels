import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError, ErrorCodes } from '../middleware/error.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// Validation schemas
const addToCartSchema = z.object({
    productId: z.string().uuid('Invalid product ID format'),
    variantId: z.string().uuid('Invalid variant ID format').optional().nullable().transform(v => v ?? null),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
});

const updateCartItemSchema = z.object({
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

// All cart routes require authentication
router.use(authenticate as (req: Request, res: Response, next: NextFunction) => void);

// GET /api/cart - Get user's cart
router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    let cart = await prisma.cart.findUnique({
        where: { userId: user.id },
        include: {
            items: {
                include: {
                    product: {
                        include: {
                            images: {
                                where: { type: 'thumbnail' },
                                take: 1,
                            },
                        },
                    },
                    variant: true,
                },
            },
        },
    });

    // Create cart if doesn't exist
    if (!cart) {
        cart = await prisma.cart.create({
            data: { userId: user.id },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                images: {
                                    where: { type: 'thumbnail' },
                                    take: 1,
                                },
                            },
                        },
                        variant: true
                    }
                }
            },
        });
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => {
        const price = Number(item.product.basePrice) + Number(item.variant?.additionalPrice || 0);
        return sum + price * item.quantity;
    }, 0);

    const taxRate = 0.03; // 3% GST
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    res.json({
        success: true,
        data: {
            ...cart,
            subtotal,
            tax,
            total,
            itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        },
    });
}));

// POST /api/cart/items - Add item to cart
router.post('/items', asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    // Validate input
    const validationResult = addToCartSchema.safeParse(req.body);
    if (!validationResult.success) {
        throw validationResult.error;
    }

    const { productId, variantId, quantity } = validationResult.data;

    // Get or create cart
    let cart = await prisma.cart.findUnique({
        where: { userId: user.id },
    });

    if (!cart) {
        cart = await prisma.cart.create({
            data: { userId: user.id },
        });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
        where: { id: productId, isActive: true },
    });

    if (!product) {
        throw new AppError(
            'Product not found',
            404,
            ErrorCodes.PRODUCT_NOT_FOUND
        );
    }

    // Check variant if provided
    if (variantId) {
        const variant = await prisma.productVariant.findUnique({
            where: { id: variantId, productId },
        });
        if (!variant) {
            throw new AppError(
                'Variant not found',
                404,
                ErrorCodes.VARIANT_NOT_FOUND
            );
        }
        if (variant.stockQuantity < quantity) {
            throw new AppError(
                `Only ${variant.stockQuantity} items available in stock`,
                400,
                ErrorCodes.INSUFFICIENT_STOCK,
                { available: variant.stockQuantity, requested: quantity }
            );
        }
    }

    // Check if item already in cart
    // Note: Prisma unique constraint lookup requires exact type match
    const existingItem = await prisma.cartItem.findUnique({
        where: {
            cartId_productId_variantId: {
                cartId: cart.id,
                productId,
                variantId: variantId as string,
            },
        },
    });

    let cartItem;
    if (existingItem) {
        // Update quantity
        cartItem = await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + quantity },
            include: { product: true, variant: true },
        });
    } else {
        // Create new cart item
        cartItem = await prisma.cartItem.create({
            data: {
                cartId: cart.id,
                productId,
                variantId,
                quantity,
            },
            include: { product: true, variant: true },
        });
    }

    res.status(201).json({
        success: true,
        message: 'Item added to cart',
        data: cartItem,
    });
}));

// PUT /api/cart/items/:id - Update cart item quantity
router.put('/items/:id', asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { id } = req.params;

    // Validate input
    const validationResult = updateCartItemSchema.safeParse(req.body);
    if (!validationResult.success) {
        throw validationResult.error;
    }

    const { quantity } = validationResult.data;

    // Find cart item and verify ownership
    const cartItem = await prisma.cartItem.findFirst({
        where: {
            id,
            cart: { userId: user.id },
        },
        include: { variant: true },
    });

    if (!cartItem) {
        throw new AppError(
            'Cart item not found',
            404,
            ErrorCodes.CART_ITEM_NOT_FOUND
        );
    }

    // Check stock if variant
    if (cartItem.variant && cartItem.variant.stockQuantity < quantity) {
        throw new AppError(
            `Only ${cartItem.variant.stockQuantity} items available in stock`,
            400,
            ErrorCodes.INSUFFICIENT_STOCK,
            { available: cartItem.variant.stockQuantity, requested: quantity }
        );
    }

    const updatedItem = await prisma.cartItem.update({
        where: { id },
        data: { quantity },
        include: { product: true, variant: true },
    });

    res.json({
        success: true,
        message: 'Cart updated',
        data: updatedItem,
    });
}));

// DELETE /api/cart/items/:id - Remove item from cart
router.delete('/items/:id', asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { id } = req.params;

    // Find and verify ownership
    const cartItem = await prisma.cartItem.findFirst({
        where: {
            id,
            cart: { userId: user.id },
        },
    });

    if (!cartItem) {
        throw new AppError(
            'Cart item not found',
            404,
            ErrorCodes.CART_ITEM_NOT_FOUND
        );
    }

    await prisma.cartItem.delete({ where: { id } });

    res.json({
        success: true,
        message: 'Item removed from cart',
    });
}));

// DELETE /api/cart - Clear cart
router.delete('/', asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    const cart = await prisma.cart.findUnique({
        where: { userId: user.id },
    });

    if (cart) {
        await prisma.cartItem.deleteMany({
            where: { cartId: cart.id },
        });
    }

    res.json({
        success: true,
        message: 'Cart cleared',
    });
}));

export default router;
