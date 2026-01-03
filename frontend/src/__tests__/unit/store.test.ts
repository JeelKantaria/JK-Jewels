/**
 * Unit Tests for Cart Store
 * 
 * Tests the Zustand cart store functionality
 */

import { act, renderHook } from '@testing-library/react';
import { useCartStore } from '@/lib/store';

// Reset store state before each test
beforeEach(() => {
    const { result } = renderHook(() => useCartStore());
    act(() => {
        result.current.clearCart();
    });
});

describe('Cart Store', () => {
    describe('setCart', () => {
        it('should set cart items and calculate itemCount', () => {
            const { result } = renderHook(() => useCartStore());

            const mockItems = [
                {
                    id: 'item-1',
                    productId: 'product-1',
                    quantity: 2,
                    product: {
                        id: 'product-1',
                        name: 'Gold Ring',
                        slug: 'gold-ring',
                        basePrice: 50000,
                        images: [{ url: '/ring.jpg' }],
                    },
                },
                {
                    id: 'item-2',
                    productId: 'product-2',
                    quantity: 3,
                    product: {
                        id: 'product-2',
                        name: 'Diamond Necklace',
                        slug: 'diamond-necklace',
                        basePrice: 100000,
                        images: [{ url: '/necklace.jpg' }],
                    },
                },
            ];

            act(() => {
                result.current.setCart({
                    items: mockItems,
                    subtotal: 400000,
                    tax: 12000,
                    total: 412000,
                });
            });

            expect(result.current.items).toHaveLength(2);
            expect(result.current.itemCount).toBe(5); // 2 + 3
            expect(result.current.subtotal).toBe(400000);
            expect(result.current.tax).toBe(12000);
            expect(result.current.total).toBe(412000);
        });
    });

    describe('addItem', () => {
        it('should add a new item to cart', () => {
            const { result } = renderHook(() => useCartStore());

            const newItem = {
                id: 'item-1',
                productId: 'product-1',
                quantity: 1,
                product: {
                    id: 'product-1',
                    name: 'Gold Bracelet',
                    slug: 'gold-bracelet',
                    basePrice: 25000,
                    images: [{ url: '/bracelet.jpg' }],
                },
            };

            act(() => {
                result.current.addItem(newItem);
            });

            expect(result.current.items).toHaveLength(1);
            expect(result.current.itemCount).toBe(1);
        });

        it('should increment quantity for existing item', () => {
            const { result } = renderHook(() => useCartStore());

            const item = {
                id: 'item-1',
                productId: 'product-1',
                quantity: 1,
                product: {
                    id: 'product-1',
                    name: 'Gold Bracelet',
                    slug: 'gold-bracelet',
                    basePrice: 25000,
                    images: [{ url: '/bracelet.jpg' }],
                },
            };

            act(() => {
                result.current.addItem(item);
                result.current.addItem({ ...item, quantity: 2 });
            });

            expect(result.current.items).toHaveLength(1);
            expect(result.current.items[0].quantity).toBe(3);
            expect(result.current.itemCount).toBe(3);
        });
    });

    describe('updateQuantity', () => {
        it('should update item quantity and recalculate itemCount', () => {
            const { result } = renderHook(() => useCartStore());

            // Set initial cart
            act(() => {
                result.current.setCart({
                    items: [
                        {
                            id: 'item-1',
                            productId: 'product-1',
                            quantity: 2,
                            product: {
                                id: 'product-1',
                                name: 'Ring',
                                slug: 'ring',
                                basePrice: 10000,
                                images: [],
                            },
                        },
                    ],
                    subtotal: 20000,
                    tax: 600,
                    total: 20600,
                });
            });

            // Update quantity
            act(() => {
                result.current.updateQuantity('item-1', 5);
            });

            expect(result.current.items[0].quantity).toBe(5);
            expect(result.current.itemCount).toBe(5);
        });
    });

    describe('removeItem', () => {
        it('should remove item and recalculate itemCount', () => {
            const { result } = renderHook(() => useCartStore());

            // Set initial cart with 2 items
            act(() => {
                result.current.setCart({
                    items: [
                        {
                            id: 'item-1',
                            productId: 'product-1',
                            quantity: 2,
                            product: { id: 'product-1', name: 'Ring', slug: 'ring', basePrice: 10000, images: [] },
                        },
                        {
                            id: 'item-2',
                            productId: 'product-2',
                            quantity: 3,
                            product: { id: 'product-2', name: 'Necklace', slug: 'necklace', basePrice: 20000, images: [] },
                        },
                    ],
                    subtotal: 80000,
                    tax: 2400,
                    total: 82400,
                });
            });

            expect(result.current.itemCount).toBe(5);

            // Remove first item
            act(() => {
                result.current.removeItem('item-1');
            });

            expect(result.current.items).toHaveLength(1);
            expect(result.current.itemCount).toBe(3);
        });
    });

    describe('clearCart', () => {
        it('should clear all items and reset itemCount to 0', () => {
            const { result } = renderHook(() => useCartStore());

            // Set initial cart
            act(() => {
                result.current.setCart({
                    items: [
                        {
                            id: 'item-1',
                            productId: 'product-1',
                            quantity: 5,
                            product: { id: 'product-1', name: 'Ring', slug: 'ring', basePrice: 10000, images: [] },
                        },
                    ],
                    subtotal: 50000,
                    tax: 1500,
                    total: 51500,
                });
            });

            expect(result.current.itemCount).toBe(5);

            // Clear cart
            act(() => {
                result.current.clearCart();
            });

            expect(result.current.items).toHaveLength(0);
            expect(result.current.itemCount).toBe(0);
            expect(result.current.subtotal).toBe(0);
            expect(result.current.tax).toBe(0);
            expect(result.current.total).toBe(0);
        });
    });
});
