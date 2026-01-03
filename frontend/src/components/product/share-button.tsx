'use client';

import { useState } from 'react';
import { Share2, MessageCircle, Link, Facebook, Twitter, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface ShareButtonProps {
    productName: string;
    productUrl: string;
    productImage?: string;
}

export function ShareButton({ productName, productUrl }: ShareButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const fullUrl = typeof window !== 'undefined'
        ? `${window.location.origin}${productUrl}`
        : productUrl;

    const shareText = `Check out ${productName} at J.K. Jewels!`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(fullUrl);
            setCopied(true);
            toast.success('Link copied!');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Failed to copy link');
        }
    };

    const handleWhatsAppShare = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${fullUrl}`)}`;
        window.open(url, '_blank');
        setIsOpen(false);
    };

    const handleFacebookShare = () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;
        window.open(url, '_blank', 'width=600,height=400');
        setIsOpen(false);
    };

    const handleTwitterShare = () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`;
        window.open(url, '_blank', 'width=600,height=400');
        setIsOpen(false);
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: productName,
                    text: shareText,
                    url: fullUrl,
                });
                setIsOpen(false);
            } catch (e) {
                // User cancelled or error
            }
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => typeof navigator.share === 'function' ? handleNativeShare() : setIsOpen(!isOpen)}
                className="p-3 border border-cream-400 hover:border-secondary-900 
                         hover:bg-secondary-900 hover:text-cream-100 transition-colors"
                title="Share"
            >
                <Share2 size={20} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 top-full mt-2 z-50 bg-white shadow-lg border border-cream-200 p-2 min-w-[180px]"
                        >
                            <div className="flex items-center justify-between px-3 py-2 mb-1">
                                <span className="text-sm font-medium text-secondary-900">Share</span>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-secondary-400 hover:text-secondary-600"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* WhatsApp */}
                            <button
                                onClick={handleWhatsAppShare}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-secondary-700 
                                         hover:bg-green-50 hover:text-green-600 transition-colors"
                            >
                                <MessageCircle size={18} />
                                WhatsApp
                            </button>

                            {/* Facebook */}
                            <button
                                onClick={handleFacebookShare}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-secondary-700 
                                         hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                                <Facebook size={18} />
                                Facebook
                            </button>

                            {/* Twitter */}
                            <button
                                onClick={handleTwitterShare}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-secondary-700 
                                         hover:bg-sky-50 hover:text-sky-500 transition-colors"
                            >
                                <Twitter size={18} />
                                Twitter
                            </button>

                            <hr className="my-2 border-cream-200" />

                            {/* Copy Link */}
                            <button
                                onClick={handleCopyLink}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-secondary-700 
                                         hover:bg-cream-100 transition-colors"
                            >
                                {copied ? (
                                    <>
                                        <Check size={18} className="text-green-600" />
                                        <span className="text-green-600">Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Link size={18} />
                                        Copy Link
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
