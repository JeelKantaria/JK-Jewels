'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';
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
                    const user = response.data.data.user;
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

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                {children}
            </AuthProvider>
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
