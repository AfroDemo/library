'use client';

import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Activity, AlertTriangle, BookOpen, Calendar, Database, Settings, TrendingUp, UserCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLayout from '../../layouts/app-layout';
import type { BreadcrumbItem, DashboardStats, PageProps, ToastMessage } from '../../types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Dashboard', href: '/admin/dashboard' },
];

export default function AdminDashboard() {
    const {
        auth,
        stats: initialStats = {},
        errors,
        success,
    } = usePage<PageProps & { stats?: DashboardStats; errors?: any; success?: string | null }>().props;
    const [stats, setStats] = useState<DashboardStats>(initialStats);
    const [isLoading, setIsLoading] = useState(!initialStats.totalBooks); // Load if no initial stats
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    // Fetch stats dynamically if not provided or on mount
    useEffect(() => {
        if (!initialStats.totalBooks) {
            setIsLoading(true);
            axios
                .get('/api/admin/stats')
                .then((response) => {
                    setStats(response.data);
                    setIsLoading(false);
                })
                .catch((error) => {
                    console.error('Failed to fetch stats:', error);
                    showToast('error', 'Failed to load dashboard statistics');
                    setIsLoading(false);
                });
        }

        // Handle success/error messages from server
        if (success) {
            showToast('success', success);
        }
        if (errors && Object.values(errors).length > 0) {
            Object.values(errors).forEach((error: any) => showToast('error', error));
        }
    }, [success, errors]);

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

    const statCards = [
        {
            title: 'Total Books',
            value: stats.totalBooks || 0,
            icon: BookOpen,
            color: 'bg-blue-500',
            textColor: 'text-blue-600',
        },
        {
            title: 'Total Students',
            value: stats.totalStudents || 0,
            icon: Users,
            color: 'bg-green-500',
            textColor: 'text-green-600',
        },
        {
            title: 'Total Librarians',
            value: stats.totalLibrarians || 0,
            icon: UserCheck,
            color: 'bg-indigo-500',
            textColor: 'text-indigo-600',
        },
        {
            title: 'Overdue Books',
            value: stats.overdueBooks || 0,
            icon: AlertTriangle,
            color: 'bg-red-500',
            textColor: 'text-red-600',
        },
        {
            title: 'Active Transactions',
            value: stats.activeTransactions || 0,
            icon: Activity,
            color: 'bg-purple-500',
            textColor: 'text-purple-600',
        },
        {
            title: 'Today’s Transactions',
            value: stats.recentTransactions || 0,
            icon: Calendar,
            color: 'bg-yellow-500',
            textColor: 'text-yellow-600',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Welcome Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-gray-900">
                        <Database className="h-6 w-6 text-blue-600" />
                        Welcome back, {auth.user.name}
                    </h1>
                    <p className="text-gray-600">
                        Oversee library operations, manage users, and monitor system performance from this central dashboard.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {statCards.map((card, index) => (
                        <div
                            key={index}
                            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-transform hover:scale-105"
                            aria-label={`${card.title}: ${isLoading ? 'Loading' : card.value}`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                                    <p className="text-3xl font-bold text-gray-900">{isLoading ? '...' : card.value.toLocaleString()}</p>
                                </div>
                                <div className={`rounded-full p-3 ${card.color}`}>
                                    <card.icon className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                            <Database className="mr-2 h-5 w-5 text-blue-600" />
                            System Management
                        </h3>
                        <div className="space-y-3">
                            <a
                                href="/admin/books"
                                className="block rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                                aria-label="Manage books"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-900">Manage Books</span>
                                    <BookOpen className="h-4 w-4 text-gray-400" />
                                </div>
                                <p className="mt-1 text-sm text-gray-600">Add, edit, and organize your book collection</p>
                            </a>
                            <a
                                href="/admin/users"
                                className="block rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                                aria-label="Manage users"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-900">Manage Users</span>
                                    <Users className="h-4 w-4 text-gray-400" />
                                </div>
                                <p className="mt-1 text-sm text-gray-600">Manage students, staff, and librarians</p>
                            </a>
                            <a
                                href="/admin/librarians"
                                className="block rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                                aria-label="Manage librarians"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-900">Manage Librarians</span>
                                    <UserCheck className="h-4 w-4 text-gray-400" />
                                </div>
                                <p className="mt-1 text-sm text-gray-600">Add or remove librarian accounts</p>
                            </a>
                            <a
                                href="/admin/settings"
                                className="block rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                                aria-label="System settings"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-900">System Settings</span>
                                    <Settings className="h-4 w-4 text-gray-400" />
                                </div>
                                <p className="mt-1 text-sm text-gray-600">Configure library policies and settings</p>
                            </a>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                            <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
                            Reports & Analytics
                        </h3>
                        <div className="space-y-3">
                            <a
                                href="/admin/reports/popular-books"
                                className="block rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                                aria-label="Popular books report"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-900">Popular Books</span>
                                    <TrendingUp className="h-4 w-4 text-gray-400" />
                                </div>
                                <p className="mt-1 text-sm text-gray-600">Most borrowed books and trends</p>
                            </a>
                            <a
                                href="/admin/reports/overdue"
                                className="block rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                                aria-label="Overdue books report"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-900">Overdue Reports</span>
                                    <AlertTriangle className="h-4 w-4 text-gray-400" />
                                </div>
                                <p className="mt-1 text-sm text-gray-600">Track overdue books and notifications</p>
                            </a>
                            <a
                                href="/admin/reports/usage"
                                className="block rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                                aria-label="Usage statistics report"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-900">Usage Statistics</span>
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                </div>
                                <p className="mt-1 text-sm text-gray-600">Library usage patterns and metrics</p>
                            </a>
                        </div>
                    </div>
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
