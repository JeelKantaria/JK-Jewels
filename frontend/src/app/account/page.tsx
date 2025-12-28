'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, Package, Heart, MapPin, Settings, LogOut, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { ordersApi, authApi } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

export default function AccountPage() {
    const router = useRouter();
    const { isAuthenticated, user, logout } = useAuthStore();

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    // Fetch recent orders
    const { data: ordersData } = useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const response = await ordersApi.getOrders({ limit: 3 });
            return response.data.data;
        },
        enabled: isAuthenticated,
    });

    const handleLogout = () => {
        logout();
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        toast.success('Logged out successfully');
        router.push('/');
    };

    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-cream-100 flex items-center justify-center">
                <div className="animate-pulse text-secondary-400">Loading...</div>
            </div>
        );
    }

    const menuItems = [
        { icon: Package, label: 'My Orders', href: '/account/orders', description: 'View your order history' },
        { icon: Heart, label: 'Wishlist', href: '/wishlist', description: 'Your favourite pieces' },
        { icon: MapPin, label: 'Addresses', href: '/account/addresses', description: 'Manage shipping addresses' },
        { icon: Settings, label: 'Settings', href: '/account/settings', description: 'Account preferences' },
    ];

    return (
        <div className="min-h-screen bg-cream-100 py-12">
            <div className="container-luxury">
                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <aside className="lg:col-span-1">
                        <div className="bg-white p-6 shadow-card">
                            {/* User Info */}
                            <div className="text-center mb-6 pb-6 border-b border-cream-200">
                                <div className="w-20 h-20 bg-primary-100 rounded-full 
                                              flex items-center justify-center mx-auto mb-4">
                                    <User size={32} className="text-primary-600" />
                                </div>
                                <h2 className="font-heading text-xl text-secondary-900">
                                    {user.name}
                                </h2>
                                <p className="text-secondary-500 text-sm">{user.email}</p>
                            </div>

                            {/* Menu */}
                            <nav className="space-y-2">
                                {menuItems.map((item) => (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className="flex items-center gap-3 p-3 text-secondary-700
                                                 hover:bg-cream-100 transition-colors group"
                                    >
                                        <item.icon size={20} className="text-secondary-400 
                                                                        group-hover:text-primary-600" />
                                        <span className="group-hover:text-secondary-900">
                                            {item.label}
                                        </span>
                                    </Link>
                                ))}
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 p-3 text-accent-800
                                             hover:bg-accent-50 transition-colors w-full"
                                >
                                    <LogOut size={20} />
                                    <span>Logout</span>
                                </button>
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Welcome Banner */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-secondary-900 text-cream-100 p-8"
                        >
                            <h1 className="font-heading text-2xl md:text-3xl mb-2">
                                Welcome back, {user.name.split(' ')[0]}!
                            </h1>
                            <p className="text-cream-400">
                                Manage your orders, wishlist, and account settings.
                            </p>
                        </motion.div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Orders', value: ordersData?.orders?.length || 0 },
                                { label: 'Wishlist', value: '—' },
                                { label: 'Reviews', value: '—' },
                                { label: 'Rewards', value: '0 pts' },
                            ].map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white p-4 text-center shadow-card"
                                >
                                    <div className="text-2xl font-bold text-secondary-900">
                                        {stat.value}
                                    </div>
                                    <div className="text-sm text-secondary-500">{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Recent Orders */}
                        <div className="bg-white shadow-card">
                            <div className="flex items-center justify-between p-6 border-b border-cream-200">
                                <h3 className="font-heading text-xl text-secondary-900">
                                    Recent Orders
                                </h3>
                                <Link
                                    href="/account/orders"
                                    className="text-primary-600 hover:text-primary-700 text-sm 
                                             flex items-center gap-1"
                                >
                                    View All <ChevronRight size={16} />
                                </Link>
                            </div>

                            {ordersData?.orders?.length > 0 ? (
                                <div className="divide-y divide-cream-200">
                                    {ordersData.orders.slice(0, 3).map((order: any) => (
                                        <Link
                                            key={order.id}
                                            href={`/account/orders/${order.orderNumber}`}
                                            className="flex items-center justify-between p-6 
                                                     hover:bg-cream-50 transition-colors"
                                        >
                                            <div>
                                                <div className="font-medium text-secondary-900">
                                                    Order #{order.orderNumber}
                                                </div>
                                                <div className="text-sm text-secondary-500">
                                                    {formatDate(order.createdAt)} • {order.items?.length || 0} items
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-secondary-900">
                                                    {formatPrice(order.total)}
                                                </div>
                                                <div className={`text-xs px-2 py-1 inline-block ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                                        order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                                                            order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                                                                'bg-cream-200 text-secondary-600'
                                                    }`}>
                                                    {order.status}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <Package size={40} className="mx-auto text-cream-400 mb-4" />
                                    <p className="text-secondary-500 mb-4">No orders yet</p>
                                    <Link href="/shop" className="btn-primary">
                                        Start Shopping
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="grid md:grid-cols-2 gap-4">
                            {menuItems.slice(0, 2).map((item, index) => (
                                <motion.div
                                    key={item.label}
                                    initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    <Link
                                        href={item.href}
                                        className="flex items-center gap-4 bg-white p-6 shadow-card
                                                 hover:shadow-luxury transition-shadow group"
                                    >
                                        <div className="w-12 h-12 bg-cream-100 flex items-center justify-center
                                                      group-hover:bg-primary-100 transition-colors">
                                            <item.icon className="text-secondary-400 
                                                                 group-hover:text-primary-600 transition-colors" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-secondary-900">
                                                {item.label}
                                            </div>
                                            <div className="text-sm text-secondary-500">
                                                {item.description}
                                            </div>
                                        </div>
                                        <ChevronRight className="ml-auto text-cream-400 
                                                               group-hover:text-primary-600 transition-colors" />
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
