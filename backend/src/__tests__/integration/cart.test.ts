/**
 * Integration Tests for Cart Routes
 * 
 * Tests the /api/cart endpoints
 */

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import cartRoutes from '../../routes/cart';
import { errorHandler, notFound, ErrorCodes } from '../../middleware/error';

// Use the same secret as config (set in setup.ts via process.env)
const testSecret = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing';

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
    __esModule: true,
    default: {
        cart: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        cartItem: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            deleteMany: jest.fn(),
        },
        product: {
            findUnique: jest.fn(),
        },
        productVariant: {
            findUnique: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
    },
}));

import prisma from '../../lib/prisma';
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Test JWT token
const createTestToken = (userId: string) => {
    return jwt.sign(
        { userId, email: 'test@test.com', role: 'CUSTOMER' },
        testSecret,
        { expiresIn: '1h' }
    );
};

// Create test app
const createTestApp = () => {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/cart', cartRoutes);
    app.use(notFound);
    app.use(errorHandler);
    return app;
};

describe('POST /api/cart/items', () => {
    let app: express.Express;
    const token = createTestToken('user-123');

    beforeEach(() => {
        app = createTestApp();
        jest.clearAllMocks();

        // Mock authenticated user
        (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'user-123',
            email: 'test@test.com',
            name: 'Test User',
            role: 'CUSTOMER',
        });
    });

    it('should return 401 without authentication', async () => {
        const response = await request(app)
            .post('/api/cart/items')
            .send({ productId: 'product-123' });

        expect(response.status).toBe(401);
    });

    it('should return 400 for invalid productId format', async () => {
        const response = await request(app)
            .post('/api/cart/items')
            .set('Authorization', `Bearer ${token}`)
            .send({ productId: 'not-a-uuid' });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });

    it('should return 404 for non-existent product', async () => {
        // Mock cart exists
        (mockPrisma.cart.findUnique as jest.Mock).mockResolvedValue({ id: 'cart-123' });
        // Mock product not found
        (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
            .post('/api/cart/items')
            .set('Authorization', `Bearer ${token}`)
            .send({ productId: '550e8400-e29b-41d4-a716-446655440000' });

        expect(response.status).toBe(404);
        expect(response.body.code).toBe(ErrorCodes.PRODUCT_NOT_FOUND);
    });

    it('should return 404 for non-existent variant', async () => {
        // Mock cart exists
        (mockPrisma.cart.findUnique as jest.Mock).mockResolvedValue({ id: 'cart-123' });
        // Mock product exists
        (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue({
            id: '550e8400-e29b-41d4-a716-446655440000',
            isActive: true,
        });
        // Mock variant not found
        (mockPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
            .post('/api/cart/items')
            .set('Authorization', `Bearer ${token}`)
            .send({
                productId: '550e8400-e29b-41d4-a716-446655440000',
                variantId: '550e8400-e29b-41d4-a716-446655440001',
            });

        expect(response.status).toBe(404);
        expect(response.body.code).toBe(ErrorCodes.VARIANT_NOT_FOUND);
    });

    it('should return 400 for insufficient stock', async () => {
        // Mock cart exists
        (mockPrisma.cart.findUnique as jest.Mock).mockResolvedValue({ id: 'cart-123' });
        // Mock product exists
        (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue({
            id: '550e8400-e29b-41d4-a716-446655440000',
            isActive: true,
        });
        // Mock variant with low stock
        (mockPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue({
            id: '550e8400-e29b-41d4-a716-446655440001',
            stockQuantity: 1,
        });

        const response = await request(app)
            .post('/api/cart/items')
            .set('Authorization', `Bearer ${token}`)
            .send({
                productId: '550e8400-e29b-41d4-a716-446655440000',
                variantId: '550e8400-e29b-41d4-a716-446655440001',
                quantity: 5, // More than available
            });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(ErrorCodes.INSUFFICIENT_STOCK);
        expect(response.body.details).toHaveProperty('available', 1);
        expect(response.body.details).toHaveProperty('requested', 5);
    });
});

describe('PUT /api/cart/items/:id', () => {
    let app: express.Express;
    const token = createTestToken('user-123');

    beforeEach(() => {
        app = createTestApp();
        jest.clearAllMocks();

        // Mock authenticated user
        (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'user-123',
            email: 'test@test.com',
            name: 'Test User',
            role: 'CUSTOMER',
        });
    });

    it('should return 400 for invalid quantity', async () => {
        const response = await request(app)
            .put('/api/cart/items/item-123')
            .set('Authorization', `Bearer ${token}`)
            .send({ quantity: 0 });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });

    it('should return 404 for non-existent cart item', async () => {
        (mockPrisma.cartItem.findFirst as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
            .put('/api/cart/items/item-123')
            .set('Authorization', `Bearer ${token}`)
            .send({ quantity: 2 });

        expect(response.status).toBe(404);
        expect(response.body.code).toBe(ErrorCodes.CART_ITEM_NOT_FOUND);
    });
});

describe('DELETE /api/cart/items/:id', () => {
    let app: express.Express;
    const token = createTestToken('user-123');

    beforeEach(() => {
        app = createTestApp();
        jest.clearAllMocks();

        // Mock authenticated user
        (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'user-123',
            email: 'test@test.com',
            name: 'Test User',
            role: 'CUSTOMER',
        });
    });

    it('should return 404 for non-existent cart item', async () => {
        (mockPrisma.cartItem.findFirst as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
            .delete('/api/cart/items/item-123')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(404);
        expect(response.body.code).toBe(ErrorCodes.CART_ITEM_NOT_FOUND);
    });
});
