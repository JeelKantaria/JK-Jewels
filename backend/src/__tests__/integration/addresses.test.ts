/**
 * Integration Tests for Addresses Routes
 * 
 * Tests the /api/addresses endpoints
 */

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import addressRoutes from '../../routes/addresses';
import { errorHandler, notFound, ErrorCodes } from '../../middleware/error';

// Use the same secret as config (set in setup.ts via process.env)
const testSecret = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing';

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
    __esModule: true,
    default: {
        address: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            updateMany: jest.fn(),
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
    app.use('/api/addresses', addressRoutes);
    app.use(notFound);
    app.use(errorHandler);
    return app;
};

describe('GET /api/addresses', () => {
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
            .get('/api/addresses');

        expect(response.status).toBe(401);
    });

    it('should return user addresses', async () => {
        (mockPrisma.address.findMany as jest.Mock).mockResolvedValue([
            {
                id: 'addr-1',
                name: 'Home',
                addressLine1: '123 Main St',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001',
                isDefault: true,
            },
        ]);

        const response = await request(app)
            .get('/api/addresses')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data[0].city).toBe('Mumbai');
    });
});

describe('POST /api/addresses', () => {
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

    const validAddress = {
        name: 'John Doe',
        phone: '+919876543210',
        addressLine1: '123 Main Street, Apartment 4B',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India',
    };

    it('should return 400 for missing required fields', async () => {
        const response = await request(app)
            .post('/api/addresses')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Test' }); // Missing required fields

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });

    it('should return 400 for invalid phone format', async () => {
        const response = await request(app)
            .post('/api/addresses')
            .set('Authorization', `Bearer ${token}`)
            .send({ ...validAddress, phone: '123' }); // Invalid phone

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });

    it('should return 400 for invalid pincode', async () => {
        const response = await request(app)
            .post('/api/addresses')
            .set('Authorization', `Bearer ${token}`)
            .send({ ...validAddress, pincode: '12345' }); // Invalid 5-digit pincode

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });

    it('should create address successfully', async () => {
        (mockPrisma.address.count as jest.Mock).mockResolvedValue(0);
        (mockPrisma.address.create as jest.Mock).mockResolvedValue({
            id: 'addr-new',
            ...validAddress,
            isDefault: true,
        });

        const response = await request(app)
            .post('/api/addresses')
            .set('Authorization', `Bearer ${token}`)
            .send(validAddress);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('John Doe');
    });

    it('should set first address as default', async () => {
        (mockPrisma.address.count as jest.Mock).mockResolvedValue(0);
        (mockPrisma.address.create as jest.Mock).mockResolvedValue({
            id: 'addr-new',
            ...validAddress,
            isDefault: true,
        });

        const response = await request(app)
            .post('/api/addresses')
            .set('Authorization', `Bearer ${token}`)
            .send(validAddress);

        expect(response.body.data.isDefault).toBe(true);
    });
});

describe('PUT /api/addresses/:id', () => {
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

    it('should return 404 for non-existent address', async () => {
        (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
            .put('/api/addresses/addr-nonexistent')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Updated Name' });

        expect(response.status).toBe(404);
    });

    it('should update address successfully', async () => {
        (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue({
            id: 'addr-1',
            userId: 'user-123',
            name: 'Old Name',
        });
        (mockPrisma.address.update as jest.Mock).mockResolvedValue({
            id: 'addr-1',
            name: 'Updated Name',
        });

        const response = await request(app)
            .put('/api/addresses/addr-1')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Updated Name' });

        expect(response.status).toBe(200);
        expect(response.body.data.name).toBe('Updated Name');
    });
});

describe('DELETE /api/addresses/:id', () => {
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

    it('should return 404 for non-existent address', async () => {
        (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
            .delete('/api/addresses/addr-nonexistent')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(404);
    });

    it('should delete address successfully', async () => {
        (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue({
            id: 'addr-1',
            userId: 'user-123',
            isDefault: false,
        });
        (mockPrisma.address.delete as jest.Mock).mockResolvedValue({
            id: 'addr-1',
        });

        const response = await request(app)
            .delete('/api/addresses/addr-1')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });
});

describe('PUT /api/addresses/:id/default', () => {
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

    it('should set address as default', async () => {
        (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue({
            id: 'addr-1',
            userId: 'user-123',
        });
        (mockPrisma.address.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
        (mockPrisma.address.update as jest.Mock).mockResolvedValue({
            id: 'addr-1',
            isDefault: true,
        });

        const response = await request(app)
            .put('/api/addresses/addr-1/default')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.isDefault).toBe(true);
    });
});
