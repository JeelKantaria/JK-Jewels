'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
    {
        id: 1,
        name: 'Priya Sharma',
        location: 'Mumbai',
        rating: 5,
        text: 'The craftsmanship is absolutely stunning. My wedding necklace from J.K. Jewels was the highlight of my bridal look. The attention to detail is exceptional.',
        product: 'Royal Temple Necklace',
    },
    {
        id: 2,
        name: 'Anita Gupta',
        location: 'Delhi',
        rating: 5,
        text: 'Been a customer for 10 years. The quality and service have always been impeccable. Their diamond collection is breathtaking.',
        product: 'Diamond Solitaire Ring',
    },
    {
        id: 3,
        name: 'Ritu Agarwal',
        location: 'Bangalore',
        rating: 5,
        text: 'The online shopping experience was seamless. The earrings arrived beautifully packaged and looked even better in person!',
        product: 'Sapphire Drop Earrings',
    },
];

export function Testimonials() {
    return (
        <section className="section-padding bg-secondary-900 text-cream-100 overflow-hidden">
            <div className="container-luxury">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <motion.span
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-primary-400 text-sm font-medium tracking-wider uppercase"
                    >
                        Customer Stories
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="font-heading text-3xl md:text-4xl mt-2"
                    >
                        What Our Customers Say
                    </motion.h2>
                </div>

                {/* Testimonials Grid */}
                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={testimonial.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.15 }}
                            className="relative p-6 md:p-8 bg-secondary-800 border border-secondary-700"
                        >
                            {/* Quote Icon */}
                            <Quote
                                size={32}
                                className="text-primary-500/20 absolute top-6 right-6"
                            />

                            {/* Rating */}
                            <div className="flex gap-1 mb-4">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={16}
                                        className="fill-primary-400 text-primary-400"
                                    />
                                ))}
                            </div>

                            {/* Text */}
                            <p className="text-cream-300 mb-6 leading-relaxed">
                                &ldquo;{testimonial.text}&rdquo;
                            </p>

                            {/* Author */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-cream-100">{testimonial.name}</p>
                                    <p className="text-sm text-cream-500">{testimonial.location}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-cream-500">Purchased</p>
                                    <p className="text-sm text-primary-400">{testimonial.product}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
