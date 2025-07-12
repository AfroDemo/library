'use client';

import { Head, router, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle, Info, Settings as SettingsIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLayout from '../../layouts/app-layout';
import type { PageProps, Settings, ToastMessage } from '../../types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Settings', href: '/admin/settings' },
];

export default function SettingsPage() {
    const {
        settings: initialSettings,
        errors,
        success,
    } = usePage<PageProps & { settings: Settings; errors: Record<string, string>; success?: string | null }>().props;
    const [settings, setSettings] = useState<Settings>({
        loan_duration_days: initialSettings.loan_duration_days,
        max_books_per_user: initialSettings.max_books_per_user,
        overdue_fine_per_day: initialSettings.overdue_fine_per_day,
    });
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (success) {
            showToast('success', success);
        }
        if (errors && Object.values(errors).length > 0) {
            Object.values(errors).forEach((error) => showToast('error', error));
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings((prev) => ({
            ...prev,
            [name]: name === 'overdue_fine_per_day' ? parseFloat(value) : parseInt(value, 10),
        }));
    };

    const handleSubmit = () => {
        setIsSubmitting(true);
        router.post('/admin/settings', settings, {
            onSuccess: () => {
                showToast('success', 'Settings updated successfully');
                setIsSubmitting(false);
            },
            onError: (errors) => {
                Object.values(errors).forEach((error) => showToast('error', error));
                setIsSubmitting(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Library Settings" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white shadow-sm">
                    <div className="flex items-center space-x-4">
                        <div className="rounded-full bg-white/20 p-3">
                            <SettingsIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Library Settings</h1>
                            <p className="text-blue-100">Manage loan policies and fine settings</p>
                        </div>
                    </div>
                </div>

                {/* Settings Form */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">General Settings</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Loan Duration (days)</label>
                            <input
                                type="number"
                                name="loan_duration_days"
                                value={settings.loan_duration_days}
                                onChange={handleChange}
                                min="1"
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                aria-label="Loan duration in days"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Max Books Per User</label>
                            <input
                                type="number"
                                name="max_books_per_user"
                                value={settings.max_books_per_user}
                                onChange={handleChange}
                                min="1"
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                aria-label="Maximum books per user"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Overdue Fine Per Day ($)</label>
                            <input
                                type="number"
                                name="overdue_fine_per_day"
                                value={settings.overdue_fine_per_day}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                aria-label="Overdue fine per day"
                            />
                            <p className="mt-1 flex items-center text-sm text-gray-500">
                                <Info className="mr-1 h-4 w-4" />
                                Changing this will update existing unpaid fines for overdue books overnight.
                            </p>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className={`rounded-lg px-4 py-2 text-white ${isSubmitting ? 'cursor-not-allowed bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                                aria-label="Save settings"
                            >
                                {isSubmitting ? 'Saving...' : 'Save Settings'}
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
                            {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
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
