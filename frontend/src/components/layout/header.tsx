'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    ShoppingBag,
    Heart,
    User,
    Menu,
    X,
    ChevronDown
} from 'lucide-react';
import { useAuthStore, useCartStore, useUIStore, useWishlistStore } from '@/lib/store';

const navigation = [
    { name: 'Shop All', href: '/shop' },
    {
        name: 'Categories',
        href: '/shop',
        children: [
            { name: 'Rings', href: '/shop?category=rings' },
            { name: 'Necklaces', href: '/shop?category=necklaces' },
            { name: 'Earrings', href: '/shop?category=earrings' },
            { name: 'Bracelets', href: '/shop?category=bracelets' },
            { name: 'Pendants', href: '/shop?category=pendants' },
        ],
    },
    { name: 'New Arrivals', href: '/shop?newArrivals=true' },
    { name: 'Featured', href: '/shop?featured=true' },
    { name: 'About', href: '/about' },
];

export function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    const { isAuthenticated, user } = useAuthStore();
    const { itemCount } = useCartStore();
    const { items: wishlistItems } = useWishlistStore();
    const { isMobileMenuOpen, toggleMobileMenu, toggleSearch, toggleCart, closeAll } = useUIStore();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            {/* Announcement Bar */}
            <div className="bg-secondary-900 text-cream-100 py-2 text-center text-sm">
                <p className="font-light tracking-wide">
                    ✨ Free Shipping on Orders Above ₹10,000 | Use Code: <span className="font-semibold text-primary-400">WELCOME10</span> for 10% Off
                </p>
            </div>

            {/* Main Header */}
            <header
                className={`sticky top-0 z-50 transition-all duration-500 ${isScrolled
                    ? 'bg-white/95 backdrop-blur-md shadow-lg'
                    : 'bg-cream-100'
                    }`}
            >
                <div className="container-luxury">
                    <div className="flex items-center justify-between h-20">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={toggleMobileMenu}
                            className="lg:hidden p-2 -ml-2 focus-ring"
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        {/* Logo */}
                        <Link href="/" className="flex-shrink-0" onClick={closeAll}>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="text-2xl md:text-3xl font-heading font-bold text-secondary-900"
                            >
                                <span className="text-primary-500">J.K.</span> Jewels
                            </motion.div>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center space-x-8">
                            {navigation.map((item) => (
                                <div
                                    key={item.name}
                                    className="relative"
                                    onMouseEnter={() => setActiveDropdown(item.name)}
                                    onMouseLeave={() => setActiveDropdown(null)}
                                >
                                    <Link
                                        href={item.href}
                                        className="flex items-center text-sm font-medium text-secondary-700 
                             hover:text-secondary-900 transition-colors link-underline py-2"
                                    >
                                        {item.name}
                                        {item.children && (
                                            <ChevronDown
                                                size={14}
                                                className={`ml-1 transition-transform ${activeDropdown === item.name ? 'rotate-180' : ''
                                                    }`}
                                            />
                                        )}
                                    </Link>

                                    {/* Dropdown */}
                                    {item.children && (
                                        <AnimatePresence>
                                            {activeDropdown === item.name && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="absolute top-full left-0 mt-2 w-48 bg-white shadow-luxury py-2"
                                                >
                                                    {item.children.map((child) => (
                                                        <Link
                                                            key={child.name}
                                                            href={child.href}
                                                            className="block px-4 py-2 text-sm text-secondary-700 
                                       hover:bg-cream-100 hover:text-secondary-900 
                                       transition-colors"
                                                        >
                                                            {child.name}
                                                        </Link>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    )}
                                </div>
                            ))}
                        </nav>

                        {/* Right Icons */}
                        <div className="flex items-center space-x-4">
                            {/* Search */}
                            <button
                                onClick={toggleSearch}
                                className="p-2 hover:text-primary-500 transition-colors focus-ring"
                                aria-label="Search"
                            >
                                <Search size={22} />
                            </button>

                            {/* Wishlist */}
                            <Link
                                href="/wishlist"
                                className="p-2 hover:text-primary-500 transition-colors focus-ring relative"
                                aria-label="Wishlist"
                            >
                                <Heart size={22} />
                            </Link>

                            {/* User Account */}
                            <Link
                                href={isAuthenticated ? '/account' : '/login'}
                                className="hidden sm:block p-2 hover:text-primary-500 transition-colors focus-ring"
                                aria-label="Account"
                            >
                                <User size={22} />
                            </Link>

                            {/* Cart */}
                            <button
                                onClick={toggleCart}
                                className="p-2 hover:text-primary-500 transition-colors focus-ring relative"
                                aria-label="Cart"
                            >
                                <ShoppingBag size={22} />
                                {itemCount > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-secondary-900 
                             text-xs font-semibold flex items-center justify-center"
                                    >
                                        {itemCount}
                                    </motion.span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="lg:hidden bg-white border-t border-cream-300 overflow-hidden"
                        >
                            <nav className="container-luxury py-4 space-y-2">
                                {navigation.map((item) => (
                                    <div key={item.name}>
                                        <Link
                                            href={item.href}
                                            onClick={closeAll}
                                            className="block py-3 text-lg font-medium text-secondary-900 
                               hover:text-primary-500 transition-colors"
                                        >
                                            {item.name}
                                        </Link>
                                        {item.children && (
                                            <div className="pl-4 space-y-2 mt-2">
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.name}
                                                        href={child.href}
                                                        onClick={closeAll}
                                                        className="block py-2 text-sm text-secondary-600 
                                     hover:text-primary-500 transition-colors"
                                                    >
                                                        {child.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <Link
                                    href={isAuthenticated ? '/account' : '/login'}
                                    onClick={closeAll}
                                    className="block py-3 text-lg font-medium text-secondary-900 
                           hover:text-primary-500 transition-colors"
                                >
                                    {isAuthenticated ? 'My Account' : 'Sign In'}
                                </Link>
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>
        </>
    );
}
