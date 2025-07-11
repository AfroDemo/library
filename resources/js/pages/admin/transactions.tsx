'use client';

import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { AlertTriangle, BookOpen, Calendar, CheckCircle, Clock, DollarSign, Download, Search, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLayout from '../../layouts/app-layout';
import type { BreadcrumbItem, ToastMessage, Transaction } from '../../types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Transactions', href: '/admin/transactions' },
];

interface PaginatedTransactions {
    data: Transaction[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

export default function AdminTransactions() {
    const {
        transactions: initialTransactions = { data: [], current_page: 1, last_page: 1, total: 0, per_page: 20 },
        errors,
        success,
    } = usePage<
        PageProps & {
            transactions?: PaginatedTransactions;
            errors?: any;
            success?: string | null;
        }
    >().props;
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions.data || []);
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(initialTransactions.data || []);
    const [currentPage, setCurrentPage] = useState(initialTransactions.current_page || 1);
    const [lastPage, setLastPage] = useState(initialTransactions.last_page || 1);
    const [isLoading, setIsLoading] = useState(!initialTransactions.data.length);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        returned: 0,
        overdue: 0,
        totalFines: 0,
    });

    useEffect(() => {
        if (!initialTransactions.data.length) {
            setIsLoading(true);
            axios
                .get(`/transactions?page=${currentPage}`)
                .then((response) => {
                    const { data, current_page, last_page, total, per_page } = response.data;
                    setTransactions(data || []);
                    setFilteredTransactions(data || []);
                    setCurrentPage(current_page || 1);
                    setLastPage(last_page || 1);
                    setIsLoading(false);
                })
                .catch((error) => {
                    console.error('Failed to fetch transactions:', error);
                    showToast('error', 'Failed to load transactions');
                    setIsLoading(false);
                });
        } else {
            setTransactions(initialTransactions.data || []);
            setFilteredTransactions(initialTransactions.data || []);
            setCurrentPage(initialTransactions.current_page || 1);
            setLastPage(initialTransactions.last_page || 1);
        }

        if (success) {
            showToast('success', success);
        }
        if (errors && Object.values(errors).length > 0) {
            Object.values(errors).forEach((error: any) => showToast('error', error));
        }
    }, [initialTransactions, success, errors]);

    const showToast = (type: ToastMessage['type'], message: string) => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { type, message, id }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    useEffect(() => {
        filterTransactions();
        calculateStats();
    }, [transactions, searchTerm, statusFilter]);

    const filterTransactions = () => {
        let filtered = Array.isArray(transactions) ? [...transactions] : [];

        if (searchTerm) {
            filtered = filtered.filter(
                (transaction) =>
                    (transaction.member_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (transaction.book_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (transaction.member_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (transaction.book_isbn || '').toLowerCase().includes(searchTerm.toLowerCase()),
            );
        }

        if (statusFilter !== 'all') {
            if (statusFilter === 'active') {
                filtered = filtered.filter((t) => !t.returned_at);
            } else if (statusFilter === 'returned') {
                filtered = filtered.filter((t) => t.returned_at);
            } else if (statusFilter === 'overdue') {
                filtered = filtered.filter((t) => !t.returned_at && new Date(t.due_date) < new Date());
            }
        }

        setFilteredTransactions(filtered);
    };

    const calculateStats = () => {
        const total = filteredTransactions.length;
        const active = filteredTransactions.filter((t) => !t.returned_at).length;
        const returned = filteredTransactions.filter((t) => t.returned_at).length;
        const overdue = filteredTransactions.filter((t) => !t.returned_at && new Date(t.due_date) < new Date()).length;
        const totalFines = filteredTransactions.reduce(
            (sum, t) => sum + (t.fine_amount && !t.fine_paid ? t.fine_amount : 0),
            0,
        );

        setStats({ total, active, returned, overdue, totalFines });
    };

    const handlePageChange = (page: number) => {
        setIsLoading(true);
        router.get(
            '/transactions',
            { page, status: statusFilter === 'all' ? undefined : statusFilter },
            {
                preserveState: true,
                onSuccess: () => {
                    setCurrentPage(page);
                    setIsLoading(false);
                },
                onError: () => {
                    showToast('error', 'Failed to load page');
                    setIsLoading(false);
                },
            },
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const isOverdue = (transaction: Transaction) => {
        return !transaction.returned_at && new Date(transaction.due_date) < new Date();
    };

    const getStatusBadge = (transaction: Transaction) => {
        if (transaction.returned_at) {
            return (
                <div className="flex items-center text-green-600">
                    <CheckCircle className="mr-1 h-4 w-4" />
                    <span className="text-sm font-medium">Returned</span>
                </div>
            );
        } else if (isOverdue(transaction)) {
            return (
                <div className="flex items-center text-red-600">
                    <AlertTriangle className="mr-1 h-4 w-4" />
                    <span className="text-sm font-medium">Overdue</span>
                </div>
            );
        } else {
            return (
                <div className="flex items-center text-green-600">
                    <CheckCircle className="mr-1 h-4 w-4" />
                    <span className="text-sm font-medium">Active</span>
                </div>
            );
        }
    };

    const handleProcessExtension = (extensionId: number | null, status: 'approved' | 'rejected') => {
        if (!extensionId) {
            showToast('error', 'No pending extension request found');
            return;
        }
        router.post(
            `/transactions/extension/${extensionId}/process`,
            { status },
            {
                onSuccess: () => {
                    showToast('success', `Extension request ${status}`);
                    router.reload({ only: ['transactions'] });
                },
                onError: (errors) => {
                    Object.values(errors).forEach((error: any) => showToast('error', error));
                },
            },
        );
    };

    const exportTransactions = () => {
        const csvContent = [
            [
                'Transaction ID',
                'Student ID',
                'Student Name',
                'Book ISBN',
                'Book Title',
                'Borrowed Date',
                'Due Date',
                'Returned Date',
                'Status',
                'Fine',
                'Extension Status',
            ],
            ...filteredTransactions.map((t) => [
                t.id.toString(),
                t.member_id || 'N/A',
                t.member_name || 'Unknown User',
                t.book_isbn || 'N/A',
                t.book_title || 'Unknown Book',
                formatDate(t.borrowed_at),
                formatDate(t.due_date),
                t.returned_at ? formatDate(t.returned_at) : 'Not returned',
                t.returned_at ? 'Returned' : isOverdue(t) ? 'Overdue' : 'Active',
                t.fine_amount ? `$${t.fine_amount.toFixed(2)} ${t.fine_paid ? '(Paid)' : '(Unpaid)'}` : '$0.00',
                t.extension_status
                    ? `${t.extension_status.charAt(0).toUpperCase() + t.extension_status.slice(1)} ${
                          t.requested_days ? `(${t.requested_days} days)` : ''
                      }`
                    : 'None',
            ]),
        ];

        const csv = csvContent.map((row) => row.map((field) => `"${field}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="All Transactions" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Transaction Management</h1>
                            <p className="text-blue-100">Manage all library transactions and extension requests</p>
                        </div>
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                exportTransactions();
                            }}
                            className="flex items-center space-x-2 rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30"
                        >
                            <Download className="h-4 w-4" />
                            <span>Export Transactions</span>
                        </a>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <BookOpen className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Loans</p>
                                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                            </div>
                            <Calendar className="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Overdue Books</p>
                                <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Returned Books</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.returned}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-gray-600" />
                        </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Fines Owed</p>
                                <p className="text-3xl font-bold text-yellow-600">${stats.totalFines.toFixed(2)}</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-yellow-600" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Search Transactions</label>
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by student or book..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Filter by Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Transactions</option>
                                <option value="active">Active Loans</option>
                                <option value="returned">Returned</option>
                                <option value="overdue">Overdue</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('all');
                                }}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Transactions List */}
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 p-6">
                        <h2 className="flex items-center text-lg font-semibold text-gray-900">
                            <BookOpen className="mr-2 h-5 w-5 text-blue-600" />
                            All Transactions ({filteredTransactions.length})
                        </h2>
                    </div>
                    <div className="p-6">
                        {isLoading ? (
                            <div className="py-8 text-center">
                                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                                <p className="mt-2 text-gray-500">Loading transactions...</p>
                            </div>
                        ) : filteredTransactions.length > 0 ? (
                            <div className="space-y-4">
                                {filteredTransactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className={`rounded-lg border p-4 ${
                                            isOverdue(transaction) ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3">
                                                    <BookOpen className="h-8 w-8 text-gray-400" />
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">
                                                            {transaction.book_title || 'Unknown Book'}
                                                        </h3>
                                                        <p className="text-sm text-gray-600">ISBN: {transaction.book_isbn || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-2 space-y-1 text-sm text-gray-600">
                                                    <div className="flex items-center">
                                                        <span className="font-medium">Student:</span>
                                                        <span className="ml-2">
                                                            {transaction.member_name || 'Unknown User'} (
                                                            {transaction.member_id || 'N/A'})
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Calendar className="mr-2 h-4 w-4" />
                                                        <span>Borrowed: {formatDate(transaction.borrowed_at)}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Clock className="mr-2 h-4 w-4" />
                                                        <span>Due: {formatDate(transaction.due_date)}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <DollarSign className="mr-2 h-4 w-4" />
                                                        <span>
                                                            Fine:{' '}
                                                            {transaction.fine_amount
                                                                ? `$${transaction.fine_amount.toFixed(2)} ${
                                                                      transaction.fine_paid ? '(Paid)' : '(Unpaid)'
                                                                  }`
                                                                : '$0.00'}
                                                        </span>
                                                    </div>
                                                    {transaction.extension_status && (
                                                        <div className="flex items-center">
                                                            <Timer className="mr-2 h-4 w-4" />
                                                            <span>
                                                                Extension:{' '}
                                                                {transaction.extension_status.charAt(0).toUpperCase() +
                                                                    transaction.extension_status.slice(1)}
                                                                {transaction.requested_days
                                                                    ? ` (${transaction.requested_days} days)`
                                                                    : ''}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="ml-4 space-y-2">
                                                {getStatusBadge(transaction)}
                                                {transaction.extension_status === 'pending' && (
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleProcessExtension(transaction.extension_id, 'approved')}
                                                            className="rounded-lg bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
                                                            aria-label={`Approve extension for transaction ${transaction.id}`}
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleProcessExtension(transaction.extension_id, 'rejected')}
                                                            className="rounded-lg bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                                                            aria-label={`Reject extension for transaction ${transaction.id}`}
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-gray-500">
                                <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                                <p>No transactions found.</p>
                            </div>
                        )}
                    </div>
                    {/* Pagination Controls */}
                    {lastPage > 1 && (
                        <div className="flex justify-between items-center p-6 border-t border-gray-200">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-600">
                                Page {currentPage} of {lastPage}
                            </span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === lastPage}
                                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>

                {/* Toast Notifications */}
                <div className="fixed right-4 bottom-4 z-50 space-y-2">
                    {toasts.map((toast) => (
                        <div
                            key={toast.id}
                            className={`flex max-w-sm items-center space-x-3 rounded-lg border px-4 py-3 shadow-lg ${
                                toast.type === 'success'
                                    ? 'border-green-200 bg-green-50 text-green-800'
                                    : 'border-red-200 bg-red-50 text-red-800'
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
