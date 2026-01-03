import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { HeroSection } from '@/components/home/hero-section';
import { Features } from '@/components/home/features';
import { HomepageCategoryRows } from '@/components/home/homepage-category-rows';

export default function HomePage() {
    return (
        <>
            {/* Hero Section */}
            <HeroSection />

            {/* Features Bar */}
            <Features />

            {/* Auto-Scrolling Category Rows */}
            <HomepageCategoryRows />

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

