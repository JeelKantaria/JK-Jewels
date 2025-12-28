'use client';

import { motion } from 'framer-motion';
import { Truck, Shield, RefreshCw, Award } from 'lucide-react';

const features = [
    {
        icon: Truck,
        title: 'Free Shipping',
        description: 'On orders above ₹10,000',
    },
    {
        icon: Shield,
        title: 'BIS Hallmarked',
        description: '100% certified quality',
    },
    {
        icon: RefreshCw,
        title: '15-Day Returns',
        description: 'Easy return policy',
    },
    {
        icon: Award,
        title: 'Lifetime Exchange',
        description: 'Upgrade anytime',
    },
];

export function Features() {
    return (
        <section className="py-8 bg-white border-y border-cream-300">
            <div className="container-luxury">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-4"
                        >
                            <div className="w-12 h-12 flex items-center justify-center 
                            bg-primary-100 text-primary-600">
                                <feature.icon size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-secondary-900 text-sm md:text-base">
                                    {feature.title}
                                </h3>
                                <p className="text-secondary-500 text-xs md:text-sm">
                                    {feature.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
