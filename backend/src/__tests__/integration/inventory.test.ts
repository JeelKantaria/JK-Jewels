/**
 * Integration Tests for Admin Inventory Routes
 * 
 * Tests the /api/admin/inventory endpoints
 */

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import adminRoutes from '../../routes/admin';
import { errorHandler, notFound, ErrorCodes } from '../../middleware/error';

// Use the same secret as config
const testSecret = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing';

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
    __esModule: true,
    default: {
        productVariant: {
            findMany: jest.fn(),
            count: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
        order: {
            findMany: jest.fn(),
            count: jest.fn(),
            aggregate: jest.fn(),
        },
        product: {
            count: jest.fn(),
            findMany: jest.fn(),
        },
        contactMessage: {
            findMany: jest.fn(),
        },
        $transaction: jest.fn(),
    },
}));

import prisma from '../../lib/prisma';
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Create admin token
const createAdminToken = () => {
    return jwt.sign(
        { userId: 'admin-123', email: 'admin@test.com', role: 'ADMIN' },
        testSecret,
        { expiresIn: '1h' }
    );
};

// Create customer token (non-admin)
const createCustomerToken = () => {
    return jwt.sign(
        { userId: 'user-123', email: 'user@test.com', role: 'CUSTOMER' },
        testSecret,
        { expiresIn: '1h' }
    );
};

// Create test app
const createTestApp = () => {
    const app = express();
    app.use(express.json());
    app.use('/api/admin', adminRoutes);
    app.use(notFound);
    app.use(errorHandler);
    return app;
};

describe('GET /api/admin/inventory', () => {
    let app: express.Express;
    const adminToken = createAdminToken();
    const customerToken = createCustomerToken();

    beforeEach(() => {
        app = createTestApp();
        jest.clearAllMocks();

        // Mock admin user
        (mockPrisma.user.findUnique as jest.Mock).mockImplementation((args) => {
            if (args.where.id === 'admin-123') {
                return Promise.resolve({
                    id: 'admin-123',
                    email: 'admin@test.com',
                    name: 'Admin User',
                    role: 'ADMIN',
                });
            }
            if (args.where.id === 'user-123') {
                return Promise.resolve({
                    id: 'user-123',
                    email: 'user@test.com',
                    name: 'Regular User',
                    role: 'CUSTOMER',
                });
            }
            return Promise.resolve(null);
        });
    });

    it('should return 401 without authentication', async () => {
        const response = await request(app)
            .get('/api/admin/inventory');

        expect(response.status).toBe(401);
    });

    it('should return 403 for non-admin users', async () => {
        const response = await request(app)
            .get('/api/admin/inventory')
            .set('Authorization', `Bearer ${customerToken}`);

        expect(response.status).toBe(403);
    });

    it('should return paginated inventory list', async () => {
        const mockVariants = [
            {
                id: 'variant-1',
                size: 'M',
                stockQuantity: 10,
                product: {
                    id: 'product-1',
                    name: 'Gold Ring',
                    sku: 'GR001',
                    images: [{ url: 'image.jpg' }],
                },
            },
        ];

        (mockPrisma.productVariant.findMany as jest.Mock).mockResolvedValue(mockVariants);
        (mockPrisma.productVariant.count as jest.Mock).mockResolvedValue(1);

        const response = await request(app)
            .get('/api/admin/inventory')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('variants');
        expect(response.body.data).toHaveProperty('pagination');
        expect(response.body.data).toHaveProperty('stats');
    });

    it('should filter low stock items', async () => {
        (mockPrisma.productVariant.findMany as jest.Mock).mockResolvedValue([]);
        (mockPrisma.productVariant.count as jest.Mock).mockResolvedValue(0);

        const response = await request(app)
            .get('/api/admin/inventory?filter=low-stock')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(mockPrisma.productVariant.findMany).toHaveBeenCalled();
    });

    it('should filter out-of-stock items', async () => {
        (mockPrisma.productVariant.findMany as jest.Mock).mockResolvedValue([]);
        (mockPrisma.productVariant.count as jest.Mock).mockResolvedValue(0);

        const response = await request(app)
            .get('/api/admin/inventory?filter=out-of-stock')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
    });

    it('should search by product name', async () => {
        (mockPrisma.productVariant.findMany as jest.Mock).mockResolvedValue([]);
        (mockPrisma.productVariant.count as jest.Mock).mockResolvedValue(0);

        const response = await request(app)
            .get('/api/admin/inventory?search=gold')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
    });
});

describe('PUT /api/admin/inventory/:variantId', () => {
    let app: express.Express;
    const adminToken = createAdminToken();

    beforeEach(() => {
        app = createTestApp();
        jest.clearAllMocks();

        // Mock admin user
        (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'admin-123',
            email: 'admin@test.com',
            name: 'Admin User',
            role: 'ADMIN',
        });
    });

    it('should update stock quantity', async () => {
        (mockPrisma.productVariant.update as jest.Mock).mockResolvedValue({
            id: 'variant-1',
            size: 'M',
            stockQuantity: 25,
            product: { name: 'Gold Ring', sku: 'GR001' },
        });

        const response = await request(app)
            .put('/api/admin/inventory/550e8400-e29b-41d4-a716-446655440000')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ stockQuantity: 25 });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    it('should return 400 for missing stockQuantity', async () => {
        const response = await request(app)
            .put('/api/admin/inventory/550e8400-e29b-41d4-a716-446655440000')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({});

        expect(response.status).toBe(400);
    });

    it('should return 400 for negative stock', async () => {
        const response = await request(app)
            .put('/api/admin/inventory/550e8400-e29b-41d4-a716-446655440000')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ stockQuantity: -5 });

        expect(response.status).toBe(400);
    });

    it('should handle database error gracefully', async () => {
        (mockPrisma.productVariant.update as jest.Mock).mockRejectedValue(new Error('Record not found'));

        const response = await request(app)
            .put('/api/admin/inventory/550e8400-e29b-41d4-a716-446655440000')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ stockQuantity: 25 });

        expect(response.status).toBe(500);
    });
});

describe('PUT /api/admin/inventory/bulk', () => {
    let app: express.Express;
    const adminToken = createAdminToken();

    beforeEach(() => {
        app = createTestApp();
        jest.clearAllMocks();

        // Mock admin user
        (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'admin-123',
            email: 'admin@test.com',
            name: 'Admin User',
            role: 'ADMIN',
        });

        // Reset productVariant.update to successful state
        (mockPrisma.productVariant.update as jest.Mock).mockResolvedValue({});
    });

    it('should update multiple variants', async () => {
        (mockPrisma.$transaction as jest.Mock).mockResolvedValue([
            { id: 'variant-1', stockQuantity: 10 },
            { id: 'variant-2', stockQuantity: 20 },
        ]);

        const response = await request(app)
            .put('/api/admin/inventory/bulk')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                updates: [
                    { variantId: '550e8400-e29b-41d4-a716-446655440001', stockQuantity: 10 },
                    { variantId: '550e8400-e29b-41d4-a716-446655440002', stockQuantity: 20 },
                ],
            });

        expect(response.status).toBe(200);
        expect(response.body.data.updated).toBe(2);
    });

    it('should return 400 for empty updates array', async () => {
        const response = await request(app)
            .put('/api/admin/inventory/bulk')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ updates: [] });

        expect(response.status).toBe(400);
    });
});
