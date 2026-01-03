/**
 * Integration Tests for Categories Routes
 * 
 * Tests the /api/categories endpoints
 */

import request from 'supertest';
import express from 'express';
import categoryRoutes from '../../routes/categories';
import { errorHandler, notFound, ErrorCodes } from '../../middleware/error';

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
    __esModule: true,
    default: {
        category: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
        },
    },
}));

import prisma from '../../lib/prisma';
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Create test app
const createTestApp = () => {
    const app = express();
    app.use(express.json());
    app.use('/api/categories', categoryRoutes);
    app.use(notFound);
    app.use(errorHandler);
    return app;
};

describe('GET /api/categories', () => {
    let app: express.Express;

    beforeEach(() => {
        app = createTestApp();
        jest.clearAllMocks();
    });

    it('should return categories with tree structure', async () => {
        const mockCategories = [
            { id: 'cat-1', name: 'Rings', slug: 'rings', parentId: null, _count: { products: 10 } },
            { id: 'cat-2', name: 'Engagement Rings', slug: 'engagement-rings', parentId: 'cat-1', _count: { products: 5 } },
            { id: 'cat-3', name: 'Necklaces', slug: 'necklaces', parentId: null, _count: { products: 8 } },
        ];

        (mockPrisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

        const response = await request(app)
            .get('/api/categories');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);

        // Check tree structure - root categories should have children
        const rings = response.body.data.find((c: { slug: string }) => c.slug === 'rings');
        expect(rings).toBeDefined();
        expect(rings.children).toBeDefined();
    });

    it('should return empty array when no categories', async () => {
        (mockPrisma.category.findMany as jest.Mock).mockResolvedValue([]);

        const response = await request(app)
            .get('/api/categories');

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
    });
});

describe('GET /api/categories/:slug', () => {
    let app: express.Express;

    beforeEach(() => {
        app = createTestApp();
        jest.clearAllMocks();
    });

    it('should return 404 for non-existent category', async () => {
        (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
            .get('/api/categories/non-existent');

        expect(response.status).toBe(404);
        expect(response.body.code).toBe(ErrorCodes.CATEGORY_NOT_FOUND);
    });

    it('should return 400 for invalid slug format', async () => {
        const response = await request(app)
            .get('/api/categories/a'); // Too short

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });

    it('should return category with children and parent', async () => {
        const mockCategory = {
            id: 'cat-1',
            name: 'Rings',
            slug: 'rings',
            children: [
                { id: 'cat-2', name: 'Engagement Rings', slug: 'engagement-rings' },
            ],
            parent: null,
        };

        (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(mockCategory);

        const response = await request(app)
            .get('/api/categories/rings');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id', 'cat-1');
        expect(response.body.data).toHaveProperty('children');
    });
});
