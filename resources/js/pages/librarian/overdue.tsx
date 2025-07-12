'use client';
import { Head } from '@inertiajs/react';
import { AlertTriangle, BookOpen, Calendar, Clock, Download, Mail, Phone, User } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '../../layouts/app-layout';
import type { BreadcrumbItem } from '../../types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Overdue Books', href: '/librarian/overdue' },
];

import { router } from '@inertiajs/react';

// Transaction type for display (with derived fields)
type OverdueTransaction = {
    id: number;
    borrowed_at: string;
    due_date: string;
    returned_at?: string;
    student_name: string;
    member_id: string;
    student_email?: string;
    student_phone?: string;
    book_title: string;
    book_isbn: string;
};

interface OverduePageProps {
    overdueTransactions: OverdueTransaction[];
}

export default function LibrarianOverdue(props: OverduePageProps) {
    const { overdueTransactions } = props;
    const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const getDaysOverdue = (dueDate: string) => {
        const due = new Date(dueDate);
        const today = new Date();
        const diffTime = today.getTime() - due.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const calculateFine = (daysOverdue: number) => {
        // $0.50 per day overdue
        return (daysOverdue * 0.5).toFixed(2);
    };

    const handleSelectTransaction = (transactionId: number) => {
        setSelectedTransactions((prev) => (prev.includes(transactionId) ? prev.filter((id) => id !== transactionId) : [...prev, transactionId]));
    };

    const handleSelectAll = () => {
        if (selectedTransactions.length === overdueTransactions.length) {
            setSelectedTransactions([]);
        } else {
            setSelectedTransactions(overdueTransactions.map((t) => t.id));
        }
    };



    const sendReminders = (ids?: number[]) => {
        const transactionIds = ids || selectedTransactions;
        if (transactionIds.length === 0) {
            alert('Please select transactions to send reminders for.');
            return;
        }
        router.post(
            route('librarian.overdue.sendReminders'),
            { transaction_ids: transactionIds },
            {
                onSuccess: () => {
                    alert(`Reminder emails sent for ${transactionIds.length} transactions.`);
                    setSelectedTransactions([]);
                },
                onError: () => {
                    alert('Failed to send reminders. Please try again.');
                },
            },
        );
    };

    const exportOverdueReport = () => {
        const csvContent = [
            ['Student ID', 'Student Name', 'Student Email', 'Book ISBN', 'Book Title', 'Due Date', 'Days Overdue', 'Fine Amount'],
            ...overdueTransactions.map((t) => {
                const daysOverdue = getDaysOverdue(t.due_date);
                return [
                    t.member_id,
                    t.student_name,
                    t.student_email || 'N/A',
                    t.book_isbn,
                    t.book_title,
                    formatDate(t.due_date),
                    daysOverdue.toString(),
                    `$${calculateFine(daysOverdue)}`,
                ];
            }),
        ];

        const csv = csvContent.map((row) => row.map((field) => `"${field}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `overdue_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const totalFines = overdueTransactions.reduce((total, transaction) => {
        const daysOverdue = getDaysOverdue(transaction.due_date);
        return total + Number.parseFloat(calculateFine(daysOverdue));
    }, 0);

    console.log(overdueTransactions)

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Overdue Books" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="mb-2 text-2xl font-bold text-gray-900">Overdue Books</h1>
                            <p className="text-gray-600">Manage overdue books and send reminder notifications</p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={exportOverdueReport}
                                className="flex items-center space-x-2 rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
                            >
                                <Download className="h-4 w-4" />
                                <span>Export Report</span>
                            </button>
                            <button
                                onClick={() => sendReminders()}
                                disabled={selectedTransactions.length === 0}
                                className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Mail className="h-4 w-4" />
                                <span>Send Reminders ({selectedTransactions.length})</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Overdue</p>
                                <p className="text-3xl font-bold text-red-600">{overdueTransactions.length}</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Fines</p>
                                <p className="text-3xl font-bold text-green-600">${totalFines.toFixed(2)}</p>
                            </div>
                            <BookOpen className="h-8 w-8 text-green-600" />
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Avg Days Overdue</p>
                                <p className="text-3xl font-bold text-orange-600">
                                    {overdueTransactions.length > 0
                                        ? Math.round(
                                              overdueTransactions.reduce((sum, t) => sum + getDaysOverdue(t.due_date), 0) /
                                                  overdueTransactions.length,
                                          )
                                        : 0}
                                </p>
                            </div>
                            <Clock className="h-8 w-8 text-orange-600" />
                        </div>
                    </div>
                </div>

                {/* Overdue Transactions */}
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Overdue Transactions ({overdueTransactions.length})</h2>
                            {overdueTransactions.length > 0 && (
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedTransactions.length === overdueTransactions.length}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-600">Select All</span>
                                </label>
                            )}
                        </div>
                    </div>

                    {overdueTransactions.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {overdueTransactions.map((transaction) => {
                                const daysOverdue = getDaysOverdue(transaction.due_date);
                                const fine = calculateFine(daysOverdue);

                                return (
                                    <div key={transaction.id} className="p-6 hover:bg-gray-50">
                                        <div className="flex items-center space-x-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedTransactions.includes(transaction.id)}
                                                onChange={() => handleSelectTransaction(transaction.id)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />

                                            <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-4">
                                                {/* Student Info */}
                                                <div className="flex items-center space-x-3">
                                                    <User className="h-8 w-8 text-gray-400" />
                                                    <div>
                                                        <div className="font-medium text-gray-900">{transaction.student_name}</div>
                                                        <div className="text-sm text-gray-500">{transaction.member_id}</div>
                                                        {transaction.student_email && (
                                                            <div className="text-sm text-gray-500">{transaction.student_email}</div>
                                                        )}
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
                                                        Due: {formatDate(transaction.due_date)}
                                                    </div>
                                                    <div className="flex items-center text-sm text-red-600">
                                                        <Clock className="mr-2 h-4 w-4" />
                                                        {daysOverdue} days overdue
                                                    </div>
                                                </div>

                                                {/* Fine Info */}
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-red-600">${fine}</div>
                                                    <div className="text-sm text-gray-500">Fine Amount</div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => sendReminders([transaction.id])}
                                                    className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                                                    title="Send Reminder"
                                                >
                                                    <Mail className="h-4 w-4" />
                                                </button>
                                                {transaction.student_phone && (
                                                    <button
                                                        onClick={() => window.open(`tel:${transaction.student_phone}`)}
                                                        className="rounded-lg p-2 text-green-600 transition-colors hover:bg-green-50"
                                                        title="Call Student"
                                                    >
                                                        <Phone className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                            <p>No overdue books found.</p>
                            <p className="mt-1 text-sm">All books are returned on time!</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
