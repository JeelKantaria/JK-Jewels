'use client';

import { useQuery } from '@tanstack/react-query';
import {
    TrendingUp,
    ShoppingCart,
    IndianRupee,
    Users,
    Package,
    Calendar,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

export default function AdminAnalyticsPage() {
    // Fetch dashboard stats for analytics overview
    const { data: stats, isLoading } = useQuery({
        queryKey: ['admin', 'dashboard'],
        queryFn: async () => {
            const response = await api.get('/admin/dashboard');
            return response.data.data;
        },
    });

    if (isLoading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 w-48 bg-gray-200 rounded" />
                    <div className="grid grid-cols-2 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-64 bg-gray-200 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const displayStats = stats || {
        totalOrders: 0,
        totalRevenue: 0,
        totalProducts: 0,
        totalCustomers: 0,
        pendingOrders: 0,
    };

    // Mock analytics data (in a real app, this would come from the API)
    const monthlyData = [
        { month: 'Jan', orders: 45, revenue: 125000 },
        { month: 'Feb', orders: 52, revenue: 148000 },
        { month: 'Mar', orders: 48, revenue: 135000 },
        { month: 'Apr', orders: 61, revenue: 172000 },
        { month: 'May', orders: 55, revenue: 155000 },
        { month: 'Jun', orders: 67, revenue: 189000 },
    ];

    const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-500 mt-1">Overview of your store performance</p>
            </div>

            {/* Key Metrics */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div className="p-3 bg-primary-100 rounded-lg">
                            <IndianRupee className="text-primary-600" size={24} />
                        </div>
                        <div className="flex items-center gap-1 text-emerald-600 text-sm">
                            <ArrowUp size={16} />
                            12.5%
                        </div>
                    </div>
                    <p className="mt-4 text-2xl font-bold text-gray-900">
                        {formatPrice(displayStats.totalRevenue)}
                    </p>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div className="p-3 bg-emerald-100 rounded-lg">
                            <ShoppingCart className="text-emerald-600" size={24} />
                        </div>
                        <div className="flex items-center gap-1 text-emerald-600 text-sm">
                            <ArrowUp size={16} />
                            8.2%
                        </div>
                    </div>
                    <p className="mt-4 text-2xl font-bold text-gray-900">
                        {displayStats.totalOrders}
                    </p>
                    <p className="text-sm text-gray-500">Total Orders</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div className="p-3 bg-accent-100 rounded-lg">
                            <Users className="text-accent-700" size={24} />
                        </div>
                        <div className="flex items-center gap-1 text-emerald-600 text-sm">
                            <ArrowUp size={16} />
                            5.1%
                        </div>
                    </div>
                    <p className="mt-4 text-2xl font-bold text-gray-900">
                        {displayStats.totalCustomers}
                    </p>
                    <p className="text-sm text-gray-500">Total Customers</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div className="p-3 bg-sky-100 rounded-lg">
                            <Package className="text-sky-600" size={24} />
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                            —
                        </div>
                    </div>
                    <p className="mt-4 text-2xl font-bold text-gray-900">
                        {displayStats.totalProducts}
                    </p>
                    <p className="text-sm text-gray-500">Active Products</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-semibold text-gray-900">Revenue Overview</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar size={16} />
                            Last 6 months
                        </div>
                    </div>
                    <div className="h-64 flex items-end justify-between gap-4">
                        {monthlyData.map((data) => (
                            <div key={data.month} className="flex-1 flex flex-col items-center">
                                <div
                                    className="w-full bg-primary-500 rounded-t-lg transition-all hover:bg-primary-600"
                                    style={{ height: `${(data.revenue / maxRevenue) * 200}px` }}
                                />
                                <p className="mt-2 text-xs text-gray-500">{data.month}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Orders Chart */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-semibold text-gray-900">Orders Overview</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar size={16} />
                            Last 6 months
                        </div>
                    </div>
                    <div className="h-64 flex items-end justify-between gap-4">
                        {monthlyData.map((data) => (
                            <div key={data.month} className="flex-1 flex flex-col items-center">
                                <div
                                    className="w-full bg-emerald-500 rounded-t-lg transition-all hover:bg-emerald-600"
                                    style={{ height: `${(data.orders / 70) * 200}px` }}
                                />
                                <p className="mt-2 text-xs text-gray-500">{data.month}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Additional Stats */}
            <div className="mt-6 grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Order Status Distribution</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-primary-500" />
                                <span className="text-sm text-gray-600">Pending</span>
                            </div>
                            <span className="font-medium">{displayStats.pendingOrders}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-sky-500" />
                                <span className="text-sm text-gray-600">Processing</span>
                            </div>
                            <span className="font-medium">-</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-sm text-gray-600">Delivered</span>
                            </div>
                            <span className="font-medium">-</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Average Order Value</h3>
                    <p className="text-3xl font-bold text-gray-900">
                        {displayStats.totalOrders > 0
                            ? formatPrice(displayStats.totalRevenue / displayStats.totalOrders)
                            : formatPrice(0)}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">Per order</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Conversion Rate</h3>
                    <p className="text-3xl font-bold text-gray-900">3.2%</p>
                    <p className="text-sm text-gray-500 mt-2">Visitors to customers</p>
                </div>
            </div>
        </div>
    );
}
