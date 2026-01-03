'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MapPin, Plus, Trash2, Edit2, Star, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import { addressesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Enhanced validation schema with better regex patterns
const addressSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name cannot exceed 50 characters')
        .regex(/^[a-zA-Z\s.]+$/, 'Name can only contain letters, spaces and dots'),
    phone: z.string()
        .regex(/^[6-9]\d{9}$/, 'Please enter valid 10-digit Indian mobile number'),
    addressLine1: z.string()
        .min(10, 'Please enter complete address (at least 10 characters)')
        .max(100, 'Address cannot exceed 100 characters'),
    addressLine2: z.string().max(100, 'Cannot exceed 100 characters').optional(),
    city: z.string()
        .min(2, 'City is required')
        .max(50, 'City name too long')
        .regex(/^[a-zA-Z\s]+$/, 'City can only contain letters'),
    state: z.string()
        .min(2, 'State is required')
        .max(50, 'State name too long')
        .regex(/^[a-zA-Z\s]+$/, 'State can only contain letters'),
    pincode: z.string()
        .regex(/^[1-9][0-9]{5}$/, 'Please enter valid 6-digit pincode'),
    isDefault: z.boolean().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface Address extends AddressFormData {
    id: string;
    country: string;
}

interface PincodeData {
    city: string;
    state: string;
    district: string;
    valid: boolean;
}

// Pincode lookup using India Post API
async function fetchPincodeDetails(pincode: string): Promise<PincodeData | null> {
    try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();

        if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
            const postOffice = data[0].PostOffice[0];
            return {
                city: postOffice.Block || postOffice.District,
                state: postOffice.State,
                district: postOffice.District,
                valid: true,
            };
        }
        return null;
    } catch {
        return null;
    }
}

