'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Plus, Trash2, Edit2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function AddressesPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    // Placeholder addresses - would come from API
    const addresses: any[] = [];

    return (
        <div className="min-h-screen bg-cream-100 py-12">
            <div className="container-luxury max-w-2xl">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/account"
                        className="text-secondary-500 hover:text-secondary-700 flex items-center gap-1 mb-4"
                    >
                        <ChevronLeft size={18} /> Back to Account
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="font-heading text-3xl text-secondary-900">Addresses</h1>
                            <p className="text-secondary-500 mt-1">Manage your shipping addresses</p>
                        </div>
                        <button className="btn-primary flex items-center gap-2">
                            <Plus size={18} /> Add New
                        </button>
                    </div>
                </div>

                {/* Addresses List */}
                {addresses.length > 0 ? (
                    <div className="space-y-4">
                        {addresses.map((address, index) => (
                            <motion.div
                                key={address.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white shadow-card p-6"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-medium text-secondary-900">
                                            {address.label}
                                        </h3>
                                        <p className="text-secondary-600 mt-1">
                                            {address.street}<br />
                                            {address.city}, {address.state} {address.postalCode}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2 text-secondary-400 hover:text-primary-600">
                                            <Edit2 size={18} />
                                        </button>
                                        <button className="p-2 text-secondary-400 hover:text-accent-800">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white shadow-card p-12 text-center">
                        <MapPin size={48} className="mx-auto text-cream-400 mb-4" />
                        <h3 className="font-heading text-xl text-secondary-900 mb-2">
                            No Addresses Saved
                        </h3>
                        <p className="text-secondary-500 mb-6">
                            Add your shipping address for faster checkout.
                        </p>
                        <button className="btn-primary flex items-center gap-2 mx-auto">
                            <Plus size={18} /> Add Address
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
