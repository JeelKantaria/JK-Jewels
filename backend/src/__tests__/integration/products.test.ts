/**
 * Integration Tests for Products Routes
 * 
 * Tests the /api/products endpoints
 */

import request from 'supertest';
import express from 'express';
import productRoutes from '../../routes/products';
import { errorHandler, notFound, ErrorCodes } from '../../middleware/error';

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
    __esModule: true,
    default: {
        product: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            count: jest.fn(),
            groupBy: jest.fn(),
        },
        review: {
            aggregate: jest.fn(),
        },
        user: {
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
    app.use('/api/products', productRoutes);
    app.use(notFound);
    app.use(errorHandler);
    return app;
};

describe('GET /api/products', () => {
    let app: express.Express;

    beforeEach(() => {
        app = createTestApp();
        jest.clearAllMocks();
    });

    it('should return paginated products', async () => {
        // Mock products
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([
            { id: 'product-1', name: 'Ring 1', basePrice: 10000 },
            { id: 'product-2', name: 'Ring 2', basePrice: 15000 },
        ]);
        (mockPrisma.product.count as jest.Mock).mockResolvedValue(2);
        (mockPrisma.review.aggregate as jest.Mock).mockResolvedValue({ _avg: { rating: 4.5 } });

        const response = await request(app)
            .get('/api/products')
            .query({ page: '1', limit: '10' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('products');
        expect(response.body.data).toHaveProperty('pagination');
    });

    it('should handle empty results', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);
        (mockPrisma.product.count as jest.Mock).mockResolvedValue(0);

        const response = await request(app)
            .get('/api/products')
            .query({ category: 'non-existent' });

        expect(response.status).toBe(200);
        expect(response.body.data.products).toHaveLength(0);
    });

    it('should filter by category', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);
        (mockPrisma.product.count as jest.Mock).mockResolvedValue(0);

        await request(app)
            .get('/api/products')
            .query({ category: 'rings' });

        expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    category: { slug: 'rings' },
                }),
            })
        );
    });

    it('should filter by price range', async () => {
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);
        (mockPrisma.product.count as jest.Mock).mockResolvedValue(0);

        await request(app)
            .get('/api/products')
            .query({ minPrice: '5000', maxPrice: '20000' });

        expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    basePrice: { gte: 5000, lte: 20000 },
                }),
            })
        );
    });
});

describe('GET /api/products/:slug', () => {
    let app: express.Express;

    beforeEach(() => {
        app = createTestApp();
        jest.clearAllMocks();
    });

    it('should return 404 for non-existent product', async () => {
        (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
            .get('/api/products/non-existent-slug');

        expect(response.status).toBe(404);
        expect(response.body.code).toBe(ErrorCodes.PRODUCT_NOT_FOUND);
    });

    it('should return 400 for invalid slug', async () => {
        const response = await request(app)
            .get('/api/products/a'); // Too short

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });

    it('should return product with details', async () => {
        const mockProduct = {
            id: 'product-123',
            slug: 'gold-ring-classic',
            name: 'Gold Ring Classic',
            categoryId: 'category-123',
            images: [],
            variants: [],
            reviews: [],
        };

        (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
        (mockPrisma.review.aggregate as jest.Mock).mockResolvedValue({
            _avg: { rating: 4.5 },
            _count: 10,
        });
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]); // Related products

        const response = await request(app)
            .get('/api/products/gold-ring-classic');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id', 'product-123');
        expect(response.body.data).toHaveProperty('avgRating');
        expect(response.body.data).toHaveProperty('reviewCount');
    });
});

describe('GET /api/products/featured', () => {
    let app: express.Express;

    beforeEach(() => {
        app = createTestApp();
        jest.clearAllMocks();
    });

    it('should return featured products', async () => {
        const featuredProducts = [
            { id: 'p1', name: 'Featured 1', isFeatured: true },
            { id: 'p2', name: 'Featured 2', isFeatured: true },
        ];
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(featuredProducts);

        const response = await request(app)
            .get('/api/products/featured');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
    });
});

describe('GET /api/products/filters', () => {
    let app: express.Express;

    beforeEach(() => {
        app = createTestApp();
        jest.clearAllMocks();
    });

    it('should return filter counts', async () => {
        (mockPrisma.product.groupBy as jest.Mock)
            .mockResolvedValueOnce([{ metalType: 'Gold', _count: { metalType: 5 } }])
            .mockResolvedValueOnce([{ purity: '22K', _count: { purity: 3 } }]);
        (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([
            { occasion: ['Wedding', 'Anniversary'] },
            { occasion: ['Wedding'] },
        ]);

        const response = await request(app)
            .get('/api/products/filters');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('metalTypes');
        expect(response.body.data).toHaveProperty('purities');
        expect(response.body.data).toHaveProperty('occasions');
    });
});
