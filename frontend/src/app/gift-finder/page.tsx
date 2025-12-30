'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Heart, Calendar, Wallet, ChevronRight, ChevronLeft, Sparkles, User } from 'lucide-react';

// Wizard steps configuration
const occasions = [
    { id: 'wedding', label: 'Wedding', icon: '💒' },
    { id: 'engagement', label: 'Engagement', icon: '💍' },
    { id: 'anniversary', label: 'Anniversary', icon: '❤️' },
    { id: 'birthday', label: 'Birthday', icon: '🎂' },
    { id: 'festival', label: 'Festival', icon: '🪔' },
    { id: 'daily-wear', label: 'Daily Wear', icon: '✨' },
];

const recipients = [
    { id: 'wife', label: 'Wife', icon: '👩' },
    { id: 'mother', label: 'Mother', icon: '👩‍🦳' },
    { id: 'girlfriend', label: 'Girlfriend', icon: '💕' },
    { id: 'sister', label: 'Sister', icon: '👧' },
    { id: 'daughter', label: 'Daughter', icon: '👶' },
    { id: 'self', label: 'Myself', icon: '😊' },
];

const budgets = [
    { id: 'under-25k', label: 'Under ₹25,000', min: 0, max: 25000 },
    { id: '25k-50k', label: '₹25,000 - ₹50,000', min: 25000, max: 50000 },
    { id: '50k-1l', label: '₹50,000 - ₹1 Lakh', min: 50000, max: 100000 },
    { id: '1l-2l', label: '₹1 Lakh - ₹2 Lakh', min: 100000, max: 200000 },
    { id: 'above-2l', label: 'Above ₹2 Lakh', min: 200000, max: null },
];

const categories = [
    { id: 'rings', label: 'Rings', icon: '💍' },
    { id: 'necklaces', label: 'Necklaces', icon: '📿' },
    { id: 'earrings', label: 'Earrings', icon: '✨' },
    { id: 'bracelets', label: 'Bracelets', icon: '⌚' },
    { id: 'pendants', label: 'Pendants', icon: '🔶' },
];

type Step = 'occasion' | 'recipient' | 'budget' | 'category' | 'results';

