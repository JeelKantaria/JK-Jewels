'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, MessageSquare, Mail, Trash2, Check, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminMessagesPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedMessage, setSelectedMessage] = useState<any>(null);
    const [unreadOnly, setUnreadOnly] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'messages', { page, unreadOnly }],
        queryFn: async () => {
            const response = await api.get('/admin/messages', {
                params: { page, limit: 20, unreadOnly: unreadOnly.toString() },
            });
            return response.data.data;
        },
    });

    const markReadMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.put(`/admin/messages/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/admin/messages/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] });
            toast.success('Message deleted');
            if (selectedMessage) setSelectedMessage(null);
        },
        onError: () => {
            toast.error('Failed to delete message');
        },
    });

    const messages = data?.messages || [];
    const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };
    const unreadCount = data?.unreadCount || 0;

    const handleViewMessage = (message: any) => {
        setSelectedMessage(message);
        if (!message.isRead) {
            markReadMutation.mutate(message.id);
        }
    };

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                    <p className="text-gray-500 mt-1">
                        {pagination.total} messages • {unreadCount} unread
                    </p>
                </div>
                <button
                    onClick={() => setUnreadOnly(!unreadOnly)}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${unreadOnly
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    {unreadOnly ? 'Show All' : 'Unread Only'}
                </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Messages List */}
                <div className="lg:col-span-1 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {isLoading ? (
                        [...Array(5)].map((_, i) => (
                            <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                                <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                                <div className="h-3 w-48 bg-gray-200 rounded" />
                            </div>
                        ))
                    ) : messages.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
                            <MessageSquare size={48} className="mx-auto mb-4" />
                            <p>No messages found</p>
                        </div>
                    ) : (
                        messages.map((message: any) => (
                            <div
                                key={message.id}
                                onClick={() => handleViewMessage(message)}
                                className={`bg-white rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${selectedMessage?.id === message.id
                                        ? 'ring-2 ring-primary-500'
                                        : ''
                                    } ${!message.isRead ? 'border-l-4 border-primary-500' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className={`truncate ${!message.isRead ? 'font-semibold' : ''} text-gray-900`}>
                                            {message.subject}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate">{message.name}</p>
                                    </div>
                                    {!message.isRead && (
                                        <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-2">{formatDate(message.createdAt)}</p>
                            </div>
                        ))
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="pt-4 flex gap-2">
                            <button
                                onClick={() => setPage(page - 1)}
                                disabled={page === 1}
                                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(page + 1)}
                                disabled={page >= pagination.totalPages}
                                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>

                {/* Message Detail */}
                <div className="lg:col-span-2">
                    {selectedMessage ? (
                        <div className="bg-white rounded-xl shadow-sm h-full">
                            <div className="p-6 border-b border-gray-100 flex items-start justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">{selectedMessage.subject}</h2>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                        <span>{selectedMessage.name}</span>
                                        <span>•</span>
                                        <a href={`mailto:${selectedMessage.email}`} className="text-primary-600 hover:underline">
                                            {selectedMessage.email}
                                        </a>
                                        {selectedMessage.phone && (
                                            <>
                                                <span>•</span>
                                                <span>{selectedMessage.phone}</span>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">{formatDate(selectedMessage.createdAt)}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (confirm('Delete this message?')) {
                                            deleteMutation.mutate(selectedMessage.id);
                                        }
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                            </div>
                            <div className="p-6 border-t border-gray-100">
                                <a
                                    href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    <Mail size={16} />
                                    Reply via Email
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm h-full flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <Eye size={48} className="mx-auto mb-4" />
                                <p>Select a message to view</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
