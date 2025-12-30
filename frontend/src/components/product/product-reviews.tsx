'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ThumbsUp, User, Loader2, AlertCircle, Check, ImageIcon, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import { reviewsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Review {
    id: string;
    rating: number;
    title?: string;
    comment?: string;
    images?: string[];
    isVerified: boolean;
    createdAt: string;
    user: {
        id: string;
        name: string;
        avatar?: string;
    };
}

interface ReviewStats {
    averageRating: number;
    totalReviews: number;
    distribution: Record<number, number>;
}

interface ProductReviewsProps {
    productId: string;
    productName: string;
}

export function ProductReviews({ productId, productName }: ProductReviewsProps) {
    const queryClient = useQueryClient();
    const { isAuthenticated, user } = useAuthStore();
    const [showForm, setShowForm] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [images, setImages] = useState<string[]>([]);

    // Fetch reviews
    const { data, isLoading, error } = useQuery({
        queryKey: ['reviews', productId],
        queryFn: async () => {
            const response = await reviewsApi.getProductReviews(productId);
            return response.data.data as { reviews: Review[]; stats: ReviewStats };
        },
    });

    // Submit review mutation
    const submitMutation = useMutation({
        mutationFn: () => reviewsApi.createReview(productId, { rating, title, comment, images }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
            toast.success('Review submitted successfully!');
            setShowForm(false);
            setRating(0);
            setTitle('');
            setComment('');
            setImages([]);
            setImageUrl('');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to submit review');
        },
    });

    // Delete review mutation
    const deleteMutation = useMutation({
        mutationFn: (reviewId: string) => reviewsApi.deleteReview(reviewId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
            toast.success('Review deleted');
        },
        onError: () => {
            toast.error('Failed to delete review');
        },
    });

    const reviews = data?.reviews || [];
    const stats = data?.stats || { averageRating: 0, totalReviews: 0, distribution: {} };

    // Check if current user has already reviewed
    const userReview = reviews.find(r => r.user.id === user?.id);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }
        submitMutation.mutate();
    };

    return (
        <section className="mt-16 pt-16 border-t border-cream-300">
            <h2 className="font-heading text-2xl text-secondary-900 mb-8">
                Customer Reviews
            </h2>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Stats Column */}
                <div className="lg:col-span-1">
                    <div className="bg-cream-100 p-6 sticky top-24">
                        {/* Average Rating */}
                        <div className="text-center mb-6">
                            <p className="text-5xl font-bold text-secondary-900">
                                {stats.averageRating.toFixed(1)}
                            </p>
                            <div className="flex justify-center my-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        size={20}
                                        className={star <= Math.round(stats.averageRating)
                                            ? 'fill-primary-500 text-primary-500'
                                            : 'text-cream-400'}
                                    />
                                ))}
                            </div>
                            <p className="text-secondary-500 text-sm">
                                Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
                            </p>
                        </div>

                        {/* Rating Distribution */}
                        <div className="space-y-2">
                            {[5, 4, 3, 2, 1].map((rating) => {
                                const count = stats.distribution[rating] || 0;
                                const percentage = stats.totalReviews > 0
                                    ? (count / stats.totalReviews) * 100
                                    : 0;
                                return (
                                    <div key={rating} className="flex items-center gap-2 text-sm">
                                        <span className="w-3">{rating}</span>
                                        <Star size={14} className="fill-primary-500 text-primary-500" />
                                        <div className="flex-1 h-2 bg-cream-300 overflow-hidden">
                                            <div
                                                className="h-full bg-primary-500 transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <span className="w-8 text-secondary-500">{count}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Write Review Button */}
                        {isAuthenticated && !userReview && !showForm && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="w-full mt-6 btn-primary"
                            >
                                Write a Review
                            </button>
                        )}

                        {!isAuthenticated && (
                            <p className="text-sm text-secondary-500 text-center mt-6">
                                <a href="/login" className="text-primary-600 hover:underline">
                                    Sign in
                                </a>{' '}
                                to write a review
                            </p>
                        )}
                    </div>
                </div>

                {/* Reviews Column */}
                <div className="lg:col-span-2">
                    {/* Review Form */}
                    <AnimatePresence>
                        {showForm && (
                            <motion.form
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                onSubmit={handleSubmit}
                                className="bg-white shadow-card p-6 mb-8"
                            >
                                <h3 className="font-heading text-lg text-secondary-900 mb-4">
                                    Review "{productName}"
                                </h3>

                                {/* Star Rating Input */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                                        Your Rating *
                                    </label>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className="p-1 focus:outline-none"
                                            >
                                                <Star
                                                    size={28}
                                                    className={`transition-colors ${star <= (hoverRating || rating)
                                                        ? 'fill-primary-500 text-primary-500'
                                                        : 'text-cream-400 hover:text-cream-500'
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Title */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Review Title
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Summarize your experience"
                                        className="w-full px-4 py-2 border border-cream-300 focus:border-primary-500 
                                                 focus:ring-1 focus:ring-primary-500 outline-none"
                                        maxLength={100}
                                    />
                                </div>

                                {/* Comment */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Your Review
                                    </label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Share your experience with this product..."
                                        className="w-full px-4 py-2 border border-cream-300 focus:border-primary-500 
                                                 focus:ring-1 focus:ring-primary-500 outline-none resize-none"
                                        rows={4}
                                        maxLength={1000}
                                    />
                                </div>

                                {/* Image URL Input */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        <ImageIcon size={16} className="inline mr-1" />
                                        Add Product Photos (Optional)
                                    </label>
                                    <p className="text-xs text-secondary-400 mb-2">
                                        Paste image URLs (max 5 images)
                                    </p>
                                    <div className="flex gap-2">
                                        <input
                                            type="url"
                                            value={imageUrl}
                                            onChange={(e) => setImageUrl(e.target.value)}
                                            placeholder="https://example.com/image.jpg"
                                            className="flex-1 px-4 py-2 border border-cream-300 focus:border-primary-500 
                                                     focus:ring-1 focus:ring-primary-500 outline-none text-sm"
                                            disabled={images.length >= 5}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (imageUrl.trim() && images.length < 5) {
                                                    try {
                                                        new URL(imageUrl); // Validate URL
                                                        setImages([...images, imageUrl.trim()]);
                                                        setImageUrl('');
                                                    } catch {
                                                        toast.error('Please enter a valid URL');
                                                    }
                                                }
                                            }}
                                            disabled={!imageUrl.trim() || images.length >= 5}
                                            className="px-4 py-2 bg-secondary-900 text-cream-100 text-sm 
                                                     hover:bg-secondary-800 transition-colors disabled:opacity-50"
                                        >
                                            Add
                                        </button>
                                    </div>

                                    {/* Image Preview Grid */}
                                    {images.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {images.map((img, index) => (
                                                <div key={index} className="relative w-16 h-16 group">
                                                    <Image
                                                        src={img}
                                                        alt={`Review image ${index + 1}`}
                                                        fill
                                                        className="object-cover rounded"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setImages(images.filter((_, i) => i !== index))}
                                                        className="absolute -top-2 -right-2 w-5 h-5 bg-accent-700 text-white rounded-full 
                                                                 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={submitMutation.isPending}
                                        className="btn-primary disabled:opacity-50"
                                    >
                                        {submitMutation.isPending ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            'Submit Review'
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {/* Reviews List */}
                    {isLoading ? (
                        <div className="text-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-secondary-500">
                            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                            Failed to load reviews
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center py-12 text-secondary-500">
                            <Star className="w-8 h-8 mx-auto mb-2 text-cream-400" />
                            <p>No reviews yet. Be the first to review this product!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {reviews.map((review) => (
                                <motion.div
                                    key={review.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white shadow-card p-6"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-cream-200 rounded-full flex items-center justify-center">
                                                {review.user.avatar ? (
                                                    <img
                                                        src={review.user.avatar}
                                                        alt={review.user.name}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <User size={20} className="text-secondary-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-secondary-900">
                                                    {review.user.name}
                                                    {review.isVerified && (
                                                        <span className="ml-2 text-xs text-green-600 flex items-center gap-1 inline-flex">
                                                            <Check size={12} /> Verified Purchase
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-sm text-secondary-500">
                                                    {formatDate(review.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    size={16}
                                                    className={star <= review.rating
                                                        ? 'fill-primary-500 text-primary-500'
                                                        : 'text-cream-400'}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {review.title && (
                                        <h4 className="font-medium text-secondary-900 mb-2">
                                            {review.title}
                                        </h4>
                                    )}

                                    {review.comment && (
                                        <p className="text-secondary-600">{review.comment}</p>
                                    )}

                                    {/* Review Images */}
                                    {review.images && review.images.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {review.images.map((img, index) => (
                                                <div key={index} className="relative w-20 h-20">
                                                    <Image
                                                        src={img}
                                                        alt={`Review image ${index + 1}`}
                                                        fill
                                                        className="object-cover rounded"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Delete button for own review */}
                                    {user?.id === review.user.id && (
                                        <button
                                            onClick={() => {
                                                if (confirm('Delete your review?')) {
                                                    deleteMutation.mutate(review.id);
                                                }
                                            }}
                                            className="mt-4 text-sm text-accent-700 hover:underline"
                                        >
                                            Delete review
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
