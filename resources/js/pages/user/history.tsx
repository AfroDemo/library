import { Head, usePage } from '@inertiajs/react';
import { BookOpen, History } from 'lucide-react';
import AppLayout from '../../layouts/app-layout';
import type { BreadcrumbItem, PageProps, Transaction } from '../../types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'User', href: '/user' },
    { title: 'My History', href: '/user/history' },
];

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
};

export default function UserHistory() {
    const { transactions } = usePage<PageProps & { transactions: Transaction[] }>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Borrowing History" />
            <div className="flex flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="mb-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-gray-900">
                        <History className="h-6 w-6 text-blue-500" /> My Borrowing History
                    </h1>
                    <p className="text-gray-600">View all books you have borrowed, their due dates, and return status.</p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900">History ({transactions.length})</h2>
                    </div>
                    {transactions.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full rounded border border-gray-200 bg-white shadow">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="px-4 py-2 text-left">Title</th>
                                        <th className="px-4 py-2 text-left">ISBN</th>
                                        <th className="px-4 py-2 text-left">Borrowed</th>
                                        <th className="px-4 py-2 text-left">Due</th>
                                        <th className="px-4 py-2 text-left">Returned</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((t) => (
                                        <tr key={t.id} className="border-t hover:bg-gray-50">
                                            <td className="px-4 py-2 font-medium text-gray-900">{t.book_title}</td>
                                            <td className="px-4 py-2 text-gray-700">{t.book_isbn}</td>
                                            <td className="px-4 py-2">{formatDate(t.borrowed_at)}</td>
                                            <td className="px-4 py-2">{formatDate(t.due_date)}</td>
                                            <td className="px-4 py-2">
                                                {t.returned_at ? (
                                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                        {formatDate(t.returned_at)}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                                        Not returned
                                                    </span>
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
                            <p>You have not borrowed any books yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
