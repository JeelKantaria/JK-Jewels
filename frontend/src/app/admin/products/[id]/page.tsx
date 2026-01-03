'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import ProductForm from '../ProductForm';

export default function EditProductPage() {
    const params = useParams();
    const productId = params.id as string;

    // Fetch product data from admin API (by ID)
    const { data: product, isLoading, error } = useQuery({
        queryKey: ['admin', 'product', productId],
        queryFn: async () => {
            const response = await api.get(`/admin/products/${productId}`);
            return response.data.data;
        },
    });

    if (isLoading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 w-48 bg-gray-200 rounded" />
                    <div className="h-64 bg-gray-200 rounded-xl" />
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="p-8">
                <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                    Product not found or failed to load.
                </div>
            </div>
        );
    }

    // Transform product data to form format
    const initialData = {
        name: product.name || '',
        sku: product.sku || '',
        slug: product.slug || '',
        description: product.description || '',
        categoryId: product.categoryId || '',
        metalType: product.metalType || 'Gold',
        purity: product.purity || '22K',
        occasion: product.occasion || [],
        basePrice: Number(product.basePrice) || 0,
        weight: Number(product.weight) || 0,
        isActive: product.isActive ?? true,
        isFeatured: product.isFeatured ?? false,
        images: product.images?.map((img: any) => ({ url: img.url, type: img.type })) || [],
        variants: product.variants?.map((v: any) => ({
            size: v.size,
            stockQuantity: v.stockQuantity,
            additionalPrice: Number(v.additionalPrice) || 0,
        })) || [],
    };

    return <ProductForm productId={productId} initialData={initialData} />;
}
