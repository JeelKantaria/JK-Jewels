'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Filter, X, ChevronDown, ChevronUp, Grid3X3, LayoutGrid, Search } from 'lucide-react';
import { ProductGrid, ProductGridSkeleton } from '@/components/product/product-card';
import { useQuery } from '@tanstack/react-query';
import { productsApi, categoriesApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

const metalTypes = ['Gold', 'Silver', 'Platinum', 'White Gold', 'Rose Gold'];
const purities = ['22K', '18K', '14K', '925'];
const occasions = ['Wedding', 'Engagement', 'Festival', 'Daily Wear', 'Party', 'Traditional'];
const priceRanges = [
    { label: 'Under ₹25,000', min: 0, max: 25000 },
    { label: '₹25,000 - ₹50,000', min: 25000, max: 50000 },
    { label: '₹50,000 - ₹1,00,000', min: 50000, max: 100000 },
    { label: 'Above ₹1,00,000', min: 100000, max: null },
];

export default function ShopPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [expandedFilters, setExpandedFilters] = useState<string[]>(['category', 'price']);

    // Get filter values from URL
    const category = searchParams.get('category') || '';
    const metalType = searchParams.get('metalType') || '';
    const purity = searchParams.get('purity') || '';
    const occasion = searchParams.get('occasion') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const newArrivals = searchParams.get('newArrivals') || '';
    const featured = searchParams.get('featured') || '';
    const search = searchParams.get('search') || '';

    // Fetch categories
    const { data: categoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await categoriesApi.getCategories();
            return response.data.data;
        },
    });

    // Fetch products
    const { data: productsData, isLoading } = useQuery({
        queryKey: ['products', { category, metalType, purity, occasion, minPrice, maxPrice, sort, order, page, newArrivals, featured, search }],
        queryFn: async () => {
            const params: Record<string, string> = { page: page.toString(), limit: '12' };
            if (category) params.category = category;
            if (metalType) params.metalType = metalType;
            if (purity) params.purity = purity;
            if (occasion) params.occasion = occasion;
            if (minPrice) params.minPrice = minPrice;
            if (maxPrice) params.maxPrice = maxPrice;
            if (sort) params.sort = sort;
            if (order) params.order = order;
            if (newArrivals) params.newArrivals = newArrivals;
            if (featured) params.featured = featured;
            if (search) params.search = search;

            const response = await productsApi.getProducts(params);
            return response.data.data;
        },
    });

    // Update filters
    const updateFilters = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.set('page', '1');
        router.push(`/shop?${params.toString()}`);
    };

    const clearFilters = () => {
        router.push('/shop');
    };

    const toggleFilter = (section: string) => {
        setExpandedFilters((prev) =>
            prev.includes(section)
                ? prev.filter((s) => s !== section)
                : [...prev, section]
        );
    };

    const activeFiltersCount = [category, metalType, purity, occasion, minPrice, search].filter(Boolean).length;

    // Local state for search input
    const [searchInput, setSearchInput] = useState(search);

    // Handle search submit
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        if (searchInput.trim()) {
            params.set('search', searchInput.trim());
        } else {
            params.delete('search');
        }
        params.set('page', '1');
        router.push(`/shop?${params.toString()}`);
    };

    return (
        <div className="min-h-screen bg-cream-100">
            {/* Header */}
            <div className="bg-secondary-900 text-cream-100 py-16">
                <div className="container-luxury text-center">
                    <h1 className="font-heading text-3xl md:text-4xl mb-4">
                        {search ? `Search: "${search}"` : newArrivals ? 'New Arrivals' : featured ? 'Featured' : 'Our Collection'}
                    </h1>
                    <p className="text-cream-400 max-w-lg mx-auto mb-8">
                        {search ? `Showing results for "${search}"` : 'Explore our exquisite range of handcrafted jewellery'}
                    </p>

                    {/* Search Input */}
                    <form onSubmit={handleSearch} className="max-w-md mx-auto">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search for jewellery..."
                                className="w-full pl-4 pr-12 py-3 bg-secondary-800 border border-secondary-700 
                                         text-cream-100 placeholder-cream-500 focus:outline-none 
                                         focus:border-primary-500 transition-colors"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 
                                         text-cream-400 hover:text-primary-400 transition-colors"
                            >
                                <Search size={20} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="container-luxury py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters - Desktop */}
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <div className="sticky top-28 space-y-6">
                            {/* Active Filters */}
                            {activeFiltersCount > 0 && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-secondary-600">
                                        {activeFiltersCount} filter(s) active
                                    </span>
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm text-primary-600 hover:text-primary-700"
                                    >
                                        Clear all
                                    </button>
                                </div>
                            )}

                            {/* Categories */}
                            <FilterSection
                                title="Category"
                                isOpen={expandedFilters.includes('category')}
                                onToggle={() => toggleFilter('category')}
                            >
                                <div className="space-y-2">
                                    {categoriesData?.map((cat: any) => (
                                        <button
                                            key={cat.slug}
                                            onClick={() => updateFilters('category', category === cat.slug ? '' : cat.slug)}
                                            className={`block w-full text-left py-1 text-sm transition-colors ${category === cat.slug
                                                ? 'text-primary-600 font-medium'
                                                : 'text-secondary-600 hover:text-secondary-900'
                                                }`}
                                        >
                                            {cat.name} ({cat._count?.products || 0})
                                        </button>
                                    ))}
                                </div>
                            </FilterSection>

                            {/* Price Range */}
                            <FilterSection
                                title="Price"
                                isOpen={expandedFilters.includes('price')}
                                onToggle={() => toggleFilter('price')}
                            >
                                <div className="space-y-2">
                                    {priceRanges.map((range) => (
                                        <button
                                            key={range.label}
                                            onClick={() => {
                                                updateFilters('minPrice', range.min.toString());
                                                if (range.max) {
                                                    updateFilters('maxPrice', range.max.toString());
                                                } else {
                                                    updateFilters('maxPrice', '');
                                                }
                                            }}
                                            className={`block w-full text-left py-1 text-sm transition-colors ${minPrice === range.min.toString()
                                                ? 'text-primary-600 font-medium'
                                                : 'text-secondary-600 hover:text-secondary-900'
                                                }`}
                                        >
                                            {range.label}
                                        </button>
                                    ))}
                                </div>
                            </FilterSection>

                            {/* Metal Type */}
                            <FilterSection
                                title="Metal"
                                isOpen={expandedFilters.includes('metal')}
                                onToggle={() => toggleFilter('metal')}
                            >
                                <div className="space-y-2">
                                    {metalTypes.map((metal) => (
                                        <button
                                            key={metal}
                                            onClick={() => updateFilters('metalType', metalType === metal ? '' : metal)}
                                            className={`block w-full text-left py-1 text-sm transition-colors ${metalType === metal
                                                ? 'text-primary-600 font-medium'
                                                : 'text-secondary-600 hover:text-secondary-900'
                                                }`}
                                        >
                                            {metal}
                                        </button>
                                    ))}
                                </div>
                            </FilterSection>

                            {/* Purity */}
                            <FilterSection
                                title="Purity"
                                isOpen={expandedFilters.includes('purity')}
                                onToggle={() => toggleFilter('purity')}
                            >
                                <div className="space-y-2">
                                    {purities.map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => updateFilters('purity', purity === p ? '' : p)}
                                            className={`block w-full text-left py-1 text-sm transition-colors ${purity === p
                                                ? 'text-primary-600 font-medium'
                                                : 'text-secondary-600 hover:text-secondary-900'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </FilterSection>

                            {/* Occasion */}
                            <FilterSection
                                title="Occasion"
                                isOpen={expandedFilters.includes('occasion')}
                                onToggle={() => toggleFilter('occasion')}
                            >
                                <div className="space-y-2">
                                    {occasions.map((occ) => (
                                        <button
                                            key={occ}
                                            onClick={() => updateFilters('occasion', occasion === occ ? '' : occ)}
                                            className={`block w-full text-left py-1 text-sm transition-colors ${occasion === occ
                                                ? 'text-primary-600 font-medium'
                                                : 'text-secondary-600 hover:text-secondary-900'
                                                }`}
                                        >
                                            {occ}
                                        </button>
                                    ))}
                                </div>
                            </FilterSection>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-cream-300">
                            {/* Mobile Filter Button */}
                            <button
                                onClick={() => setMobileFiltersOpen(true)}
                                className="lg:hidden flex items-center gap-2 text-secondary-900"
                            >
                                <Filter size={20} />
                                Filters
                                {activeFiltersCount > 0 && (
                                    <span className="w-5 h-5 bg-primary-500 text-secondary-900 text-xs 
                                 flex items-center justify-center">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </button>

                            {/* Results Count */}
                            <p className="hidden lg:block text-secondary-600 text-sm">
                                {productsData?.pagination?.total || 0} products
                            </p>

                            {/* Sort */}
                            <div className="flex items-center gap-4">
                                <select
                                    value={`${sort}-${order}`}
                                    onChange={(e) => {
                                        const [newSort, newOrder] = e.target.value.split('-');
                                        const params = new URLSearchParams(searchParams.toString());
                                        params.set('sort', newSort);
                                        params.set('order', newOrder);
                                        params.set('page', '1');
                                        router.push(`/shop?${params.toString()}`);
                                    }}
                                    className="input-luxury py-2 pr-8 text-sm"
                                >
                                    <option value="createdAt-desc">Newest First</option>
                                    <option value="createdAt-asc">Oldest First</option>
                                    <option value="basePrice-asc">Price: Low to High</option>
                                    <option value="basePrice-desc">Price: High to Low</option>
                                    <option value="name-asc">Name: A to Z</option>
                                </select>
                            </div>
                        </div>

                        {/* Products Grid */}
                        {isLoading ? (
                            <ProductGridSkeleton count={12} />
                        ) : productsData?.products?.length > 0 ? (
                            <>
                                <ProductGrid products={productsData.products} columns={3} />

                                {/* Pagination */}
                                {productsData.pagination.totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-12">
                                        {[...Array(productsData.pagination.totalPages)].map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => updateFilters('page', (i + 1).toString())}
                                                className={`w-10 h-10 flex items-center justify-center text-sm 
                                  transition-colors ${page === i + 1
                                                        ? 'bg-secondary-900 text-cream-100'
                                                        : 'bg-cream-200 text-secondary-700 hover:bg-cream-300'
                                                    }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-16">
                                <p className="text-secondary-500 mb-4">No products found matching your criteria.</p>
                                <button onClick={clearFilters} className="btn-secondary">
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

// Filter Section Component
function FilterSection({
    title,
    isOpen,
    onToggle,
    children,
}: {
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="border-b border-cream-300 pb-4">
            <button
                onClick={onToggle}
                className="flex items-center justify-between w-full py-2 text-secondary-900 font-medium"
            >
                {title}
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {isOpen && <div className="mt-2">{children}</div>}
        </div>
    );
}
