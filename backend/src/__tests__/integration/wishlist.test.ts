/**
 * Integration Tests for Wishlist Routes
 * 
 * Tests the /api/wishlist endpoints
 */

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import wishlistRoutes from '../../routes/wishlist';
import { errorHandler, notFound, ErrorCodes } from '../../middleware/error';

// Use the same secret as config (set in setup.ts via process.env)
const testSecret = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing';

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
    __esModule: true,
    default: {
        wishlistItem: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            deleteMany: jest.fn(),
        },
        product: {
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
    app.use('/api/wishlist', wishlistRoutes);
    app.use(notFound);
    app.use(errorHandler);
    return app;
};

describe('GET /api/wishlist', () => {
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
            .get('/api/wishlist');

        expect(response.status).toBe(401);
    });

    it('should return wishlist items', async () => {
        (mockPrisma.wishlistItem.findMany as jest.Mock).mockResolvedValue([
            { id: 'wish-1', productId: 'prod-1', product: { name: 'Ring 1' } },
            { id: 'wish-2', productId: 'prod-2', product: { name: 'Ring 2' } },
        ]);

        const response = await request(app)
            .get('/api/wishlist')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
    });
});

describe('POST /api/wishlist/:productId', () => {
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

    it('should return 400 for invalid product ID format', async () => {
        const response = await request(app)
            .post('/api/wishlist/invalid-uuid')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });

    it('should return 404 for non-existent product', async () => {
        (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
            .post('/api/wishlist/550e8400-e29b-41d4-a716-446655440000')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(404);
        expect(response.body.code).toBe(ErrorCodes.PRODUCT_NOT_FOUND);
    });

    it('should return 200 if already in wishlist (idempotent)', async () => {
        (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue({
            id: '550e8400-e29b-41d4-a716-446655440000',
            isActive: true,
        });
        (mockPrisma.wishlistItem.findUnique as jest.Mock).mockResolvedValue({
            id: 'existing-wish',
            userId: 'user-123',
            productId: '550e8400-e29b-41d4-a716-446655440000',
        });

        const response = await request(app)
            .post('/api/wishlist/550e8400-e29b-41d4-a716-446655440000')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toContain('Already in wishlist');
    });

    it('should return 201 when adding new item', async () => {
        (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue({
            id: '550e8400-e29b-41d4-a716-446655440000',
            isActive: true,
        });
        (mockPrisma.wishlistItem.findUnique as jest.Mock).mockResolvedValue(null);
        (mockPrisma.wishlistItem.create as jest.Mock).mockResolvedValue({
            id: 'new-wish',
            userId: 'user-123',
            productId: '550e8400-e29b-41d4-a716-446655440000',
        });

        const response = await request(app)
            .post('/api/wishlist/550e8400-e29b-41d4-a716-446655440000')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
    });
});

describe('DELETE /api/wishlist/:productId', () => {
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

    it('should return 200 even if item not in wishlist', async () => {
        (mockPrisma.wishlistItem.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

        const response = await request(app)
            .delete('/api/wishlist/550e8400-e29b-41d4-a716-446655440000')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });
});

describe('DELETE /api/wishlist', () => {
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

    it('should clear entire wishlist', async () => {
        (mockPrisma.wishlistItem.deleteMany as jest.Mock).mockResolvedValue({ count: 5 });

        const response = await request(app)
            .delete('/api/wishlist')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toContain('cleared');
    });
});
