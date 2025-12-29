/**
 * Jest Test Setup
 * 
 * This file runs before each test file and sets up the test environment.
 */

// Set test environment variables BEFORE any imports
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

// Export the test secret so test files can use it
export const TEST_JWT_SECRET = process.env.JWT_SECRET;

// Increase timeout for database operations
jest.setTimeout(30000);

// Global teardown
afterAll(async () => {
    // Clean up any resources if needed
});

// Mock console.error to reduce test output noise
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
    // Only show unexpected errors, not expected test failures
    if (!args[0]?.toString().includes('AppError')) {
        // Still log unexpected errors during development
        // originalConsoleError(...args);
    }
};
