import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { SearchModal } from '@/components/search/search-modal';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

const playfair = Playfair_Display({
    subsets: ['latin'],
    variable: '--font-playfair',
    display: 'swap',
});

export const metadata: Metadata = {
    title: {
        default: 'J.K. Jewels | Exquisite Indian Jewellery',
        template: '%s | J.K. Jewels',
    },
    description:
        'Discover timeless elegance with J.K. Jewels. Premium handcrafted Indian jewellery featuring gold, diamond, and precious gemstone collections.',
    keywords: [
        'jewellery',
        'gold jewellery',
        'diamond rings',
        'Indian jewellery',
        'bridal jewellery',
        'necklace',
        'earrings',
        'luxury',
    ],
    authors: [{ name: 'J.K. Jewels' }],
    openGraph: {
        title: 'J.K. Jewels | Exquisite Indian Jewellery',
        description: 'Discover timeless elegance with J.K. Jewels',
        url: 'https://jkjewels.com',
        siteName: 'J.K. Jewels',
        locale: 'en_IN',
        type: 'website',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
            <body className="min-h-screen flex flex-col">
                <Providers>
                    <Header />
                    <CartDrawer />
                    <SearchModal />
                    <main className="flex-1">{children}</main>
                    <Footer />
                </Providers>
            </body>
        </html>
    );
}
