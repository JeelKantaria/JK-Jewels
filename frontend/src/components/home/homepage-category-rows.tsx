'use client';

import { useQuery } from '@tanstack/react-query';
import { homepageApi } from '@/lib/api';
import { CategoryRow } from './category-row';
import { RefreshCw } from 'lucide-react';

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

interface HomepageRow {
    id: string;
    categoryId: string;
    categoryName: string;
    categorySlug: string;
    scrollDirection: 'left' | 'right';
    scrollSpeed: number;
    products: Product[];
}

interface HomepageData {
    globalScrollSpeed: number;
    rows: HomepageRow[];
}

export function HomepageCategoryRows() {
    const { data, isLoading, error, refetch } = useQuery<HomepageData>({
        queryKey: ['homepage', 'rows'],
        queryFn: async () => {
            const response = await homepageApi.getRows();
            return response.data.data;
        },
        staleTime: 60 * 1000, // 1 minute
    });

    if (isLoading) {
        return (
            <section className="py-12 bg-cream-100">
                <div className="container-luxury">
                    {/* Skeleton Loading */}
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="mb-10 animate-pulse">
                            <div className="flex justify-between items-center mb-4">
                                <div className="h-8 w-32 bg-gray-200 rounded" />
                                <div className="h-5 w-20 bg-gray-200 rounded" />
                            </div>
                            <div className="flex gap-4 overflow-hidden">
                                {[1, 2, 3, 4, 5].map((j) => (
                                    <div
                                        key={j}
                                        className="flex-shrink-0 w-60 aspect-square bg-gray-200 rounded-lg"
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="py-12 bg-cream-100">
                <div className="container-luxury">
                    <div className="text-center py-12">
                        <p className="text-gray-600 mb-4">Failed to load collections</p>
                        <button
                            onClick={() => refetch()}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            <RefreshCw size={16} />
                            Try Again
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    if (!data?.rows.length) {
        return null;
    }

    return (
        <section className="py-4 bg-cream-100">
            {/* Section Header */}
            <div className="container-luxury text-center mb-4">
                <span className="text-primary-600 text-xs font-medium tracking-wider uppercase">
                    Explore Our Collection
                </span>
                <h2 className="font-heading text-2xl md:text-3xl text-secondary-900 mt-1">
                    Shop by Category
                </h2>
            </div>

            {/* Category Rows */}
            {data.rows.map((row, index) => (
                <CategoryRow
                    key={row.id}
                    categoryName={row.categoryName}
                    categorySlug={row.categorySlug}
                    products={row.products}
                    scrollDirection={row.scrollDirection}
                    scrollSpeed={row.scrollSpeed}
                    index={index}
                />
            ))}
        </section>
    );
}
