'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, User, Lock, Bell, Shield, Save } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
    const router = useRouter();
    const { isAuthenticated, user, updateUser } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
    });

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: '',
            });
        }
    }, [user]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await authApi.updateProfile({
                name: formData.name,
                phone: formData.phone,
            });
            updateUser(response.data.data.user);
            toast.success('Profile updated successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAuthenticated) {
        return null;
    }

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
                    <h1 className="font-heading text-3xl text-secondary-900">Settings</h1>
                    <p className="text-secondary-500 mt-1">Manage your account preferences</p>
                </div>

                {/* Settings Sections */}
                <div className="space-y-6">
                    {/* Profile Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white shadow-card"
                    >
                        <div className="px-6 py-4 border-b border-cream-200 flex items-center gap-3">
                            <User size={20} className="text-primary-600" />
                            <h2 className="font-heading text-lg">Profile Information</h2>
                        </div>
                        <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input-luxury"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="input-luxury bg-cream-100 cursor-not-allowed"
                                />
                                <p className="text-xs text-secondary-400 mt-1">
                                    Email cannot be changed
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+91 98765 43210"
                                    className="input-luxury"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Save size={18} />
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </motion.div>

                    {/* Password Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white shadow-card"
                    >
                        <div className="px-6 py-4 border-b border-cream-200 flex items-center gap-3">
                            <Lock size={20} className="text-primary-600" />
                            <h2 className="font-heading text-lg">Password</h2>
                        </div>
                        <div className="p-6">
                            <p className="text-secondary-600 mb-4">
                                Change your password to keep your account secure.
                            </p>
                            <button className="btn-secondary">
                                Change Password
                            </button>
                        </div>
                    </motion.div>

                    {/* Notifications Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white shadow-card"
                    >
                        <div className="px-6 py-4 border-b border-cream-200 flex items-center gap-3">
                            <Bell size={20} className="text-primary-600" />
                            <h2 className="font-heading text-lg">Notifications</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {[
                                { label: 'Order updates', desc: 'Get notified about order status changes' },
                                { label: 'Promotions', desc: 'Receive offers and discount codes' },
                                { label: 'New arrivals', desc: 'Be the first to know about new products' },
                            ].map((item) => (
                                <label key={item.label} className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        defaultChecked
                                        className="w-5 h-5 accent-primary-500 mt-0.5"
                                    />
                                    <div>
                                        <div className="font-medium text-secondary-900">{item.label}</div>
                                        <div className="text-sm text-secondary-500">{item.desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </motion.div>

                    {/* Privacy Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white shadow-card"
                    >
                        <div className="px-6 py-4 border-b border-cream-200 flex items-center gap-3">
                            <Shield size={20} className="text-primary-600" />
                            <h2 className="font-heading text-lg">Privacy & Data</h2>
                        </div>
                        <div className="p-6">
                            <p className="text-secondary-600 mb-4">
                                We take your privacy seriously. You can request to download or delete your data.
                            </p>
                            <div className="flex gap-3">
                                <button className="btn-secondary text-sm">
                                    Download My Data
                                </button>
                                <button className="text-accent-800 hover:text-accent-900 text-sm font-medium">
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
