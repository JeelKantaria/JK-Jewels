'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Plus, X, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface ProductFormData {
    name: string;
    sku: string;
    slug: string;
    description: string;
    categoryId: string;
    metalType: string;
    purity: string;
    basePrice: number;
    weight: number;
    isActive: boolean;
    isFeatured: boolean;
    images: { url: string; type: string }[];
    variants: { size: string; stockQuantity: number; additionalPrice: number }[];
}

interface ProductFormProps {
    productId?: string;
    initialData?: ProductFormData;
}

const defaultFormData: ProductFormData = {
    name: '',
    sku: '',
    slug: '',
    description: '',
    categoryId: '',
    metalType: 'Gold',
    purity: '22K',
    basePrice: 0,
    weight: 0,
    isActive: true,
    isFeatured: false,
    images: [],
    variants: [],
};

export default function ProductForm({ productId, initialData }: ProductFormProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const isEditing = !!productId;

    const [formData, setFormData] = useState<ProductFormData>(initialData || defaultFormData);
    const [newImageUrl, setNewImageUrl] = useState('');
    const [newVariant, setNewVariant] = useState({ size: '', stockQuantity: 0, additionalPrice: 0 });

    // Fetch categories
    const { data: categoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get('/categories');
            return response.data.data;
        },
    });

    const categories = categoriesData || [];

    // Generate slug from name
    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    // Update slug when name changes
    useEffect(() => {
        if (!isEditing && formData.name) {
            setFormData(prev => ({ ...prev, slug: generateSlug(prev.name) }));
        }
    }, [formData.name, isEditing]);

    // Create/Update mutation
    const saveMutation = useMutation({
        mutationFn: async (data: ProductFormData) => {
            if (isEditing) {
                return api.put(`/admin/products/${productId}`, data);
            } else {
                return api.post('/admin/products', data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
            toast.success(isEditing ? 'Product updated!' : 'Product created!');
            router.push('/admin/products');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to save product');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.sku || !formData.categoryId) {
            toast.error('Please fill in all required fields');
            return;
        }
        saveMutation.mutate(formData);
    };

    const addImage = () => {
        if (newImageUrl.trim()) {
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, { url: newImageUrl.trim(), type: prev.images.length === 0 ? 'thumbnail' : 'gallery' }],
            }));
            setNewImageUrl('');
        }
    };

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    const addVariant = () => {
        if (newVariant.size.trim()) {
            setFormData(prev => ({
                ...prev,
                variants: [...prev.variants, { ...newVariant }],
            }));
            setNewVariant({ size: '', stockQuantity: 0, additionalPrice: 0 });
        }
    };

    const removeVariant = (index: number) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== index),
        }));
    };

    return (
        <div className="p-8 max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/products" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEditing ? 'Edit Product' : 'Add New Product'}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {isEditing ? 'Update product details' : 'Create a new product listing'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Basic Information</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Product Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                SKU *
                            </label>
                            <input
                                type="text"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                URL Slug
                            </label>
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                placeholder="Enter product description..."
                            />
                        </div>
                    </div>
                </div>

                {/* Category & Attributes */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Category & Attributes</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category *
                            </label>
                            <select
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                required
                            >
                                <option value="">Select category</option>
                                {categories.map((cat: any) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Metal Type
                            </label>
                            <select
                                value={formData.metalType}
                                onChange={(e) => setFormData({ ...formData, metalType: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                            >
                                <option value="Gold">Gold</option>
                                <option value="Silver">Silver</option>
                                <option value="Platinum">Platinum</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Purity
                            </label>
                            <select
                                value={formData.purity}
                                onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                            >
                                <option value="24K">24K</option>
                                <option value="22K">22K</option>
                                <option value="18K">18K</option>
                                <option value="14K">14K</option>
                                <option value="925">925 Sterling</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Weight (grams)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.weight}
                                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Pricing</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Base Price (₹) *
                            </label>
                            <input
                                type="number"
                                value={formData.basePrice}
                                onChange={(e) => setFormData({ ...formData, basePrice: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                required
                            />
                        </div>
                        <div className="flex items-end gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-5 h-5 text-primary-600 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">Active</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isFeatured}
                                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                                    className="w-5 h-5 text-primary-600 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">Featured</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Images */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Product Images</h2>
                    <div className="flex gap-2 mb-4">
                        <input
                            type="url"
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                            placeholder="Paste image URL"
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                        />
                        <button
                            type="button"
                            onClick={addImage}
                            className="px-4 py-2 bg-secondary-900 text-white rounded-lg hover:bg-secondary-800 transition-colors"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                    {formData.images.length > 0 ? (
                        <div className="grid grid-cols-4 gap-4">
                            {formData.images.map((img, index) => (
                                <div key={index} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="p-2 bg-red-500 text-white rounded-full"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    {index === 0 && (
                                        <span className="absolute top-2 left-2 px-2 py-1 bg-primary-500 text-white text-xs rounded">
                                            Thumbnail
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-center py-8">No images added yet</p>
                    )}
                </div>

                {/* Variants */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Size Variants</h2>
                    <div className="grid grid-cols-12 gap-2 mb-4">
                        <div className="col-span-5">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Size</label>
                            <input
                                type="text"
                                value={newVariant.size}
                                onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
                                placeholder="e.g., 16, 17, S, M, L"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div className="col-span-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Stock Quantity</label>
                            <input
                                type="number"
                                value={newVariant.stockQuantity}
                                onChange={(e) => setNewVariant({ ...newVariant, stockQuantity: parseInt(e.target.value) || 0 })}
                                placeholder="0"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div className="col-span-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Extra Charge (₹)</label>
                            <input
                                type="number"
                                value={newVariant.additionalPrice}
                                onChange={(e) => setNewVariant({ ...newVariant, additionalPrice: parseInt(e.target.value) || 0 })}
                                placeholder="0"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div className="col-span-1 flex items-end">
                            <button
                                type="button"
                                onClick={addVariant}
                                className="w-full px-4 py-2 bg-secondary-900 text-white rounded-lg hover:bg-secondary-800 transition-colors"
                            >
                                <Plus size={18} className="mx-auto" />
                            </button>
                        </div>
                    </div>
                    {formData.variants.length > 0 ? (
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Size</th>
                                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Stock</th>
                                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Extra Price</th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {formData.variants.map((variant, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2">{variant.size}</td>
                                        <td className="px-4 py-2">{variant.stockQuantity}</td>
                                        <td className="px-4 py-2">₹{variant.additionalPrice}</td>
                                        <td className="px-4 py-2">
                                            <button
                                                type="button"
                                                onClick={() => removeVariant(index)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-gray-400 text-center py-4">No variants added yet</p>
                    )}
                </div>

                {/* Submit */}
                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={saveMutation.isPending}
                        className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                        <Save size={18} />
                        {saveMutation.isPending ? 'Saving...' : (isEditing ? 'Update Product' : 'Create Product')}
                    </button>
                    <Link
                        href="/admin/products"
                        className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}
