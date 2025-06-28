'use client';

import { Head, router } from '@inertiajs/react';
import { AlertTriangle, BookOpen, Calendar, CheckCircle, Clock, Download, History, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLayout from '../../layouts/app-layout';
import type { BreadcrumbItem, PageProps, ToastMessage } from '../../types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'User', href: '/user' },
    { title: 'My History', href: '/user/history' },
];

// Transaction type for display
type TransactionDisplay = {
    id: number;
    borrowed_at: string;
    due_date: string;
    returned_at?: string;
    book_title: string;
    book_isbn: string;
};

// Props with paginated transactions
interface UserHistoryProps extends PageProps {
    transactions: {
        data: TransactionDisplay[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        search?: string;
        status?: string;
    };
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
};

export default function UserHistory({ transactions, filters }: UserHistoryProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        // Show toasts for success messages from server
        if ((window as any).success) {
            showToast('success', (window as any).success);
        }
        if ((window as any).errors?.transaction_id) {
            showToast('error', (window as any).errors.transaction_id);
        }
    }, []);

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

    const isOverdue = (transaction: TransactionDisplay) => {
        return !transaction.returned_at && new Date(transaction.due_date) < new Date();
    };

    const getStatusBadge = (transaction: TransactionDisplay) => {
        if (transaction.returned_at) {
            return (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Returned
                </span>
            );
        } else if (isOverdue(transaction)) {
            return (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Overdue
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    <Clock className="mr-1 h-3 w-3" />
                    Active
                </span>
            );
        }
    };

    const exportTransactions = () => {
        const csvContent = [
            ['Book Title', 'ISBN', 'Borrowed Date', 'Due Date', 'Returned Date', 'Status'],
            ...transactions.data.map((t) => [
                t.book_title,
                t.book_isbn,
                formatDate(t.borrowed_at),
                formatDate(t.due_date),
                t.returned_at ? formatDate(t.returned_at) : 'Not returned',
                t.returned_at ? 'Returned' : isOverdue(t) ? 'Overdue' : 'Active',
            ]),
        ];

        const csv = csvContent.map((row) => row.map((field) => `"${field}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `borrowing_history_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleFilterChange = () => {
        router.get(route('user.history'), { search: searchTerm, status: statusFilter }, { preserveState: true, replace: true });
    };

    const handlePageChange = (url: string | null) => {
        if (url) {
            router.get(url, { search: searchTerm, status: statusFilter }, { preserveState: true });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Borrowing History" />
            <div className="flex flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-gray-900">
                                <History className="h-6 w-6 text-blue-500" /> My Borrowing History
                            </h1>
                            <p className="text-gray-600">View all books you have borrowed, their due dates, and return status.</p>
                        </div>
                        <button
                            onClick={exportTransactions}
                            className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                            aria-label="Export borrowing history as CSV"
                        >
                            <Download className="h-4 w-4" />
                            <span>Export CSV</span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Search</label>
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by book title or ISBN..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleFilterChange()}
                                    className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                    aria-label="Search transactions by book title or ISBN"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    handleFilterChange();
                                }}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                aria-label="Filter transactions by status"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="returned">Returned</option>
                                <option value="overdue">Overdue</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('all');
                                    handleFilterChange();
                                }}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
                                aria-label="Clear all filters"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900">History ({transactions.total})</h2>
                    </div>
                    {transactions.data.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Book</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Borrowed</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Due</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {transactions.data.map((transaction) => (
                                        <tr key={transaction.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <BookOpen className="mr-3 h-8 w-8 text-gray-400" />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{transaction.book_title}</div>
                                                        <div className="text-sm text-gray-500">{transaction.book_isbn}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                <div className="flex items-center">
                                                    <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                                                    {formatDate(transaction.borrowed_at)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                <div className="flex items-center">
                                                    <Clock className="mr-2 h-4 w-4 text-gray-400" />
                                                    {formatDate(transaction.due_date)}
                                                    {isOverdue(transaction) && (
                                                        <span className="ml-2 text-sm text-red-600">
                                                            (
                                                            {Math.ceil(
                                                                (new Date().getTime() - new Date(transaction.due_date).getTime()) /
                                                                    (1000 * 60 * 60 * 24),
                                                            )}{' '}
                                                            days overdue)
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(transaction)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                            <p>You have not borrowed any books yet.</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {transactions.last_page > 1 && (
                        <div className="flex justify-center space-x-2 p-6">
                            {transactions.links.map((link, index) => (
                                <button
                                    key={index}
                                    onClick={() => handlePageChange(link.url)}
                                    className={`rounded-lg px-4 py-2 ${
                                        link.active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                    disabled={!link.url}
                                    aria-label={
                                        link.label === '« Previous'
                                            ? 'Previous page'
                                            : link.label === 'Next »'
                                              ? 'Next page'
                                              : `Go to page ${link.label}`
                                    }
                                >
                                    {link.label === '« Previous' ? 'Previous' : link.label === 'Next »' ? 'Next' : link.label}
                                </button>
                            ))}
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
                                    : toast.type === 'error'
                                      ? 'border-red-200 bg-red-50 text-red-800'
                                      : 'border-blue-200 bg-blue-50 text-blue-800'
                            }`}
                        >
                            {toast.type === 'success' && <div className="h-5 w-5 text-green-600">✔</div>}
                            {toast.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                            {toast.type === 'info' && <div className="h-5 w-5 text-blue-600">ℹ</div>}
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
