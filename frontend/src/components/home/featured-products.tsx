'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ProductGrid, ProductGridSkeleton } from '@/components/product/product-card';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';

export function FeaturedProducts() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['featured-products'],
        queryFn: async () => {
            const response = await productsApi.getFeatured();
            return response.data.data;
        },
    });

    return (
        <section className="section-padding bg-white">
            <div className="container-luxury">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
                    <div>
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-primary-600 text-sm font-medium tracking-wider uppercase"
                        >
                            Curated Selection
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="font-heading text-3xl md:text-4xl text-secondary-900 mt-2"
                        >
                            Featured Collection
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="text-secondary-600 mt-2 max-w-lg"
                        >
                            Handpicked pieces that showcase exceptional craftsmanship and timeless design.
                        </motion.p>
                    </div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                    >
                        <Link
                            href="/shop?featured=true"
                            className="inline-flex items-center text-secondary-900 hover:text-primary-600 
                       transition-colors mt-4 md:mt-0 link-underline"
                        >
                            View All Featured
                            <ArrowRight size={18} className="ml-2" />
                        </Link>
                    </motion.div>
                </div>

                {/* Products Grid */}
                {isLoading ? (
                    <ProductGridSkeleton count={4} />
                ) : error ? (
                    <div className="text-center py-12 text-secondary-500">
                        Failed to load products. Please try again later.
                    </div>
                ) : data && data.length > 0 ? (
                    <ProductGrid products={data.slice(0, 4)} columns={4} />
                ) : (
                    <div className="text-center py-12 text-secondary-500">
                        No featured products available at the moment.
                    </div>
                )}
            </div>
        </section>
    );
}
