/**
 * Integration Tests for Orders Routes
 * 
 * Tests the /api/orders endpoints
 */

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import orderRoutes from '../../routes/orders';
import { errorHandler, notFound, ErrorCodes } from '../../middleware/error';

// Use the same secret as config (set in setup.ts via process.env)
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
    app.use('/api/orders', orderRoutes);
    app.use(notFound);
    app.use(errorHandler);
    return app;
};

describe('GET /api/orders', () => {
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
            .get('/api/orders');

        expect(response.status).toBe(401);
    });

    it('should return paginated orders', async () => {
        (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([
            { id: 'order-1', orderNumber: 'JK123', status: 'PENDING' },
        ]);
        (mockPrisma.order.count as jest.Mock).mockResolvedValue(1);

        const response = await request(app)
            .get('/api/orders')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('orders');
        expect(response.body.data).toHaveProperty('pagination');
    });
});

describe('GET /api/orders/:orderNumber', () => {
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

    it('should return 404 for non-existent order', async () => {
        (mockPrisma.order.findFirst as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
            .get('/api/orders/JKNONEXISTENT')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(404);
        expect(response.body.code).toBe(ErrorCodes.ORDER_NOT_FOUND);
    });

    it('should return order details', async () => {
        const mockOrder = {
            id: 'order-123',
            orderNumber: 'JK12345',
            status: 'PENDING',
            items: [],
            shippingAddress: { city: 'Mumbai' },
        };
        (mockPrisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);

        const response = await request(app)
            .get('/api/orders/JK12345')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.orderNumber).toBe('JK12345');
    });
});

describe('POST /api/orders', () => {
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

    it('should return 400 for invalid address ID format', async () => {
        const response = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${token}`)
            .send({ shippingAddressId: 'invalid-uuid' });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });

    it('should return 400 for empty cart', async () => {
        (mockPrisma.cart.findUnique as jest.Mock).mockResolvedValue({
            id: 'cart-123',
            items: [],
        });

        const response = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${token}`)
            .send({ shippingAddressId: '550e8400-e29b-41d4-a716-446655440000' });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(ErrorCodes.CART_EMPTY);
    });

    it('should return 400 for invalid address', async () => {
        // Mock non-empty cart
        (mockPrisma.cart.findUnique as jest.Mock).mockResolvedValue({
            id: 'cart-123',
            items: [
                { quantity: 1, product: { basePrice: 10000 }, variant: null },
            ],
        });
        // Mock address not found
        (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${token}`)
            .send({ shippingAddressId: '550e8400-e29b-41d4-a716-446655440000' });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(ErrorCodes.INVALID_ADDRESS);
    });
});

describe('POST /api/orders/:orderNumber/cancel', () => {
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

    it('should return 404 for non-existent order', async () => {
        (mockPrisma.order.findFirst as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
            .post('/api/orders/JKNONEXISTENT/cancel')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(404);
        expect(response.body.code).toBe(ErrorCodes.ORDER_NOT_FOUND);
    });

    it('should return 400 for shipped order', async () => {
        (mockPrisma.order.findFirst as jest.Mock).mockResolvedValue({
            id: 'order-123',
            orderNumber: 'JK12345',
            status: 'SHIPPED', // Cannot cancel
        });

        const response = await request(app)
            .post('/api/orders/JK12345/cancel')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(ErrorCodes.ORDER_CANNOT_CANCEL);
        expect(response.body.details).toHaveProperty('currentStatus', 'SHIPPED');
    });

    it('should successfully cancel pending order', async () => {
        (mockPrisma.order.findFirst as jest.Mock).mockResolvedValue({
            id: 'order-123',
            orderNumber: 'JK12345',
            status: 'PENDING',
        });
        (mockPrisma.order.update as jest.Mock).mockResolvedValue({
            id: 'order-123',
            status: 'CANCELLED',
        });

        const response = await request(app)
            .post('/api/orders/JK12345/cancel')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });
});
