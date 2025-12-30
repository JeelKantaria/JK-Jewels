'use client';

import { useQuery } from '@tanstack/react-query';
import {
    Package,
    ShoppingCart,
    Users,
    IndianRupee,
    Clock,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

interface DashboardStats {
    totalOrders: number;
    totalRevenue: number;
    totalProducts: number;
    totalCustomers: number;
    pendingOrders: number;
    recentOrders: any[];
    recentMessages: any[];
}

export default function AdminDashboard() {
    // Fetch dashboard stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['admin', 'dashboard'],
        queryFn: async () => {
            const response = await api.get('/admin/dashboard');
            return response.data.data as DashboardStats;
        },
    });

    // Fetch analytics comparison for trends
    const { data: trends, isLoading: trendsLoading } = useQuery({
        queryKey: ['admin', 'analytics', 'comparison'],
        queryFn: async () => {
            const response = await api.get('/admin/analytics/comparison');
            return response.data.data;
        },
    });

    const isLoading = statsLoading || trendsLoading;

    if (isLoading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 w-48 bg-gray-200 rounded" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Fallback stats if API not yet implemented
    const displayStats = stats || {
        totalOrders: 0,
        totalRevenue: 0,
        totalProducts: 0,
        totalCustomers: 0,
        pendingOrders: 0,
        recentOrders: [],
        recentMessages: [],
    };

    const formatTrend = (value: number | undefined) => {
        if (value === undefined) return { value: '0%', isUp: true };
        const isUp = value >= 0;
        return {
            value: `${Math.abs(value)}%`,
            isUp
        };
    };

    const revenueTrend = formatTrend(trends?.revenueGrowth);
    const ordersTrend = formatTrend(trends?.orderGrowth);
    const customersTrend = formatTrend(trends?.customerGrowth);

    const statCards = [
        {
            title: 'Total Revenue',
            value: formatPrice(displayStats.totalRevenue),
            icon: IndianRupee,
            trend: revenueTrend.value,
            trendUp: revenueTrend.isUp,
            color: 'bg-primary-500', // Gold
        },
        {
            title: 'Total Orders',
            value: displayStats.totalOrders.toString(),
            icon: ShoppingCart,
            trend: ordersTrend.value,
            trendUp: ordersTrend.isUp,
            color: 'bg-emerald-600', // Emerald
        },
        {
            title: 'Total Products',
            value: displayStats.totalProducts.toString(),
            icon: Package,
            trend: '—', // No trend for products currently
            trendUp: true,
            color: 'bg-sky-600', // Sapphire
        },
        {
            title: 'Total Customers',
            value: displayStats.totalCustomers.toString(),
            icon: Users,
            trend: customersTrend.value,
            trendUp: customersTrend.isUp,
            color: 'bg-accent-700', // Ruby
        },
    ];

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">Welcome to the admin panel</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.title} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                </div>
                                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                                    <Icon size={20} />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                {stat.trend !== '—' && (
                                    <>
                                        {stat.trendUp ? (
                                            <ArrowUpRight size={16} className="text-green-500 mr-1" />
                                        ) : (
                                            <ArrowDownRight size={16} className="text-red-500 mr-1" />
                                        )}
                                        <span className={stat.trendUp ? 'text-green-500' : 'text-red-500'}>
                                            {stat.trend}
                                        </span>
                                        <span className="text-gray-400 ml-2">vs last month</span>
                                    </>
                                )}
                                {stat.trend === '—' && (
                                    <span className="text-gray-400">Total active items</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pending Orders Alert */}
            {displayStats.pendingOrders > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Clock className="text-amber-600" size={24} />
                        <div>
                            <p className="font-medium text-amber-900">
                                {displayStats.pendingOrders} Pending Order{displayStats.pendingOrders > 1 ? 's' : ''}
                            </p>
                            <p className="text-sm text-amber-700">Awaiting confirmation</p>
                        </div>
                    </div>
                    <Link
                        href="/admin/orders?status=PENDING"
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
                    >
                        View Orders
                    </Link>
                </div>
            )}

            {/* Recent Activity Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="bg-white rounded-xl shadow-sm">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900">Recent Orders</h2>
                        <Link href="/admin/orders" className="text-sm text-primary-600 hover:underline">
                            View all
                        </Link>
                    </div>
                    <div className="p-6">
                        {displayStats.recentOrders.length > 0 ? (
                            <div className="space-y-4">
                                {displayStats.recentOrders.slice(0, 5).map((order: any) => (
                                    <div key={order.orderNumber} className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="font-medium text-gray-900">{order.orderNumber}</p>
                                            <p className="text-sm text-gray-500">{order.user?.name || order.guestName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">{formatPrice(Number(order.totalAmount))}</p>
                                            <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                                order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <ShoppingCart size={32} className="mx-auto mb-2" />
                                <p>No orders yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Messages */}
                <div className="bg-white rounded-xl shadow-sm">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900">Recent Messages</h2>
                        <Link href="/admin/messages" className="text-sm text-primary-600 hover:underline">
                            View all
                        </Link>
                    </div>
                    <div className="p-6">
                        {displayStats.recentMessages.length > 0 ? (
                            <div className="space-y-4">
                                {displayStats.recentMessages.slice(0, 5).map((msg: any) => (
                                    <div key={msg.id} className="flex items-start gap-3 py-2">
                                        <div className={`w-2 h-2 rounded-full mt-2 ${msg.isRead ? 'bg-gray-300' : 'bg-primary-500'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{msg.subject}</p>
                                            <p className="text-sm text-gray-500 truncate">{msg.name} - {msg.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <AlertCircle size={32} className="mx-auto mb-2" />
                                <p>No messages yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
