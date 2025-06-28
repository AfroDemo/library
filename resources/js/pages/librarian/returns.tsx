'use client';
import type React from 'react';
import { useState } from 'react';

import { Head } from '@inertiajs/react';
import { AlertTriangle, BookOpen, Calendar, Clock, Scan, Search, User } from 'lucide-react';
import AppLayout from '../../layouts/app-layout';
import type { BreadcrumbItem } from '../../types';

// Transaction type for display (with derived fields)
type TransactionDisplay = {
    id: number;
    borrowed_at: string;
    due_date: string;
    returned_at?: string;
    student_name: string;
    member_id: string;
    book_title: string;
    book_isbn: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Librarian', href: '/librarian' },
    { title: 'Returns', href: '/librarian/returns' },
];

// Expect activeTransactions as a prop from the controller
import { router } from '@inertiajs/react';

interface ReturnsPageProps {
    activeTransactions: TransactionDisplay[];
}

export default function LibrarianReturns(props: ReturnsPageProps) {
    const { activeTransactions } = props;
    const [searchTerm, setSearchTerm] = useState('');
    const [scanInput, setScanInput] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleScanReturn = (e: React.FormEvent) => {
        e.preventDefault();
        if (!scanInput.trim()) return;

        // Try to find transaction by book ISBN or student ID
        const transaction = activeTransactions.find((t) => t.book_isbn === scanInput || t.member_id === scanInput || t.id.toString() === scanInput);

        if (transaction) {
            handleReturn(transaction.id);
        } else {
            alert('No active transaction found for this scan.');
        }
        setScanInput('');
    };

    const handleReturn = (transactionId: number) => {
        if (confirm('Are you sure you want to process this return?')) {
            setProcessing(true);
            router.post(
                route('librarian.returns.process'),
                { transaction_id: transactionId },
                {
                    onSuccess: () => {
                        setProcessing(false);
                        // Optionally, you can reload the page or use Inertia visit to refresh
                        router.reload({ only: ['activeTransactions'] });
                        alert('Book returned successfully!');
                    },
                    onError: () => {
                        setProcessing(false);
                        alert('Failed to process return. Please try again.');
                    },
                },
            );
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const isOverdue = (transaction: TransactionDisplay) => {
        return new Date(transaction.due_date) < new Date();
    };

    const getDaysOverdue = (dueDate: string) => {
        const due = new Date(dueDate);
        const today = new Date();
        const diffTime = today.getTime() - due.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const filteredTransactions = activeTransactions.filter(
        (transaction) =>
            transaction.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.book_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.member_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.book_isbn?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Process Returns" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h1 className="mb-2 text-2xl font-bold text-gray-900">Process Returns</h1>
                    <p className="text-gray-600">Scan books or manually process returns for borrowed items</p>
                </div>

                {/* Quick Scan Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center space-x-3">
                        <Scan className="h-6 w-6 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Quick Return</h2>
                    </div>

                    <form onSubmit={handleScanReturn} className="flex space-x-3">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={scanInput}
                                onChange={(e) => setScanInput(e.target.value)}
                                placeholder="Scan book ISBN, student ID, or enter manually..."
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!scanInput.trim() || processing}
                            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Process Return
                        </button>
                    </form>
                </div>

                {/* Search and Filter */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center space-x-3">
                        <Search className="h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search active transactions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Active Transactions */}
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900">Active Transactions ({filteredTransactions.length})</h2>
                    </div>

                    {/* Remove isLoading, since data is now from props */}
                    {false ? (
                        <div className="p-8 text-center">
                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-500">Loading active transactions...</p>
                        </div>
                    ) : filteredTransactions.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {filteredTransactions.map((transaction) => (
                                <div key={transaction.id} className="p-6 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
                                            {/* Student Info */}
                                            <div className="flex items-center space-x-3">
                                                <User className="h-8 w-8 text-gray-400" />
                                                <div>
                                                    <div className="font-medium text-gray-900">{transaction.student_name}</div>
                                                    <div className="text-sm text-gray-500">{transaction.member_id}</div>
                                                </div>
                                            </div>

                                            {/* Book Info */}
                                            <div className="flex items-center space-x-3">
                                                <BookOpen className="h-8 w-8 text-gray-400" />
                                                <div>
                                                    <div className="font-medium text-gray-900">{transaction.book_title}</div>
                                                    <div className="text-sm text-gray-500">{transaction.book_isbn}</div>
                                                </div>
                                            </div>

                                            {/* Date Info */}
                                            <div className="space-y-1">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Calendar className="mr-2 h-4 w-4" />
                                                    Borrowed: {formatDate(transaction.borrowed_at)}
                                                </div>
                                                <div className="flex items-center text-sm">
                                                    <Clock className="mr-2 h-4 w-4" />
                                                    <span className={isOverdue(transaction) ? 'text-red-600' : 'text-gray-600'}>
                                                        Due: {formatDate(transaction.due_date)}
                                                        {isOverdue(transaction) && (
                                                            <span className="ml-2 font-medium">
                                                                ({getDaysOverdue(transaction.due_date)} days overdue)
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status and Actions */}
                                        <div className="flex items-center space-x-4">
                                            {isOverdue(transaction) ? (
                                                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                                    <AlertTriangle className="mr-1 h-3 w-3" />
                                                    Overdue
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                                    <Clock className="mr-1 h-3 w-3" />
                                                    Active
                                                </span>
                                            )}

                                            <button
                                                onClick={() => handleReturn(transaction.id)}
                                                className="rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                                            >
                                                Process Return
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                            <p>No active transactions found.</p>
                            <p className="mt-1 text-sm">All books have been returned!</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
