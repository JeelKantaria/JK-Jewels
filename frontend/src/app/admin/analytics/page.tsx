'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    TrendingUp,
    ShoppingCart,
    IndianRupee,
    Users,
    Package,
    Calendar,
    ArrowUp,
    ArrowDown,
    Filter
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

export default function AdminAnalyticsPage() {
    const [period, setPeriod] = useState('month');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Fetch dashboard stats for analytics overview
    const { data: dashboardStats } = useQuery({
        queryKey: ['admin', 'dashboard'],
        queryFn: async () => {
            const response = await api.get('/admin/dashboard');
            return response.data.data;
        },
    });

    const { data: analyticsOverview } = useQuery({
        queryKey: ['admin', 'analytics', 'overview'],
        queryFn: async () => {
            const response = await api.get('/admin/analytics/overview');
            return response.data.data;
        },
    });

    const { data: analyticsComparison } = useQuery({
        queryKey: ['admin', 'analytics', 'comparison', period, fromDate, toDate],
        queryFn: async () => {
            let url = `/admin/analytics/comparison`;
            if (period === 'custom' && fromDate && toDate) {
                url += `?from=${fromDate}&to=${toDate}`;
            } else {
                url += `?period=${period}`;
            }
            const response = await api.get(url);
            return response.data.data;
        },
    });

    // Use filtered totals if available, otherwise fallback to dashboard stats (all time)
    // Actually, dashboard stats are "All Time", but our filtered panels should show "Selected Period" totals.
    // So if comparison data is loaded, use it.
    const displayStats = analyticsComparison?.totals || {
        revenue: 0,
        orders: 0,
        customers: 0,
    };

    // We still need totalProducts from dashboardStats as it's not time-bound
    const totalProducts = dashboardStats?.totalProducts || 0;

    const monthlyData = analyticsOverview?.monthlyData || [];
    const statusBreakdown = analyticsOverview?.statusBreakdown || [];

    // Calculate max revenue and max orders for chart scaling
    const maxRevenue = monthlyData.length > 0
        ? Math.max(...monthlyData.map((d: any) => d.revenue))
        : 10000;
    const maxOrders = monthlyData.length > 0
        ? Math.max(...monthlyData.map((d: any) => d.orders))
        : 100;

    const renderTrend = (value: number | undefined) => {
        if (value === undefined) return null;
        const isPositive = value >= 0;
        return (
            <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                {Math.abs(value)}%
            </div>
        );
    };

    const periods = [
        { label: 'Today', value: 'day' },
        { label: 'This Week', value: 'week' },
        { label: 'This Month', value: 'month' },
        { label: 'This Quarter', value: 'quarter' },
        { label: 'This Year', value: 'year' },
        { label: 'Custom Range', value: 'custom' },
    ];

    return (
        <div className="p-8">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                    <p className="text-gray-500 mt-1">Overview of your store performance</p>
                </div>

                {/* Period Filter */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                        <Filter size={16} className="text-gray-500 ml-2" />
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer outline-none"
                        >
                            {periods.map((p) => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    </div>

                    {period === 'custom' && (
                        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                            <Calendar size={16} className="text-gray-500" />
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="bg-transparent border-none text-sm text-gray-700 outline-none"
                                max={toDate || undefined}
                            />
                            <span className="text-gray-400">to</span>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="bg-transparent border-none text-sm text-gray-700 outline-none"
                                min={fromDate || undefined}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div className="p-3 bg-primary-100 rounded-lg">
                            <IndianRupee className="text-primary-600" size={24} />
                        </div>
                        {renderTrend(analyticsComparison?.growth?.revenue)}
                    </div>
                    <p className="mt-4 text-2xl font-bold text-gray-900">
                        {formatPrice(displayStats.revenue)}
                    </p>
                    <p className="text-sm text-gray-500">Revenue</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div className="p-3 bg-emerald-100 rounded-lg">
                            <ShoppingCart className="text-emerald-600" size={24} />
                        </div>
                        {renderTrend(analyticsComparison?.growth?.orders)}
                    </div>
                    <p className="mt-4 text-2xl font-bold text-gray-900">
                        {displayStats.orders}
                    </p>
                    <p className="text-sm text-gray-500">Orders</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div className="p-3 bg-accent-100 rounded-lg">
                            <Users className="text-accent-700" size={24} />
                        </div>
                        {renderTrend(analyticsComparison?.growth?.customers)}
                    </div>
                    <p className="mt-4 text-2xl font-bold text-gray-900">
                        {displayStats.customers}
                    </p>
                    <p className="text-sm text-gray-500">New Customers</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div className="p-3 bg-sky-100 rounded-lg">
                            <Package className="text-sky-600" size={24} />
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                            Live
                        </div>
                    </div>
                    <p className="mt-4 text-2xl font-bold text-gray-900">
                        {totalProducts}
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
                        {monthlyData.length > 0 ? monthlyData.map((data: any) => (
                            <div key={data.month} className="flex-1 flex flex-col items-center">
                                <div className="w-full relative group h-full flex items-end">
                                    <div
                                        className="w-full bg-primary-500 rounded-t-lg transition-all hover:bg-primary-600"
                                        style={{
                                            height: `${Math.max((data.revenue / maxRevenue) * 100, 2)}%` // Min 2% height for visibility
                                        }}
                                    />
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs p-2 rounded whitespace-nowrap z-10">
                                        {formatPrice(data.revenue)}
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-gray-500">{data.month}</p>
                            </div>
                        )) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No data available
                            </div>
                        )}
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
                        {monthlyData.length > 0 ? monthlyData.map((data: any) => (
                            <div key={data.month} className="flex-1 flex flex-col items-center">
                                <div className="w-full relative group h-full flex items-end">
                                    <div
                                        className="w-full bg-emerald-500 rounded-t-lg transition-all hover:bg-emerald-600"
                                        style={{
                                            height: `${Math.max((data.orders / maxOrders) * 100, 2)}%`
                                        }}
                                    />
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs p-2 rounded whitespace-nowrap z-10">
                                        {data.orders} orders
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-gray-500">{data.month}</p>
                            </div>
                        )) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No data available
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Additional Stats */}
            <div className="mt-6 grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Order Status Distribution</h3>
                    <div className="space-y-3">
                        {statusBreakdown.length > 0 ? (
                            statusBreakdown.map((status: any) => (
                                <div key={status.status} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${status.status === 'PENDING' ? 'bg-amber-500' :
                                            status.status === 'CONFIRMED' ? 'bg-blue-500' :
                                                status.status === 'DELIVERED' ? 'bg-emerald-500' :
                                                    status.status === 'CANCELLED' ? 'bg-red-500' :
                                                        'bg-gray-500'
                                            }`} />
                                        <span className="text-sm text-gray-600 capitalized">{status.status}</span>
                                    </div>
                                    <span className="font-medium">{status.count}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500">No orders yet</p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Average Order Value</h3>
                    <p className="text-3xl font-bold text-gray-900">
                        {displayStats.orders > 0
                            ? formatPrice(displayStats.revenue / displayStats.orders)
                            : formatPrice(0)}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">Per order</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Conversion Rate</h3>
                    <div className="flex flex-col h-full justify-between">
                        <div>
                            <p className="text-3xl font-bold text-gray-900">—</p>
                            <p className="text-sm text-gray-500 mt-2">Requires visitor tracking</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
