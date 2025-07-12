'use client';

import { Head, router, usePage } from '@inertiajs/react';
import { AlertTriangle, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLayout from '../../layouts/app-layout';
import type { PageProps, ToastMessage } from '../../types';

interface ExtensionRequest {
    id: number;
    transaction_id: number;
    book_title: string;
    book_isbn: string;
    student_name: string;
    member_id: string;
    requested_days: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    processed_at: string | null;
    processed_by: string;
}

interface ExtensionRequestsPageProps extends PageProps {
    extensionRequests: {
        data: ExtensionRequest[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Extension Requests', href: '/librarian/extension-requests' },
];

export default function ExtensionRequests() {
    const { extensionRequests, filters, errors, success } = usePage<ExtensionRequestsPageProps>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ExtensionRequest | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleFilterChange = () => {
        router.get(route('librarian.extension-requests'), { search, status }, { preserveState: true, replace: true });
    };

    const handlePageChange = (page: number) => {
        router.get(route('librarian.extension-requests'), { search, status, page }, { preserveState: true, replace: true });
    };

    const openApproveModal = (request: ExtensionRequest) => {
        setSelectedRequest(request);
        setIsApproveModalOpen(true);
    };

    const openRejectModal = (request: ExtensionRequest) => {
        setSelectedRequest(request);
        setIsRejectModalOpen(true);
    };

    const handleProcessRequest = (action: 'approved' | 'rejected') => {
        if (!selectedRequest) return;
        setIsSubmitting(true);

        router.post(
            route('transactions.extension.process', selectedRequest.id),
            { status: action },
            {
                onSuccess: () => {
                    setIsApproveModalOpen(false);
                    setIsRejectModalOpen(false);
                    setSelectedRequest(null);
                    setIsSubmitting(false);
                },
                onError: (errors) => {
                    Object.values(errors).forEach((error) => showToast('error', error));
                    setIsSubmitting(false);
                },
            },
        );
    };

    // Generate pagination links
    const paginationLinks = [];
    const currentPage = extensionRequests.current_page;
    const lastPage = extensionRequests.last_page;
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(lastPage, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (currentPage > 1) {
        paginationLinks.push({ label: 'Previous', page: currentPage - 1, active: false });
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationLinks.push({ label: i.toString(), page: i, active: i === currentPage });
    }

    if (currentPage < lastPage) {
        paginationLinks.push({ label: 'Next', page: currentPage + 1, active: false });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Extension Requests" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                {/* Header */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col items-center justify-between sm:flex-row">
                        <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-gray-900">
                            <BookOpen className="h-6 w-6 text-blue-600" />
                            Manage Extension Requests
                        </h1>
                    </div>
                    <p className="mt-2 text-gray-600">Review and process extension requests for borrowed books.</p>
                </div>

                {/* Filters */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Search</label>
                            <div className="relative">
                                <BookOpen className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by book title, ISBN, or student name..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleFilterChange()}
                                    className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                    aria-label="Search extension requests"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
                            <select
                                value={status}
                                onChange={(e) => {
                                    setStatus(e.target.value);
                                    handleFilterChange();
                                }}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                aria-label="Filter by status"
                            >
                                <option value="">All</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setStatus('');
                                    handleFilterChange();
                                }}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
                                aria-label="Clear filters"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Extension Requests Table */}
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900">Extension Requests ({extensionRequests.total})</h2>
                    </div>
                    {extensionRequests.data.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Book
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Student
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Requested Days
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Requested At
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Processed By
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {extensionRequests.data.map((request) => (
                                        <tr key={request.id} className="transition-colors hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <BookOpen className="mr-3 h-8 w-8 text-gray-400" />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{request.book_title}</div>
                                                        <div className="text-sm text-gray-500">{request.book_isbn}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                {request.student_name} ({request.member_id})
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">{request.requested_days}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        request.status === 'pending'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : request.status === 'approved'
                                                              ? 'bg-green-100 text-green-800'
                                                              : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">{request.created_at}</td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">{request.processed_by}</td>
                                            <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                                                {request.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => openApproveModal(request)}
                                                            className="mr-4 text-green-600 transition-colors hover:text-green-900"
                                                            aria-label={`Approve extension request for ${request.book_title}`}
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => openRejectModal(request)}
                                                            className="text-red-600 transition-colors hover:text-red-900"
                                                            aria-label={`Reject extension request for ${request.book_title}`}
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    </>
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
                            <p>No extension requests found.</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {extensionRequests.last_page > 1 && (
                        <div className="flex justify-center space-x-2 p-6">
                            {paginationLinks.map((link, index) => (
                                <button
                                    key={index}
                                    onClick={() => handlePageChange(link.page)}
                                    className={`rounded-lg px-4 py-2 ${
                                        link.active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    } transition-colors`}
                                    disabled={link.active}
                                    aria-label={
                                        link.label === 'Previous' ? 'Previous page' : link.label === 'Next' ? 'Next page' : `Go to page ${link.label}`
                                    }
                                >
                                    {link.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Approve Modal */}
                {isApproveModalOpen && selectedRequest && (
                    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
                        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                            <h2 className="mb-4 text-xl font-bold text-gray-900">Confirm Approve Extension</h2>
                            <p className="text-gray-600">
                                Are you sure you want to approve the extension request for{' '}
                                <span className="font-semibold">{selectedRequest.book_title}</span> by{' '}
                                <span className="font-semibold">{selectedRequest.student_name}</span> for{' '}
                                <span className="font-semibold">{selectedRequest.requested_days}</span> days?
                            </p>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setIsApproveModalOpen(false);
                                        setSelectedRequest(null);
                                    }}
                                    className="rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
                                    aria-label="Cancel"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleProcessRequest('approved')}
                                    disabled={isSubmitting}
                                    className={`rounded-lg px-4 py-2 text-white transition-colors ${
                                        isSubmitting ? 'cursor-not-allowed bg-green-400' : 'bg-green-600 hover:bg-green-700'
                                    }`}
                                    aria-label="Approve extension"
                                >
                                    {isSubmitting ? 'Processing...' : 'Approve'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reject Modal */}
                {isRejectModalOpen && selectedRequest && (
                    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
                        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                            <h2 className="mb-4 text-xl font-bold text-gray-900">Confirm Reject Extension</h2>
                            <p className="text-gray-600">
                                Are you sure you want to reject the extension request for{' '}
                                <span className="font-semibold">{selectedRequest.book_title}</span> by{' '}
                                <span className="font-semibold">{selectedRequest.student_name}</span> for{' '}
                                <span className="font-semibold">{selectedRequest.requested_days}</span> days?
                            </p>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setIsRejectModalOpen(false);
                                        setSelectedRequest(null);
                                    }}
                                    className="rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
                                    aria-label="Cancel"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleProcessRequest('rejected')}
                                    disabled={isSubmitting}
                                    className={`rounded-lg px-4 py-2 text-white transition-colors ${
                                        isSubmitting ? 'cursor-not-allowed bg-red-400' : 'bg-red-600 hover:bg-red-700'
                                    }`}
                                    aria-label="Reject extension"
                                >
                                    {isSubmitting ? 'Processing...' : 'Reject'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
