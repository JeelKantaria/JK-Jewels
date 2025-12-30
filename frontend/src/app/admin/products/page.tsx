'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Package, Edit, Trash2, Eye, ToggleLeft, ToggleRight, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    // Fetch products
    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'products', { page, search }],
        queryFn: async () => {
            const response = await api.get('/admin/products', {
                params: { page, limit: 20, search: search || undefined },
            });
            return response.data.data;
        },
    });

    // Toggle product active status
    const toggleMutation = useMutation({
        mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
            await api.put(`/admin/products/${id}`, { isActive });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
            toast.success('Product status updated');
        },
        onError: () => {
            toast.error('Failed to update product');
        },
    });

    // Delete product
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/admin/products/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
            toast.success('Product deleted');
        },
        onError: () => {
            toast.error('Failed to delete product');
        },
    });

    const products = data?.products || [];
    const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                    <p className="text-gray-500 mt-1">{pagination.total} products total</p>
                </div>
                <Link
                    href="/admin/products/new"
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus size={18} />
                    Add Product
                </Link>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Search by name or SKU..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                    />
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <Package size={48} className="mx-auto mb-4" />
                        <p>No products found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        SKU
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {products.map((product: any) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-gray-100">
                                                    {product.images?.[0]?.url ? (
                                                        <Image
                                                            src={product.images[0].url}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <Package className="w-6 h-6 text-gray-400 absolute inset-0 m-auto" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 truncate max-w-[200px]">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {product.metalType} - {product.purity}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{product.sku}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{product.category?.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium text-right">
                                            {formatPrice(Number(product.basePrice))}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => toggleMutation.mutate({ id: product.id, isActive: !product.isActive })}
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${product.isActive
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-gray-100 text-gray-500'
                                                    }`}
                                            >
                                                {product.isActive ? (
                                                    <>
                                                        <ToggleRight size={14} />
                                                        Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <ToggleLeft size={14} />
                                                        Inactive
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/products/${product.slug}`}
                                                    target="_blank"
                                                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                                    title="View on site"
                                                >
                                                    <Eye size={16} />
                                                </Link>
                                                <Link
                                                    href={`/admin/products/${product.id}`}
                                                    className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Delete this product?')) {
                                                            deleteMutation.mutate(product.id);
                                                        }
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Page {pagination.page} of {pagination.totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(page - 1)}
                                disabled={page === 1}
                                className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(page + 1)}
                                disabled={page >= pagination.totalPages}
                                className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
