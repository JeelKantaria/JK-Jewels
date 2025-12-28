import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Truck, Shield, RefreshCw } from 'lucide-react';
import { HeroSection } from '@/components/home/hero-section';
import { FeaturedProducts } from '@/components/home/featured-products';
import { Categories } from '@/components/home/categories';
import { NewArrivals } from '@/components/home/new-arrivals';
import { Testimonials } from '@/components/home/testimonials';
import { Features } from '@/components/home/features';

export default function HomePage() {
    return (
        <>
            {/* Hero Section */}
            <HeroSection />

            {/* Features Bar */}
            <Features />

            {/* Categories */}
            <Categories />

            {/* Featured Products */}
            <FeaturedProducts />

            {/* Banner Section */}
            <section className="relative py-20 md:py-32 bg-secondary-900 overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <Image
                        src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920"
                        alt="Luxury jewellery background"
                        fill
                        className="object-cover"
                    />
                </div>
                <div className="container-luxury relative z-10 text-center">
                    <h2 className="font-heading text-3xl md:text-5xl text-cream-100 mb-6">
                        Every Piece Tells a <span className="text-primary-400">Story</span>
                    </h2>
                    <p className="text-cream-300 max-w-2xl mx-auto mb-8 text-lg">
                        From the first sketch to the final polish, our master artisans pour their heart
                        into every creation. Discover the art of fine Indian jewellery.
                    </p>
                    <Link
                        href="/about"
                        className="btn-gold inline-flex items-center gap-2"
                    >
                        Our Craftsmanship
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </section>

            {/* New Arrivals */}
            <NewArrivals />

            {/* Testimonials */}
            <Testimonials />

            {/* Final CTA */}
            <section className="py-20 bg-cream-200">
                <div className="container-luxury text-center">
                    <Sparkles className="w-12 h-12 text-primary-500 mx-auto mb-6" />
                    <h2 className="font-heading text-3xl md:text-4xl text-secondary-900 mb-4">
                        Begin Your Journey
                    </h2>
                    <p className="text-secondary-600 max-w-lg mx-auto mb-8">
                        Whether you're celebrating love, achievement, or simply treating yourself,
                        find the perfect piece that speaks to your soul.
                    </p>
                    <Link
                        href="/shop"
                        className="btn-primary"
                    >
                        Explore Collection
                    </Link>
                </div>
            </section>
        </>
    );
}
