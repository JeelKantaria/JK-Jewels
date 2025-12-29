import { AxiosError } from 'axios';

/**
 * API Error Codes - matching backend ErrorCodes
 */
export const ApiErrorCodes = {
    // Auth
    UNAUTHORIZED: 'UNAUTHORIZED',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_INVALID: 'TOKEN_INVALID',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    EMAIL_EXISTS: 'EMAIL_EXISTS',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    FORBIDDEN: 'FORBIDDEN',

    // Product
    PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
    VARIANT_NOT_FOUND: 'VARIANT_NOT_FOUND',

    // Cart
    CART_ITEM_NOT_FOUND: 'CART_ITEM_NOT_FOUND',
    CART_EMPTY: 'CART_EMPTY',
    INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',

    // Order
    ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
    ORDER_CANNOT_CANCEL: 'ORDER_CANNOT_CANCEL',
    INVALID_ADDRESS: 'INVALID_ADDRESS',

    // Promo
    PROMO_NOT_FOUND: 'PROMO_NOT_FOUND',
    PROMO_EXPIRED: 'PROMO_EXPIRED',
    PROMO_MIN_ORDER: 'PROMO_MIN_ORDER',
    PROMO_USAGE_EXCEEDED: 'PROMO_USAGE_EXCEEDED',

    // Generic
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ApiErrorCode = typeof ApiErrorCodes[keyof typeof ApiErrorCodes];

/**
 * Interface for API error response
 */
interface ApiErrorResponse {
    success: false;
    message: string;
    code?: ApiErrorCode;
    errors?: Array<{ field: string; message: string }>;
    details?: Record<string, unknown>;
}

/**
 * Check if the error is a network/connection error
 */
export function isNetworkError(error: unknown): boolean {
    if (error instanceof AxiosError) {
        return !error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error');
    }
    return false;
}

/**
 * Check if the error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
    if (error instanceof AxiosError) {
        return error.code === 'ECONNABORTED' || error.message.includes('timeout');
    }
    return false;
}

/**
 * Get user-friendly error message from any error
 */
export function getErrorMessage(error: unknown): string {
    // Handle network errors
    if (isNetworkError(error)) {
        return 'Unable to connect to the server. Please check your internet connection.';
    }

    // Handle timeout errors
    if (isTimeoutError(error)) {
        return 'Request timed out. Please try again.';
    }

    // Handle Axios errors with API response
    if (error instanceof AxiosError && error.response?.data) {
        const data = error.response.data as ApiErrorResponse;

        // Use server-provided message if available
        if (data.message) {
            return data.message;
        }

        // Handle validation errors
        if (data.errors && data.errors.length > 0) {
            return data.errors.map(e => e.message).join('. ');
        }

        // Fallback to HTTP status text
        return error.response.statusText || 'An error occurred';
    }

    // Handle standard Error objects
    if (error instanceof Error) {
        return error.message;
    }

    // Handle string errors
    if (typeof error === 'string') {
        return error;
    }

    // Default fallback
    return 'An unexpected error occurred. Please try again.';
}

/**
 * Get the error code from an API error response
 */
export function getErrorCode(error: unknown): ApiErrorCode | undefined {
    if (error instanceof AxiosError && error.response?.data) {
        const data = error.response.data as ApiErrorResponse;
        return data.code;
    }
    return undefined;
}

/**
 * Check if error is a specific API error code
 */
export function isApiError(error: unknown, code: ApiErrorCode): boolean {
    return getErrorCode(error) === code;
}

/**
 * Get additional error details from API response
 */
export function getErrorDetails(error: unknown): Record<string, unknown> | undefined {
    if (error instanceof AxiosError && error.response?.data) {
        const data = error.response.data as ApiErrorResponse;
        return data.details;
    }
    return undefined;
}
