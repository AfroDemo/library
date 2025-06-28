'use client';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { AlertTriangle, BookOpen, Calendar, CheckCircle, Clock, Download, Search, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLayout from '../../layouts/app-layout';
import type { BreadcrumbItem, Transaction } from '../../types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Librarian', href: '/librarian' },
    { title: 'Transactions', href: '/librarian/transactions' },
];

export default function LibrarianTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');

    useEffect(() => {
        fetchTransactions();
    }, []);

    useEffect(() => {
        filterTransactions();
    }, [transactions, searchTerm, statusFilter, dateFilter]);

    const fetchTransactions = async () => {
        try {
            const response = await axios.get('/api/librarian/transactions');
            setTransactions(response.data);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterTransactions = () => {
        let filtered = [...transactions];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(
                (transaction) =>
                    transaction.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    transaction.book_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    transaction.member_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    transaction.book_isbn?.toLowerCase().includes(searchTerm.toLowerCase()),
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            if (statusFilter === 'active') {
                filtered = filtered.filter((t) => !t.returned_at);
            } else if (statusFilter === 'returned') {
                filtered = filtered.filter((t) => t.returned_at);
            } else if (statusFilter === 'overdue') {
                filtered = filtered.filter((t) => !t.returned_at && new Date(t.due_date) < new Date());
            }
        }

        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            const filterDate = new Date();

            if (dateFilter === 'today') {
                filterDate.setHours(0, 0, 0, 0);
                filtered = filtered.filter((t) => new Date(t.borrowed_at) >= filterDate);
            } else if (dateFilter === 'week') {
                filterDate.setDate(now.getDate() - 7);
                filtered = filtered.filter((t) => new Date(t.borrowed_at) >= filterDate);
            } else if (dateFilter === 'month') {
                filterDate.setMonth(now.getMonth() - 1);
                filtered = filtered.filter((t) => new Date(t.borrowed_at) >= filterDate);
            }
        }

        setFilteredTransactions(filtered);
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
            ['Student ID', 'Student Name', 'Book ISBN', 'Book Title', 'Borrowed Date', 'Due Date', 'Returned Date', 'Status'],
            ...filteredTransactions.map((t) => [
                t.member_id,
                t.student_name,
                t.book_isbn,
                t.book_title,
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
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transactions" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
                            <p className="text-gray-600">View and manage all library transactions</p>
                        </div>
                        <button
                            onClick={exportTransactions}
                            className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                        >
                            <Download className="h-4 w-4" />
                            <span>Export CSV</span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Search</label>
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by student, book, or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="returned">Returned</option>
                                <option value="overdue">Overdue</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Date Range</label>
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">Last 7 Days</option>
                                <option value="month">Last 30 Days</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('all');
                                    setDateFilter('all');
                                }}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900">Transactions ({filteredTransactions.length})</h2>
                    </div>

                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-500">Loading transactions...</p>
                        </div>
                    ) : filteredTransactions.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Student</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Book</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Borrowed Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Due Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {filteredTransactions.map((transaction) => (
                                        <tr key={transaction.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <User className="mr-3 h-8 w-8 text-gray-400" />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{transaction.student_name}</div>
                                                        <div className="text-sm text-gray-500">{transaction.member_id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
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
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(transaction)}</td>
                                            <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                                                {!transaction.returned_at && (
                                                    <button
                                                        onClick={() => router.visit(`/librarian/returns?transaction=${transaction.id}`)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        Process Return
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                            <p>No transactions found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
