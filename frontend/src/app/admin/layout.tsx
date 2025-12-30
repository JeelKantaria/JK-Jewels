'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    MessageSquare,
    BarChart3,
    Settings,
    LogOut,
    ChevronLeft,
    Warehouse
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';

const adminNavItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/inventory', label: 'Inventory', icon: Warehouse },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/admin/customers', label: 'Customers', icon: Users },
    { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, isLoading } = useAuthStore();

    // Redirect non-admin users
    useEffect(() => {
        if (!isLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
            router.push('/login?redirect=/admin');
        }
    }, [isAuthenticated, user, isLoading, router]);

    // Show loading while checking auth
    if (isLoading || !isAuthenticated || user?.role !== 'ADMIN') {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-600">Verifying admin access...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-secondary-900 text-cream-100 flex flex-col fixed h-full">
                {/* Logo / Brand */}
                <div className="p-6 border-b border-secondary-700">
                    <Link href="/" className="flex items-center gap-2 text-sm text-cream-400 hover:text-cream-100 mb-3">
                        <ChevronLeft size={16} />
                        Back to Store
                    </Link>
                    <h1 className="font-heading text-xl text-primary-400">J.K. Jewels</h1>
                    <p className="text-xs text-cream-500 mt-1">Admin Panel</p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                    <ul className="space-y-1">
                        {adminNavItems.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== '/admin' && pathname.startsWith(item.href));
                            const Icon = item.icon;

                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${isActive
                                            ? 'bg-primary-600 text-secondary-900 font-medium'
                                            : 'text-cream-300 hover:bg-secondary-800 hover:text-cream-100'
                                            }`}
                                    >
                                        <Icon size={18} />
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* User Info / Logout */}
                <div className="p-4 border-t border-secondary-700">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-secondary-900 font-medium">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.name}</p>
                            <p className="text-xs text-cream-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            // Logout logic
                            useAuthStore.getState().logout();
                            router.push('/');
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-cream-400 
                                 hover:text-cream-100 hover:bg-secondary-800 rounded-lg transition-colors"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64">
                {children}
            </main>
        </div>
    );
}
