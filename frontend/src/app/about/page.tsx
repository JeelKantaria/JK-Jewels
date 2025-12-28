'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Award, Heart, Shield, Sparkles, Users, MapPin, Phone, Mail } from 'lucide-react';

const values = [
    {
        icon: Award,
        title: 'Master Craftsmanship',
        description: 'Third-generation artisans bringing decades of expertise to every piece.',
    },
    {
        icon: Shield,
        title: 'BIS Certified',
        description: 'All our gold jewellery is BIS hallmarked for guaranteed purity.',
    },
    {
        icon: Heart,
        title: 'Made with Love',
        description: 'Each creation is handcrafted with passion and attention to detail.',
    },
    {
        icon: Sparkles,
        title: 'Premium Quality',
        description: 'Only the finest materials and ethically sourced gemstones.',
    },
];

const milestones = [
    { year: '1985', event: 'J.K. Jewels founded in Mumbai' },
    { year: '1995', event: 'Expanded to 3 showrooms across Maharashtra' },
    { year: '2005', event: 'Introduced contemporary designer collections' },
    { year: '2015', event: 'Received National Jewellery Award' },
    { year: '2024', event: 'Launched online store with pan-India delivery' },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-cream-100">
            {/* Hero Section */}
            <section className="relative h-[50vh] min-h-[400px] bg-secondary-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-secondary-900 via-secondary-900/90 to-transparent z-10" />
                <Image
                    src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1600"
                    alt="Jewellery crafting"
                    fill
                    className="object-cover opacity-40"
                    priority
                />
                <div className="relative z-20 container-luxury h-full flex items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-2xl"
                    >
                        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl text-cream-100 mb-6">
                            Our <span className="text-primary-400">Legacy</span> of Excellence
                        </h1>
                        <p className="text-cream-300 text-lg md:text-xl">
                            Three generations of master craftsmen, creating timeless jewellery
                            that celebrates life's precious moments.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Story Section */}
            <section className="py-20 bg-white">
                <div className="container-luxury">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <span className="text-primary-600 font-medium tracking-wider text-sm uppercase">
                                Our Story
                            </span>
                            <h2 className="font-heading text-3xl md:text-4xl text-secondary-900 mt-2 mb-6">
                                Crafting Dreams Since 1985
                            </h2>
                            <div className="space-y-4 text-secondary-600">
                                <p>
                                    J.K. Jewels was founded by Jayprakash Kantaria with a simple vision:
                                    to create jewellery that tells stories. What started as a small
                                    workshop in Mumbai has grown into one of India's most trusted
                                    jewellery houses.
                                </p>
                                <p>
                                    Today, led by the third generation of the Kantaria family, we
                                    continue to blend traditional craftsmanship with contemporary
                                    designs. Every piece that bears our name is a testament to our
                                    unwavering commitment to quality and artistry.
                                </p>
                                <p>
                                    Our master karigars (craftsmen) bring decades of expertise to each
                                    creation, ensuring that every ornament is not just jewellery, but
                                    a family heirloom in the making.
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="aspect-[4/5] relative">
                                <Image
                                    src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800"
                                    alt="Jewellery craftsmanship"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-8 -left-8 bg-primary-500 text-secondary-900 p-6">
                                <div className="text-4xl font-bold">39+</div>
                                <div className="text-sm font-medium">Years of Excellence</div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-20 bg-cream-100">
                <div className="container-luxury">
                    <div className="text-center mb-16">
                        <span className="text-primary-600 font-medium tracking-wider text-sm uppercase">
                            Why Choose Us
                        </span>
                        <h2 className="font-heading text-3xl md:text-4xl text-secondary-900 mt-2">
                            Our Core Values
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {values.map((value, index) => (
                            <motion.div
                                key={value.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white p-8 text-center"
                            >
                                <div className="w-16 h-16 bg-primary-100 flex items-center justify-center mx-auto mb-6">
                                    <value.icon className="w-8 h-8 text-primary-600" />
                                </div>
                                <h3 className="font-heading text-xl text-secondary-900 mb-3">
                                    {value.title}
                                </h3>
                                <p className="text-secondary-600 text-sm">
                                    {value.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Timeline Section */}
            <section className="py-20 bg-secondary-900 text-cream-100">
                <div className="container-luxury">
                    <div className="text-center mb-16">
                        <span className="text-primary-400 font-medium tracking-wider text-sm uppercase">
                            Our Journey
                        </span>
                        <h2 className="font-heading text-3xl md:text-4xl mt-2">
                            Milestones & Achievements
                        </h2>
                    </div>

                    <div className="max-w-3xl mx-auto">
                        {milestones.map((milestone, index) => (
                            <motion.div
                                key={milestone.year}
                                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="flex items-center gap-8 mb-8"
                            >
                                <div className="w-20 flex-shrink-0 text-right">
                                    <span className="text-primary-400 font-bold text-xl">
                                        {milestone.year}
                                    </span>
                                </div>
                                <div className="w-3 h-3 bg-primary-500 rounded-full flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-cream-300">{milestone.event}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-20 bg-white">
                <div className="container-luxury">
                    <div className="text-center mb-16">
                        <span className="text-primary-600 font-medium tracking-wider text-sm uppercase">
                            Meet The Team
                        </span>
                        <h2 className="font-heading text-3xl md:text-4xl text-secondary-900 mt-2">
                            The Kantaria Family
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {[
                            { name: 'Jayprakash Kantaria', role: 'Founder & Chairman' },
                            { name: 'Rajesh Kantaria', role: 'Managing Director' },
                            { name: 'Jeel Kantaria', role: 'Creative Director' },
                        ].map((member, index) => (
                            <motion.div
                                key={member.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="text-center"
                            >
                                <div className="w-32 h-32 bg-cream-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <Users className="w-12 h-12 text-cream-400" />
                                </div>
                                <h3 className="font-heading text-lg text-secondary-900">
                                    {member.name}
                                </h3>
                                <p className="text-primary-600 text-sm">{member.role}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact CTA */}
            <section className="py-20 bg-cream-100">
                <div className="container-luxury">
                    <div className="bg-secondary-900 p-12 md:p-16 text-center">
                        <h2 className="font-heading text-3xl md:text-4xl text-cream-100 mb-4">
                            Visit Our Showroom
                        </h2>
                        <p className="text-cream-400 mb-8 max-w-xl mx-auto">
                            Experience our collections in person. Our experts are ready to help
                            you find the perfect piece.
                        </p>

                        <div className="flex flex-wrap justify-center gap-8 mb-8 text-cream-300">
                            <div className="flex items-center gap-2">
                                <MapPin size={18} className="text-primary-400" />
                                Mumbai, Maharashtra
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={18} className="text-primary-400" />
                                +91 98765 43210
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail size={18} className="text-primary-400" />
                                info@jkjewels.com
                            </div>
                        </div>

                        <Link href="/contact" className="btn-primary">
                            Book an Appointment
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
