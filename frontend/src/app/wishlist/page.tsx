'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useWishlistStore } from '@/lib/store';
import { wishlistApi, cartApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function WishlistPage() {
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuthStore();
    const { items: localItems, removeItem: removeLocalItem, clearWishlist } = useWishlistStore();

    // Fetch wishlist from API if authenticated
    const { data: wishlistData, isLoading } = useQuery({
        queryKey: ['wishlist'],
        queryFn: async () => {
            const response = await wishlistApi.getWishlist();
            return response.data.data;
        },
        enabled: isAuthenticated,
    });

    // Remove from wishlist mutation
    const removeMutation = useMutation({
        mutationFn: (productId: string) => wishlistApi.removeItem(productId),
        onSuccess: (_, productId) => {
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
            removeLocalItem(productId);
            toast.success('Removed from wishlist');
        },
    });

    // Add to cart mutation
    const addToCartMutation = useMutation({
        mutationFn: (productId: string) => cartApi.addItem({ productId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            toast.success('Added to cart');
        },
    });

    // wishlistData is an array of WishlistItem, each with a nested 'product' object
    const products = isAuthenticated
        ? (wishlistData?.map((item: any) => item.product).filter(Boolean) || [])
        : [];

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-cream-100 py-16">
                <div className="container-luxury">
                    <div className="max-w-md mx-auto text-center">
                        <Heart size={64} className="mx-auto text-cream-400 mb-6" />
                        <h1 className="font-heading text-3xl text-secondary-900 mb-4">
                            Your Wishlist
                        </h1>
                        <p className="text-secondary-600 mb-8">
                            Please sign in to view your wishlist and save your favourite pieces.
                        </p>
                        <Link href="/login" className="btn-primary">
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-cream-100 py-16">
                <div className="container-luxury">
                    <h1 className="font-heading text-3xl text-secondary-900 mb-8">Your Wishlist</h1>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="aspect-square bg-cream-200 mb-4" />
                                <div className="h-4 bg-cream-200 mb-2 w-3/4" />
                                <div className="h-4 bg-cream-200 w-1/2" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="min-h-screen bg-cream-100 py-16">
                <div className="container-luxury">
                    <div className="max-w-md mx-auto text-center">
                        <Heart size={64} className="mx-auto text-cream-400 mb-6" />
                        <h1 className="font-heading text-3xl text-secondary-900 mb-4">
                            Your Wishlist is Empty
                        </h1>
                        <p className="text-secondary-600 mb-8">
                            Start adding your favourite pieces to your wishlist by clicking the heart icon on any product.
                        </p>
                        <Link href="/shop" className="btn-primary inline-flex items-center gap-2">
                            Explore Collection
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cream-100 py-16">
            <div className="container-luxury">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="font-heading text-3xl text-secondary-900">
                            Your Wishlist
                        </h1>
                        <p className="text-secondary-600 mt-1">
                            {products.length} item{products.length !== 1 ? 's' : ''} saved
                        </p>
                    </div>
                    <button
                        onClick={async () => {
                            if (confirm('Are you sure you want to clear your wishlist?')) {
                                try {
                                    // Clear from backend API
                                    await wishlistApi.clearAll();
                                    // Clear local store
                                    clearWishlist();
                                    // Invalidate cache to update UI
                                    queryClient.invalidateQueries({ queryKey: ['wishlist'] });
                                    toast.success('Wishlist cleared');
                                } catch (error) {
                                    toast.error('Failed to clear wishlist');
                                }
                            }
                        }}
                        className="text-secondary-500 hover:text-accent-800 text-sm transition-colors"
                    >
                        Clear All
                    </button>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map((product: any, index: number) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group bg-white"
                        >
                            {/* Image */}
                            <Link href={`/products/${product.slug}`}>
                                <div className="aspect-square relative overflow-hidden bg-cream-100">
                                    <Image
                                        src={product.images?.[0]?.url || '/placeholder.jpg'}
                                        alt={product.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        sizes="(max-width: 768px) 50vw, 25vw"
                                    />
                                </div>
                            </Link>

                            {/* Details */}
                            <div className="p-4">
                                <Link href={`/products/${product.slug}`}>
                                    <h3 className="font-medium text-secondary-900 group-hover:text-primary-600 
                                                 transition-colors line-clamp-1">
                                        {product.name}
                                    </h3>
                                </Link>
                                <p className="text-primary-600 font-semibold mt-1">
                                    {formatPrice(product.basePrice)}
                                </p>

                                {/* Actions */}
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => addToCartMutation.mutate(product.id)}
                                        disabled={addToCartMutation.isPending}
                                        className="flex-1 btn-primary py-2 text-sm flex items-center justify-center gap-2"
                                    >
                                        <ShoppingBag size={16} />
                                        Add to Cart
                                    </button>
                                    <button
                                        onClick={() => removeMutation.mutate(product.id)}
                                        disabled={removeMutation.isPending}
                                        className="p-2 border border-cream-300 hover:border-accent-800 
                                                 hover:text-accent-800 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