export default function AddressesPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isAuthenticated, isLoading: authLoading } = useAuthStore();
    const [showForm, setShowForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const { register, handleSubmit, reset, setValue, control, formState: { errors, isSubmitting } } = useForm<AddressFormData>({
        resolver: zodResolver(addressSchema),
        mode: 'onChange', // Validate on change for better UX
    });

    // Watch pincode field for auto-populate
    const watchedPincode = useWatch({ control, name: 'pincode' });

    // Debounced pincode lookup
    const lookupPincode = useCallback(async (pincode: string) => {
        if (pincode && /^[1-9][0-9]{5}$/.test(pincode)) {
            setPincodeStatus('loading');
            const data = await fetchPincodeDetails(pincode);
            if (data) {
                setValue('city', data.city, { shouldValidate: true });
                setValue('state', data.state, { shouldValidate: true });
                setPincodeStatus('success');
                toast.success(`Found: ${data.city}, ${data.state}`);
            } else {
                setPincodeStatus('error');
            }
        } else {
            setPincodeStatus('idle');
        }
    }, [setValue]);

    // Trigger pincode lookup when pincode changes
    useEffect(() => {
        const timer = setTimeout(() => {
            if (watchedPincode && watchedPincode.length === 6) {
                lookupPincode(watchedPincode);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [watchedPincode, lookupPincode]);

    // Redirect if not authenticated
    if (!authLoading && !isAuthenticated) {
        router.push('/login');
    }

    // Fetch addresses
    const { data: addresses, isLoading } = useQuery({
        queryKey: ['addresses'],
        queryFn: async () => {
            const response = await addressesApi.getAddresses();
            return response.data.data as Address[];
        },
        enabled: isAuthenticated,
    });

    // Create address mutation
    const createMutation = useMutation({
        mutationFn: (data: AddressFormData) => addressesApi.createAddress(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['addresses'] });
            toast.success('Address added successfully');
            setShowForm(false);
            reset();
            setPincodeStatus('idle');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to add address');
        },
    });

    // Update address mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: AddressFormData }) =>
            addressesApi.updateAddress(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['addresses'] });
            toast.success('Address updated successfully');
            setEditingAddress(null);
            setShowForm(false);
            reset();
            setPincodeStatus('idle');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update address');
        },
    });

    // Delete address mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => addressesApi.deleteAddress(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['addresses'] });
            toast.success('Address deleted');
        },
        onError: () => {
            toast.error('Failed to delete address');
        },
    });

    // Set default mutation
    const setDefaultMutation = useMutation({
        mutationFn: (id: string) => addressesApi.setDefaultAddress(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['addresses'] });
            toast.success('Default address updated');
        },
        onError: () => {
            toast.error('Failed to set default address');
        },
    });

    const onSubmit = (data: AddressFormData) => {
        if (editingAddress) {
            updateMutation.mutate({ id: editingAddress.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (address: Address) => {
        setEditingAddress(address);
        reset({
            name: address.name,
            phone: address.phone,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2 || '',
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            isDefault: address.isDefault,
        });
        setPincodeStatus('idle');
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingAddress(null);
        reset();
        setPincodeStatus('idle');
    };

    if (authLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen bg-cream-100 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cream-100 py-12">
            <div className="container-luxury max-w-2xl">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/account"
                        className="text-secondary-500 hover:text-secondary-700 flex items-center gap-1 mb-4"
                    >
                        <ChevronLeft size={18} /> Back to Account
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="font-heading text-3xl text-secondary-900">Addresses</h1>
                            <p className="text-secondary-500 mt-1">Manage your shipping addresses</p>
                        </div>
                        {!showForm && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Plus size={18} /> Add New
                            </button>
                        )}
                    </div>
                </div>

                {/* Address Form */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white shadow-card p-6 mb-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-heading text-xl text-secondary-900">
                                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                                </h2>
                                <button onClick={handleCancel} className="text-secondary-400 hover:text-secondary-600">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                                            Full Name *
                                        </label>
                                        <input
                                            {...register('name')}
                                            className={`w-full px-4 py-2 border ${errors.name ? 'border-accent-700' : 'border-cream-300'} 
                                                     focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none`}
                                            placeholder="Recipient name"
                                        />
                                        {errors.name && (
                                            <p className="text-accent-700 text-sm mt-1">{errors.name.message}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                                            Phone Number *
                                        </label>
                                        <div className="flex">
                                            <span className="inline-flex items-center px-3 border border-r-0 border-cream-300 bg-cream-100 text-secondary-500 text-sm">
                                                +91
                                            </span>
                                            <input
                                                {...register('phone')}
                                                className={`w-full px-4 py-2 border-y border-r ${errors.phone ? 'border-accent-700' : 'border-cream-300'} 
                                                         focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none`}
                                                placeholder="9876543210"
                                                maxLength={10}
                                            />
                                        </div>
                                        {errors.phone && (
                                            <p className="text-accent-700 text-sm mt-1">{errors.phone.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Address Line 1 *
                                    </label>
                                    <input
                                        {...register('addressLine1')}
                                        className={`w-full px-4 py-2 border ${errors.addressLine1 ? 'border-accent-700' : 'border-cream-300'} 
                                                 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none`}
                                        placeholder="House/Flat No., Building Name, Street"
                                    />
                                    {errors.addressLine1 && (
                                        <p className="text-accent-700 text-sm mt-1">{errors.addressLine1.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Address Line 2 <span className="text-secondary-400">(Optional)</span>
                                    </label>
                                    <input
                                        {...register('addressLine2')}
                                        className="w-full px-4 py-2 border border-cream-300 focus:border-primary-500 
                                                 focus:ring-1 focus:ring-primary-500 outline-none"
                                        placeholder="Landmark, Area"
                                    />
                                </div>

                                {/* Pincode with auto-lookup */}
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                                            Pincode *
                                        </label>
                                        <div className="relative">
                                            <input
                                                {...register('pincode')}
                                                className={`w-full px-4 py-2 border ${errors.pincode ? 'border-accent-700' : 'border-cream-300'} 
                                                         focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none pr-10`}
                                                placeholder="400001"
                                                maxLength={6}
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                {pincodeStatus === 'loading' && (
                                                    <Loader2 size={16} className="animate-spin text-primary-600" />
                                                )}
                                                {pincodeStatus === 'success' && (
                                                    <CheckCircle size={16} className="text-green-600" />
                                                )}
                                                {pincodeStatus === 'error' && (
                                                    <AlertCircle size={16} className="text-accent-700" />
                                                )}
                                            </div>
                                        </div>
                                        {errors.pincode && (
                                            <p className="text-accent-700 text-sm mt-1">{errors.pincode.message}</p>
                                        )}
                                        {pincodeStatus === 'error' && !errors.pincode && (
                                            <p className="text-accent-700 text-sm mt-1">Pincode not found</p>
                                        )}
                                        <p className="text-xs text-secondary-400 mt-1">
                                            City & State will auto-fill
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                                            City *
                                        </label>
                                        <input
                                            {...register('city')}
                                            className={`w-full px-4 py-2 border ${errors.city ? 'border-accent-700' : 'border-cream-300'} 
                                                     focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none
                                                     ${pincodeStatus === 'success' ? 'bg-green-50' : ''}`}
                                            placeholder="City"
                                        />
                                        {errors.city && (
                                            <p className="text-accent-700 text-sm mt-1">{errors.city.message}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                                            State *
                                        </label>
                                        <input
                                            {...register('state')}
                                            className={`w-full px-4 py-2 border ${errors.state ? 'border-accent-700' : 'border-cream-300'} 
                                                     focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none
                                                     ${pincodeStatus === 'success' ? 'bg-green-50' : ''}`}
                                            placeholder="State"
                                        />
                                        {errors.state && (
                                            <p className="text-accent-700 text-sm mt-1">{errors.state.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isDefault"
                                        {...register('isDefault')}
                                        className="w-4 h-4 text-primary-600 border-cream-300 rounded 
                                                 focus:ring-primary-500"
                                    />
                                    <label htmlFor="isDefault" className="text-sm text-secondary-600">
                                        Set as default address
                                    </label>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={createMutation.isPending || updateMutation.isPending || isSubmitting}
                                        className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {(createMutation.isPending || updateMutation.isPending) ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Saving...
                                            </>
                                        ) : editingAddress ? (
                                            'Update Address'
                                        ) : (
                                            'Save Address'
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="btn-secondary flex-1"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Addresses List */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
                    </div>
                ) : addresses && addresses.length > 0 ? (
                    <div className="space-y-4">
                        {addresses.map((address, index) => (
                            <motion.div
                                key={address.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white shadow-card p-6"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-medium text-secondary-900">{address.name}</h3>
                                            {address.isDefault && (
                                                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 flex items-center gap-1">
                                                    <Star size={12} fill="currentColor" /> Default
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-secondary-600">
                                            {address.addressLine1}
                                            {address.addressLine2 && <>, {address.addressLine2}</>}
                                        </p>
                                        <p className="text-secondary-600">
                                            {address.city}, {address.state} - {address.pincode}
                                        </p>
                                        <p className="text-secondary-500 text-sm mt-2">
                                            Phone: +91 {address.phone}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        {!address.isDefault && (
                                            <button
                                                onClick={() => setDefaultMutation.mutate(address.id)}
                                                className="p-2 text-secondary-400 hover:text-primary-600 transition-colors"
                                                title="Set as default"
                                            >
                                                <Star size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleEdit(address)}
                                            className="p-2 text-secondary-400 hover:text-primary-600 transition-colors"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('Delete this address?')) {
                                                    deleteMutation.mutate(address.id);
                                                }
                                            }}
                                            className="p-2 text-secondary-400 hover:text-accent-800 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white shadow-card p-12 text-center">
                        <MapPin size={48} className="mx-auto text-cream-400 mb-4" />
                        <h3 className="font-heading text-xl text-secondary-900 mb-2">
                            No Addresses Saved
                        </h3>
                        <p className="text-secondary-500 mb-6">
                            Add your shipping address for faster checkout.
                        </p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="btn-primary flex items-center gap-2 mx-auto"
                        >
                            <Plus size={18} /> Add Address
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
