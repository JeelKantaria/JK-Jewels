'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuthStore();
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const loginForm = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const registerForm = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const handleLogin = async (data: LoginFormData) => {
        setIsLoading(true);
        try {
            const response = await authApi.login(data);
            const { user, accessToken, refreshToken } = response.data.data;
            login(user, accessToken, refreshToken);
            toast.success('Welcome back!');
            router.push('/');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (data: RegisterFormData) => {
        setIsLoading(true);
        try {
            const response = await authApi.register({
                name: data.name,
                email: data.email,
                password: data.password,
            });
            const { user, accessToken, refreshToken } = response.data.data;
            login(user, accessToken, refreshToken);
            toast.success('Welcome to J.K. Jewels!');
            router.push('/');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-cream-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <span className="font-heading text-3xl font-bold text-secondary-900">
                            <span className="text-primary-500">J.K.</span> Jewels
                        </span>
                    </Link>
                </div>

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-8 shadow-luxury"
                >
                    {/* Tabs */}
                    <div className="flex mb-8">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 pb-3 text-center font-medium transition-colors border-b-2 ${isLogin
                                    ? 'border-primary-500 text-secondary-900'
                                    : 'border-transparent text-secondary-400 hover:text-secondary-600'
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 pb-3 text-center font-medium transition-colors border-b-2 ${!isLogin
                                    ? 'border-primary-500 text-secondary-900'
                                    : 'border-transparent text-secondary-400 hover:text-secondary-600'
                                }`}
                        >
                            Create Account
                        </button>
                    </div>

                    {isLogin ? (
                        /* Login Form */
                        <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
                                    <input
                                        type="email"
                                        {...loginForm.register('email')}
                                        className="input-luxury pl-10"
                                        placeholder="you@example.com"
                                    />
                                </div>
                                {loginForm.formState.errors.email && (
                                    <p className="text-accent-800 text-sm mt-1">
                                        {loginForm.formState.errors.email.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        {...loginForm.register('password')}
                                        className="input-luxury pl-10 pr-10"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {loginForm.formState.errors.password && (
                                    <p className="text-accent-800 text-sm mt-1">
                                        {loginForm.formState.errors.password.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" className="w-4 h-4 accent-primary-500" />
                                    Remember me
                                </label>
                                <Link href="/forgot-password" className="text-primary-600 hover:text-primary-700">
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-primary disabled:opacity-50"
                            >
                                {isLoading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>
                    ) : (
                        /* Register Form */
                        <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
                                    <input
                                        type="text"
                                        {...registerForm.register('name')}
                                        className="input-luxury pl-10"
                                        placeholder="Your name"
                                    />
                                </div>
                                {registerForm.formState.errors.name && (
                                    <p className="text-accent-800 text-sm mt-1">
                                        {registerForm.formState.errors.name.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
                                    <input
                                        type="email"
                                        {...registerForm.register('email')}
                                        className="input-luxury pl-10"
                                        placeholder="you@example.com"
                                    />
                                </div>
                                {registerForm.formState.errors.email && (
                                    <p className="text-accent-800 text-sm mt-1">
                                        {registerForm.formState.errors.email.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        {...registerForm.register('password')}
                                        className="input-luxury pl-10 pr-10"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {registerForm.formState.errors.password && (
                                    <p className="text-accent-800 text-sm mt-1">
                                        {registerForm.formState.errors.password.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
                                    <input
                                        type="password"
                                        {...registerForm.register('confirmPassword')}
                                        className="input-luxury pl-10"
                                        placeholder="••••••••"
                                    />
                                </div>
                                {registerForm.formState.errors.confirmPassword && (
                                    <p className="text-accent-800 text-sm mt-1">
                                        {registerForm.formState.errors.confirmPassword.message}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-primary disabled:opacity-50"
                            >
                                {isLoading ? 'Creating account...' : 'Create Account'}
                            </button>
                        </form>
                    )}

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-cream-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-secondary-500">or continue with</span>
                        </div>
                    </div>

                    {/* Social Login */}
                    <button
                        type="button"
                        className="w-full flex items-center justify-center gap-3 px-6 py-3 
                     border border-cream-400 hover:border-secondary-900 transition-colors"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>
                </motion.div>

                {/* Footer */}
                <p className="text-center text-sm text-secondary-500 mt-8">
                    By signing in, you agree to our{' '}
                    <Link href="/terms" className="text-primary-600 hover:underline">
                        Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-primary-600 hover:underline">
                        Privacy Policy
                    </Link>
                </p>
            </div>
        </div>
    );
}
