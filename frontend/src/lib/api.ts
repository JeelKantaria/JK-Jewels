import axios from 'axios';
import Cookies from 'js-cookie';

// Create axios instance
export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = Cookies.get('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Could implement refresh token logic here
            Cookies.remove('accessToken');
            Cookies.remove('refreshToken');

            // Redirect to login if on client side
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    register: (data: { email: string; password: string; name: string; phone?: string }) =>
        api.post('/auth/register', data),

    login: (data: { email: string; password: string }) =>
        api.post('/auth/login', data),

    getMe: () => api.get('/auth/me'),

    updateProfile: (data: { name?: string; phone?: string; avatar?: string }) =>
        api.put('/auth/profile', data),

    logout: () => api.post('/auth/logout'),
};

// Products API
export const productsApi = {
    getProducts: (params?: Record<string, string>) =>
        api.get('/products', { params }),

    getProduct: (slug: string) =>
        api.get(`/products/${slug}`),

    getFeatured: () =>
        api.get('/products/featured'),

    getNewArrivals: () =>
        api.get('/products/new-arrivals'),

    getFilters: () =>
        api.get('/products/filters'),
};

// Categories API
export const categoriesApi = {
    getCategories: () =>
        api.get('/categories'),

    getCategory: (slug: string) =>
        api.get(`/categories/${slug}`),
};

// Cart API
export const cartApi = {
    getCart: () =>
        api.get('/cart'),

    addItem: (data: { productId: string; variantId?: string; quantity?: number }) =>
        api.post('/cart/items', data),

    updateItem: (itemId: string, quantity: number) =>
        api.put(`/cart/items/${itemId}`, { quantity }),

    removeItem: (itemId: string) =>
        api.delete(`/cart/items/${itemId}`),

    clearCart: () =>
        api.delete('/cart'),
};

// Wishlist API
export const wishlistApi = {
    getWishlist: () =>
        api.get('/wishlist'),

    addItem: (productId: string) =>
        api.post(`/wishlist/${productId}`),

    removeItem: (productId: string) =>
        api.delete(`/wishlist/${productId}`),

    clearAll: () =>
        api.delete('/wishlist'),
};

// Orders API
export const ordersApi = {
    getOrders: (params?: { page?: number; limit?: number }) =>
        api.get('/orders', { params }),

    getOrder: (orderNumber: string) =>
        api.get(`/orders/${orderNumber}`),

    createOrder: (data: {
        shippingAddressId: string;
        paymentMethod?: string;
        promoCode?: string;
        customerNotes?: string;
    }) => api.post('/orders', data),

    cancelOrder: (orderNumber: string) =>
        api.post(`/orders/${orderNumber}/cancel`),
};

// Addresses API
export const addressesApi = {
    getAddresses: () =>
        api.get('/addresses'),

    getAddress: (id: string) =>
        api.get(`/addresses/${id}`),

    createAddress: (data: {
        name: string;
        phone: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        pincode: string;
        country?: string;
        isDefault?: boolean;
    }) => api.post('/addresses', data),

    updateAddress: (id: string, data: {
        name?: string;
        phone?: string;
        addressLine1?: string;
        addressLine2?: string;
        city?: string;
        state?: string;
        pincode?: string;
        country?: string;
        isDefault?: boolean;
    }) => api.put(`/addresses/${id}`, data),

    deleteAddress: (id: string) =>
        api.delete(`/addresses/${id}`),

    setDefaultAddress: (id: string) =>
        api.put(`/addresses/${id}/default`),
};

// Reviews API
export const reviewsApi = {
    getProductReviews: (productId: string, params?: { page?: number; limit?: number }) =>
        api.get(`/reviews/product/${productId}`, { params }),

    createReview: (productId: string, data: {
        rating: number;
        title?: string;
        comment?: string;
        images?: string[];
    }) => api.post(`/reviews/product/${productId}`, data),

    deleteReview: (reviewId: string) =>
        api.delete(`/reviews/${reviewId}`),
};

// Promo Code API
export const promoApi = {
    validate: (code: string, cartTotal: number) =>
        api.post('/promo/validate', { code, cartTotal }),

    getAvailable: () =>
        api.get('/promo/available'),
};

export default api;
