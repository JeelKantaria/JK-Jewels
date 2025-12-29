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
    { label: 'Under ₹25K', min: 0, max: 25000 },
    { label: '₹25K - ₹50K', min: 25000, max: 50000 },
    { label: '₹50K - ₹1L', min: 50000, max: 100000 },
    { label: 'Above ₹1L', min: 100000, max: null },
];

// Price range constants (₹0 to ₹1 crore)
const PRICE_MIN = 0;
const PRICE_MAX = 10000000; // 1 crore

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

    // Fetch filter counts (metal, purity, occasion)
    const { data: filterCounts } = useQuery({
        queryKey: ['filterCounts'],
        queryFn: async () => {
            const response = await productsApi.getFilters();
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

    // Clear price filter specifically (both min and max at once)
    const clearPriceFilter = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('minPrice');
        params.delete('maxPrice');
        params.set('page', '1');
        setCustomMinPrice('0');
        setCustomMaxPrice(PRICE_MAX.toString());
        router.push(`/shop?${params.toString()}`);
    };

    // Set price range (both min and max at once to avoid race conditions)
    const setPriceRange = (min: number, max: number | null) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('minPrice', min.toString());
        if (max !== null && max < PRICE_MAX) {
            params.set('maxPrice', max.toString());
        } else {
            params.delete('maxPrice');
        }
        params.set('page', '1');
        setCustomMinPrice(min.toString());
        setCustomMaxPrice(max?.toString() || PRICE_MAX.toString());
        router.push(`/shop?${params.toString()}`);
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

    // Local state for custom price range
    const [customMinPrice, setCustomMinPrice] = useState(minPrice || '0');
    const [customMaxPrice, setCustomMaxPrice] = useState(maxPrice || '10000000');
    const [showCustomPriceRange, setShowCustomPriceRange] = useState(false);

    // Check if custom range is applied (not matching any preset)
    const isCustomRangeApplied = minPrice && !priceRanges.some(r =>
        r.min.toString() === minPrice && (r.max?.toString() === maxPrice || (!r.max && !maxPrice))
    );

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

    // Apply custom price range
    const applyCustomPriceRange = () => {
        const params = new URLSearchParams(searchParams.toString());
        const min = parseInt(customMinPrice) || 0;
        const max = parseInt(customMaxPrice) || PRICE_MAX;

        // Always set minPrice for custom range (so it shows in active filters)
        // Only skip if it's the default full range (0 to PRICE_MAX)
        if (min === 0 && max >= PRICE_MAX) {
            params.delete('minPrice');
            params.delete('maxPrice');
        } else {
            params.set('minPrice', min.toString());
            if (max < PRICE_MAX) {
                params.set('maxPrice', max.toString());
            } else {
                params.delete('maxPrice');
            }
        }
        params.set('page', '1');
        router.push(`/shop?${params.toString()}`);
    };

    // Format price for display (Indian format)
    const formatPriceLabel = (value: number) => {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
        return `₹${value}`;
    };
    // Custom piecewise slider scale
    // More granularity in ₹50K - ₹5L range (common jewelry prices)
    // Scale breakpoints: 0, 50K, 1L, 2L, 5L, 10L, 1Cr
    const PRICE_BREAKPOINTS = [
        { price: 0, slider: 0 },
        { price: 50000, slider: 10 },      // ₹0-50K gets 10% of slider
        { price: 100000, slider: 25 },     // ₹50K-1L gets 15% 
        { price: 200000, slider: 45 },     // ₹1L-2L gets 20% (high granularity)
        { price: 500000, slider: 65 },     // ₹2L-5L gets 20% (high granularity)
        { price: 1000000, slider: 80 },    // ₹5L-10L gets 15%
        { price: PRICE_MAX, slider: 100 }, // ₹10L-1Cr gets 20%
    ];

    // Convert actual price to slider position (0-100)
    const priceToSlider = (price: number) => {
        if (price <= 0) return 0;
        if (price >= PRICE_MAX) return 100;

        // Find the segment this price falls into
        for (let i = 1; i < PRICE_BREAKPOINTS.length; i++) {
            const prev = PRICE_BREAKPOINTS[i - 1];
            const curr = PRICE_BREAKPOINTS[i];
            if (price <= curr.price) {
                // Linear interpolation within segment
                const priceRatio = (price - prev.price) / (curr.price - prev.price);
                return prev.slider + priceRatio * (curr.slider - prev.slider);
            }
        }
        return 100;
    };

    // Convert slider position (0-100) to actual price
    const sliderToPrice = (sliderValue: number) => {
        if (sliderValue <= 0) return 0;
        if (sliderValue >= 100) return PRICE_MAX;

        // Find the segment this slider value falls into
        for (let i = 1; i < PRICE_BREAKPOINTS.length; i++) {
            const prev = PRICE_BREAKPOINTS[i - 1];
            const curr = PRICE_BREAKPOINTS[i];
            if (sliderValue <= curr.slider) {
                // Linear interpolation within segment
                const sliderRatio = (sliderValue - prev.slider) / (curr.slider - prev.slider);
                const price = prev.price + sliderRatio * (curr.price - prev.price);
                // Round to nice values based on range
                if (price < 50000) return Math.round(price / 5000) * 5000;
                if (price < 100000) return Math.round(price / 10000) * 10000;
                if (price < 500000) return Math.round(price / 10000) * 10000;
                if (price < 1000000) return Math.round(price / 50000) * 50000;
                return Math.round(price / 100000) * 100000;
            }
        }
        return PRICE_MAX;
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
                        <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto space-y-6 pr-2 scrollbar-thin">
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
                                <div className="space-y-4">
                                    {/* Preset Ranges */}
                                    <div className="space-y-2">
                                        {priceRanges.map((range) => (
                                            <button
                                                key={range.label}
                                                onClick={() => setPriceRange(range.min, range.max)}
                                                className={`block w-full text-left py-1 text-sm transition-colors ${minPrice === range.min.toString() &&
                                                    (maxPrice === range.max?.toString() || (!range.max && !maxPrice))
                                                    ? 'text-primary-600 font-medium'
                                                    : 'text-secondary-600 hover:text-secondary-900'
                                                    }`}
                                            >
                                                {range.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Custom Range - Collapsible */}
                                    <div className="border-t border-cream-300 pt-3">
                                        {/* Custom Range Header - Click to expand/collapse */}
                                        <button
                                            onClick={() => setShowCustomPriceRange(!showCustomPriceRange)}
                                            className={`flex items-center justify-between w-full py-1 text-sm transition-colors ${isCustomRangeApplied || showCustomPriceRange
                                                ? 'text-primary-600 font-medium'
                                                : 'text-secondary-600 hover:text-secondary-900'
                                                }`}
                                        >
                                            <span>
                                                {isCustomRangeApplied && !showCustomPriceRange
                                                    ? `Custom: ${formatPriceLabel(parseInt(minPrice))} - ${formatPriceLabel(parseInt(maxPrice) || PRICE_MAX)}`
                                                    : 'Custom Range'
                                                }
                                            </span>
                                            <ChevronDown
                                                size={14}
                                                className={`transition-transform ${showCustomPriceRange ? 'rotate-180' : ''}`}
                                            />
                                        </button>

                                        {/* Expandable Custom Range Section */}
                                        {showCustomPriceRange && (
                                            <div className="mt-3 space-y-3">
                                                {/* Current Range Display */}
                                                <div className="text-center text-sm text-secondary-700">
                                                    {formatPriceLabel(parseInt(customMinPrice) || 0)} - {formatPriceLabel(parseInt(customMaxPrice) || PRICE_MAX)}
                                                </div>

                                                {/* Dual Range Slider - Logarithmic Scale */}
                                                <div className="relative h-6">
                                                    {/* Track */}
                                                    <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-cream-300 rounded-full" />
                                                    {/* Active Track */}
                                                    <div
                                                        className="absolute top-1/2 -translate-y-1/2 h-1 bg-primary-500 rounded-full"
                                                        style={{
                                                            left: `${priceToSlider(parseInt(customMinPrice) || 0)}%`,
                                                            right: `${100 - priceToSlider(parseInt(customMaxPrice) || PRICE_MAX)}%`,
                                                        }}
                                                    />
                                                    {/* Min Slider */}
                                                    <input
                                                        type="range"
                                                        min={0}
                                                        max={100}
                                                        step={0.5}
                                                        value={priceToSlider(parseInt(customMinPrice) || 0)}
                                                        onChange={(e) => {
                                                            const sliderVal = parseFloat(e.target.value);
                                                            const priceVal = sliderToPrice(sliderVal);
                                                            const currentMax = parseInt(customMaxPrice) || PRICE_MAX;
                                                            if (priceVal < currentMax) {
                                                                setCustomMinPrice(priceVal.toString());
                                                            }
                                                        }}
                                                        className="absolute w-full h-6 appearance-none bg-transparent pointer-events-none 
                                                                   [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none 
                                                                   [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary-600 
                                                                   [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                                                                   [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
                                                                   [&::-webkit-slider-thumb]:shadow-md"
                                                    />
                                                    {/* Max Slider */}
                                                    <input
                                                        type="range"
                                                        min={0}
                                                        max={100}
                                                        step={0.5}
                                                        value={priceToSlider(parseInt(customMaxPrice) || PRICE_MAX)}
                                                        onChange={(e) => {
                                                            const sliderVal = parseFloat(e.target.value);
                                                            const priceVal = sliderToPrice(sliderVal);
                                                            const currentMin = parseInt(customMinPrice) || 0;
                                                            if (priceVal > currentMin) {
                                                                setCustomMaxPrice(priceVal.toString());
                                                            }
                                                        }}
                                                        className="absolute w-full h-6 appearance-none bg-transparent pointer-events-none 
                                                                   [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none 
                                                                   [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary-600 
                                                                   [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                                                                   [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
                                                                   [&::-webkit-slider-thumb]:shadow-md"
                                                    />
                                                </div>
                                                {/* Price Range Markers */}
                                                <div className="flex justify-between w-full mt-1 px-0.5">
                                                    <span className="text-[10px] text-secondary-400">0</span>
                                                    <span className="text-[10px] text-secondary-400">50K</span>
                                                    <span className="text-[10px] text-secondary-400">1L</span>
                                                    <span className="text-[10px] text-secondary-400">2L</span>
                                                    <span className="text-[10px] text-secondary-400">5L</span>
                                                    <span className="text-[10px] text-secondary-400">10L</span>
                                                    <span className="text-[10px] text-secondary-400">1Cr</span>
                                                </div>
                                                {/* Input Fields */}
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1">
                                                        <label className="text-xs text-secondary-500">Min</label>
                                                        <input
                                                            type="number"
                                                            value={customMinPrice}
                                                            onChange={(e) => setCustomMinPrice(e.target.value)}
                                                            placeholder="0"
                                                            className="w-full px-2 py-1 text-sm border border-cream-300 rounded 
                                                                       focus:outline-none focus:border-primary-500"
                                                        />
                                                    </div>
                                                    <span className="text-secondary-400 mt-4">-</span>
                                                    <div className="flex-1">
                                                        <label className="text-xs text-secondary-500">Max</label>
                                                        <input
                                                            type="number"
                                                            value={customMaxPrice}
                                                            onChange={(e) => setCustomMaxPrice(e.target.value)}
                                                            placeholder="10 Cr"
                                                            className="w-full px-2 py-1 text-sm border border-cream-300 rounded 
                                                                       focus:outline-none focus:border-primary-500"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Apply Button */}
                                                <button
                                                    onClick={() => {
                                                        applyCustomPriceRange();
                                                        setShowCustomPriceRange(false);
                                                    }}
                                                    className="w-full px-3 py-2 bg-primary-500 text-secondary-900 text-sm 
                                                               font-medium hover:bg-primary-600 transition-colors"
                                                >
                                                    Apply Price Range
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </FilterSection>

                            {/* Metal Type */}
                            <FilterSection
                                title="Metal"
                                isOpen={expandedFilters.includes('metal')}
                                onToggle={() => toggleFilter('metal')}
                            >
                                <div className="space-y-2">
                                    {metalTypes.map((metal) => {
                                        const count = filterCounts?.metalTypes?.find((m: any) => m.name === metal)?.count || 0;
                                        return (
                                            <button
                                                key={metal}
                                                onClick={() => updateFilters('metalType', metalType === metal ? '' : metal)}
                                                className={`block w-full text-left py-1 text-sm transition-colors ${metalType === metal
                                                    ? 'text-primary-600 font-medium'
                                                    : 'text-secondary-600 hover:text-secondary-900'
                                                    }`}
                                            >
                                                {metal} ({count})
                                            </button>
                                        );
                                    })}
                                </div>
                            </FilterSection>

                            {/* Purity */}
                            <FilterSection
                                title="Purity"
                                isOpen={expandedFilters.includes('purity')}
                                onToggle={() => toggleFilter('purity')}
                            >
                                <div className="space-y-2">
                                    {purities.map((p) => {
                                        const count = filterCounts?.purities?.find((item: any) => item.name === p)?.count || 0;
                                        return (
                                            <button
                                                key={p}
                                                onClick={() => updateFilters('purity', purity === p ? '' : p)}
                                                className={`block w-full text-left py-1 text-sm transition-colors ${purity === p
                                                    ? 'text-primary-600 font-medium'
                                                    : 'text-secondary-600 hover:text-secondary-900'
                                                    }`}
                                            >
                                                {p} ({count})
                                            </button>
                                        );
                                    })}
                                </div>
                            </FilterSection>

                            {/* Occasion */}
                            <FilterSection
                                title="Occasion"
                                isOpen={expandedFilters.includes('occasion')}
                                onToggle={() => toggleFilter('occasion')}
                            >
                                <div className="space-y-2">
                                    {occasions.map((occ) => {
                                        const count = filterCounts?.occasions?.find((item: any) => item.occasion === occ)?.count || 0;
                                        return (
                                            <button
                                                key={occ}
                                                onClick={() => updateFilters('occasion', occasion === occ ? '' : occ)}
                                                className={`block w-full text-left py-1 text-sm transition-colors ${occasion === occ
                                                    ? 'text-primary-600 font-medium'
                                                    : 'text-secondary-600 hover:text-secondary-900'
                                                    }`}
                                            >
                                                {occ} ({count})
                                            </button>
                                        );
                                    })}
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

                        {/* Active Filters Chips */}
                        {activeFiltersCount > 0 && (
                            <div className="flex flex-wrap items-center gap-2 mb-6">
                                <span className="text-sm text-secondary-500">Active Filters:</span>

                                {category && (
                                    <button
                                        onClick={() => updateFilters('category', '')}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 
                                                   text-sm rounded-full hover:bg-primary-200 transition-colors"
                                    >
                                        Category: {categoriesData?.find((c: any) => c.slug === category)?.name || category}
                                        <X size={14} />
                                    </button>
                                )}

                                {metalType && (
                                    <button
                                        onClick={() => updateFilters('metalType', '')}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 
                                                   text-sm rounded-full hover:bg-primary-200 transition-colors"
                                    >
                                        Metal: {metalType}
                                        <X size={14} />
                                    </button>
                                )}

                                {purity && (
                                    <button
                                        onClick={() => updateFilters('purity', '')}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 
                                                   text-sm rounded-full hover:bg-primary-200 transition-colors"
                                    >
                                        Purity: {purity}
                                        <X size={14} />
                                    </button>
                                )}

                                {occasion && (
                                    <button
                                        onClick={() => updateFilters('occasion', '')}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 
                                                   text-sm rounded-full hover:bg-primary-200 transition-colors"
                                    >
                                        Occasion: {occasion}
                                        <X size={14} />
                                    </button>
                                )}

                                {(minPrice || maxPrice) && (
                                    <button
                                        onClick={clearPriceFilter}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 
                                                   text-sm rounded-full hover:bg-primary-200 transition-colors"
                                    >
                                        Price: {priceRanges.find(r => r.min.toString() === minPrice && (r.max?.toString() === maxPrice || (!r.max && !maxPrice)))?.label
                                            || `${formatPriceLabel(parseInt(minPrice) || 0)} - ${formatPriceLabel(parseInt(maxPrice) || PRICE_MAX)}`}
                                        <X size={14} />
                                    </button>
                                )}

                                {search && (
                                    <button
                                        onClick={() => {
                                            setSearchInput('');
                                            updateFilters('search', '');
                                        }}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 
                                                   text-sm rounded-full hover:bg-primary-200 transition-colors"
                                    >
                                        Search: "{search}"
                                        <X size={14} />
                                    </button>
                                )}

                                {activeFiltersCount > 1 && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm text-accent-800 hover:text-accent-900 underline ml-2"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                        )}

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
