'use client';

import { Component, ReactNode } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * React Error Boundary to catch rendering errors and display fallback UI
 * Prevents the entire app from crashing on client-side errors
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // Log error for debugging - can be extended to send to error tracking service
        console.error('[ErrorBoundary] Caught error:', {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
        });
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-[400px] flex items-center justify-center p-8">
                    <div className="text-center max-w-md">
                        <div className="w-16 h-16 mx-auto mb-6 bg-accent-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-accent-800" />
                        </div>
                        <h2 className="font-heading text-2xl text-secondary-900 mb-2">
                            Something went wrong
                        </h2>
                        <p className="text-secondary-600 mb-6">
                            We encountered an unexpected error. Please try again or return to the homepage.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={this.handleRetry}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-secondary-900 text-cream-100 
                                         hover:bg-secondary-800 transition-colors"
                            >
                                <RefreshCw size={18} />
                                Try Again
                            </button>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-6 py-3 border border-secondary-900 
                                         text-secondary-900 hover:bg-cream-100 transition-colors"
                            >
                                <Home size={18} />
                                Go to Homepage
                            </Link>
                        </div>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mt-8 text-left">
                                <summary className="text-sm text-secondary-500 cursor-pointer hover:text-secondary-700">
                                    Error details (development only)
                                </summary>
                                <pre className="mt-2 p-4 bg-secondary-900 text-cream-100 text-xs overflow-auto rounded">
                                    {this.state.error.message}
                                    {'\n\n'}
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Inline error display component for sections that fail to load
 */
interface InlineErrorProps {
    message?: string;
    onRetry?: () => void;
}

export function InlineError({
    message = 'Failed to load. Please try again.',
    onRetry
}: InlineErrorProps) {
    return (
        <div className="text-center py-12 px-4">
            <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-accent-700" />
            <p className="text-secondary-600 mb-4">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-secondary-900 
                             text-secondary-900 hover:bg-cream-100 transition-colors"
                >
                    <RefreshCw size={16} />
                    Retry
                </button>
            )}
        </div>
    );
}
