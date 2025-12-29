import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(price);
}

export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(date));
}

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
}

export function truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.slice(0, length) + '...';
}

export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// Format number to Indian notation with ₹ symbol (e.g., 2000000 → ₹20,00,000)
export function formatIndianNumber(num: number | string): string {
    const n = typeof num === 'string' ? parseInt(num) || 0 : num;
    if (n === 0) return '₹0';

    // Use Indian locale formatting
    return '₹' + n.toLocaleString('en-IN');
}

// Parse Indian formatted string back to number (e.g., ₹20,00,000 → 2000000)
export function parseIndianNumber(str: string): number {
    // Remove ₹ symbol, commas, and spaces, then parse
    const cleaned = str.replace(/[₹,\s]/g, '');
    return parseInt(cleaned) || 0;
}
