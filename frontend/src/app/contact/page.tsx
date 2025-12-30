'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

const contactSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    phone: z.string().optional(),
    subject: z.string().min(3, 'Subject must be at least 3 characters'),
    message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactPage() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
    });

    const onSubmit = async (data: ContactFormData) => {
        setIsSubmitting(true);
        try {
            await api.post('/contact', data);
            setIsSubmitted(true);
            reset();
            toast.success('Message sent successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send message');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-cream-100">
            {/* Hero Section */}
            <div className="bg-secondary-900 text-cream-100 py-16">
                <div className="container-luxury text-center">
                    <h1 className="font-heading text-3xl md:text-4xl mb-4">Get in Touch</h1>
                    <p className="text-cream-400 max-w-lg mx-auto">
                        Have a question about our jewellery or need assistance? We&apos;re here to help.
                    </p>
                </div>
            </div>

            <div className="container-luxury py-12">
                <div className="grid lg:grid-cols-3 gap-12">
                    {/* Contact Information */}
                    <div className="lg:col-span-1 space-y-8">
                        <div>
                            <h2 className="font-heading text-2xl text-secondary-900 mb-6">Contact Information</h2>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <MapPin className="text-primary-600" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-secondary-900">Visit Us</h3>
                                        <p className="text-secondary-600 text-sm mt-1">
                                            123 Jewellery Lane<br />
                                            Mumbai, Maharashtra 400001<br />
                                            India
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Phone className="text-primary-600" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-secondary-900">Call Us</h3>
                                        <p className="text-secondary-600 text-sm mt-1">
                                            +91 98765 43210<br />
                                            +91 22 1234 5678
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Mail className="text-primary-600" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-secondary-900">Email Us</h3>
                                        <p className="text-secondary-600 text-sm mt-1">
                                            info@jkjewels.com<br />
                                            support@jkjewels.com
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Clock className="text-primary-600" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-secondary-900">Store Hours</h3>
                                        <p className="text-secondary-600 text-sm mt-1">
                                            Mon - Sat: 10:00 AM - 8:00 PM<br />
                                            Sunday: 11:00 AM - 6:00 PM
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white shadow-card p-8">
                            {isSubmitted ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-12"
                                >
                                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                    <h3 className="font-heading text-2xl text-secondary-900 mb-2">Thank You!</h3>
                                    <p className="text-secondary-600 mb-6">
                                        Your message has been received. We&apos;ll get back to you within 24 hours.
                                    </p>
                                    <button
                                        onClick={() => setIsSubmitted(false)}
                                        className="btn-secondary"
                                    >
                                        Send Another Message
                                    </button>
                                </motion.div>
                            ) : (
                                <>
                                    <h2 className="font-heading text-2xl text-secondary-900 mb-6">Send Us a Message</h2>
                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                                    Your Name *
                                                </label>
                                                <input
                                                    {...register('name')}
                                                    type="text"
                                                    className="input-luxury w-full"
                                                    placeholder="John Doe"
                                                />
                                                {errors.name && (
                                                    <p className="text-accent-700 text-sm mt-1">{errors.name.message}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                                    Email Address *
                                                </label>
                                                <input
                                                    {...register('email')}
                                                    type="email"
                                                    className="input-luxury w-full"
                                                    placeholder="john@example.com"
                                                />
                                                {errors.email && (
                                                    <p className="text-accent-700 text-sm mt-1">{errors.email.message}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                                    Phone Number
                                                </label>
                                                <input
                                                    {...register('phone')}
                                                    type="tel"
                                                    className="input-luxury w-full"
                                                    placeholder="+91 98765 43210"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                                    Subject *
                                                </label>
                                                <input
                                                    {...register('subject')}
                                                    type="text"
                                                    className="input-luxury w-full"
                                                    placeholder="Product Inquiry"
                                                />
                                                {errors.subject && (
                                                    <p className="text-accent-700 text-sm mt-1">{errors.subject.message}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                                                Message *
                                            </label>
                                            <textarea
                                                {...register('message')}
                                                rows={6}
                                                className="input-luxury w-full resize-none"
                                                placeholder="Tell us how we can help you..."
                                            />
                                            {errors.message && (
                                                <p className="text-accent-700 text-sm mt-1">{errors.message.message}</p>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="btn-primary w-full md:w-auto flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 size={18} className="animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={18} />
                                                    Send Message
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
