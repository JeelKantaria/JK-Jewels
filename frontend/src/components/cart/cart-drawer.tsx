'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUIStore, useAuthStore } from '@/lib/store';
import { cartApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

export function CartDrawer() {
    const queryClient = useQueryClient();
    const { isCartOpen, toggleCart } = useUIStore();
    const { isAuthenticated } = useAuthStore();

    const { data: cart, isLoading } = useQuery({
        queryKey: ['cart'],
        queryFn: async () => {
            const response = await cartApi.getCart();
            return response.data.data;
        },
        enabled: isAuthenticated && isCartOpen,
    });

    const updateMutation = useMutation({
        mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
            cartApi.updateItem(itemId, quantity),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });

    const removeMutation = useMutation({
        mutationFn: (itemId: string) => cartApi.removeItem(itemId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            toast.success('Item removed');
        },
    });

    const items = cart?.items || [];
    const subtotal = cart?.subtotal || 0;
    const tax = cart?.tax || 0;
    const total = cart?.total || 0;

    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleCart}
                        className="fixed inset-0 bg-black/50 z-50"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 
                     flex flex-col shadow-luxury-xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-cream-300">
                            <h2 className="font-heading text-xl">Shopping Bag ({items.length})</h2>
                            <button
                                onClick={toggleCart}
                                className="p-2 hover:bg-cream-100 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto">
                            {!isAuthenticated ? (
                                <div className="flex flex-col items-center justify-center h-full p-6">
                                    <ShoppingBag size={48} className="text-cream-400 mb-4" />
                                    <p className="text-secondary-600 mb-4 text-center">
                                        Please sign in to view your cart
                                    </p>
                                    <Link
                                        href="/login"
                                        onClick={toggleCart}
                                        className="btn-primary"
                                    >
                                        Sign In
                                    </Link>
                                </div>
                            ) : items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full p-6">
                                    <ShoppingBag size={48} className="text-cream-400 mb-4" />
                                    <p className="text-secondary-600 mb-4">Your bag is empty</p>
                                    <Link
                                        href="/shop"
                                        onClick={toggleCart}
                                        className="btn-primary"
                                    >
                                        Start Shopping
                                    </Link>
                                </div>
                            ) : (
                                <div className="p-6 space-y-4">
                                    {items.map((item: any) => (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -100 }}
                                            className="flex gap-4 pb-4 border-b border-cream-200"
                                        >
                                            {/* Image */}
                                            <Link
                                                href={`/products/${item.product.slug}`}
                                                onClick={toggleCart}
                                                className="relative w-20 h-20 bg-cream-100 flex-shrink-0"
                                            >
                                                <Image
                                                    src={item.product.images?.[0]?.url || '/placeholder.jpg'}
                                                    alt={item.product.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="80px"
                                                />
                                            </Link>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <Link
                                                    href={`/products/${item.product.slug}`}
                                                    onClick={toggleCart}
                                                    className="font-medium text-secondary-900 hover:text-primary-600 
                                   line-clamp-1 transition-colors"
                                                >
                                                    {item.product.name}
                                                </Link>
                                                {item.variant && (
                                                    <p className="text-sm text-secondary-500">
                                                        Size: {item.variant.size}
                                                    </p>
                                                )}
                                                <p className="font-semibold mt-1">
                                                    {formatPrice(
                                                        Number(item.product.basePrice) +
                                                        Number(item.variant?.additionalPrice || 0)
                                                    )}
                                                </p>

                                                {/* Quantity & Remove */}
                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex items-center border border-cream-300">
                                                        <button
                                                            onClick={() =>
                                                                updateMutation.mutate({
                                                                    itemId: item.id,
                                                                    quantity: Math.max(1, item.quantity - 1),
                                                                })
                                                            }
                                                            disabled={item.quantity <= 1 || updateMutation.isPending}
                                                            className="w-8 h-8 flex items-center justify-center 
                                       hover:bg-cream-100 disabled:opacity-50"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <span className="w-8 text-center text-sm">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() =>
                                                                updateMutation.mutate({
                                                                    itemId: item.id,
                                                                    quantity: item.quantity + 1,
                                                                })
                                                            }
                                                            disabled={updateMutation.isPending}
                                                            className="w-8 h-8 flex items-center justify-center 
                                       hover:bg-cream-100"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => removeMutation.mutate(item.id)}
                                                        disabled={removeMutation.isPending}
                                                        className="text-secondary-400 hover:text-accent-800 transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {isAuthenticated && items.length > 0 && (
                            <div className="border-t border-cream-300 p-6 space-y-4">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-secondary-600">Subtotal</span>
                                        <span>{formatPrice(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-secondary-600">GST (3%)</span>
                                        <span>{formatPrice(tax)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-semibold pt-2 border-t border-cream-200">
                                        <span>Total</span>
                                        <span>{formatPrice(total)}</span>
                                    </div>
                                </div>

                                <Link
                                    href="/checkout"
                                    onClick={toggleCart}
                                    className="block w-full btn-primary text-center"
                                >
                                    Proceed to Checkout
                                </Link>

                                <button
                                    onClick={toggleCart}
                                    className="block w-full text-center text-sm text-secondary-600 
                           hover:text-secondary-900 transition-colors"
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
