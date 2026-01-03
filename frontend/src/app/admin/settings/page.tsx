'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Edit2, Trash2, X, Save, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

interface SettingItem {
    id: string;
    name: string;
    displayOrder: number;
    isActive: boolean;
    metalType?: string; // Only for Purity
}

type SettingType = 'metal-types' | 'purities' | 'occasions';

const settingConfigs = {
    'metal-types': { title: 'Metal Types', singular: 'Metal Type', hasMetal: false },
    'purities': { title: 'Purity Levels', singular: 'Purity', hasMetal: true },
    'occasions': { title: 'Occasions', singular: 'Occasion', hasMetal: false },
};

export default function AdminSettingsPage() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<SettingType>('metal-types');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<SettingItem | null>(null);
    const [formData, setFormData] = useState({ name: '', displayOrder: 0, isActive: true, metalType: '' });

    const config = settingConfigs[activeTab];

    // Fetch items
    const { data: items, isLoading } = useQuery<SettingItem[]>({
        queryKey: ['admin', activeTab],
        queryFn: async () => {
            const response = await api.get(`/admin/${activeTab}`);
            return response.data.data;
        },
    });

    // Create
    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            await api.post(`/admin/${activeTab}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', activeTab] });
            toast.success(`${config.singular} created`);
            closeModal();
        },
        onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to create'),
    });

    // Update
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
            await api.put(`/admin/${activeTab}/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', activeTab] });
            toast.success(`${config.singular} updated`);
            closeModal();
        },
        onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to update'),
    });

    // Delete
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/admin/${activeTab}/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', activeTab] });
            toast.success(`${config.singular} deleted`);
        },
        onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to delete'),
    });

    const openModal = (item?: SettingItem) => {
        if (item) {
            setEditingItem(item);
            setFormData({ name: item.name, displayOrder: item.displayOrder, isActive: item.isActive, metalType: item.metalType || '' });
        } else {
            setEditingItem(null);
            setFormData({ name: '', displayOrder: 0, isActive: true, metalType: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = (item: SettingItem) => {
        if (confirm(`Delete "${item.name}"?`)) {
            deleteMutation.mutate(item.id);
        }
    };

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Product Settings</h1>
                <p className="text-gray-500 mt-1">Manage metal types, purity levels, and occasions</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {(Object.keys(settingConfigs) as SettingType[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab
                                ? 'bg-secondary-900 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {settingConfigs[tab].title}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="font-semibold text-gray-900">{config.title}</h2>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <Plus size={18} />
                        Add {config.singular}
                    </button>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
                    </div>
                ) : !items?.length ? (
                    <div className="p-8 text-center text-gray-500">
                        <Settings size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No {config.title.toLowerCase()} found</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Name</th>
                                {config.hasMetal && <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Metal</th>}
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Order</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {items.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                                    {config.hasMetal && <td className="px-6 py-4 text-gray-600">{item.metalType || '-'}</td>}
                                    <td className="px-6 py-4 text-gray-600">{item.displayOrder}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {item.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => openModal(item)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(item)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-semibold">{editingItem ? 'Edit' : 'Add'} {config.singular}</h2>
                            <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                    required
                                />
                            </div>
                            {config.hasMetal && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Metal Type</label>
                                    <input
                                        type="text"
                                        value={formData.metalType}
                                        onChange={(e) => setFormData({ ...formData, metalType: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                        placeholder="e.g., Gold"
                                    />
                                </div>
                            )}
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
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                                >
                                    <Save size={16} />
                                    {editingItem ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
