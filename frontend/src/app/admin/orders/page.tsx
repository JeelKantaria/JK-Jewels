'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ShoppingCart, Eye, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';

const ORDER_STATUSES = [
    { value: 'ALL', label: 'All Orders', color: 'bg-gray-100 text-gray-700' },
    { value: 'PENDING', label: 'Pending', color: 'bg-amber-100 text-amber-700' },
    { value: 'CONFIRMED', label: 'Confirmed', color: 'bg-blue-100 text-blue-700' },
    { value: 'PROCESSING', label: 'Processing', color: 'bg-indigo-100 text-indigo-700' },
    { value: 'SHIPPED', label: 'Shipped', color: 'bg-purple-100 text-purple-700' },
    { value: 'DELIVERED', label: 'Delivered', color: 'bg-green-100 text-green-700' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-700' },
];

export default function AdminOrdersPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('ALL');
    const [page, setPage] = useState(1);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

    // Fetch orders
    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'orders', { page, search, status }],
        queryFn: async () => {
            const response = await api.get('/admin/orders', {
                params: {
                    page,
                    limit: 20,
                    search: search || undefined,
                    status: status !== 'ALL' ? status : undefined,
                },
            });
            return response.data.data;
        },
    });

    // Update order status
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
            await api.put(`/admin/orders/${id}/status`, { status: newStatus });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
            toast.success('Order status updated');
        },
        onError: () => {
            toast.error('Failed to update order');
        },
    });

    const orders = data?.orders || [];
    const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

    const getStatusColor = (orderStatus: string) => {
        return ORDER_STATUSES.find((s) => s.value === orderStatus)?.color || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                <p className="text-gray-500 mt-1">{pagination.total} orders total</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search by order number, name, or email..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex flex-wrap gap-2">
                        {ORDER_STATUSES.map((s) => (
                            <button
                                key={s.value}
                                onClick={() => {
                                    setStatus(s.value);
                                    setPage(1);
                                }}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${status === s.value
                                        ? 'bg-secondary-900 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
                        <ShoppingCart size={48} className="mx-auto mb-4" />
                        <p>No orders found</p>
                    </div>
                ) : (
                    orders.map((order: any) => (
                        <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                            {/* Order Header */}
                            <div
                                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                                            <p className="text-sm text-gray-500">
                                                {order.user?.name || order.guestName}
                                                {order.guestEmail && ` (Guest)`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">
                                                {formatPrice(Number(order.totalAmount))}
                                            </p>
                                            <p className="text-sm text-gray-500">{order.items?.length} items</p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                                        </div>

                                        {/* Status Dropdown */}
                                        <div className="relative">
                                            <select
                                                value={order.status}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    updateStatusMutation.mutate({
                                                        id: order.id,
                                                        newStatus: e.target.value,
                                                    });
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                className={`appearance-none px-3 py-1.5 pr-8 rounded-lg text-sm font-medium cursor-pointer ${getStatusColor(order.status)}`}
                                            >
                                                {ORDER_STATUSES.filter((s) => s.value !== 'ALL').map((s) => (
                                                    <option key={s.value} value={s.value}>
                                                        {s.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown
                                                size={14}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedOrder === order.id && (
                                <div className="border-t border-gray-100 p-6 bg-gray-50">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Order Items */}
                                        <div>
                                            <h3 className="font-medium text-gray-900 mb-3">Order Items</h3>
                                            <div className="space-y-3">
                                                {order.items?.map((item: any) => (
                                                    <div key={item.id} className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-gray-200 rounded" />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium">{item.productName}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {item.size && `Size: ${item.size} • `}
                                                                Qty: {item.quantity}
                                                            </p>
                                                        </div>
                                                        <p className="text-sm font-medium">
                                                            {formatPrice(Number(item.totalPrice))}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Shipping Address */}
                                        <div>
                                            <h3 className="font-medium text-gray-900 mb-3">Shipping Address</h3>
                                            {order.shippingAddress ? (
                                                <div className="text-sm text-gray-600">
                                                    <p className="font-medium">{order.shippingAddress.name}</p>
                                                    <p>{order.shippingAddress.addressLine1}</p>
                                                    {order.shippingAddress.addressLine2 && (
                                                        <p>{order.shippingAddress.addressLine2}</p>
                                                    )}
                                                    <p>
                                                        {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                                                        {order.shippingAddress.pincode}
                                                    </p>
                                                    <p>{order.shippingAddress.phone}</p>
                                                </div>
                                            ) : order.guestAddressLine1 ? (
                                                <div className="text-sm text-gray-600">
                                                    <p className="font-medium">{order.guestName}</p>
                                                    <p>{order.guestAddressLine1}</p>
                                                    {order.guestAddressLine2 && <p>{order.guestAddressLine2}</p>}
                                                    <p>
                                                        {order.guestCity}, {order.guestState} {order.guestPincode}
                                                    </p>
                                                    <p>{order.guestPhone}</p>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-400">No address available</p>
                                            )}

                                            {/* Order Summary */}
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <div className="space-y-1 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Subtotal</span>
                                                        <span>{formatPrice(Number(order.subtotal))}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Tax</span>
                                                        <span>{formatPrice(Number(order.taxAmount))}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Shipping</span>
                                                        <span>{formatPrice(Number(order.shippingAmount))}</span>
                                                    </div>
                                                    {Number(order.discountAmount) > 0 && (
                                                        <div className="flex justify-between text-green-600">
                                                            <span>Discount</span>
                                                            <span>-{formatPrice(Number(order.discountAmount))}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between font-semibold pt-2 border-t">
                                                        <span>Total</span>
                                                        <span>{formatPrice(Number(order.totalAmount))}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {order.customerNotes && (
                                        <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                                            <p className="text-sm font-medium text-amber-800">Customer Notes:</p>
                                            <p className="text-sm text-amber-700">{order.customerNotes}</p>
                                        </div>
                                    )}
                                </div>
                            )}
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
