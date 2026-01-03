import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

// Types
interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: string;
    avatar?: string;
}

interface CartItem {
    id: string;
    productId: string;
    variantId?: string;
    quantity: number;
    product: {
        id: string;
        name: string;
        slug: string;
        basePrice: number;
        images: { url: string }[];
    };
    variant?: {
        id: string;
        size: string;
        additionalPrice: number;
    };
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (user: User, accessToken: string, refreshToken: string) => void;
    logout: () => void;
    updateUser: (user: Partial<User>) => void;
    setLoading: (loading: boolean) => void;
}

interface CartState {
    items: CartItem[];
    subtotal: number;
    tax: number;
    total: number;
    itemCount: number;
    setCart: (data: { items: CartItem[]; subtotal: number; tax: number; total: number }) => void;
    addItem: (item: CartItem) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    removeItem: (itemId: string) => void;
    clearCart: () => void;
}

interface WishlistState {
    items: string[]; // product IDs
    addItem: (productId: string) => void;
    removeItem: (productId: string) => void;
    isInWishlist: (productId: string) => boolean;
    clearWishlist: () => void;
}

interface UIState {
    isCartOpen: boolean;
    isMobileMenuOpen: boolean;
    isSearchOpen: boolean;
    toggleCart: () => void;
    toggleMobileMenu: () => void;
    toggleSearch: () => void;
    closeAll: () => void;
}

// Auth Store
export const useAuthStore = create<AuthState>()((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    login: (user, accessToken, refreshToken) => {
        Cookies.set('accessToken', accessToken, { expires: 7 });
        Cookies.set('refreshToken', refreshToken, { expires: 30 });
        set({ user, isAuthenticated: true, isLoading: false });
    },

    logout: () => {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        set({ user: null, isAuthenticated: false, isLoading: false });
    },

    updateUser: (userData) => {
        set((state) => ({
            user: state.user ? { ...state.user, ...userData } : null,
        }));
    },

    setLoading: (loading) => set({ isLoading: loading }),
}));

// Cart Store
export const useCartStore = create<CartState>()((set) => ({
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    itemCount: 0,

    setCart: (data) => {
        set({
            items: data.items,
            subtotal: data.subtotal,
            tax: data.tax,
            total: data.total,
            itemCount: data.items.reduce((sum, item) => sum + item.quantity, 0),
        });
    },

    addItem: (item) => {
        set((state) => {
            const existingIndex = state.items.findIndex(
                (i) => i.productId === item.productId && i.variantId === item.variantId
            );

            let newItems;
            if (existingIndex >= 0) {
                newItems = [...state.items];
                newItems[existingIndex].quantity += item.quantity;
            } else {
                newItems = [...state.items, item];
            }

            return { items: newItems, itemCount: state.itemCount + item.quantity };
        });
    },

    updateQuantity: (itemId, quantity) => {
        set((state) => {
            const newItems = state.items.map((item) =>
                item.id === itemId ? { ...item, quantity } : item
            );
            return {
                items: newItems,
                itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
            };
        });
    },

    removeItem: (itemId) => {
        set((state) => {
            const newItems = state.items.filter((item) => item.id !== itemId);
            return {
                items: newItems,
                itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
            };
        });
    },

    clearCart: () => {
        set({ items: [], subtotal: 0, tax: 0, total: 0, itemCount: 0 });
    },
}));

// Wishlist Store (persisted)
export const useWishlistStore = create<WishlistState>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (productId) => {
                set((state) => ({
                    items: state.items.includes(productId)
                        ? state.items
                        : [...state.items, productId],
                }));
            },

            removeItem: (productId) => {
                set((state) => ({
                    items: state.items.filter((id) => id !== productId),
                }));
            },

            isInWishlist: (productId) => get().items.includes(productId),

            clearWishlist: () => set({ items: [] }),
        }),
        { name: 'jk-wishlist' }
    )
);

// UI Store
export const useUIStore = create<UIState>()((set) => ({
    isCartOpen: false,
    isMobileMenuOpen: false,
    isSearchOpen: false,

    toggleCart: () => set((state) => ({
        isCartOpen: !state.isCartOpen,
        isMobileMenuOpen: false,
        isSearchOpen: false,
    })),

    toggleMobileMenu: () => set((state) => ({
        isMobileMenuOpen: !state.isMobileMenuOpen,
        isCartOpen: false,
        isSearchOpen: false,
    })),

    toggleSearch: () => set((state) => ({
        isSearchOpen: !state.isSearchOpen,
        isCartOpen: false,
        isMobileMenuOpen: false,
    })),

    closeAll: () => set({
        isCartOpen: false,
        isMobileMenuOpen: false,
        isSearchOpen: false,
    }),
}));
