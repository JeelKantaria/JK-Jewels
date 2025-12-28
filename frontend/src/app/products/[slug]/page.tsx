'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Share2, Truck, Shield, RefreshCw, Star, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productsApi, cartApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useWishlistStore } from '@/lib/store';
import { ProductGrid, ProductGridSkeleton } from '@/components/product/product-card';
import toast from 'react-hot-toast';

export default function ProductPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);

    const { addItem, removeItem, isInWishlist } = useWishlistStore();

    const { data: product, isLoading, error } = useQuery({
        queryKey: ['product', slug],
        queryFn: async () => {
            const response = await productsApi.getProduct(slug);
            return response.data.data;
        },
    });

    if (isLoading) {
        return <ProductPageSkeleton />;
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cream-100">
                <div className="text-center">
                    <h1 className="font-heading text-2xl mb-4">Product Not Found</h1>
                    <Link href="/shop" className="btn-primary">
                        Back to Shop
                    </Link>
                </div>
            </div>
        );
    }

    const inWishlist = isInWishlist(product.id);
    const images = product.images || [];
    const variants = product.variants || [];
    const selectedVariantData = variants.find((v: any) => v.id === selectedVariant);
    const totalPrice = Number(product.basePrice) + Number(selectedVariantData?.additionalPrice || 0);

    const handleAddToCart = async () => {
        try {
            await cartApi.addItem({
                productId: product.id,
                variantId: selectedVariant || undefined,
                quantity,
            });
            toast.success('Added to cart!');
        } catch (error) {
            toast.error('Please login to add to cart');
        }
    };

    const handleWishlistToggle = () => {
        if (inWishlist) {
            removeItem(product.id);
            toast.success('Removed from wishlist');
        } else {
            addItem(product.id);
            toast.success('Added to wishlist');
        }
    };

    return (
        <div className="min-h-screen bg-cream-100">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-cream-300">
                <div className="container-luxury py-4">
                    <nav className="flex items-center gap-2 text-sm text-secondary-500">
                        <Link href="/" className="hover:text-secondary-900">Home</Link>
                        <span>/</span>
                        <Link href="/shop" className="hover:text-secondary-900">Shop</Link>
                        <span>/</span>
                        <Link href={`/shop?category=${product.category?.slug}`} className="hover:text-secondary-900">
                            {product.category?.name}
                        </Link>
                        <span>/</span>
                        <span className="text-secondary-900">{product.name}</span>
                    </nav>
                </div>
            </div>

            <div className="container-luxury py-8 md:py-12">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Image Gallery */}
                    <div className="space-y-4">
                        {/* Main Image */}
                        <motion.div
                            className="relative aspect-square bg-white overflow-hidden"
                            layoutId="product-image"
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={selectedImage}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="relative w-full h-full"
                                >
                                    <Image
                                        src={images[selectedImage]?.url || '/placeholder.jpg'}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 100vw, 50vw"
                                        priority
                                    />
                                </motion.div>
                            </AnimatePresence>

                            {/* Navigation Arrows */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 
                             bg-white/80 flex items-center justify-center hover:bg-white transition"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        onClick={() => setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 
                             bg-white/80 flex items-center justify-center hover:bg-white transition"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </>
                            )}

                            {/* Badges */}
                            {product.isNewArrival && (
                                <span className="badge-new">New</span>
                            )}
                        </motion.div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                {images.map((image: any, index: number) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(index)}
                                        className={`relative w-20 h-20 flex-shrink-0 overflow-hidden 
                              border-2 transition-colors ${selectedImage === index
                                                ? 'border-primary-500'
                                                : 'border-transparent hover:border-cream-400'
                                            }`}
                                    >
                                        <Image
                                            src={image.url}
                                            alt={`${product.name} ${index + 1}`}
                                            fill
                                            className="object-cover"
                                            sizes="80px"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Details */}
                    <div className="lg:py-4">
                        {/* Category */}
                        <p className="text-primary-600 text-sm font-medium tracking-wider uppercase mb-2">
                            {product.category?.name}
                        </p>

                        {/* Title */}
                        <h1 className="font-heading text-3xl md:text-4xl text-secondary-900 mb-4">
                            {product.name}
                        </h1>

                        {/* Rating */}
                        {product.avgRating > 0 && (
                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={16}
                                            className={i < Math.floor(product.avgRating)
                                                ? 'fill-primary-500 text-primary-500'
                                                : 'text-cream-400'}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm text-secondary-600">
                                    {product.avgRating.toFixed(1)} ({product.reviewCount} reviews)
                                </span>
                            </div>
                        )}

                        {/* Price */}
                        <div className="mb-6">
                            <p className="font-heading text-3xl text-secondary-900 mb-2">
                                {formatPrice(totalPrice)}
                            </p>
                            <p className="text-sm text-secondary-500">
                                Inclusive of all taxes
                            </p>
                        </div>

                        {/* Price Breakdown */}
                        <div className="bg-cream-200 p-4 mb-6 text-sm">
                            <div className="flex justify-between mb-1">
                                <span className="text-secondary-600">Metal Value</span>
                                <span>{formatPrice(Number(product.metalCost) || 0)}</span>
                            </div>
                            <div className="flex justify-between mb-1">
                                <span className="text-secondary-600">Making Charge</span>
                                <span>{formatPrice(Number(product.makingCharge) || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-secondary-600">GST ({product.gstPercent}%)</span>
                                <span>{formatPrice(totalPrice * Number(product.gstPercent) / 100)}</span>
                            </div>
                        </div>

                        {/* Product Info */}
                        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                            <div>
                                <p className="text-secondary-500">Metal</p>
                                <p className="font-medium">{product.metalType}</p>
                            </div>
                            <div>
                                <p className="text-secondary-500">Purity</p>
                                <p className="font-medium">{product.purity}</p>
                            </div>
                            <div>
                                <p className="text-secondary-500">Weight</p>
                                <p className="font-medium">{product.weight} grams</p>
                            </div>
                            <div>
                                <p className="text-secondary-500">SKU</p>
                                <p className="font-medium">{product.sku}</p>
                            </div>
                        </div>

                        {/* Size Selection */}
                        {variants.length > 0 && (
                            <div className="mb-6">
                                <p className="text-sm font-medium text-secondary-900 mb-3">
                                    Select Size
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    {variants.map((variant: any) => (
                                        <button
                                            key={variant.id}
                                            onClick={() => setSelectedVariant(variant.id)}
                                            disabled={variant.stockQuantity === 0}
                                            className={`min-w-[60px] px-4 py-2 text-sm border transition-all ${selectedVariant === variant.id
                                                    ? 'border-secondary-900 bg-secondary-900 text-cream-100'
                                                    : variant.stockQuantity === 0
                                                        ? 'border-cream-300 text-cream-400 cursor-not-allowed'
                                                        : 'border-cream-400 hover:border-secondary-900'
                                                }`}
                                        >
                                            {variant.size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity */}
                        <div className="flex items-center gap-4 mb-6">
                            <p className="text-sm font-medium">Quantity</p>
                            <div className="flex items-center border border-cream-400">
                                <button
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                    className="w-10 h-10 flex items-center justify-center hover:bg-cream-200 transition"
                                >
                                    <Minus size={16} />
                                </button>
                                <span className="w-12 text-center font-medium">{quantity}</span>
                                <button
                                    onClick={() => setQuantity((q) => q + 1)}
                                    className="w-10 h-10 flex items-center justify-center hover:bg-cream-200 transition"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 mb-8">
                            <button
                                onClick={handleAddToCart}
                                className="flex-1 btn-primary"
                            >
                                <ShoppingBag size={18} className="mr-2" />
                                Add to Cart
                            </button>
                            <button
                                onClick={handleWishlistToggle}
                                className={`w-12 h-12 flex items-center justify-center border transition-colors ${inWishlist
                                        ? 'border-accent-800 bg-accent-800 text-white'
                                        : 'border-cream-400 hover:border-secondary-900'
                                    }`}
                            >
                                <Heart size={20} fill={inWishlist ? 'currentColor' : 'none'} />
                            </button>
                            <button className="w-12 h-12 flex items-center justify-center border border-cream-400 
                               hover:border-secondary-900 transition-colors">
                                <Share2 size={20} />
                            </button>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-3 gap-4 py-6 border-y border-cream-300">
                            <div className="text-center">
                                <Truck size={24} className="mx-auto text-primary-600 mb-2" />
                                <p className="text-xs text-secondary-600">Free Shipping</p>
                            </div>
                            <div className="text-center">
                                <Shield size={24} className="mx-auto text-primary-600 mb-2" />
                                <p className="text-xs text-secondary-600">BIS Certified</p>
                            </div>
                            <div className="text-center">
                                <RefreshCw size={24} className="mx-auto text-primary-600 mb-2" />
                                <p className="text-xs text-secondary-600">Easy Returns</p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mt-6">
                            <h3 className="font-semibold text-secondary-900 mb-3">Description</h3>
                            <p className="text-secondary-600 leading-relaxed">
                                {product.description}
                            </p>
                            {product.story && (
                                <>
                                    <h4 className="font-semibold text-secondary-900 mt-4 mb-2">Craftsmanship</h4>
                                    <p className="text-secondary-600 leading-relaxed">
                                        {product.story}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Related Products */}
                {product.relatedProducts?.length > 0 && (
                    <section className="mt-16 pt-16 border-t border-cream-300">
                        <h2 className="font-heading text-2xl text-secondary-900 mb-8">
                            You May Also Like
                        </h2>
                        <ProductGrid products={product.relatedProducts} columns={4} />
                    </section>
                )}
            </div>
        </div>
    );
}

function ProductPageSkeleton() {
    return (
        <div className="min-h-screen bg-cream-100">
            <div className="container-luxury py-12">
                <div className="grid lg:grid-cols-2 gap-12">
                    <div className="aspect-square bg-cream-300 animate-pulse" />
                    <div className="space-y-6">
                        <div className="h-4 w-24 bg-cream-300 animate-pulse" />
                        <div className="h-10 w-3/4 bg-cream-300 animate-pulse" />
                        <div className="h-8 w-32 bg-cream-300 animate-pulse" />
                        <div className="h-24 bg-cream-300 animate-pulse" />
                        <div className="h-12 bg-cream-300 animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
}
