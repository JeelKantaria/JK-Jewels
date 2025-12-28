'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const categories = [
    {
        name: 'Rings',
        slug: 'rings',
        image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600',
        description: 'Engagement, wedding & fashion rings',
    },
    {
        name: 'Necklaces',
        slug: 'necklaces',
        image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600',
        description: 'Statement pieces & delicate chains',
    },
    {
        name: 'Earrings',
        slug: 'earrings',
        image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600',
        description: 'Studs, drops & traditional jhumkas',
    },
    {
        name: 'Bracelets',
        slug: 'bracelets',
        image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600',
        description: 'Bangles, tennis & charm bracelets',
    },
];

export function Categories() {
    return (
        <section className="section-padding bg-cream-100">
            <div className="container-luxury">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <motion.span
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-primary-600 text-sm font-medium tracking-wider uppercase"
                    >
                        Explore Our Collection
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="font-heading text-3xl md:text-4xl text-secondary-900 mt-2"
                    >
                        Shop by Category
                    </motion.h2>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map((category, index) => (
                        <motion.div
                            key={category.slug}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link
                                href={`/shop?category=${category.slug}`}
                                className="group block relative overflow-hidden"
                            >
                                {/* Image */}
                                <div className="aspect-[3/4] relative">
                                    <Image
                                        src={category.image}
                                        alt={category.name}
                                        fill
                                        className="object-cover transition-transform duration-700 
                             group-hover:scale-110"
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                    />
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                </div>

                                {/* Content */}
                                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                    <h3 className="font-heading text-2xl mb-1">{category.name}</h3>
                                    <p className="text-cream-300 text-sm mb-3 opacity-0 group-hover:opacity-100 
                              transform translate-y-2 group-hover:translate-y-0 transition-all">
                                        {category.description}
                                    </p>
                                    <span className="inline-flex items-center text-sm text-primary-400 
                                 group-hover:text-primary-300 transition-colors">
                                        Shop Now
                                        <ArrowRight
                                            size={16}
                                            className="ml-1 group-hover:translate-x-1 transition-transform"
                                        />
                                    </span>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
