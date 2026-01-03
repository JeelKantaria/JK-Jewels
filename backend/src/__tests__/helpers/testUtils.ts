/**
 * Test Utilities and Helpers
 * 
 * Common utilities for API testing
 */

import request from 'supertest';
import express, { Express } from 'express';
import { ErrorCodes } from '../../middleware/error.js';

// Re-export ErrorCodes for test assertions
export { ErrorCodes };

/**
 * Create a test user and get authentication token
 */
export interface TestUser {
    id: string;
    email: string;
    name: string;
    accessToken: string;
    refreshToken: string;
}

/**
 * Generate a unique test email
 */
export const generateTestEmail = (): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `test-${timestamp}-${random}@test.com`;
};

/**
 * Generate valid test user data
 */
export const generateUserData = () => ({
    email: generateTestEmail(),
    password: 'TestPassword123!',
    name: 'Test User',
});

/**
 * Assert error response format
 */
export const expectErrorResponse = (
    response: request.Response,
    statusCode: number,
    errorCode: string
) => {
    expect(response.status).toBe(statusCode);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('code', errorCode);
    expect(response.body).toHaveProperty('message');
};

/**
 * Assert success response format
 */
export const expectSuccessResponse = (
    response: request.Response,
    statusCode: number = 200
) => {
    expect(response.status).toBe(statusCode);
    expect(response.body).toHaveProperty('success', true);
};

/**
 * Create authenticated request helper
 */
export const authRequest = (app: Express, token: string) => ({
    get: (url: string) =>
        request(app)
            .get(url)
            .set('Authorization', `Bearer ${token}`),
    post: (url: string) =>
        request(app)
            .post(url)
            .set('Authorization', `Bearer ${token}`),
    put: (url: string) =>
        request(app)
            .put(url)
            .set('Authorization', `Bearer ${token}`),
    delete: (url: string) =>
        request(app)
            .delete(url)
            .set('Authorization', `Bearer ${token}`),
});

/**
 * Wait for a specified number of milliseconds
 */
export const wait = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));
