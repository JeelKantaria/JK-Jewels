'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Package, AlertTriangle, XCircle, Search, Save, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface ProductVariant {
    id: string;
    size: string;
    stockQuantity: number;
    additionalPrice: string;
    product: {
        id: string;
        name: string;
        sku: string;
        basePrice: string;
        images: { url: string }[];
    };
}

interface InventoryData {
    variants: ProductVariant[];
    stats: {
        outOfStockCount: number;
        lowStockCount: number;
        lowStockThreshold: number;
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export default function InventoryPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'low-stock' | 'out-of-stock'>('all');
    const [page, setPage] = useState(1);
    const [editingStock, setEditingStock] = useState<Record<string, number>>({});

    // Fetch inventory
    const { data, isLoading, error } = useQuery<InventoryData>({
        queryKey: ['admin', 'inventory', { search, filter, page }],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', '20');
            if (search) params.append('search', search);
            if (filter !== 'all') params.append('filter', filter);
            const response = await api.get(`/admin/inventory?${params}`);
            return response.data.data;
        },
    });

    // Update stock mutation
    const updateStockMutation = useMutation({
        mutationFn: async ({ variantId, stockQuantity }: { variantId: string; stockQuantity: number }) => {
            await api.put(`/admin/inventory/${variantId}`, { stockQuantity });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] });
            toast.success('Stock updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update stock');
        },
    });

    const handleStockChange = (variantId: string, value: number) => {
        setEditingStock(prev => ({ ...prev, [variantId]: value }));
    };

    const handleSaveStock = (variantId: string) => {
        const newStock = editingStock[variantId];
        if (newStock !== undefined && newStock >= 0) {
            updateStockMutation.mutate({ variantId, stockQuantity: newStock });
            setEditingStock(prev => {
                const { [variantId]: _, ...rest } = prev;
                return rest;
            });
        }
    };

    const getStockStatus = (stock: number, threshold: number) => {
        if (stock === 0) return { color: 'text-accent-700 bg-accent-50', label: 'Out of Stock', icon: XCircle };
        if (stock <= threshold) return { color: 'text-primary-600 bg-primary-50', label: 'Low Stock', icon: AlertTriangle };
        return { color: 'text-emerald-600 bg-emerald-50', label: 'In Stock', icon: Package };
    };

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                    Failed to load inventory data.
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
                    <p className="text-gray-500 mt-1">Track and manage your product stock levels</p>
                </div>
                <button
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] })}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    <RefreshCw size={18} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            {data?.stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-emerald-500">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 rounded-xl">
                                <Package className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Variants</p>
                                <p className="text-2xl font-bold text-gray-900">{data.pagination.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-primary-500">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary-100 rounded-xl">
                                <AlertTriangle className="w-6 h-6 text-primary-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Low Stock (≤{data.stats.lowStockThreshold})</p>
                                <p className="text-2xl font-bold text-primary-600">{data.stats.lowStockCount}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-accent-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-accent-100 rounded-xl">
                                <XCircle className="w-6 h-6 text-accent-700" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Out of Stock</p>
                                <p className="text-2xl font-bold text-accent-700">{data.stats.outOfStockCount}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by product name or SKU..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                        />
                    </div>
                    {/* Filter Buttons */}
                    <div className="flex gap-2">
                        {(['all', 'low-stock', 'out-of-stock'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => { setFilter(f); setPage(1); }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                    ? 'bg-secondary-900 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {f === 'all' ? 'All' : f === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
                        <p className="text-gray-500 mt-4">Loading inventory...</p>
                    </div>
                ) : data?.variants.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No inventory items found.
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Product</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">SKU</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Size</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Stock</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data?.variants.map((variant) => {
                                const status = getStockStatus(variant.stockQuantity, data.stats.lowStockThreshold);
                                const StatusIcon = status.icon;
                                const isEditing = editingStock[variant.id] !== undefined;
                                const displayStock = isEditing ? editingStock[variant.id] : variant.stockQuantity;

                                return (
                                    <tr key={variant.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden relative">
                                                    {variant.product.images[0]?.url ? (
                                                        <Image
                                                            src={variant.product.images[0].url}
                                                            alt={variant.product.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <Package size={20} />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="font-medium text-gray-900">{variant.product.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{variant.product.sku}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-gray-100 rounded text-sm">{variant.size}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                                <StatusIcon size={12} />
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                min="0"
                                                value={displayStock}
                                                onChange={(e) => handleStockChange(variant.id, parseInt(e.target.value) || 0)}
                                                className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-center focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            {isEditing && (
                                                <button
                                                    onClick={() => handleSaveStock(variant.id)}
                                                    disabled={updateStockMutation.isPending}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                                                >
                                                    <Save size={14} />
                                                    Save
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {data && data.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                                disabled={page === data.pagination.totalPages}
                                className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
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
