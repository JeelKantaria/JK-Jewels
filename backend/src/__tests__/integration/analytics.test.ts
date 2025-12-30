
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import analyticsRoutes from '../../routes/analytics';
import { errorHandler, notFound, ErrorCodes } from '../../middleware/error';

// Use the same secret as config
const testSecret = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing';

// Mock Prisma
jest.mock('../../lib/prisma', () => {
    const mockPrismaClient = {
        $queryRaw: jest.fn(),
        order: {
            groupBy: jest.fn(),
            aggregate: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
            count: jest.fn(),
            findFirst: jest.fn(),
        },
        orderItem: {
            groupBy: jest.fn(),
        },
        product: {
            findUnique: jest.fn(),
        }
    };
    return {
        __esModule: true,
        default: mockPrismaClient,
        prisma: mockPrismaClient,
    };
});

import prisma from '../../lib/prisma';
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Test Admin Token
const createAdminToken = (userId: string) => {
    return jwt.sign(
        { userId, email: 'admin@test.com', role: 'ADMIN' },
        testSecret,
        { expiresIn: '1h' }
    );
};

const createUserToken = (userId: string) => {
    return jwt.sign(
        { userId, email: 'user@test.com', role: 'CUSTOMER' },
        testSecret,
        { expiresIn: '1h' }
    );
};

// Create test app
const createTestApp = () => {
    const app = express();
    app.use(express.json());
    app.use('/api/admin/analytics', analyticsRoutes);
    app.use(notFound);
    app.use(errorHandler);
    return app;
};

describe('Analytics Routes', () => {
    let app: express.Express;
    const adminToken = createAdminToken('admin-123');
    const userToken = createUserToken('user-123');

    beforeEach(() => {
        app = createTestApp();
        jest.clearAllMocks();

        // Mock authenticated admin
        (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'admin-123',
            email: 'admin@test.com',
            name: 'Admin User',
            role: 'ADMIN',
        });
    });

    describe('GET /api/admin/analytics/overview', () => {
        it('should return 401 without authentication', async () => {
            const response = await request(app).get('/api/admin/analytics/overview');
            expect(response.status).toBe(401);
        });

        it('should return 403 for non-admin user', async () => {
            // Mock authenticated customer
            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: 'user-123',
                email: 'user@test.com',
                name: 'User',
                role: 'CUSTOMER',
            });

            const response = await request(app)
                .get('/api/admin/analytics/overview')
                .set('Authorization', `Bearer ${userToken}`);
            expect(response.status).toBe(403);
        });

        it('should return overview data successfully', async () => {
            // Mock $queryRaw for monthly stats
            (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([
                { month: new Date(), orderCount: BigInt(10), revenue: 50000 }
            ]);

            // Mock order.groupBy for status breakdown
            (mockPrisma.order.groupBy as jest.Mock).mockResolvedValue([
                { status: 'DELIVERED', _count: { id: 5 } },
                { status: 'PENDING', _count: { id: 5 } }
            ]);

            const response = await request(app)
                .get('/api/admin/analytics/overview')
                .set('Authorization', `Bearer ${adminToken}`);

            if (response.status !== 200) {
                console.error('Overview Error:', response.body);
            }
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('monthlyData');
            expect(response.body.data).toHaveProperty('statusBreakdown');
            expect(response.body.data.monthlyData).toHaveLength(6); // Should always return 6 months
            expect(response.body.data.statusBreakdown).toHaveLength(2);
        });
    });

    describe('GET /api/admin/analytics/comparison', () => {
        it('should return comparison data', async () => {
            // Mock aggregations
            (mockPrisma.order.aggregate as jest.Mock)
                .mockResolvedValueOnce({ _sum: { totalAmount: 1000 }, _count: { id: 10 } }) // Current
                .mockResolvedValueOnce({ _sum: { totalAmount: 800 }, _count: { id: 8 } }); // Previous

            (mockPrisma.user.count as jest.Mock)
                .mockResolvedValueOnce(20) // Current customers
                .mockResolvedValueOnce(15); // Previous customers

            const response = await request(app)
                .get('/api/admin/analytics/comparison')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('revenueGrowth', 25); // (1000-800)/800 * 100
            expect(response.body.data).toHaveProperty('orderGrowth', 25); // (10-8)/8 * 100
            expect(response.body.data).toHaveProperty('customerGrowth', 33.3); // (20-15)/15 * 100
        });
    });

    describe('GET /api/admin/analytics/top-products', () => {
        it('should return top products', async () => {
            (mockPrisma.orderItem.groupBy as jest.Mock).mockResolvedValue([
                { productId: 'prod-1', _sum: { quantity: 5, totalPrice: 10000 } },
            ]);

            (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue({
                name: 'Test Ring',
                images: [{ url: 'test.jpg' }]
            });

            const response = await request(app)
                .get('/api/admin/analytics/top-products')
                .set('Authorization', `Bearer ${adminToken}`);

            if (response.status !== 200) {
                console.error('TopProducts Error:', response.body);
            }
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0]).toHaveProperty('name', 'Test Ring');
            expect(response.body.data[0]).toHaveProperty('revenue', 10000);
        });
    });
});
