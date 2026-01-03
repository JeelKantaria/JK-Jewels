'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart } from 'lucide-react';
import { useWishlistStore, useUIStore } from '@/lib/store';
import { wishlistApi, cartApi } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface Product {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    image: string | null;
    variants: {
        id: string;
        size: string;
        stockQuantity: number;
    }[];
}

interface InfiniteScrollRowProps {
    products: Product[];
    direction: 'left' | 'right';
    speed: number; // seconds for one loop
}

export function InfiniteScrollRow({ products, direction, speed }: InfiniteScrollRowProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const { items: wishlistItems, addItem: addToWishlistStore, removeItem: removeFromWishlistStore } = useWishlistStore();
    const { toggleCart } = useUIStore();
    const queryClient = useQueryClient();

    const cardWidth = 180;
    const gap = 12;

    // Create 4 sets of products for robust seamless looping + manual scrolling buffer
    const displayProducts = [...products, ...products, ...products, ...products];
    const singleSetWidth = products.length * (cardWidth + gap);

    // Precise scroll position for sub-pixel accuracy
    const preciseScrollRef = useRef(0);

    // Initial Scroll Setup
    useEffect(() => {
        if (containerRef.current) {
            // Start in the middle (Set 2) so user can scroll left or right immediately
            const startPos = singleSetWidth;
            containerRef.current.scrollLeft = startPos;
            preciseScrollRef.current = startPos;
        }
    }, [singleSetWidth]);

    // Auto-scroll Logic
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let animationFrameId: number;
        let lastTime = performance.now();

        // Calculate pixels per frame based on speed (seconds for singleSetWidth)
        // speed = time for singleSetWidth
        const pixelsPerSecond = singleSetWidth / speed;

        const animate = (time: number) => {
            const deltaTime = (time - lastTime) / 1000; // seconds
            lastTime = time;

            if (!isPaused && !isDragging && container) {
                const moveAmount = pixelsPerSecond * deltaTime;

                if (direction === 'left') {
                    preciseScrollRef.current += moveAmount;
                } else {
                    preciseScrollRef.current -= moveAmount;
                }

                container.scrollLeft = preciseScrollRef.current;

                // Seamless Loop Logic
                // We have 4 sets: [0][1][2][3]
                // We want to keep viewport roughly in [1][2]
                // If we go too far right (into [3]), jump back to [2]
                // If we go too far left (into [0]), jump forward to [1]

                // If scrollLeft > 2.5 sets, subtract 1 set width
                if (preciseScrollRef.current >= singleSetWidth * 2.5) {
                    preciseScrollRef.current -= singleSetWidth;
                    container.scrollLeft = preciseScrollRef.current;
                }
                // If scrollLeft < 0.5 sets, add 1 set width
                else if (preciseScrollRef.current <= singleSetWidth * 0.5) {
                    preciseScrollRef.current += singleSetWidth;
                    container.scrollLeft = preciseScrollRef.current;
                }
            } else if (container) {
                // When paused or dragging, sync precise ref with actual DOM scroll
                // so we resume smoothly from new position
                preciseScrollRef.current = container.scrollLeft;
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrameId);
    }, [direction, speed, singleSetWidth, isPaused, isDragging]);

    // Wishlist mutations
    const addWishlistMutation = useMutation({
        mutationFn: (productId: string) => wishlistApi.addItem(productId),
        onSuccess: (_, productId) => {
            addToWishlistStore(productId);
            toast.success('Added to wishlist');
        },
        onError: () => toast.error('Failed to add to wishlist'),
    });

    const removeWishlistMutation = useMutation({
        mutationFn: (productId: string) => wishlistApi.removeItem(productId),
        onSuccess: (_, productId) => {
            removeFromWishlistStore(productId);
            toast.success('Removed from wishlist');
        },
        onError: () => toast.error('Failed to remove from wishlist'),
    });

    // Cart mutation
    const addToCartMutation = useMutation({
        mutationFn: (data: { productId: string; variantId?: string }) => cartApi.addItem(data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            toast.success('Added to cart');
            toggleCart();
        },
        onError: () => toast.error('Failed to add to cart'),
    });

    const handleWishlistToggle = (e: React.MouseEvent, productId: string) => {
        e.preventDefault();
        e.stopPropagation();

        const isInWishlist = wishlistItems.includes(productId);
        if (isInWishlist) {
            removeWishlistMutation.mutate(productId);
        } else {
            addWishlistMutation.mutate(productId);
        }
    };

    const handleAddToCart = (e: React.MouseEvent, product: Product) => {
        e.preventDefault();
        // Prevent event propagation so clicking button doesn't trigger row drag logic or unwanted behaviors
        e.stopPropagation();

        // Check if product has variants and stock
        const availableVariants = product.variants.filter(v => v.stockQuantity > 0);

        if (availableVariants.length === 0) {
            toast.error('Out of stock');
            return;
        }

        if (availableVariants.length === 1) {
            // Single variant - add directly
            addToCartMutation.mutate({
                productId: product.id,
                variantId: availableVariants[0].id,
            });
        } else if (product.variants.length === 0) {
            // No variants - add without variantId
            addToCartMutation.mutate({ productId: product.id });
        } else {
            // Multiple variants - redirect to product page
            window.location.href = `/products/${product.slug}`;
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(price);
    };

    if (products.length === 0) {
        return null;
    }

    return (
        <div
            ref={containerRef}
            className="flex overflow-x-auto w-full scrollbar-hide cursor-grab active:cursor-grabbing"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => {
                setIsPaused(false);
                setIsDragging(false);
            }}
            onTouchStart={() => {
                setIsPaused(true);
                setIsDragging(true);
            }}
            onTouchEnd={() => {
                // Resume after a short delay
                setTimeout(() => {
                    setIsDragging(false);
                    setIsPaused(false);
                }, 1000);
            }}
            onMouseDown={() => {
                setIsDragging(true);
                setIsPaused(true);
            }}
            onMouseUp={() => {
                setIsDragging(false);
            }}
            style={{
                scrollBehavior: 'auto', // Important for instant seeking (resetting loop)
            }}
        >
            <div className="flex gap-3 px-4">
                {displayProducts.map((product, index) => {
                    const isInWishlist = wishlistItems.includes(product.id);

                    return (
                        <Link
                            key={`${product.id}-${index}`}
                            href={`/products/${product.slug}`}
                            className="flex-shrink-0 group relative select-none" // select-none prevents text selection while dragging
                            style={{ width: cardWidth }}
                            draggable={false} // Prevent native drag-start behavior
                        >
                            {/* Product Card */}
                            <div className="relative aspect-square rounded-lg overflow-hidden bg-cream-100">
                                {/* Product Image */}
                                {product.image ? (
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        sizes="240px"
                                        draggable={false}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        No image
                                    </div>
                                )}

                                {/* Gradient Overlay - Always visible at bottom */}
                                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                {/* Product Name - Visible on hover */}
                                <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                    <h3 className="text-white text-sm font-medium line-clamp-2">
                                        {product.name}
                                    </h3>
                                    <p className="text-primary-300 text-sm font-semibold mt-1">
                                        {formatPrice(product.basePrice)}
                                    </p>
                                </div>

                                {/* Wishlist Heart - Always show if wishlisted, show on hover otherwise */}
                                <button
                                    onClick={(e) => handleWishlistToggle(e, product.id)}
                                    className={`absolute top-3 right-3 z-10 p-2 rounded-full transition-all duration-300 ${isInWishlist
                                        ? 'opacity-100 bg-white/90'
                                        : 'opacity-0 group-hover:opacity-100 bg-white/80 hover:bg-white'
                                        }`}
                                >
                                    <Heart
                                        size={18}
                                        className={`transition-colors ${isInWishlist
                                            ? 'fill-accent-600 text-accent-600'
                                            : 'text-secondary-700 group-hover:text-accent-600'
                                            }`}
                                        style={isInWishlist ? {
                                            fill: 'url(#wishlistGradient)',
                                            stroke: '#8B2942',
                                            strokeWidth: 2,
                                        } : {}}
                                    />
                                </button>

                                {/* Add to Cart - Visible on hover */}
                                <button
                                    onClick={(e) => handleAddToCart(e, product)}
                                    className="absolute top-3 left-3 z-10 p-2 rounded-full bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-all duration-300"
                                >
                                    <ShoppingCart size={18} className="text-secondary-700" />
                                </button>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* SVG Gradient Definition for Wishlist Heart */}
            <svg width="0" height="0" className="absolute">
                <defs>
                    <linearGradient id="wishlistGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F5E6C8" />
                        <stop offset="50%" stopColor="#C9A962" />
                        <stop offset="100%" stopColor="#B8963F" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}
