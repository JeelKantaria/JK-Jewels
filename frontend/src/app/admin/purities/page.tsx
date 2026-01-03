'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Edit2, Trash2, X, Save, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface Purity {
    id: string;
    name: string;
    metalType: string | null;
    displayOrder: number;
    isActive: boolean;
}

export default function AdminPuritiesPage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Purity | null>(null);
    const [formData, setFormData] = useState({ name: '', metalType: '', displayOrder: 0, isActive: true });

    const { data: items, isLoading } = useQuery<Purity[]>({
        queryKey: ['admin', 'purities'],
        queryFn: async () => (await api.get('/admin/purities')).data.data,
    });

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => api.post('/admin/purities', data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'purities'] }); toast.success('Purity created'); closeModal(); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => api.put(`/admin/purities/${id}`, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'purities'] }); toast.success('Purity updated'); closeModal(); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => api.delete(`/admin/purities/${id}`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'purities'] }); toast.success('Deleted'); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
    });

    const openModal = (item?: Purity) => {
        setEditingItem(item || null);
        setFormData(item ? { name: item.name, metalType: item.metalType || '', displayOrder: item.displayOrder, isActive: item.isActive } : { name: '', metalType: '', displayOrder: 0, isActive: true });
        setIsModalOpen(true);
    };
    const closeModal = () => { setIsModalOpen(false); setEditingItem(null); };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        editingItem ? updateMutation.mutate({ id: editingItem.id, data: formData }) : createMutation.mutate(formData);
    };

    return (
        <div className="p-6 lg:p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Purity Levels</h1>
                    <p className="text-gray-500 mt-1">Manage purity levels (22K, 18K, 925, etc.)</p>
                </div>
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                    <Plus size={18} /> Add Purity
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" /></div>
                ) : !items?.length ? (
                    <div className="p-8 text-center text-gray-500"><Shield size={48} className="mx-auto mb-4 opacity-50" /><p>No purities found</p></div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b"><tr>
                            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Name</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Metal Type</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Order</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
                        </tr></thead>
                        <tbody className="divide-y">
                            {items.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{item.metalType || '-'}</td>
                                    <td className="px-6 py-4 text-gray-600">{item.displayOrder}</td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{item.isActive ? 'Active' : 'Inactive'}</span></td>
                                    <td className="px-6 py-4"><div className="flex gap-2">
                                        <button onClick={() => openModal(item)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                                        <button onClick={() => confirm('Delete?') && deleteMutation.mutate(item.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-semibold">{editingItem ? 'Edit' : 'Add'} Purity</h2>
                            <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" required placeholder="e.g., 22K" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Metal Type</label>
                                <input type="text" value={formData.metalType} onChange={(e) => setFormData({ ...formData, metalType: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" placeholder="e.g., Gold" /></div>
                            <div className="flex gap-4">
                                <div className="flex-1"><label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                                    <input type="number" value={formData.displayOrder} onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" /></div>
                                <div className="flex items-center gap-2 pt-6">
                                    <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4" />
                                    <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                                    <Save size={16} /> {editingItem ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
