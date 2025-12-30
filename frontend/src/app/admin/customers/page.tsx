'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, Mail, Phone, ShoppingCart } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function AdminCustomersPage() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'customers', { page, search }],
        queryFn: async () => {
            const response = await api.get('/admin/customers', {
                params: { page, limit: 20, search: search || undefined },
            });
            return response.data.data;
        },
    });

    const customers = data?.customers || [];
    const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                <p className="text-gray-500 mt-1">{pagination.total} registered customers</p>
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
                        placeholder="Search by name or email..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                    />
                </div>
            </div>

            {/* Customers Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    [...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                            <div className="h-10 w-10 bg-gray-200 rounded-full mb-4" />
                            <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                            <div className="h-3 w-48 bg-gray-200 rounded" />
                        </div>
                    ))
                ) : customers.length === 0 ? (
                    <div className="col-span-full bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
                        <Users size={48} className="mx-auto mb-4" />
                        <p>No customers found</p>
                    </div>
                ) : (
                    customers.map((customer: any) => (
                        <div key={customer.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-lg">
                                    {customer.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">{customer.name}</h3>
                                    <div className="mt-2 space-y-1">
                                        <p className="text-sm text-gray-500 flex items-center gap-2 truncate">
                                            <Mail size={14} />
                                            {customer.email}
                                        </p>
                                        {customer.phone && (
                                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                                <Phone size={14} />
                                                {customer.phone}
                                            </p>
                                        )}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-sm text-gray-500">
                                            <ShoppingCart size={14} />
                                            {customer._count?.orders || 0} orders
                                        </div>
                                        <p className="text-xs text-gray-400">
                                            Joined {formatDate(customer.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Page {pagination.page} of {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(page + 1)}
                            disabled={page >= pagination.totalPages}
                            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
