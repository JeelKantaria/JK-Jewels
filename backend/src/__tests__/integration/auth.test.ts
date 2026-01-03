/**
 * Integration Tests for Auth Routes
 * 
 * Tests the /api/auth endpoints
 */

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from '../../routes/auth';
import { errorHandler, notFound } from '../../middleware/error';
import { ErrorCodes } from '../../middleware/error';

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        cart: {
            create: jest.fn(),
        },
    },
}));

// Import mocked prisma
import prisma from '../../lib/prisma';
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Create test app
const createTestApp = () => {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/auth', authRoutes);
    app.use(notFound);
    app.use(errorHandler);
    return app;
};

describe('POST /api/auth/register', () => {
    let app: express.Express;

    beforeEach(() => {
        app = createTestApp();
        jest.clearAllMocks();
    });

    it('should return 400 for invalid email format', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'invalid-email',
                password: 'ValidPassword123',
                name: 'Test User',
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });

    it('should return 400 for short password', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'test@example.com',
                password: '123', // Too short
                name: 'Test User',
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });

    it('should return 400 for missing name', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'test@example.com',
                password: 'ValidPassword123',
                // name is missing
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });

    it('should return 400 for duplicate email', async () => {
        // Mock existing user
        (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
            id: 'existing-user-id',
            email: 'test@example.com',
        });

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'test@example.com',
                password: 'ValidPassword123',
                name: 'Test User',
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe(ErrorCodes.EMAIL_EXISTS);
    });

    it('should return 201 for valid registration', async () => {
        // Mock no existing user
        (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

        // Mock user creation
        const mockUser = {
            id: 'new-user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: 'CUSTOMER',
        };
        (mockPrisma.user.create as jest.Mock).mockResolvedValueOnce(mockUser);

        // Mock cart creation
        (mockPrisma.cart.create as jest.Mock).mockResolvedValueOnce({ id: 'cart-id' });

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'test@example.com',
                password: 'ValidPassword123',
                name: 'Test User',
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('user');
        expect(response.body.data).toHaveProperty('accessToken');
        expect(response.body.data).toHaveProperty('refreshToken');
    });
});

describe('POST /api/auth/login', () => {
    let app: express.Express;

    beforeEach(() => {
        app = createTestApp();
        jest.clearAllMocks();
    });

    it('should return 400 for invalid email format', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'invalid-email',
                password: 'password123',
            });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });

    it('should return 401 for non-existent user', async () => {
        (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'nonexistent@example.com',
                password: 'password123',
            });

        expect(response.status).toBe(401);
        expect(response.body.code).toBe(ErrorCodes.INVALID_CREDENTIALS);
    });

    it('should return 401 for wrong password', async () => {
        // Mock user with password hash (bcrypt hash of 'correctpassword')
        (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
            id: 'user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: 'CUSTOMER',
            passwordHash: '$2a$12$K8TcBJSh.Z7TY9JmNq8zX.INVALID_HASH',
        });

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'wrongpassword',
            });

        expect(response.status).toBe(401);
        expect(response.body.code).toBe(ErrorCodes.INVALID_CREDENTIALS);
    });
});

describe('GET /api/auth/me', () => {
    let app: express.Express;

    beforeEach(() => {
        app = createTestApp();
        jest.clearAllMocks();
    });

    it('should return 401 without token', async () => {
        const response = await request(app)
            .get('/api/auth/me');

        expect(response.status).toBe(401);
        expect(response.body.code).toBe(ErrorCodes.UNAUTHORIZED);
    });

    it('should return 401 with invalid token', async () => {
        const response = await request(app)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(401);
        expect(response.body.code).toBe(ErrorCodes.TOKEN_INVALID);
    });
});
