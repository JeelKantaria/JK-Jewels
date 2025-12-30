'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Plus, Truck, Shield, Tag, X, Check, Loader2, Info } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import { cartApi, addressesApi, ordersApi, promoApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Address {
    id: string;
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    isDefault: boolean;
}

export default function CheckoutPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isAuthenticated, isLoading: authLoading } = useAuthStore();

    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [promoCode, setPromoCode] = useState('');
    const [promoApplied, setPromoApplied] = useState<string | null>(null);
    const [promoDiscount, setPromoDiscount] = useState(0);
    const [promoDescription, setPromoDescription] = useState<string | null>(null);
    const [promoLoading, setPromoLoading] = useState(false);
    const [customerNotes, setCustomerNotes] = useState('');
    const [showAddressForm, setShowAddressForm] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login?redirect=/checkout');
        }
    }, [isAuthenticated, authLoading, router]);

    // Fetch cart
    const { data: cart, isLoading: cartLoading } = useQuery({
        queryKey: ['cart'],
        queryFn: async () => {
            const response = await cartApi.getCart();
            return response.data.data;
        },
        enabled: isAuthenticated,
    });

    // Fetch addresses
    const { data: addresses, isLoading: addressesLoading } = useQuery({
        queryKey: ['addresses'],
        queryFn: async () => {
            const response = await addressesApi.getAddresses();
            return response.data.data as Address[];
        },
        enabled: isAuthenticated,
    });

    // Set default address when addresses load
    useEffect(() => {
        if (addresses && addresses.length > 0 && !selectedAddressId) {
            const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
            setSelectedAddressId(defaultAddr.id);
        }
    }, [addresses, selectedAddressId]);

    // Create order mutation
    const createOrderMutation = useMutation({
        mutationFn: async () => {
            if (!selectedAddressId) {
                throw new Error('Please select a shipping address');
            }
            const response = await ordersApi.createOrder({
                shippingAddressId: selectedAddressId,
                promoCode: promoApplied || undefined,
                customerNotes: customerNotes || undefined,
            });
            return response.data.data;
        },
        onSuccess: (order) => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            toast.success('Order placed successfully!');
            router.push(`/account/orders?success=${order.orderNumber}`);
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to place order';
            toast.error(message);
        },
    });

    // Calculate totals
    const subtotal = cart?.subtotal || 0;
    const tax = cart?.tax || 0;
    const shipping = subtotal > 10000 ? 0 : 99;
    const discount = promoDiscount;
    const total = subtotal + tax + shipping - discount;

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) return;

        setPromoLoading(true);
        try {
            const response = await promoApi.validate(promoCode.trim(), subtotal);
            const data = response.data.data;

            setPromoApplied(data.code);
            setPromoDiscount(data.discountAmount);
            setPromoDescription(data.description);
            toast.success(`Promo applied! You save ${formatPrice(data.discountAmount)}`);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Invalid promo code';
            toast.error(message);
            setPromoApplied(null);
            setPromoDiscount(0);
            setPromoDescription(null);
        } finally {
            setPromoLoading(false);
        }
    };

    const handleRemovePromo = () => {
        setPromoApplied(null);
        setPromoDiscount(0);
        setPromoDescription(null);
        setPromoCode('');
    };

    if (authLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen bg-cream-100 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (cartLoading || addressesLoading) {
        return (
            <div className="min-h-screen bg-cream-100 py-12">
                <div className="container-luxury">
                    <div className="text-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
                        <p className="text-secondary-500 mt-4">Loading checkout...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!cart || cart.items.length === 0) {
        return (
            <div className="min-h-screen bg-cream-100 py-12">
                <div className="container-luxury max-w-2xl text-center py-20">
                    <h1 className="font-heading text-3xl text-secondary-900 mb-4">Your Cart is Empty</h1>
                    <p className="text-secondary-600 mb-8">Add some items to your cart before checking out.</p>
                    <Link href="/shop" className="btn-primary">
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cream-100 py-12">
            <div className="container-luxury">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/shop"
                        className="text-secondary-500 hover:text-secondary-700 flex items-center gap-1 mb-4"
                    >
                        <ChevronLeft size={18} /> Continue Shopping
                    </Link>
                    <h1 className="font-heading text-3xl md:text-4xl text-secondary-900">Checkout</h1>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content - Left Side */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Shipping Address Section */}
                        <section className="bg-white shadow-card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-heading text-xl text-secondary-900 flex items-center gap-2">
                                    <MapPin size={20} className="text-primary-600" />
                                    Shipping Address
                                </h2>
                                <button
                                    onClick={() => setShowAddressForm(!showAddressForm)}
                                    className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                                >
                                    <Plus size={16} /> Add New
                                </button>
                            </div>

                            {addresses && addresses.length > 0 ? (
                                <div className="space-y-3">
                                    {addresses.map((address) => (
                                        <motion.div
                                            key={address.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className={`p-4 border-2 cursor-pointer transition-colors ${selectedAddressId === address.id
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-cream-300 hover:border-cream-400'
                                                }`}
                                            onClick={() => setSelectedAddressId(address.id)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium text-secondary-900">
                                                        {address.name}
                                                        {address.isDefault && (
                                                            <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-0.5">
                                                                Default
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-secondary-600 text-sm mt-1">
                                                        {address.addressLine1}
                                                        {address.addressLine2 && `, ${address.addressLine2}`}
                                                    </p>
                                                    <p className="text-secondary-600 text-sm">
                                                        {address.city}, {address.state} - {address.pincode}
                                                    </p>
                                                    <p className="text-secondary-500 text-sm mt-1">
                                                        Phone: {address.phone}
                                                    </p>
                                                </div>
                                                {selectedAddressId === address.id && (
                                                    <Check size={20} className="text-primary-600" />
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 border-2 border-dashed border-cream-300">
                                    <MapPin size={32} className="mx-auto text-cream-400 mb-3" />
                                    <p className="text-secondary-600 mb-4">No saved addresses</p>
                                    <Link
                                        href="/account/addresses"
                                        className="text-primary-600 hover:text-primary-700 font-medium"
                                    >
                                        Add your first address →
                                    </Link>
                                </div>
                            )}
                        </section>

                        {/* Order Items */}
                        <section className="bg-white shadow-card p-6">
                            <h2 className="font-heading text-xl text-secondary-900 mb-6">
                                Order Items ({cart.itemCount})
                            </h2>
                            <div className="space-y-4">
                                {cart.items.map((item: any) => (
                                    <div key={item.id} className="flex gap-4 py-4 border-b border-cream-200 last:border-0">
                                        <div className="w-20 h-20 relative bg-cream-100 flex-shrink-0">
                                            <Image
                                                src={item.product.images?.[0]?.url || '/placeholder.jpg'}
                                                alt={item.product.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-secondary-900">
                                                {item.product.name}
                                            </h3>
                                            {item.variant && (
                                                <p className="text-sm text-secondary-500">
                                                    Size: {item.variant.size}
                                                </p>
                                            )}
                                            <p className="text-sm text-secondary-500">
                                                Qty: {item.quantity}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-secondary-900">
                                                {formatPrice(
                                                    (Number(item.product.basePrice) +
                                                        Number(item.variant?.additionalPrice || 0)) * item.quantity
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Customer Notes */}
                        <section className="bg-white shadow-card p-6">
                            <h2 className="font-heading text-xl text-secondary-900 mb-4">
                                Order Notes (Optional)
                            </h2>
                            <textarea
                                value={customerNotes}
                                onChange={(e) => setCustomerNotes(e.target.value)}
                                placeholder="Any special instructions for your order..."
                                className="w-full p-3 border border-cream-300 focus:border-primary-500 
                                         focus:ring-1 focus:ring-primary-500 outline-none resize-none"
                                rows={3}
                                maxLength={500}
                            />
                        </section>
                    </div>

                    {/* Order Summary - Right Side */}
                    <div className="lg:col-span-1">
                        <div className="bg-white shadow-card p-6 sticky top-24">
                            <h2 className="font-heading text-xl text-secondary-900 mb-6">
                                Order Summary
                            </h2>

                            {/* Promo Code */}
                            <div className="mb-6 pb-6 border-b border-cream-200">
                                <label className="text-sm font-medium text-secondary-700 mb-2 block">
                                    <Tag size={16} className="inline mr-1" /> Promo Code
                                </label>
                                {promoApplied ? (
                                    <div className="bg-green-50 p-3 border border-green-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-green-700 font-medium">{promoApplied}</span>
                                            <button
                                                onClick={handleRemovePromo}
                                                className="text-green-600 hover:text-green-800"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                        {promoDescription && (
                                            <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                                                <Info size={14} /> {promoDescription}
                                            </p>
                                        )}
                                        <p className="text-green-700 text-sm font-medium mt-2">
                                            You save {formatPrice(promoDiscount)}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                            placeholder="Enter code"
                                            className="flex-1 px-3 py-2 border border-cream-300 focus:border-primary-500 
                                                     focus:ring-1 focus:ring-primary-500 outline-none text-sm"
                                            disabled={promoLoading}
                                        />
                                        <button
                                            onClick={handleApplyPromo}
                                            disabled={promoLoading || !promoCode.trim()}
                                            className="px-4 py-2 bg-secondary-900 text-cream-100 text-sm 
                                                     hover:bg-secondary-800 transition-colors disabled:opacity-50
                                                     flex items-center gap-2"
                                        >
                                            {promoLoading && <Loader2 size={14} className="animate-spin" />}
                                            Apply
                                        </button>
                                    </div>
                                )}
                                <p className="text-xs text-secondary-400 mt-2">
                                    Try: FLAT500, SAVE200, FESTIVE20
                                </p>
                            </div>

                            {/* Totals */}
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-secondary-600">Subtotal</span>
                                    <span className="text-secondary-900">{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary-600">Tax (GST 3%)</span>
                                    <span className="text-secondary-900">{formatPrice(tax)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary-600">Shipping</span>
                                    <span className="text-secondary-900">
                                        {shipping === 0 ? (
                                            <span className="text-green-600">Free</span>
                                        ) : (
                                            formatPrice(shipping)
                                        )}
                                    </span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount</span>
                                        <span>-{formatPrice(discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-semibold pt-3 border-t border-cream-200">
                                    <span className="text-secondary-900">Total</span>
                                    <span className="text-secondary-900">{formatPrice(total)}</span>
                                </div>
                            </div>

                            {/* Place Order Button */}
                            <button
                                onClick={() => createOrderMutation.mutate()}
                                disabled={!selectedAddressId || createOrderMutation.isPending}
                                className="w-full mt-6 btn-primary disabled:opacity-50 disabled:cursor-not-allowed
                                         flex items-center justify-center gap-2"
                            >
                                {createOrderMutation.isPending ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    'Place Order'
                                )}
                            </button>

                            {!selectedAddressId && (
                                <p className="text-accent-700 text-sm text-center mt-2">
                                    Please select a shipping address
                                </p>
                            )}

                            {/* Trust Badges */}
                            <div className="mt-6 pt-6 border-t border-cream-200">
                                <p className="text-xs text-secondary-500 uppercase tracking-wider mb-3">Why shop with us</p>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-secondary-600">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Shield size={16} className="text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-secondary-800">SSL Encrypted</p>
                                            <p className="text-xs text-secondary-500">256-bit secure checkout</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-secondary-600">
                                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Check size={16} className="text-primary-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-secondary-800">BIS Hallmarked</p>
                                            <p className="text-xs text-secondary-500">100% certified gold & silver</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-secondary-600">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Truck size={16} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-secondary-800">Free Insured Shipping</p>
                                            <p className="text-xs text-secondary-500">On orders above ₹10,000</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
