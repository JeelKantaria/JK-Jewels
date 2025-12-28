import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';

const router = Router();

// All cart routes require authentication
router.use(authenticate as (req: Request, res: Response, next: NextFunction) => void);

// GET /api/cart - Get user's cart
router.get('/', async (req: Request, res: Response) => {
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
        const newCart = await prisma.cart.create({
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
        cart = newCart;
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
});

// POST /api/cart/items - Add item to cart
router.post('/items', async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { productId, variantId, quantity = 1 } = req.body;

    if (!productId) {
        throw new AppError('Product ID is required', 400);
    }

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
        throw new AppError('Product not found', 404);
    }

    // Check variant if provided
    if (variantId) {
        const variant = await prisma.productVariant.findUnique({
            where: { id: variantId, productId },
        });
        if (!variant) {
            throw new AppError('Variant not found', 404);
        }
        if (variant.stockQuantity < quantity) {
            throw new AppError('Insufficient stock', 400);
        }
    }

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findUnique({
        where: {
            cartId_productId_variantId: {
                cartId: cart.id,
                productId,
                variantId: variantId || null,
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
});

// PUT /api/cart/items/:id - Update cart item quantity
router.put('/items/:id', async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
        throw new AppError('Valid quantity is required', 400);
    }

    // Find cart item and verify ownership
    const cartItem = await prisma.cartItem.findFirst({
        where: {
            id,
            cart: { userId: user.id },
        },
        include: { variant: true },
    });

    if (!cartItem) {
        throw new AppError('Cart item not found', 404);
    }

    // Check stock if variant
    if (cartItem.variant && cartItem.variant.stockQuantity < quantity) {
        throw new AppError('Insufficient stock', 400);
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
});

// DELETE /api/cart/items/:id - Remove item from cart
router.delete('/items/:id', async (req: Request, res: Response) => {
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
        throw new AppError('Cart item not found', 404);
    }

    await prisma.cartItem.delete({ where: { id } });

    res.json({
        success: true,
        message: 'Item removed from cart',
    });
});

// DELETE /api/cart - Clear cart
router.delete('/', async (req: Request, res: Response) => {
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
});

export default router;
