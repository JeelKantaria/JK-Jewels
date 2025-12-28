'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2 } from 'lucide-react';
import { useUIStore } from '@/lib/store';
import { productsApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/lib/hooks';

export function SearchModal() {
    const { isSearchOpen, toggleSearch } = useUIStore();
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const debouncedQuery = useDebounce(query, 300);

    const { data: results, isLoading } = useQuery({
        queryKey: ['search', debouncedQuery],
        queryFn: async () => {
            if (!debouncedQuery || debouncedQuery.length < 2) return [];
            const response = await productsApi.getProducts({ search: debouncedQuery, limit: '6' });
            return response.data.data.products || [];
        },
        enabled: debouncedQuery.length >= 2,
    });

    useEffect(() => {
        if (isSearchOpen && inputRef.current) {
            inputRef.current.focus();
        }
        if (!isSearchOpen) {
            setQuery('');
        }
    }, [isSearchOpen]);

    // Close on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isSearchOpen) {
                toggleSearch();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isSearchOpen, toggleSearch]);

    return (
        <AnimatePresence>
            {isSearchOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleSearch}
                        className="fixed inset-0 bg-black/60 z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-0 left-0 right-0 z-50 bg-white shadow-luxury-xl"
                    >
                        <div className="container-luxury py-6">
                            {/* Search Input */}
                            <div className="flex items-center gap-4">
                                <div className="flex-1 relative">
                                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search for jewellery..."
                                        className="w-full pl-12 pr-4 py-4 border border-cream-300 
                                                 text-lg focus:outline-none focus:border-primary-500
                                                 transition-colors"
                                    />
                                    {isLoading && (
                                        <Loader2 size={20} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-primary-500" />
                                    )}
                                </div>
                                <button
                                    onClick={toggleSearch}
                                    className="p-3 hover:bg-cream-100 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Results */}
                            {query.length >= 2 && (
                                <div className="mt-6">
                                    {results && results.length > 0 ? (
                                        <>
                                            <p className="text-sm text-secondary-500 mb-4">
                                                {results.length} result{results.length !== 1 ? 's' : ''} found
                                            </p>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                                {results.map((product: any) => (
                                                    <Link
                                                        key={product.id}
                                                        href={`/products/${product.slug}`}
                                                        onClick={toggleSearch}
                                                        className="group"
                                                    >
                                                        <div className="aspect-square relative bg-cream-100 overflow-hidden mb-2">
                                                            <Image
                                                                src={product.images?.[0]?.url || '/placeholder.jpg'}
                                                                alt={product.name}
                                                                fill
                                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                                sizes="(max-width: 768px) 50vw, 16vw"
                                                            />
                                                        </div>
                                                        <h4 className="text-sm font-medium text-secondary-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                                                            {product.name}
                                                        </h4>
                                                        <p className="text-sm text-primary-600 font-semibold">
                                                            {formatPrice(product.basePrice)}
                                                        </p>
                                                    </Link>
                                                ))}
                                            </div>
                                            <div className="mt-6 text-center">
                                                <Link
                                                    href={`/shop?search=${encodeURIComponent(query)}`}
                                                    onClick={toggleSearch}
                                                    className="text-primary-600 hover:text-primary-700 font-medium"
                                                >
                                                    View all results →
                                                </Link>
                                            </div>
                                        </>
                                    ) : !isLoading ? (
                                        <p className="text-secondary-500 text-center py-8">
                                            No products found for "{query}"
                                        </p>
                                    ) : null}
                                </div>
                            )}

                            {/* Quick Links */}
                            {query.length < 2 && (
                                <div className="mt-6">
                                    <p className="text-sm text-secondary-500 mb-3">Popular Searches</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['Ring', 'Necklace', 'Diamond', 'Gold', 'Wedding'].map((term) => (
                                            <button
                                                key={term}
                                                onClick={() => setQuery(term)}
                                                className="px-4 py-2 bg-cream-100 text-secondary-700 text-sm
                                                         hover:bg-cream-200 transition-colors"
                                            >
                                                {term}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
