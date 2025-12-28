'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, ChevronLeft, Eye } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';

export default function OrdersPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    const { data: ordersData, isLoading } = useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const response = await ordersApi.getOrders({ limit: 20 });
            return response.data.data;
        },
        enabled: isAuthenticated,
    });

    const orders = ordersData?.orders || [];

    return (
        <div className="min-h-screen bg-cream-100 py-12">
            <div className="container-luxury max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/account"
                        className="text-secondary-500 hover:text-secondary-700 flex items-center gap-1 mb-4"
                    >
                        <ChevronLeft size={18} /> Back to Account
                    </Link>
                    <h1 className="font-heading text-3xl text-secondary-900">My Orders</h1>
                    <p className="text-secondary-500 mt-1">Track and manage your orders</p>
                </div>

                {/* Orders List */}
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white p-6 animate-pulse">
                                <div className="h-4 bg-cream-200 w-1/4 mb-3" />
                                <div className="h-4 bg-cream-200 w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : orders.length > 0 ? (
                    <div className="space-y-4">
                        {orders.map((order: any, index: number) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white shadow-card"
                            >
                                <div className="p-6">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <div className="font-medium text-secondary-900 text-lg">
                                                Order #{order.orderNumber}
                                            </div>
                                            <div className="text-sm text-secondary-500 mt-1">
                                                Placed on {formatDate(order.createdAt)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-secondary-900 text-lg">
                                                {formatPrice(order.total)}
                                            </div>
                                            <span className={`text-xs px-3 py-1 inline-block mt-1 ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                                    order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                                                        order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                                                            order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                                'bg-cream-200 text-secondary-600'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-cream-200">
                                        <div className="text-sm text-secondary-600">
                                            {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-cream-50 border-t border-cream-200">
                                    <Link
                                        href={`/account/orders/${order.orderNumber}`}
                                        className="text-primary-600 hover:text-primary-700 text-sm 
                                                 flex items-center gap-1"
                                    >
                                        <Eye size={16} /> View Details
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white shadow-card p-12 text-center">
                        <Package size={48} className="mx-auto text-cream-400 mb-4" />
                        <h3 className="font-heading text-xl text-secondary-900 mb-2">
                            No Orders Yet
                        </h3>
                        <p className="text-secondary-500 mb-6">
                            When you place an order, it will appear here.
                        </p>
                        <Link href="/shop" className="btn-primary">
                            Start Shopping
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
