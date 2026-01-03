import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Brand Colors - Luxury Jewel Tones
                primary: {
                    50: '#fdf9ed',
                    100: '#f9efd2',
                    200: '#f2dca1',
                    300: '#e9c36a',
                    400: '#e2ab3f',
                    500: '#C9A962', // Antique Gold - Main
                    600: '#b8942d',
                    700: '#997027',
                    800: '#7d5926',
                    900: '#684a23',
                    950: '#3c2710',
                },
                secondary: {
                    50: '#f6f6f6',
                    100: '#e7e7e7',
                    200: '#d1d1d1',
                    300: '#b0b0b0',
                    400: '#888888',
                    500: '#6d6d6d',
                    600: '#5d5d5d',
                    700: '#4f4f4f',
                    800: '#454545',
                    900: '#1A1A1A', // Rich Black - Main
                    950: '#0d0d0d',
                },
                accent: {
                    50: '#fdf2f4',
                    100: '#fce7eb',
                    200: '#f9d2da',
                    300: '#f4aebb',
                    400: '#ed7c95',
                    500: '#e15071',
                    600: '#cd305b',
                    700: '#ac234a',
                    800: '#8B2942', // Ruby - Main
                    900: '#78253c',
                    950: '#430f1e',
                },
                cream: {
                    50: '#FEFDFB',
                    100: '#FAF8F5', // Warm Cream - Main
                    200: '#F5F1EB',
                    300: '#EAE3D8',
                    400: '#D9CFC0',
                    500: '#C4B7A4',
                },
                gold: {
                    light: '#F5E6C8',
                    DEFAULT: '#C9A962',
                    dark: '#997027',
                    shimmer: 'linear-gradient(135deg, #C9A962 0%, #F5E6C8 50%, #C9A962 100%)',
                },
            },
            fontFamily: {
                heading: ['var(--font-playfair)', 'Playfair Display', 'serif'],
                body: ['var(--font-inter)', 'Inter', 'sans-serif'],
            },
            boxShadow: {
                'luxury': '0 4px 20px rgba(201, 169, 98, 0.15)',
                'luxury-lg': '0 10px 40px rgba(201, 169, 98, 0.2)',
                'luxury-xl': '0 20px 60px rgba(201, 169, 98, 0.25)',
                'card': '0 2px 12px rgba(0, 0, 0, 0.08)',
                'card-hover': '0 8px 30px rgba(0, 0, 0, 0.12)',
                'glow': '0 0 20px rgba(201, 169, 98, 0.4)',
            },
            backgroundImage: {
                'gold-gradient': 'linear-gradient(135deg, #C9A962 0%, #F5E6C8 50%, #C9A962 100%)',
                'gold-shimmer': 'linear-gradient(90deg, transparent 0%, rgba(201, 169, 98, 0.3) 50%, transparent 100%)',
                'dark-gradient': 'linear-gradient(135deg, #1A1A1A 0%, #2d2d2d 100%)',
                'hero-pattern': 'radial-gradient(circle at 20% 80%, rgba(201, 169, 98, 0.1) 0%, transparent 50%)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'fade-up': 'fadeUp 0.6s ease-out',
                'scale-in': 'scaleIn 0.4s ease-out',
                'shimmer': 'shimmer 2s infinite linear',
                'float': 'float 6s ease-in-out infinite',
                'glow-pulse': 'glowPulse 2s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                glowPulse: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(201, 169, 98, 0.4)' },
                    '50%': { boxShadow: '0 0 40px rgba(201, 169, 98, 0.6)' },
                },
            },
            transitionTimingFunction: {
                'luxury': 'cubic-bezier(0.4, 0, 0.2, 1)',
            },
        },
    },
    plugins: [],
};

export default config;
