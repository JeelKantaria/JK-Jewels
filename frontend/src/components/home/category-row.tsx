'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { InfiniteScrollRow } from './infinite-scroll-row';

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

interface CategoryRowProps {
    categoryName: string;
    categorySlug: string;
    products: Product[];
    scrollDirection: 'left' | 'right';
    scrollSpeed: number;
    index: number;
}

export function CategoryRow({
    categoryName,
    categorySlug,
    products,
    scrollDirection,
    scrollSpeed,
    index,
}: CategoryRowProps) {
    if (products.length === 0) {
        return null;
    }

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="py-3"
        >
            {/* Row Header */}
            <div className="container-luxury mb-2">
                <div className="flex items-center justify-between">
                    <h2 className="font-heading text-xl md:text-2xl text-secondary-900">
                        {categoryName}
                    </h2>
                    <Link
                        href={`/shop?category=${categorySlug}`}
                        className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors group"
                    >
                        View All
                        <ArrowRight
                            size={16}
                            className="group-hover:translate-x-1 transition-transform"
                        />
                    </Link>
                </div>
            </div>

            {/* Scrolling Products */}
            <div className="w-screen relative left-1/2 -translate-x-1/2 overflow-hidden">
                <div className="px-4 md:px-8 lg:px-12 xl:px-16">
                    <InfiniteScrollRow
                        products={products}
                        direction={scrollDirection}
                        speed={scrollSpeed}
                    />
                </div>
            </div>
        </motion.section>
    );
}
