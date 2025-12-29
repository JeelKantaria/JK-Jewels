'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
    Package, ChevronLeft, Truck, MapPin, CreditCard, Clock,
    CheckCircle, XCircle, Loader2, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { formatPrice, formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

const statusSteps = [
    { key: 'PENDING', label: 'Order Placed', icon: Clock },
    { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle },
    { key: 'PROCESSING', label: 'Processing', icon: Package },
    { key: 'SHIPPED', label: 'Shipped', icon: Truck },
    { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
];

function getStatusIndex(status: string): number {
    if (status === 'CANCELLED') return -1;
    const index = statusSteps.findIndex(s => s.key === status);
    return index >= 0 ? index : 0;
}

export default function OrderDetailPage() {
    const router = useRouter();
    const params = useParams();
    const orderNumber = params.orderNumber as string;
    const queryClient = useQueryClient();
    const { isAuthenticated, isLoading: authLoading } = useAuthStore();

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, authLoading, router]);

    const { data: order, isLoading, error } = useQuery({
        queryKey: ['order', orderNumber],
        queryFn: async () => {
            const response = await ordersApi.getOrder(orderNumber);
            return response.data.data;
        },
        enabled: isAuthenticated && !!orderNumber,
    });

    const cancelMutation = useMutation({
        mutationFn: () => ordersApi.cancelOrder(orderNumber),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['order', orderNumber] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            toast.success('Order cancelled successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to cancel order');
        },
    });

    if (authLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen bg-cream-100 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-cream-100 py-12">
                <div className="container-luxury max-w-4xl">
                    <div className="animate-pulse">
                        <div className="h-4 bg-cream-200 w-32 mb-4" />
                        <div className="h-8 bg-cream-200 w-64 mb-8" />
                        <div className="bg-white p-6 space-y-4">
                            <div className="h-20 bg-cream-100" />
                            <div className="h-20 bg-cream-100" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-cream-100 py-12">
                <div className="container-luxury max-w-4xl text-center py-20">
                    <AlertCircle size={48} className="mx-auto text-accent-700 mb-4" />
                    <h1 className="font-heading text-2xl text-secondary-900 mb-4">Order Not Found</h1>
                    <p className="text-secondary-600 mb-8">
                        We couldn't find an order with number "{orderNumber}".
                    </p>
                    <Link href="/account/orders" className="btn-primary">
                        Back to Orders
                    </Link>
                </div>
            </div>
        );
    }

    const statusIndex = getStatusIndex(order.status);
    const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status);

    return (
        <div className="min-h-screen bg-cream-100 py-12">
            <div className="container-luxury max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/account/orders"
                        className="text-secondary-500 hover:text-secondary-700 flex items-center gap-1 mb-4"
                    >
                        <ChevronLeft size={18} /> Back to Orders
                    </Link>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="font-heading text-3xl text-secondary-900">
                                Order #{order.orderNumber}
                            </h1>
                            <p className="text-secondary-500 mt-1">
                                Placed on {formatDateTime(order.createdAt)}
                            </p>
                        </div>
                        <span className={`text-sm px-4 py-2 font-medium ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                            order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                        'bg-cream-200 text-secondary-600'
                            }`}>
                            {order.status}
                        </span>
                    </div>
                </div>

                {/* Status Timeline */}
                {order.status !== 'CANCELLED' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white shadow-card p-6 mb-6"
                    >
                        <h2 className="font-heading text-lg text-secondary-900 mb-6">Order Status</h2>
                        <div className="flex justify-between relative">
                            {/* Progress line */}
                            <div className="absolute top-5 left-0 right-0 h-0.5 bg-cream-200" />
                            <div
                                className="absolute top-5 left-0 h-0.5 bg-primary-500 transition-all"
                                style={{ width: `${(statusIndex / (statusSteps.length - 1)) * 100}%` }}
                            />

                            {statusSteps.map((step, index) => {
                                const Icon = step.icon;
                                const isActive = index <= statusIndex;
                                const isCurrent = index === statusIndex;

                                return (
                                    <div key={step.key} className="flex flex-col items-center relative z-10">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive
                                            ? 'bg-primary-500 text-white'
                                            : 'bg-cream-200 text-secondary-400'
                                            } ${isCurrent ? 'ring-4 ring-primary-100' : ''}`}>
                                            <Icon size={18} />
                                        </div>
                                        <span className={`text-xs mt-2 text-center ${isActive ? 'text-secondary-900 font-medium' : 'text-secondary-400'
                                            }`}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Cancelled Notice */}
                {order.status === 'CANCELLED' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 p-6 mb-6 flex items-center gap-4"
                    >
                        <XCircle size={24} className="text-red-600" />
                        <div>
                            <p className="font-medium text-red-800">This order has been cancelled</p>
                            <p className="text-sm text-red-600 mt-1">
                                Refund will be processed within 5-7 business days if payment was made.
                            </p>
                        </div>
                    </motion.div>
                )}

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Order Items */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-2 bg-white shadow-card"
                    >
                        <div className="p-6 border-b border-cream-200">
                            <h2 className="font-heading text-lg text-secondary-900">
                                Items ({order.items?.length || 0})
                            </h2>
                        </div>
                        <div className="divide-y divide-cream-200">
                            {order.items?.map((item: any) => (
                                <div key={item.id} className="p-6 flex gap-4">
                                    <div className="w-20 h-20 relative bg-cream-100 flex-shrink-0">
                                        <Image
                                            src={item.product?.images?.[0]?.url || '/placeholder.jpg'}
                                            alt={item.productName}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Link
                                            href={`/products/${item.product?.slug || '#'}`}
                                            className="font-medium text-secondary-900 hover:text-primary-600"
                                        >
                                            {item.productName}
                                        </Link>
                                        {item.size && (
                                            <p className="text-sm text-secondary-500">
                                                Size: {item.size}
                                            </p>
                                        )}
                                        <p className="text-sm text-secondary-500">
                                            Qty: {item.quantity}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-secondary-900">
                                            {formatPrice(Number(item.totalPrice) || 0)}
                                        </p>
                                        <p className="text-sm text-secondary-500">
                                            {formatPrice(Number(item.unitPrice) || 0)} each
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Order Summary & Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-6"
                    >
                        {/* Order Summary */}
                        <div className="bg-white shadow-card p-6">
                            <h2 className="font-heading text-lg text-secondary-900 mb-4">Summary</h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-secondary-600">Subtotal</span>
                                    <span>{formatPrice(Number(order.subtotal) || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary-600">Tax</span>
                                    <span>{formatPrice(Number(order.taxAmount) || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary-600">Shipping</span>
                                    <span>{Number(order.shippingAmount) > 0 ? formatPrice(Number(order.shippingAmount)) : 'Free'}</span>
                                </div>
                                {Number(order.discountAmount) > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount {order.promoCode && <span className="text-xs">({order.promoCode})</span>}</span>
                                        <span>-{formatPrice(Number(order.discountAmount))}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-semibold text-base pt-3 border-t border-cream-200">
                                    <span>Total</span>
                                    <span>{formatPrice(Number(order.totalAmount) || 0)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-white shadow-card p-6">
                            <h2 className="font-heading text-lg text-secondary-900 mb-4 flex items-center gap-2">
                                <MapPin size={18} className="text-primary-600" />
                                Shipping Address
                            </h2>
                            {order.shippingAddress ? (
                                <div className="text-sm text-secondary-600">
                                    <p className="font-medium text-secondary-900">{order.shippingAddress.name}</p>
                                    <p>{order.shippingAddress.addressLine1}</p>
                                    {order.shippingAddress.addressLine2 && (
                                        <p>{order.shippingAddress.addressLine2}</p>
                                    )}
                                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                                    <p className="mt-2">Phone: {order.shippingAddress.phone}</p>
                                </div>
                            ) : (
                                <p className="text-secondary-500 text-sm">Address not available</p>
                            )}
                        </div>

                        {/* Payment Info */}
                        <div className="bg-white shadow-card p-6">
                            <h2 className="font-heading text-lg text-secondary-900 mb-4 flex items-center gap-2">
                                <CreditCard size={18} className="text-primary-600" />
                                Payment
                            </h2>
                            <div className="text-sm">
                                <div className="flex justify-between mb-2">
                                    <span className="text-secondary-600">Method</span>
                                    <span className="text-secondary-900">{order.paymentMethod || 'COD'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary-600">Status</span>
                                    <span className={order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-secondary-500'}>
                                        {order.paymentStatus || 'Pending'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Cancel Button */}
                        {canCancel && (
                            <button
                                onClick={() => {
                                    if (confirm('Are you sure you want to cancel this order?')) {
                                        cancelMutation.mutate();
                                    }
                                }}
                                disabled={cancelMutation.isPending}
                                className="w-full py-3 border border-accent-700 text-accent-700 hover:bg-accent-50 
                                         transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {cancelMutation.isPending ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Cancelling...
                                    </>
                                ) : (
                                    <>
                                        <XCircle size={18} />
                                        Cancel Order
                                    </>
                                )}
                            </button>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
