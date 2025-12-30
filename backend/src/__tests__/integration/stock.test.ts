/**
 * Integration Tests for Stock Validation in Orders
 * 
 * Tests the stock validation and deduction functionality in order creation
 */

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import orderRoutes from '../../routes/orders';
import { errorHandler, notFound, ErrorCodes } from '../../middleware/error';

// Use the same secret as config
const testSecret = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing';

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
    __esModule: true,
    default: {
        order: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
        cart: {
            findUnique: jest.fn(),
        },
        cartItem: {
            deleteMany: jest.fn(),
        },
        address: {
            findFirst: jest.fn(),
        },
        promoCode: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        promoCodeUsage: {
            count: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
        productVariant: {
            findUnique: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
        },
        $transaction: jest.fn(),
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
    app.use('/api/orders', orderRoutes);
    app.use(notFound);
    app.use(errorHandler);
    return app;
};

describe('Stock Validation on Order Creation', () => {
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

    it('should return error for out-of-stock product', async () => {
        // Mock cart with item that has variant
        (mockPrisma.cart.findUnique as jest.Mock).mockResolvedValue({
            id: 'cart-123',
            items: [
                {
                    id: 'item-1',
                    quantity: 5,
                    product: { id: 'product-1', name: 'Gold Ring', basePrice: 10000 },
                    variant: { id: 'variant-1', size: 'M', additionalPrice: 0 },
                },
            ],
        });

        // Mock variant with 0 stock
        (mockPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue({
            id: 'variant-1',
            stockQuantity: 0,
            product: { name: 'Gold Ring' },
        });

        // Mock valid address
        (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue({
            id: 'address-1',
            userId: 'user-123',
            fullName: 'Test User',
        });

        const response = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${token}`)
            .send({ shippingAddressId: '550e8400-e29b-41d4-a716-446655440000' });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(ErrorCodes.INSUFFICIENT_STOCK);
    });

    it('should return error for insufficient stock quantity', async () => {
        // Mock cart with item requesting more than available
        (mockPrisma.cart.findUnique as jest.Mock).mockResolvedValue({
            id: 'cart-123',
            items: [
                {
                    id: 'item-1',
                    quantity: 10, // Requesting 10
                    product: { id: 'product-1', name: 'Diamond Necklace', basePrice: 50000 },
                    variant: { id: 'variant-1', size: 'L', additionalPrice: 5000 },
                },
            ],
        });

        // Mock variant with only 3 in stock
        (mockPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue({
            id: 'variant-1',
            stockQuantity: 3, // Only 3 available
            product: { name: 'Diamond Necklace' },
        });

        // Mock valid address
        (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue({
            id: 'address-1',
            userId: 'user-123',
            fullName: 'Test User',
        });

        const response = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${token}`)
            .send({ shippingAddressId: '550e8400-e29b-41d4-a716-446655440000' });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(ErrorCodes.INSUFFICIENT_STOCK);
        expect(response.body.details).toHaveProperty('available', 3);
        expect(response.body.details).toHaveProperty('requested', 10);
    });
});

describe('Stock Restoration on Order Cancellation', () => {
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

    it('should restore stock when order is cancelled', async () => {
        // Mock order with items
        (mockPrisma.order.findFirst as jest.Mock).mockResolvedValue({
            id: 'order-123',
            orderNumber: 'JK12345',
            status: 'PENDING',
            userId: 'user-123',
            items: [
                {
                    id: 'item-1',
                    quantity: 2,
                    variantId: 'variant-1',
                },
            ],
        });

        // Mock variant
        (mockPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue({
            id: 'variant-1',
            stockQuantity: 5,
        });

        // Mock variant update (stock restoration)
        (mockPrisma.productVariant.update as jest.Mock).mockResolvedValue({
            id: 'variant-1',
            stockQuantity: 7, // 5 + 2 restored
        });

        // Mock order update
        (mockPrisma.order.update as jest.Mock).mockResolvedValue({
            id: 'order-123',
            status: 'CANCELLED',
        });

        const response = await request(app)
            .post('/api/orders/JK12345/cancel')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        // Verify stock restoration was called
        expect(mockPrisma.productVariant.update).toHaveBeenCalled();
    });

    it('should not restore stock for already cancelled orders', async () => {
        // Mock already cancelled order
        (mockPrisma.order.findFirst as jest.Mock).mockResolvedValue({
            id: 'order-123',
            orderNumber: 'JK12345',
            status: 'CANCELLED',
            userId: 'user-123',
            items: [],
        });

        const response = await request(app)
            .post('/api/orders/JK12345/cancel')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(ErrorCodes.ORDER_CANNOT_CANCEL);
    });
});

describe('Guest Checkout Stock Validation', () => {
    let app: express.Express;

    beforeEach(() => {
        app = createTestApp();
        jest.clearAllMocks();
    });

    it('should validate stock for guest checkout', async () => {
        // Mock variant with 0 stock
        (mockPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue({
            id: 'variant-1',
            stockQuantity: 0,
            product: { name: 'Ruby Earrings' },
        });

        const response = await request(app)
            .post('/api/orders/guest')
            .send({
                email: 'guest@test.com',
                name: 'Guest User',
                phone: '9876543210',
                items: [
                    { productId: 'product-1', variantId: 'variant-1', quantity: 1 },
                ],
                shippingAddress: {
                    fullName: 'Guest User',
                    phone: '9876543210',
                    addressLine1: '123 Main St',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    pincode: '400001',
                },
            });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(ErrorCodes.INSUFFICIENT_STOCK);
    });
});
