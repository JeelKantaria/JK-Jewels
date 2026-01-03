'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
    return (
        <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-cream-100">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-hero-pattern opacity-50" />

            {/* Decorative Elements */}
            <div className="absolute top-20 left-10 w-64 h-64 bg-primary-200/30 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl" />

            <div className="container-luxury relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="text-center lg:text-left"
                    >
                        <motion.span
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-block px-4 py-2 bg-primary-100 text-primary-700 
                       text-sm font-medium tracking-wider uppercase mb-6"
                        >
                            New Collection 2024
                        </motion.span>

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="font-heading text-4xl md:text-5xl lg:text-6xl xl:text-7xl 
                       text-secondary-900 leading-tight mb-6"
                        >
                            Where Elegance
                            <span className="block text-gradient-gold">
                                Meets Timeless Beauty
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                            className="text-lg text-secondary-600 mb-8 max-w-lg mx-auto lg:mx-0"
                        >
                            Discover our exquisite collection of handcrafted Indian jewellery,
                            where tradition meets contemporary design. Each piece is a testament
                            to exceptional craftsmanship.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                        >
                            <Link href="/shop" className="btn-primary group">
                                Shop Now
                                <ArrowRight
                                    size={18}
                                    className="ml-2 group-hover:translate-x-1 transition-transform"
                                />
                            </Link>
                            <Link href="/shop?featured=true" className="btn-secondary">
                                View Featured
                            </Link>
                        </motion.div>

                        {/* Trust Indicators */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="flex items-center gap-8 mt-12 justify-center lg:justify-start"
                        >
                            <div className="text-center">
                                <span className="block text-2xl font-heading font-bold text-primary-500">
                                    35+
                                </span>
                                <span className="text-sm text-secondary-500">Years Legacy</span>
                            </div>
                            <div className="w-px h-12 bg-cream-400" />
                            <div className="text-center">
                                <span className="block text-2xl font-heading font-bold text-primary-500">
                                    10K+
                                </span>
                                <span className="text-sm text-secondary-500">Happy Customers</span>
                            </div>
                            <div className="w-px h-12 bg-cream-400" />
                            <div className="text-center">
                                <span className="block text-2xl font-heading font-bold text-primary-500">
                                    BIS
                                </span>
                                <span className="text-sm text-secondary-500">Certified</span>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Right Image */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative hidden lg:block"
                    >
                        {/* Main Image */}
                        <div className="relative z-10">
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                                className="relative"
                            >
                                <div className="aspect-[4/5] relative rounded-2xl overflow-hidden shadow-luxury-xl">
                                    <Image
                                        src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800"
                                        alt="Exquisite gold necklace"
                                        fill
                                        priority
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 0vw, 40vw"
                                    />
                                </div>

                                {/* Floating Card 1 */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.8 }}
                                    className="absolute -right-8 top-1/4 bg-white p-4 shadow-luxury z-20"
                                >
                                    <p className="text-xs text-secondary-500 mb-1">Starting from</p>
                                    <p className="text-lg font-semibold text-secondary-900">₹25,000</p>
                                    <p className="text-xs text-primary-600">Premium Collection</p>
                                </motion.div>

                                {/* Floating Card 2 */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 1 }}
                                    className="absolute -left-8 bottom-1/4 bg-secondary-900 text-cream-100 p-4 shadow-luxury-lg z-20"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-primary-400">★★★★★</span>
                                    </div>
                                    <p className="text-sm font-medium">4.9/5 Rating</p>
                                    <p className="text-xs text-cream-400">2,500+ Reviews</p>
                                </motion.div>
                            </motion.div>
                        </div>

                        {/* Decorative Frame */}
                        <div className="absolute -inset-4 border-2 border-primary-300/50 rounded-2xl -z-10" />
                        <div className="absolute -inset-8 border border-primary-200/30 rounded-2xl -z-10" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
