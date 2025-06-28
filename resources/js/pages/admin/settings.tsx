'use client';

import { Head, router, usePage } from '@inertiajs/react';
import { AlertTriangle, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLayout from '../../layouts/app-layout';
import type { BreadcrumbItem, PageProps, ToastMessage } from '../../types';

interface Settings {
    loan_duration_days: number;
    max_books_per_user: number;
    overdue_fine_per_day: number;
}

interface SettingsPageProps extends PageProps {
    settings: Settings;
    errors?: any;
    success?: string | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'System Settings', href: '/admin/settings' },
];

export default function SystemSettings() {
    const { settings, errors, success } = usePage<SettingsPageProps>().props;
    const [form, setForm] = useState(settings);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        if (success) showToast('success', success);
        if (errors && Object.values(errors).length > 0) {
            Object.values(errors).forEach((error: any) => showToast('error', error));
        }
    }, [success, errors]);

    const showToast = (type: ToastMessage['type'], message: string) => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { type, message, id }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const handleSubmit = () => {
        router.post(route('admin.settings.update'), form);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="System Settings" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-gray-900">
                        <Settings className="h-6 w-6 text-blue-600" />
                        System Settings
                    </h1>
                    <p className="text-gray-600">Configure library policies and system-wide settings.</p>
                </div>

                {/* Settings Form */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Loan Duration (days)</label>
                            <input
                                type="number"
                                value={form.loan_duration_days}
                                onChange={(e) => setForm({ ...form, loan_duration_days: parseInt(e.target.value) })}
                                className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                aria-label="Loan duration in days"
                                min="1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Max Books per User</label>
                            <input
                                type="number"
                                value={form.max_books_per_user}
                                onChange={(e) => setForm({ ...form, max_books_per_user: parseInt(e.target.value) })}
                                className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                aria-label="Maximum books per user"
                                min="1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Overdue Fine per Day ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.overdue_fine_per_day}
                                onChange={(e) => setForm({ ...form, overdue_fine_per_day: parseFloat(e.target.value) })}
                                className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                aria-label="Overdue fine per day"
                                min="0"
                            />
                        </div>
                        <div>
                            <button
                                onClick={handleSubmit}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                                aria-label="Save settings"
                            >
                                Save Settings
                            </button>
                        </div>
                    </div>
                </div>

                {/* Toast Notifications */}
                <div className="fixed right-4 bottom-4 z-50 space-y-2">
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
