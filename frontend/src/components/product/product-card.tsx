'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { formatPrice } from '@/lib/utils';
import { useWishlistStore, useCartStore, useAuthStore } from '@/lib/store';
import { cartApi, wishlistApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface ProductCardProps {
    product: {
        id: string;
        name: string;
        slug: string;
        basePrice: number;
        metalType: string;
        purity: string;
        isNewArrival?: boolean;
        isFeatured?: boolean;
        images: { url: string; type: string }[];
        category?: { name: string; slug: string };
        avgRating?: number;
        _count?: { reviews: number };
    };
}

export function ProductCard({ product }: ProductCardProps) {
    const queryClient = useQueryClient();
    const { addItem, removeItem, isInWishlist } = useWishlistStore();
    const { isAuthenticated } = useAuthStore();
    const inWishlist = isInWishlist(product.id);

    const primaryImage = product.images.find(img => img.type === 'gallery') || product.images[0];
    const hoverImage = product.images[1];

    const handleWishlistToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (inWishlist) {
            removeItem(product.id);
            // Sync with backend if authenticated
            if (isAuthenticated) {
                try {
                    await wishlistApi.removeItem(product.id);
                    // Invalidate wishlist cache so wishlist page shows updated data
                    queryClient.invalidateQueries({ queryKey: ['wishlist'] });
                } catch (error) {
                    // Revert on error
                    addItem(product.id);
                }
            }
            toast.success('Removed from wishlist');
        } else {
            addItem(product.id);
            // Sync with backend if authenticated
            if (isAuthenticated) {
                try {
                    await wishlistApi.addItem(product.id);
                    // Invalidate wishlist cache so wishlist page shows updated data
                    queryClient.invalidateQueries({ queryKey: ['wishlist'] });
                } catch (error) {
                    // Revert on error
                    removeItem(product.id);
                }
            }
            toast.success('Added to wishlist');
        }
    };

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            await cartApi.addItem({ productId: product.id });
            toast.success('Added to cart');
        } catch (error) {
            toast.error('Please login to add to cart');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="group"
        >
            <Link href={`/products/${product.slug}`}>
                <div className="card-product group">
                    {/* Image Container */}
                    <div className="relative aspect-square overflow-hidden bg-cream-200">
                        {/* Primary Image */}
                        <Image
                            src={primaryImage?.url || '/placeholder.jpg'}
                            alt={product.name}
                            fill
                            className="object-cover product-image transition-opacity duration-500"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />

                        {/* Hover Image */}
                        {hoverImage && (
                            <Image
                                src={hoverImage.url}
                                alt={`${product.name} - alternate view`}
                                fill
                                className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 
                         transition-opacity duration-500"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            />
                        )}

                        {/* Overlay */}
                        <div className="product-overlay" />

                        {/* Badges */}
                        {product.isNewArrival && (
                            <span className="badge-new">New</span>
                        )}

                        {/* Wishlist Badge - Black/Charcoal with Gold Accent */}
                        {inWishlist && (
                            <span className="wishlist-heart overflow-hidden">
                                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <linearGradient id="charcoal-gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#454545" />
                                            <stop offset="40%" stopColor="#1A1A1A" />
                                            <stop offset="60%" stopColor="#2d2d2d" />
                                            <stop offset="100%" stopColor="#454545" />
                                        </linearGradient>
                                    </defs>
                                    <path
                                        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                                        fill="url(#charcoal-gold-gradient)"
                                        stroke="#C9A962"
                                        strokeWidth="1.5"
                                    />
                                </svg>
                            </span>
                        )}

                        {/* Quick Actions */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2
                          opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0
                          transition-all duration-300">
                            {/* View */}
                            <Link
                                href={`/products/${product.slug}`}
                                className="w-10 h-10 flex items-center justify-center bg-white shadow-lg
                         hover:bg-primary-500 transition-colors"
                                aria-label="Quick view"
                            >
                                <Eye size={18} />
                            </Link>

                            {/* Add to Cart */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleAddToCart}
                                className="w-10 h-10 flex items-center justify-center bg-secondary-900 text-cream-100
                         shadow-lg hover:bg-primary-500 hover:text-secondary-900 transition-colors"
                                aria-label="Add to cart"
                            >
                                <ShoppingBag size={18} />
                            </motion.button>

                            {/* Wishlist */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleWishlistToggle}
                                className={`w-10 h-10 flex items-center justify-center bg-white shadow-lg
                          hover:bg-primary-500 transition-colors ${inWishlist ? 'text-accent-800' : 'text-secondary-900'
                                    }`}
                                aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                            >
                                <Heart size={18} fill={inWishlist ? 'currentColor' : 'none'} />
                            </motion.button>
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                        {/* Category */}
                        {product.category && (
                            <p className="text-xs text-primary-600 uppercase tracking-wider mb-1">
                                {product.category.name}
                            </p>
                        )}

                        {/* Name */}
                        <h3 className="font-heading text-lg text-secondary-900 mb-1 
                         group-hover:text-primary-600 transition-colors line-clamp-1">
                            {product.name}
                        </h3>

                        {/* Metal Info */}
                        <p className="text-sm text-secondary-500 mb-2">
                            {product.metalType} • {product.purity}
                        </p>

                        {/* Price */}
                        <p className="font-semibold text-secondary-900">
                            {formatPrice(product.basePrice)}
                        </p>

                        {/* Rating */}
                        {product.avgRating !== undefined && product.avgRating > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                                <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                        <span
                                            key={i}
                                            className={`text-sm ${i < Math.floor(product.avgRating!)
                                                ? 'text-primary-500'
                                                : 'text-cream-400'
                                                }`}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                                <span className="text-xs text-secondary-500">
                                    ({product._count?.reviews || 0})
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

// Product Grid Component
interface ProductGridProps {
    products: ProductCardProps['product'][];
    columns?: 2 | 3 | 4;
}

export function ProductGrid({ products, columns = 4 }: ProductGridProps) {
    const gridCols = {
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    };

    return (
        <div className={`grid ${gridCols[columns]} gap-6 md:gap-8`}>
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}

// Loading Skeleton
export function ProductCardSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="aspect-square bg-cream-300 mb-4" />
            <div className="space-y-2 px-4">
                <div className="h-3 w-16 bg-cream-300 rounded" />
                <div className="h-5 w-3/4 bg-cream-300 rounded" />
                <div className="h-3 w-1/2 bg-cream-300 rounded" />
                <div className="h-5 w-1/3 bg-cream-300 rounded" />
            </div>
        </div>
    );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {[...Array(count)].map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    );
}
