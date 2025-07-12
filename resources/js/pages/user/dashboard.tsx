'use client';

import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { AlertTriangle, BookOpen, Calendar, CheckCircle, Clock, DollarSign, Search, Timer, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLayout from '../../layouts/app-layout';
import type { BreadcrumbItem, DashboardStats, PageProps, ToastMessage, Transaction } from '../../types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'My Library', href: '/user' },
    { title: 'Dashboard', href: '/user/dashboard' },
];

export default function UserDashboard() {
    const {
        auth,
        stats: initialStats = {},
        transactions: initialTransactions = [],
        errors,
        success,
    } = usePage<PageProps & { stats?: DashboardStats; transactions?: Transaction[]; errors?: any; success?: string | null }>().props;
    const [stats, setStats] = useState<DashboardStats>(initialStats);
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
    const [isLoading, setIsLoading] = useState(!initialStats.myBorrowedBooks);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [requestedDays, setRequestedDays] = useState<number>(7);

    const showToast = (type: ToastMessage['type'], message: string) => {
        const id = Date.now().toString();
        const toast: ToastMessage = { type, message, id };
        setToasts((prev) => [...prev, toast]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const openExtensionModal = (transaction: Transaction) => {
        if (!transaction.returned_at && transaction.extension_status !== 'pending') {
            setSelectedTransaction(transaction);
            setRequestedDays(7);
            setIsExtensionModalOpen(true);
        }
    };

    const handleExtensionRequest = () => {
        if (selectedTransaction) {
            router.post(
                '/transactions/extension',
                {
                    transaction_id: selectedTransaction.id,
                    requested_days: requestedDays,
                },
                {
                    onSuccess: () => {
                        setIsExtensionModalOpen(false);
                        showToast('success', 'Extension request submitted successfully');
                        router.reload({ only: ['transactions', 'stats'] });
                    },
                    onError: (errors) => {
                        Object.values(errors).forEach((error: any) => showToast('error', error));
                    },
                },
            );
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const isOverdue = (transaction: Transaction) => {
        return !transaction.returned_at && new Date(transaction.due_date) < new Date();
    };

    const statCards = [
        {
            title: 'Books Borrowed',
            value: stats.myBorrowedBooks ?? 0,
            icon: BookOpen,
            color: 'text-blue-600',
        },
        {
            title: 'Active Borrowed Books',
            value: stats.activeLoans ?? 0,
            icon: Calendar,
            color: 'text-green-600',
        },
        {
            title: 'Overdue Books',
            value: stats.overdueBooks ?? 0,
            icon: Clock,
            color: 'text-red-600',
        },
        {
            title: 'Fines Owed',
            value: transactions.reduce((sum, t) => sum + (t.fine_amount && !t.fine_paid ? t.fine_amount : 0), 0).toFixed(2),
            icon: DollarSign,
            color: 'text-yellow-600',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Welcome Section */}
                <div className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white shadow-sm">
                    <div className="flex items-center space-x-4">
                        <div className="rounded-full bg-white/20 p-3">
                            <User className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Welcome back, {auth.user.name}!</h1>
                            <p className="text-blue-100">{auth.user.role === 'student' ? 'Student' : 'Staff'} • Library Member</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    {statCards.map((card, index) => (
                        <div
                            key={index}
                            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                            aria-label={`${card.title}: ${isLoading ? 'Loading' : card.value}`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                                    <p className="text-3xl font-bold text-gray-900">{isLoading ? '...' : card.value.toLocaleString()}</p>
                                </div>
                                <card.icon className={`h-8 w-8 ${card.color}`} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Current Borrowed Books */}
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 p-6">
                        <h2 className="flex items-center text-lg font-semibold text-gray-900">
                            <BookOpen className="mr-2 h-5 w-5 text-blue-600" />
                            Currently Borrowed Books
                        </h2>
                    </div>
                    <div className="p-6">
                        {isLoading ? (
                            <div className="py-8 text-center">
                                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                                <p className="mt-2 text-gray-500">Loading your books...</p>
                            </div>
                        ) : transactions.filter((t) => !t.returned_at).length > 0 ? (
                            <div className="space-y-4">
                                {transactions
                                    .filter((t) => !t.returned_at)
                                    .map((transaction) => (
                                        <div
                                            key={transaction.id}
                                            className={`rounded-lg border p-4 ${
                                                isOverdue(transaction) ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900">{transaction.book_title}</h3>
                                                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                                                        <div className="flex items-center">
                                                            <Calendar className="mr-2 h-4 w-4" />
                                                            <span>Borrowed: {formatDate(transaction.borrowed_at)}</span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <Clock className="mr-2 h-4 w-4" />
                                                            <span>Due: {formatDate(transaction.due_date)}</span>
                                                        </div>
                                                        {transaction.fine_amount && (
                                                            <div className="flex items-center">
                                                                <DollarSign className="mr-2 h-4 w-4" />
                                                                <span>
                                                                    Fine: ${transaction.fine_amount.toFixed(2)}{' '}
                                                                    {transaction.fine_paid ? '(Paid)' : '(Unpaid)'}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {transaction.extension_status && (
                                                            <div className="flex items-center">
                                                                <Timer className="mr-2 h-4 w-4" />
                                                                <span>
                                                                    Extension:{' '}
                                                                    {transaction.extension_status.charAt(0).toUpperCase() +
                                                                        transaction.extension_status.slice(1)}
                                                                    {transaction.requested_days && ` (${transaction.requested_days} days)`}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="ml-4 space-y-2">
                                                    {isOverdue(transaction) ? (
                                                        <div className="flex items-center text-red-600">
                                                            <AlertTriangle className="mr-1 h-4 w-4" />
                                                            <span className="text-sm font-medium">Overdue</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center text-green-600">
                                                            <CheckCircle className="mr-1 h-4 w-4" />
                                                            <span className="text-sm font-medium">Active</span>
                                                        </div>
                                                    )}
                                                    {!transaction.returned_at && transaction.extension_status !== 'pending' && (
                                                        <button
                                                            onClick={() => openExtensionModal(transaction)}
                                                            className="flex items-center text-blue-600 hover:text-blue-900"
                                                            aria-label={`Request extension for ${transaction.book_title}`}
                                                        >
                                                            <Timer className="mr-1 h-4 w-4" />
                                                            <span className="text-sm">Request Extension</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-gray-500">
                                <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                                <p>You don't have any books currently borrowed.</p>
                                <p className="mt-1 text-sm">Visit the library to borrow some books!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Extension Request Modal */}
                {isExtensionModalOpen && selectedTransaction && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="w-full max-w-md rounded-lg bg-white p-6">
                            <h2 className="mb-4 text-xl font-bold text-gray-900">Request Extension</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Book</label>
                                    <p className="text-sm text-gray-900">
                                        {selectedTransaction.book_title} ({selectedTransaction.book_isbn})
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Current Due Date</label>
                                    <p className="text-sm text-gray-900">{formatDate(selectedTransaction.due_date)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Requested Extension (days)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="14"
                                        value={requestedDays}
                                        onChange={(e) => setRequestedDays(Number(e.target.value))}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                        aria-label="Requested extension days"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={() => setIsExtensionModalOpen(false)}
                                    className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
                                    aria-label="Cancel"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleExtensionRequest}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                                    aria-label="Submit extension request"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <a href="/user/search" className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                        <div className="flex items-center space-x-3">
                            <Search className="h-8 w-8 text-blue-600" />
                            <div>
                                <h3 className="font-semibold text-gray-900">Search Books</h3>
                                <p className="text-sm text-gray-600">Find books in the library catalog</p>
                            </div>
                        </div>
                    </a>
                    <a href="/user/history" className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                        <div className="flex items-center space-x-3">
                            <Clock className="h-8 w-8 text-gray-600" />
                            <div>
                                <h3 className="font-semibold text-gray-900">Borrowing History</h3>
                                <p className="text-sm text-gray-600">View your complete borrowing history</p>
                            </div>
                        </div>
                    </a>
                </div>

                {/* Toast Notifications */}
                <div className="fixed bottom-4 right-4 z-50 space-y-2">
                    {toasts.map((toast) => (
                        <div
                            key={toast.id}
                            className={`flex max-w-sm items-center space-x-3 rounded-lg border px-4 py-3 shadow-lg ${
                                toast.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'
                            }`}
                        >
                            {toast.type === 'success' && <div className="h-5 w-5 text-green-600">✔</div>}
                            {toast.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                            <span className="text-sm font-medium">{toast.message}</span>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Close toast notification"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
