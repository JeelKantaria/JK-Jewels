'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Edit2, Trash2, FolderOpen, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    displayOrder: number;
    isActive: boolean;
    _count: { products: number };
}

export default function AdminCategoriesPage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        image: '',
        displayOrder: 0,
        isActive: true,
    });

    // Fetch categories
    const { data: categories, isLoading } = useQuery<Category[]>({
        queryKey: ['admin', 'categories'],
        queryFn: async () => {
            const response = await api.get('/admin/categories');
            return response.data.data;
        },
    });

    // Create category
    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            await api.post('/admin/categories', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
            toast.success('Category created successfully');
            closeModal();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create category');
        },
    });

    // Update category
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
            await api.put(`/admin/categories/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
            toast.success('Category updated successfully');
            closeModal();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update category');
        },
    });

    // Delete category
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/admin/categories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
            toast.success('Category deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete category');
        },
    });

    const openModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                slug: category.slug,
                description: category.description || '',
                image: category.image || '',
                displayOrder: category.displayOrder,
                isActive: category.isActive,
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                slug: '',
                description: '',
                image: '',
                displayOrder: 0,
                isActive: true,
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory) {
            updateMutation.mutate({ id: editingCategory.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = (category: Category) => {
        if (category._count.products > 0) {
            toast.error(`Cannot delete category with ${category._count.products} products`);
            return;
        }
        if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
            deleteMutation.mutate(category.id);
        }
    };

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
                    <p className="text-gray-500 mt-1">Manage your product categories</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus size={18} />
                    Add Category
                </button>
            </div>

            {/* Categories List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
                    </div>
                ) : !categories?.length ? (
                    <div className="p-8 text-center text-gray-500">
                        <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No categories found. Create your first category!</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Name</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Slug</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Products</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {categories.map((category) => (
                                <tr key={category.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {category.image ? (
                                                <img src={category.image} alt={category.name} className="w-10 h-10 rounded-lg object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <FolderOpen size={20} className="text-gray-400" />
                                                </div>
                                            )}
                                            <span className="font-medium text-gray-900">{category.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{category.slug}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-gray-100 rounded text-sm">{category._count.products}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${category.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {category.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openModal(category)}
                                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category)}
                                                disabled={category._count.products > 0}
                                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-semibold">
                                {editingCategory ? 'Edit Category' : 'Add Category'}
                            </h2>
                            <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                    placeholder="e.g., Nose Rings"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                    placeholder="Auto-generated if empty"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                    rows={3}
                                    placeholder="Category description..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                                <input
                                    type="url"
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                                    <input
                                        type="number"
                                        value={formData.displayOrder}
                                        onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2 pt-6">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 text-primary-600 rounded"
                                    />
                                    <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                                >
                                    <Save size={16} />
                                    {editingCategory ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
