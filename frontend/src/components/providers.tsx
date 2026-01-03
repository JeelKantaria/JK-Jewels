'use client';

import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { useAuthStore, useCartStore } from '@/lib/store';
import { authApi, cartApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { getErrorMessage, isNetworkError } from '@/lib/errors';
import { ErrorBoundary } from '@/components/error-boundary';
import Cookies from 'js-cookie';

function AuthProvider({ children }: { children: React.ReactNode }) {
    const { login, logout, setLoading } = useAuthStore();

    useEffect(() => {
        const initAuth = async () => {
            const accessToken = Cookies.get('accessToken');
            const refreshToken = Cookies.get('refreshToken');

            if (accessToken) {
                try {
                    const response = await authApi.getMe();
                    // API returns user directly in data, not data.user
                    const user = response.data.data;
                    login(user, accessToken, refreshToken || '');
                } catch (error) {
                    // Token invalid, clear cookies
                    Cookies.remove('accessToken');
                    Cookies.remove('refreshToken');
                    logout();
                }
            } else {
                setLoading(false);
            }
        };

        initAuth();
    }, [login, logout, setLoading]);

    return <>{children}</>;
}

export function CartSync() {
    const { isAuthenticated } = useAuthStore();
    const { setCart } = useCartStore();
    const { data: cartData } = useQuery({
        queryKey: ['cart'],
        queryFn: async () => {
            const response = await cartApi.getCart();
            return response.data.data;
        },
        enabled: isAuthenticated,
        staleTime: 0, // Always fetch fresh data on mount/invalidation
    });

    useEffect(() => {
        if (cartData) {
            setCart(cartData);
        }
    }, [cartData, setCart]);

    return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        refetchOnWindowFocus: false,
                        retry: (failureCount, error) => {
                            // Don't retry on network errors or 4xx errors
                            if (isNetworkError(error)) return false;
                            // Retry up to 2 times for other errors
                            return failureCount < 2;
                        },
                        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
                    },
                    mutations: {
                        retry: false, // Don't retry mutations automatically
                    },
                },
                // Global mutation error handler
                mutationCache: new MutationCache({
                    onError: (error, _variables, _context, mutation) => {
                        // Only show toast if mutation doesn't have its own onError handler
                        if (!mutation.options.onError) {
                            const message = getErrorMessage(error);
                            toast.error(message);
                        }
                    },
                }),
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <ErrorBoundary>
                <AuthProvider>
                    <CartSync />
                    {children}
                </AuthProvider>
            </ErrorBoundary>
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#1A1A1A',
                        color: '#FAF8F5',
                        borderRadius: '0',
                        padding: '16px 24px',
                        fontFamily: 'var(--font-inter)',
                    },
                    success: {
                        iconTheme: {
                            primary: '#C9A962',
                            secondary: '#1A1A1A',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#8B2942',
                            secondary: '#FAF8F5',
                        },
                    },
                }}
            />
        </QueryClientProvider>
    );
}
