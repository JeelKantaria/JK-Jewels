import { Metadata } from 'next';
import ProductPageClient from './ProductPageClient';

// Server-side metadata generation for SEO
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type Props = {
    params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    try {
        const res = await fetch(`${API_URL}/products/${params.slug}`, {
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!res.ok) {
            return {
                title: 'Product Not Found | J.K. Jewels',
                description: 'The requested product could not be found.',
            };
        }

        const data = await res.json();
        const product = data.data;
        const primaryImage = product.images?.[0]?.url;

        return {
            title: `${product.name} | J.K. Jewels`,
            description: product.description?.slice(0, 160) || `Shop ${product.name} - Premium ${product.metalType} ${product.purity} jewellery at J.K. Jewels.`,
            keywords: [product.category?.name, product.metalType, product.purity, ...product.occasion, 'jewellery', 'J.K. Jewels'].filter(Boolean),
            openGraph: {
                title: product.name,
                description: product.description?.slice(0, 160),
                images: primaryImage ? [{ url: primaryImage, width: 800, height: 800, alt: product.name }] : [],
                type: 'website',
                siteName: 'J.K. Jewels',
            },
            twitter: {
                card: 'summary_large_image',
                title: product.name,
                description: product.description?.slice(0, 160),
                images: primaryImage ? [primaryImage] : [],
            },
        };
    } catch (error) {
        return {
            title: 'J.K. Jewels | Luxury Jewellery',
            description: 'Explore exquisite handcrafted jewellery at J.K. Jewels.',
        };
    }
}

export default function ProductPage() {
    return <ProductPageClient />;
}
