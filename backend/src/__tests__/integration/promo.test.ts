/**
 * Integration Tests for Promo Code Routes
 * 
 * Tests the /api/promo endpoints
 */

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import promoRoutes from '../../routes/promo';
import { errorHandler, notFound, ErrorCodes } from '../../middleware/error';

// Use the same secret as config (set in setup.ts via process.env)
const testSecret = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing';

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
    __esModule: true,
    default: {
        promoCode: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
        promoCodeUsage: {
            count: jest.fn(),
            groupBy: jest.fn(),
        },
        order: {
            count: jest.fn(),
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
    app.use('/api/promo', promoRoutes);
    app.use(notFound);
    app.use(errorHandler);
    return app;
};

describe('POST /api/promo/validate', () => {
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
            .post('/api/promo/validate')
            .send({ code: 'FLAT500', cartTotal: 10000 });

        expect(response.status).toBe(401);
    }, 60000); // Increase timeout for cold start

    it('should return 400 for missing code', async () => {
        const response = await request(app)
            .post('/api/promo/validate')
            .set('Authorization', `Bearer ${token}`)
            .send({ cartTotal: 10000 });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });

    it('should return 400 for invalid promo code', async () => {
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
            .post('/api/promo/validate')
            .set('Authorization', `Bearer ${token}`)
            .send({ code: 'INVALIDCODE', cartTotal: 10000 });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(ErrorCodes.PROMO_NOT_FOUND);
    });

    it('should return 400 for expired promo code', async () => {
        const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue({
            id: 'promo-1',
            code: 'EXPIRED',
            isActive: true,
            validFrom: new Date(Date.now() - 48 * 60 * 60 * 1000),
            validUntil: expiredDate,
            perUserLimit: 1,
        });
        (mockPrisma.promoCodeUsage.count as jest.Mock).mockResolvedValue(0);

        const response = await request(app)
            .post('/api/promo/validate')
            .set('Authorization', `Bearer ${token}`)
            .send({ code: 'EXPIRED', cartTotal: 10000 });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(ErrorCodes.PROMO_EXPIRED);
    });

    it('should return 400 when cart total is below minimum', async () => {
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue({
            id: 'promo-1',
            code: 'FLAT500',
            isActive: true,
            validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000),
            validUntil: futureDate,
            discountType: 'fixed',
            discountValue: 500,
            minOrderAmount: 5000,
            maxDiscount: null,
            usageLimit: null,
            usedCount: 0,
            perUserLimit: 3,
            isFirstOrderOnly: false,
        });
        (mockPrisma.promoCodeUsage.count as jest.Mock).mockResolvedValue(0);

        const response = await request(app)
            .post('/api/promo/validate')
            .set('Authorization', `Bearer ${token}`)
            .send({ code: 'FLAT500', cartTotal: 2000 }); // Below 5000 minimum

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(ErrorCodes.PROMO_MIN_ORDER);
    });

    it('should return 400 when per-user limit exceeded', async () => {
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue({
            id: 'promo-1',
            code: 'FLAT500',
            isActive: true,
            validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000),
            validUntil: futureDate,
            discountType: 'fixed',
            discountValue: 500,
            minOrderAmount: 5000,
            usageLimit: null,
            usedCount: 0,
            perUserLimit: 1,
            isFirstOrderOnly: false,
        });
        (mockPrisma.promoCodeUsage.count as jest.Mock).mockResolvedValue(1); // Already used once

        const response = await request(app)
            .post('/api/promo/validate')
            .set('Authorization', `Bearer ${token}`)
            .send({ code: 'FLAT500', cartTotal: 10000 });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(ErrorCodes.PROMO_USAGE_EXCEEDED);
    });

    it('should return 400 for first-order-only code when user has orders', async () => {
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue({
            id: 'promo-1',
            code: 'WELCOME10',
            isActive: true,
            validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000),
            validUntil: futureDate,
            discountType: 'percentage',
            discountValue: 10,
            minOrderAmount: 10000,
            maxDiscount: 5000,
            usageLimit: null,
            usedCount: 0,
            perUserLimit: 1,
            isFirstOrderOnly: true,
        });
        (mockPrisma.promoCodeUsage.count as jest.Mock).mockResolvedValue(0);
        (mockPrisma.order.count as jest.Mock).mockResolvedValue(2); // User has 2 orders

        const response = await request(app)
            .post('/api/promo/validate')
            .set('Authorization', `Bearer ${token}`)
            .send({ code: 'WELCOME10', cartTotal: 15000 });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(ErrorCodes.PROMO_USAGE_EXCEEDED);
    });

    it('should validate and return discount for percentage code', async () => {
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue({
            id: 'promo-1',
            code: 'FESTIVE20',
            description: '20% off on all orders',
            isActive: true,
            validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000),
            validUntil: futureDate,
            discountType: 'percentage',
            discountValue: 20,
            minOrderAmount: 15000,
            maxDiscount: 10000,
            usageLimit: null,
            usedCount: 0,
            perUserLimit: 1,
            isFirstOrderOnly: false,
            allowWithOther: false,
        });
        (mockPrisma.promoCodeUsage.count as jest.Mock).mockResolvedValue(0);

        const response = await request(app)
            .post('/api/promo/validate')
            .set('Authorization', `Bearer ${token}`)
            .send({ code: 'FESTIVE20', cartTotal: 50000 });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.code).toBe('FESTIVE20');
        expect(response.body.data.discountAmount).toBe(10000); // 20% of 50000 = 10000, capped by maxDiscount
    });

    it('should validate and return discount for fixed code', async () => {
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        (mockPrisma.promoCode.findUnique as jest.Mock).mockResolvedValue({
            id: 'promo-1',
            code: 'FLAT500',
            description: '₹500 off on orders above ₹5,000',
            isActive: true,
            validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000),
            validUntil: futureDate,
            discountType: 'fixed',
            discountValue: 500,
            minOrderAmount: 5000,
            maxDiscount: null,
            usageLimit: null,
            usedCount: 0,
            perUserLimit: 3,
            isFirstOrderOnly: false,
            allowWithOther: false,
        });
        (mockPrisma.promoCodeUsage.count as jest.Mock).mockResolvedValue(0);

        const response = await request(app)
            .post('/api/promo/validate')
            .set('Authorization', `Bearer ${token}`)
            .send({ code: 'FLAT500', cartTotal: 10000 });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.code).toBe('FLAT500');
        expect(response.body.data.discountAmount).toBe(500);
    });
});

