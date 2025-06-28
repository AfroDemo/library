'use client';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { AlertTriangle, BookOpen, Calendar, CheckCircle, Clock, Search, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLayout from '../../layouts/app-layout';
import type { BreadcrumbItem, DashboardStats, PageProps, Transaction } from '../../types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'My Library', href: '/user' },
    { title: 'Dashboard', href: '/user/dashboard' },
];

export default function UserDashboard() {
    const { auth } = usePage<PageProps>().props;
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<DashboardStats>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const [transactionsResponse, statsResponse] = await Promise.all([
                axios.get('/api/user/transactions'),
                axios.get('/api/user/dashboard-stats'),
            ]);

            setTransactions(transactionsResponse.data);
            setStats(statsResponse.data);
        } catch (error) {
            console.error('Failed to fetch user data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const isOverdue = (dueDate: string) => {
        return new Date(dueDate) < new Date() && !transactions.find((t) => t.due_date === dueDate)?.returned_at;
    };

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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Books Borrowed</p>
                                <p className="text-3xl font-bold text-gray-900">{isLoading ? '...' : stats.myBorrowedBooks || 0}</p>
                            </div>
                            <BookOpen className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Loans</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {isLoading ? '...' : transactions.filter((t) => !t.returned_at).length}
                                </p>
                            </div>
                            <Calendar className="h-8 w-8 text-green-600" />
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Overdue Books</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {isLoading ? '...' : transactions.filter((t) => !t.returned_at && isOverdue(t.due_date)).length}
                                </p>
                            </div>
                            <Clock className="h-8 w-8 text-red-600" />
                        </div>
                    </div>
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
                                                isOverdue(transaction.due_date) ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
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
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    {isOverdue(transaction.due_date) ? (
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
            </div>
        </AppLayout>
    );
}