export default function GiftFinderPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<Step>('occasion');
    const [selections, setSelections] = useState({
        occasion: '',
        recipient: '',
        budget: '',
        category: '',
    });

    const steps: Step[] = ['occasion', 'recipient', 'budget', 'category', 'results'];
    const currentStepIndex = steps.indexOf(currentStep);

    const handleSelect = (field: keyof typeof selections, value: string) => {
        setSelections((prev) => ({ ...prev, [field]: value }));
    };

    const goNext = () => {
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < steps.length) {
            setCurrentStep(steps[nextIndex]);
        }
    };

    const goBack = () => {
        const prevIndex = currentStepIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(steps[prevIndex]);
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 'occasion':
                return selections.occasion !== '';
            case 'recipient':
                return selections.recipient !== '';
            case 'budget':
                return selections.budget !== '';
            case 'category':
                return selections.category !== '';
            default:
                return true;
        }
    };

    const getResultsUrl = () => {
        const params = new URLSearchParams();

        // Map occasion to filter
        const occasionMap: Record<string, string> = {
            wedding: 'Wedding',
            engagement: 'Engagement',
            anniversary: 'Anniversary',
            birthday: 'Party',
            festival: 'Festival',
            'daily-wear': 'Daily Wear',
        };
        if (selections.occasion && occasionMap[selections.occasion]) {
            params.set('occasion', occasionMap[selections.occasion]);
        }

        // Map budget to price range
        const selectedBudget = budgets.find((b) => b.id === selections.budget);
        if (selectedBudget) {
            params.set('minPrice', selectedBudget.min.toString());
            if (selectedBudget.max) {
                params.set('maxPrice', selectedBudget.max.toString());
            }
        }

        // Map category
        if (selections.category) {
            params.set('category', selections.category);
        }

        return `/shop?${params.toString()}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-cream-100 to-cream-200">
            {/* Hero */}
            <div className="bg-secondary-900 text-cream-100 py-12">
                <div className="container-luxury text-center">
                    <Gift className="w-12 h-12 mx-auto mb-4 text-primary-400" />
                    <h1 className="font-heading text-3xl md:text-4xl mb-3">Gift Finder</h1>
                    <p className="text-cream-400 max-w-lg mx-auto">
                        Answer a few questions and we&apos;ll help you find the perfect piece of jewellery.
                    </p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="container-luxury py-6">
                <div className="flex items-center justify-center gap-2 mb-8">
                    {steps.slice(0, -1).map((step, index) => (
                        <div key={step} className="flex items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${index < currentStepIndex
                                        ? 'bg-primary-500 text-secondary-900'
                                        : index === currentStepIndex
                                            ? 'bg-secondary-900 text-cream-100'
                                            : 'bg-cream-300 text-secondary-400'
                                    }`}
                            >
                                {index + 1}
                            </div>
                            {index < steps.length - 2 && (
                                <div
                                    className={`w-12 h-1 mx-1 transition-colors ${index < currentStepIndex ? 'bg-primary-500' : 'bg-cream-300'
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="max-w-2xl mx-auto"
                    >
                        {currentStep === 'occasion' && (
                            <div className="bg-white shadow-card p-8 text-center">
                                <Calendar className="w-10 h-10 mx-auto mb-4 text-primary-600" />
                                <h2 className="font-heading text-2xl text-secondary-900 mb-2">
                                    What&apos;s the occasion?
                                </h2>
                                <p className="text-secondary-500 mb-6">Select the special moment you&apos;re celebrating</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {occasions.map((occ) => (
                                        <button
                                            key={occ.id}
                                            onClick={() => handleSelect('occasion', occ.id)}
                                            className={`p-4 border-2 transition-all hover:border-primary-500 ${selections.occasion === occ.id
                                                    ? 'border-primary-500 bg-primary-50'
                                                    : 'border-cream-300'
                                                }`}
                                        >
                                            <span className="text-2xl block mb-2">{occ.icon}</span>
                                            <span className="text-sm font-medium text-secondary-700">{occ.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {currentStep === 'recipient' && (
                            <div className="bg-white shadow-card p-8 text-center">
                                <User className="w-10 h-10 mx-auto mb-4 text-primary-600" />
                                <h2 className="font-heading text-2xl text-secondary-900 mb-2">
                                    Who is it for?
                                </h2>
                                <p className="text-secondary-500 mb-6">Select the lucky recipient</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {recipients.map((rec) => (
                                        <button
                                            key={rec.id}
                                            onClick={() => handleSelect('recipient', rec.id)}
                                            className={`p-4 border-2 transition-all hover:border-primary-500 ${selections.recipient === rec.id
                                                    ? 'border-primary-500 bg-primary-50'
                                                    : 'border-cream-300'
                                                }`}
                                        >
                                            <span className="text-2xl block mb-2">{rec.icon}</span>
                                            <span className="text-sm font-medium text-secondary-700">{rec.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {currentStep === 'budget' && (
                            <div className="bg-white shadow-card p-8 text-center">
                                <Wallet className="w-10 h-10 mx-auto mb-4 text-primary-600" />
                                <h2 className="font-heading text-2xl text-secondary-900 mb-2">
                                    What&apos;s your budget?
                                </h2>
                                <p className="text-secondary-500 mb-6">Select your preferred price range</p>
                                <div className="space-y-3">
                                    {budgets.map((budget) => (
                                        <button
                                            key={budget.id}
                                            onClick={() => handleSelect('budget', budget.id)}
                                            className={`w-full p-4 border-2 transition-all hover:border-primary-500 text-left ${selections.budget === budget.id
                                                    ? 'border-primary-500 bg-primary-50'
                                                    : 'border-cream-300'
                                                }`}
                                        >
                                            <span className="font-medium text-secondary-700">{budget.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {currentStep === 'category' && (
                            <div className="bg-white shadow-card p-8 text-center">
                                <Sparkles className="w-10 h-10 mx-auto mb-4 text-primary-600" />
                                <h2 className="font-heading text-2xl text-secondary-900 mb-2">
                                    What type of jewellery?
                                </h2>
                                <p className="text-secondary-500 mb-6">Select your preferred category</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => handleSelect('category', cat.id)}
                                            className={`p-4 border-2 transition-all hover:border-primary-500 ${selections.category === cat.id
                                                    ? 'border-primary-500 bg-primary-50'
                                                    : 'border-cream-300'
                                                }`}
                                        >
                                            <span className="text-2xl block mb-2">{cat.icon}</span>
                                            <span className="text-sm font-medium text-secondary-700">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {currentStep === 'results' && (
                            <div className="bg-white shadow-card p-8 text-center">
                                <Heart className="w-12 h-12 mx-auto mb-4 text-accent-700" />
                                <h2 className="font-heading text-2xl text-secondary-900 mb-2">
                                    Perfect! We found your matches
                                </h2>
                                <p className="text-secondary-500 mb-6">
                                    Based on your selections, we&apos;ve curated the best pieces for you.
                                </p>
                                <div className="bg-cream-100 p-4 mb-6 text-left space-y-2 text-sm">
                                    <p><strong>Occasion:</strong> {occasions.find((o) => o.id === selections.occasion)?.label}</p>
                                    <p><strong>Recipient:</strong> {recipients.find((r) => r.id === selections.recipient)?.label}</p>
                                    <p><strong>Budget:</strong> {budgets.find((b) => b.id === selections.budget)?.label}</p>
                                    <p><strong>Category:</strong> {categories.find((c) => c.id === selections.category)?.label}</p>
                                </div>
                                <Link href={getResultsUrl()} className="btn-primary inline-flex items-center gap-2">
                                    <Sparkles size={18} />
                                    View Recommendations
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between max-w-2xl mx-auto mt-8">
                    <button
                        onClick={goBack}
                        disabled={currentStepIndex === 0}
                        className="flex items-center gap-2 px-4 py-2 text-secondary-600 hover:text-secondary-900 
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={18} />
                        Back
                    </button>

                    {currentStep !== 'results' && (
                        <button
                            onClick={goNext}
                            disabled={!canProceed()}
                            className="flex items-center gap-2 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                            <ChevronRight size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
