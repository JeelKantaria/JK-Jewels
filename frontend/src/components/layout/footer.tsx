import Link from 'next/link';
import {
    Mail,
    Phone,
    MapPin,
    Facebook,
    Instagram,
    Twitter,
    Youtube
} from 'lucide-react';

const footerLinks = {
    shop: [
        { name: 'All Jewellery', href: '/shop' },
        { name: 'Rings', href: '/shop?category=rings' },
        { name: 'Necklaces', href: '/shop?category=necklaces' },
        { name: 'Earrings', href: '/shop?category=earrings' },
        { name: 'Bracelets', href: '/shop?category=bracelets' },
    ],
    company: [
        { name: 'About Us', href: '/about' },
        { name: 'Our Story', href: '/about#story' },
        { name: 'Craftsmanship', href: '/about#craftsmanship' },
        { name: 'Contact', href: '/contact' },
    ],
    support: [
        { name: 'FAQs', href: '/faq' },
        { name: 'Shipping & Returns', href: '/shipping' },
        { name: 'Size Guide', href: '/size-guide' },
        { name: 'Care Instructions', href: '/care' },
    ],
    legal: [
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Terms of Service', href: '/terms' },
        { name: 'Refund Policy', href: '/refund' },
    ],
};

const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'Youtube', icon: Youtube, href: '#' },
];

export function Footer() {
    return (
        <footer className="bg-secondary-900 text-cream-100">
            {/* Newsletter Section */}
            <div className="border-b border-secondary-800">
                <div className="container-luxury py-12">
                    <div className="max-w-2xl mx-auto text-center">
                        <h3 className="font-heading text-2xl md:text-3xl mb-4">
                            Join Our <span className="text-primary-400">Exclusive</span> Circle
                        </h3>
                        <p className="text-cream-300 mb-6">
                            Subscribe for early access to new collections, exclusive offers, and jewellery care tips.
                        </p>
                        <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 px-4 py-3 bg-secondary-800 border border-secondary-700 
                         text-cream-100 placeholder-cream-400
                         focus:outline-none focus:border-primary-500 transition-colors"
                            />
                            <button
                                type="submit"
                                className="px-6 py-3 bg-primary-500 text-secondary-900 font-medium
                         hover:bg-primary-400 transition-colors"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Main Footer */}
            <div className="container-luxury py-12 md:py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-4 lg:col-span-1">
                        <Link href="/" className="inline-block mb-6">
                            <span className="text-2xl font-heading font-bold">
                                <span className="text-primary-400">J.K.</span> Jewels
                            </span>
                        </Link>
                        <p className="text-cream-400 text-sm mb-6 leading-relaxed">
                            Crafting timeless elegance since 1985. Each piece tells a story of
                            exceptional craftsmanship and enduring beauty.
                        </p>
                        <div className="flex space-x-4">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.name}
                                    href={social.href}
                                    className="w-10 h-10 flex items-center justify-center 
                           border border-secondary-700 hover:border-primary-500 
                           hover:text-primary-400 transition-colors"
                                    aria-label={social.name}
                                >
                                    <social.icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Shop Links */}
                    <div>
                        <h4 className="font-semibold text-cream-100 mb-4">Shop</h4>
                        <ul className="space-y-3">
                            {footerLinks.shop.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-cream-400 hover:text-primary-400 text-sm transition-colors"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h4 className="font-semibold text-cream-100 mb-4">Company</h4>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-cream-400 hover:text-primary-400 text-sm transition-colors"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div>
                        <h4 className="font-semibold text-cream-100 mb-4">Support</h4>
                        <ul className="space-y-3">
                            {footerLinks.support.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-cream-400 hover:text-primary-400 text-sm transition-colors"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="col-span-2 md:col-span-1">
                        <h4 className="font-semibold text-cream-100 mb-4">Contact</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <MapPin size={18} className="text-primary-400 flex-shrink-0 mt-0.5" />
                                <span className="text-cream-400 text-sm">
                                    123 Jewellery Lane, Zaveri Bazaar, Mumbai - 400002
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={18} className="text-primary-400" />
                                <a href="tel:+919876543210" className="text-cream-400 hover:text-primary-400 text-sm">
                                    +91 98765 43210
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={18} className="text-primary-400" />
                                <a href="mailto:hello@jkjewels.com" className="text-cream-400 hover:text-primary-400 text-sm">
                                    hello@jkjewels.com
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-secondary-800">
                <div className="container-luxury py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-cream-500 text-sm">
                            © {new Date().getFullYear()} J.K. Jewels. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6">
                            {footerLinks.legal.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="text-cream-500 hover:text-primary-400 text-sm transition-colors"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                        {/* Trust Badges */}
                        <div className="flex items-center gap-4">
                            <span className="text-cream-500 text-xs">Secure Payments</span>
                            <div className="flex gap-2">
                                <div className="w-8 h-5 bg-cream-100/20 rounded-sm"></div>
                                <div className="w-8 h-5 bg-cream-100/20 rounded-sm"></div>
                                <div className="w-8 h-5 bg-cream-100/20 rounded-sm"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
