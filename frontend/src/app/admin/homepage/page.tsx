'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    Plus,
    Edit2,
    Trash2,
    X,
    Save,
    GripVertical,
    ArrowLeft,
    ArrowRight,
    RefreshCw,
    Gauge,
    Eye,
    EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface Category {
    id: string;
    name: string;
    slug: string;
    image: string | null;
}

interface HomepageRow {
    id: string;
    categoryId: string;
    displayOrder: number;
    isActive: boolean;
    productDisplay: string;
    productCount: number | null;
    scrollDirection: string;
    scrollSpeed: number | null;
    category: Category;
}

interface HomepageSettings {
    id: string;
    globalScrollSpeed: number;
}

interface HomepageData {
    settings: HomepageSettings;
    rows: HomepageRow[];
    availableCategories: Category[];
}

export default function AdminHomepagePage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRow, setEditingRow] = useState<HomepageRow | null>(null);
    const [formData, setFormData] = useState({
        categoryId: '',
        productDisplay: 'all' as 'all' | 'featured' | 'count',
        productCount: 10,
        scrollDirection: 'auto' as 'left' | 'right' | 'auto',
        useCustomSpeed: false,
        scrollSpeed: 30,
    });
    const [globalSpeed, setGlobalSpeed] = useState(30);
    const [draggedId, setDraggedId] = useState<string | null>(null);

    // Fetch homepage data
    const { data, isLoading } = useQuery<HomepageData>({
        queryKey: ['admin', 'homepage'],
        queryFn: async () => {
            const response = await api.get('/homepage/admin');
            return response.data.data;
        },
        staleTime: 0,
    });

    // Update local state when data loads
    useEffect(() => {
        if (data) {
            setGlobalSpeed(data.settings.globalScrollSpeed);
        }
    }, [data]);

    // Update global settings
    const updateSettingsMutation = useMutation({
        mutationFn: async (speed: number) => {
            await api.put('/homepage/admin/settings', { globalScrollSpeed: speed });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'homepage'] });
            toast.success('Global speed updated');
        },
        onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to update'),
    });

    // Add row
    const addRowMutation = useMutation({
        mutationFn: async (rowData: typeof formData) => {
            await api.post('/homepage/admin/rows', {
                categoryId: rowData.categoryId,
                productDisplay: rowData.productDisplay,
                productCount: rowData.productDisplay === 'count' ? rowData.productCount : undefined,
                scrollDirection: rowData.scrollDirection,
                scrollSpeed: rowData.useCustomSpeed ? rowData.scrollSpeed : null,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'homepage'] });
            toast.success('Category added to homepage');
            closeModal();
        },
        onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to add'),
    });

    // Update row
    const updateRowMutation = useMutation({
        mutationFn: async ({ id, rowData }: { id: string; rowData: typeof formData & { isActive?: boolean } }) => {
            await api.put(`/homepage/admin/rows/${id}`, {
                productDisplay: rowData.productDisplay,
                productCount: rowData.productDisplay === 'count' ? rowData.productCount : null,
                scrollDirection: rowData.scrollDirection,
                scrollSpeed: rowData.useCustomSpeed ? rowData.scrollSpeed : null,
                isActive: rowData.isActive,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'homepage'] });
            toast.success('Row updated');
            closeModal();
        },
        onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to update'),
    });

    // Delete row
    const deleteRowMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/homepage/admin/rows/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'homepage'] });
            toast.success('Category removed from homepage');
        },
        onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to delete'),
    });

    // Reorder rows
    const reorderMutation = useMutation({
        mutationFn: async (order: { id: string; displayOrder: number }[]) => {
            await api.put('/homepage/admin/rows/reorder', { order });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'homepage'] });
        },
        onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to reorder'),
    });

    // Toggle row visibility
    const toggleRowMutation = useMutation({
        mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
            await api.put(`/homepage/admin/rows/${id}`, { isActive });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'homepage'] });
        },
        onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to toggle'),
    });

    const openModal = (row?: HomepageRow) => {
        if (row) {
            setEditingRow(row);
            setFormData({
                categoryId: row.categoryId,
                productDisplay: row.productDisplay as 'all' | 'featured' | 'count',
                productCount: row.productCount || 10,
                scrollDirection: row.scrollDirection as 'left' | 'right' | 'auto',
                useCustomSpeed: row.scrollSpeed !== null,
                scrollSpeed: row.scrollSpeed || 30,
            });
        } else {
            setEditingRow(null);
            setFormData({
                categoryId: data?.availableCategories[0]?.id || '',
                productDisplay: 'all',
                productCount: 10,
                scrollDirection: 'auto',
                useCustomSpeed: false,
                scrollSpeed: 30,
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRow(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingRow) {
            updateRowMutation.mutate({ id: editingRow.id, rowData: formData });
        } else {
            addRowMutation.mutate(formData);
        }
    };

    const handleDelete = (row: HomepageRow) => {
        if (confirm(`Remove "${row.category.name}" from homepage?`)) {
            deleteRowMutation.mutate(row.id);
        }
    };

    // Drag and drop handlers
    const handleDragStart = (id: string) => {
        setDraggedId(id);
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedId || draggedId === targetId || !data) return;

        const rows = [...data.rows];
        const draggedIndex = rows.findIndex(r => r.id === draggedId);
        const targetIndex = rows.findIndex(r => r.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        // Swap positions
        const [draggedRow] = rows.splice(draggedIndex, 1);
        rows.splice(targetIndex, 0, draggedRow);

        // Update display orders
        const newOrder = rows.map((row, index) => ({
            id: row.id,
            displayOrder: index,
        }));

        reorderMutation.mutate(newOrder);
    };

    const handleDragEnd = () => {
        setDraggedId(null);
    };

    const getDirectionIcon = (direction: string) => {
        if (direction === 'left') return <ArrowLeft size={16} className="text-blue-600" />;
        if (direction === 'right') return <ArrowRight size={16} className="text-green-600" />;
        return <RefreshCw size={16} className="text-gray-500" />;
    };

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Homepage Configuration</h1>
                <p className="text-gray-500 mt-1">Manage auto-scrolling category rows on the homepage</p>
            </div>

            {/* Global Settings */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Gauge size={20} className="text-primary-600" />
                    Global Settings
                </h2>
                <div className="flex items-center gap-4">
                    <label className="text-sm text-gray-600">Default Scroll Speed:</label>
                    <input
                        type="range"
                        min="10"
                        max="60"
                        value={globalSpeed}
                        onChange={(e) => setGlobalSpeed(parseInt(e.target.value))}
                        className="flex-1 max-w-xs h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    <span className="text-sm font-medium text-gray-900 w-20">{globalSpeed} seconds</span>
                    <button
                        onClick={() => updateSettingsMutation.mutate(globalSpeed)}
                        disabled={updateSettingsMutation.isPending || globalSpeed === data?.settings.globalScrollSpeed}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        <Save size={16} />
                        Save
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Time in seconds for one complete loop. Lower = faster scroll.
                </p>
            </div>

            {/* Category Rows */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="font-semibold text-gray-900">Category Rows</h2>
                    <button
                        onClick={() => openModal()}
                        disabled={!data?.availableCategories.length}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Plus size={18} />
                        Add Category
                    </button>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
                    </div>
                ) : !data?.rows.length ? (
                    <div className="p-8 text-center text-gray-500">
                        <p>No categories added to homepage yet</p>
                        <p className="text-sm mt-1">Click "Add Category" to get started</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {data.rows.map((row, index) => (
                            <div
                                key={row.id}
                                draggable
                                onDragStart={() => handleDragStart(row.id)}
                                onDragOver={(e) => handleDragOver(e, row.id)}
                                onDragEnd={handleDragEnd}
                                className={`flex items-center gap-4 p-4 hover:bg-gray-50 cursor-grab active:cursor-grabbing transition-colors ${draggedId === row.id ? 'opacity-50 bg-gray-100' : ''
                                    } ${!row.isActive ? 'opacity-60' : ''}`}
                            >
                                {/* Drag Handle */}
                                <div className="text-gray-400">
                                    <GripVertical size={20} />
                                </div>

                                {/* Row Number */}
                                <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-sm font-medium text-gray-600">
                                    {index + 1}
                                </span>

                                {/* Category Image */}
                                <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                    {row.category.image ? (
                                        <Image
                                            src={row.category.image}
                                            alt={row.category.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                            No img
                                        </div>
                                    )}
                                </div>

                                {/* Category Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-gray-900">{row.category.name}</h3>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                        <span className="flex items-center gap-1">
                                            {getDirectionIcon(row.scrollDirection)}
                                            {row.scrollDirection === 'auto' ? 'Alternating' : row.scrollDirection === 'left' ? 'Left' : 'Right'}
                                        </span>
                                        <span>•</span>
                                        <span>
                                            {row.productDisplay === 'all' ? 'All products' :
                                                row.productDisplay === 'featured' ? 'Featured only' :
                                                    `${row.productCount} products`}
                                        </span>
                                        <span>•</span>
                                        <span>{row.scrollSpeed ?? data.settings.globalScrollSpeed}s</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleRowMutation.mutate({ id: row.id, isActive: !row.isActive })}
                                        className={`p-2 rounded-lg transition-colors ${row.isActive
                                            ? 'text-green-600 hover:bg-green-50'
                                            : 'text-gray-400 hover:bg-gray-100'
                                            }`}
                                        title={row.isActive ? 'Hide from homepage' : 'Show on homepage'}
                                    >
                                        {row.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                    <button
                                        onClick={() => openModal(row)}
                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(row)}
                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Info Banner */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> Drag and drop rows to reorder. Categories scroll horizontally in alternating directions
                    (Row 1: left, Row 2: right, etc.) when set to "Alternating" mode.
                </p>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-semibold">
                                {editingRow ? 'Edit Row Settings' : 'Add Category to Homepage'}
                            </h2>
                            <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Category Select (only for new) */}
                            {!editingRow && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                    <select
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                        required
                                    >
                                        {data?.availableCategories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Product Display */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Products to Display</label>
                                <div className="flex gap-3">
                                    {[
                                        { value: 'all', label: 'All Products' },
                                        { value: 'featured', label: 'Featured Only' },
                                        { value: 'count', label: 'Specific Count' },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, productDisplay: option.value as any })}
                                            className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${formData.productDisplay === option.value
                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                                {formData.productDisplay === 'count' && (
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={formData.productCount}
                                        onChange={(e) => setFormData({ ...formData, productCount: parseInt(e.target.value) || 10 })}
                                        className="mt-3 w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                        placeholder="Number of products"
                                    />
                                )}
                            </div>

                            {/* Scroll Direction */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Scroll Direction</label>
                                <div className="flex gap-3">
                                    {[
                                        { value: 'auto', label: 'Alternating', icon: RefreshCw },
                                        { value: 'left', label: 'Left', icon: ArrowLeft },
                                        { value: 'right', label: 'Right', icon: ArrowRight },
                                    ].map((option) => {
                                        const Icon = option.icon;
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, scrollDirection: option.value as any })}
                                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${formData.scrollDirection === option.value
                                                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                    }`}
                                            >
                                                <Icon size={16} />
                                                {option.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Custom Speed */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        type="checkbox"
                                        id="useCustomSpeed"
                                        checked={formData.useCustomSpeed}
                                        onChange={(e) => setFormData({ ...formData, useCustomSpeed: e.target.checked })}
                                        className="w-4 h-4 text-primary-600 rounded"
                                    />
                                    <label htmlFor="useCustomSpeed" className="text-sm font-medium text-gray-700">
                                        Use custom scroll speed
                                    </label>
                                </div>
                                {formData.useCustomSpeed && (
                                    <div className="flex items-center gap-3 mt-2">
                                        <input
                                            type="range"
                                            min="10"
                                            max="60"
                                            value={formData.scrollSpeed}
                                            onChange={(e) => setFormData({ ...formData, scrollSpeed: parseInt(e.target.value) })}
                                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                        />
                                        <span className="text-sm font-medium text-gray-900 w-20">
                                            {formData.scrollSpeed} seconds
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addRowMutation.isPending || updateRowMutation.isPending}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                                >
                                    <Save size={16} />
                                    {editingRow ? 'Update' : 'Add'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