describe('GET /api/promo/available', () => {
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
            .get('/api/promo/available');

        expect(response.status).toBe(401);
    });

    it('should return available promo codes', async () => {
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        (mockPrisma.order.count as jest.Mock).mockResolvedValue(0);
        (mockPrisma.promoCode.findMany as jest.Mock).mockResolvedValue([
            {
                id: 'promo-1',
                code: 'FLAT500',
                description: '₹500 off',
                discountType: 'fixed',
                discountValue: 500,
                minOrderAmount: 5000,
                maxDiscount: null,
                validUntil: futureDate,
                isFirstOrderOnly: false,
                usageLimit: null,
                usedCount: 0,
                perUserLimit: 3,
            },
        ]);
        (mockPrisma.promoCodeUsage.groupBy as jest.Mock).mockResolvedValue([]);

        const response = await request(app)
            .get('/api/promo/available')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data[0].code).toBe('FLAT500');
    });

    it('should filter out first-order codes for returning customers', async () => {
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        (mockPrisma.order.count as jest.Mock).mockResolvedValue(2); // Returning customer
        (mockPrisma.promoCode.findMany as jest.Mock).mockResolvedValue([
            {
                id: 'promo-1',
                code: 'WELCOME10',
                description: '10% off for new customers',
                discountType: 'percentage',
                discountValue: 10,
                minOrderAmount: 10000,
                maxDiscount: 5000,
                validUntil: futureDate,
                isFirstOrderOnly: true, // First order only
                usageLimit: null,
                usedCount: 0,
                perUserLimit: 1,
            },
            {
                id: 'promo-2',
                code: 'FLAT500',
                description: '₹500 off',
                discountType: 'fixed',
                discountValue: 500,
                minOrderAmount: 5000,
                maxDiscount: null,
                validUntil: futureDate,
                isFirstOrderOnly: false,
                usageLimit: null,
                usedCount: 0,
                perUserLimit: 3,
            },
        ]);
        (mockPrisma.promoCodeUsage.groupBy as jest.Mock).mockResolvedValue([]);

        const response = await request(app)
            .get('/api/promo/available')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].code).toBe('FLAT500'); // WELCOME10 filtered out
    });
});
