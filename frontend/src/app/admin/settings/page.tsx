'use client';

import { useState } from 'react';
import { Save, Store, Bell, Shield, Palette } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState({
        storeName: 'J.K. Jewels',
        storeEmail: 'info@jkjewels.com',
        storePhone: '+91 98765 43210',
        taxRate: '3',
        freeShippingThreshold: '10000',
        emailNotifications: true,
        orderNotifications: true,
        lowStockAlerts: true,
    });

    const handleSave = () => {
        // In a real app, this would call an API
        toast.success('Settings saved successfully');
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500 mt-1">Manage your store configuration</p>
            </div>

            <div className="max-w-3xl space-y-6">
                {/* Store Information */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary-100 rounded-lg">
                            <Store className="text-primary-600" size={20} />
                        </div>
                        <h2 className="font-semibold text-gray-900">Store Information</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Store Name
                            </label>
                            <input
                                type="text"
                                value={settings.storeName}
                                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Store Email
                                </label>
                                <input
                                    type="email"
                                    value={settings.storeEmail}
                                    onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Store Phone
                                </label>
                                <input
                                    type="tel"
                                    value={settings.storePhone}
                                    onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing & Shipping */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Shield className="text-green-600" size={20} />
                        </div>
                        <h2 className="font-semibold text-gray-900">Pricing & Shipping</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tax Rate (%)
                            </label>
                            <input
                                type="number"
                                value={settings.taxRate}
                                onChange={(e) => setSettings({ ...settings, taxRate: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Free Shipping Threshold (₹)
                            </label>
                            <input
                                type="number"
                                value={settings.freeShippingThreshold}
                                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Bell className="text-blue-600" size={20} />
                        </div>
                        <h2 className="font-semibold text-gray-900">Notifications</h2>
                    </div>
                    <div className="space-y-4">
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <p className="font-medium text-gray-900">Email Notifications</p>
                                <p className="text-sm text-gray-500">Receive email for important updates</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.emailNotifications}
                                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                            />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <p className="font-medium text-gray-900">Order Notifications</p>
                                <p className="text-sm text-gray-500">Get notified for new orders</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.orderNotifications}
                                onChange={(e) => setSettings({ ...settings, orderNotifications: e.target.checked })}
                                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                            />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <p className="font-medium text-gray-900">Low Stock Alerts</p>
                                <p className="text-sm text-gray-500">Alert when product stock is low</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.lowStockAlerts}
                                onChange={(e) => setSettings({ ...settings, lowStockAlerts: e.target.checked })}
                                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                            />
                        </label>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Save size={18} />
                    Save Settings
                </button>
            </div>
        </div>
    );
}
