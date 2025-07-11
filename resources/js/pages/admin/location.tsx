'use client';

import { Head, router, usePage } from '@inertiajs/react';
import { AlertTriangle, Edit, MapPin, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLayout from '../../layouts/app-layout';
import type { BreadcrumbItem, PageProps, ToastMessage } from '../../types';

interface Shelf {
    id: number;
    floor: string;
    shelf_number: string;
    description: string | null;
    book_count: number;
}

interface ShelvesPageProps extends PageProps {
    shelves: {
        data: Shelf[];
        current_page: number;
        last_page: number;
        links: { url: string | null; label: string; active: boolean }[];
        total: number;
    };
    filters: {
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Manage Locations', href: '/admin/location' },
];

export default function AdminLocation() {
    const { shelves, filters, errors, success } = usePage<ShelvesPageProps>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingShelf, setEditingShelf] = useState<Shelf | null>(null);
    const [deletingShelf, setDeletingShelf] = useState<Shelf | null>(null);
    const [form, setForm] = useState({ floor: '', shelf_number: '', description: '' });
    const [formErrors, setFormErrors] = useState<{ floor?: string; shelf_number?: string }>({});
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
        router.get(route('admin.shelves.index'), { search }, { preserveState: true, replace: true });
    };

    const handlePageChange = (url: string | null) => {
        if (url) router.get(url, { search }, { preserveState: true });
    };

    const openModal = (shelf: Shelf | null = null) => {
        setEditingShelf(shelf);
        setForm(
            shelf
                ? { floor: shelf.floor, shelf_number: shelf.shelf_number, description: shelf.description || '' }
                : { floor: '', shelf_number: '', description: '' },
        );
        setFormErrors({});
        setIsModalOpen(true);
    };

    const validateForm = () => {
        const errors: { floor?: string; shelf_number?: string } = {};
        if (!form.floor.trim()) errors.floor = 'Floor is required';
        if (!form.shelf_number.trim()) errors.shelf_number = 'Shelf number is required';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = () => {
        if (!validateForm()) return;
        setIsSubmitting(true);

        if (editingShelf) {
            router.put(route('admin.shelves.update', editingShelf.id), form, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingShelf(null);
                    setIsSubmitting(false);
                },
                onError: (errors) => {
                    Object.values(errors).forEach((error) => showToast('error', error));
                    setIsSubmitting(false);
                },
            });
        } else {
            router.post(route('admin.shelves.store'), form, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setIsSubmitting(false);
                },
                onError: (errors) => {
                    Object.values(errors).forEach((error) => showToast('error', error));
                    setIsSubmitting(false);
                },
            });
        }
    };

    const openDeleteModal = (shelf: Shelf) => {
        setDeletingShelf(shelf);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = () => {
        if (deletingShelf) {
            router.delete(route('admin.shelves.destroy', deletingShelf.id), {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setDeletingShelf(null);
                },
                onError: (errors) => {
                    Object.values(errors).forEach((error) => showToast('error', error));
                    setIsDeleteModalOpen(false);
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Locations" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                {/* Header */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col items-center justify-between sm:flex-row">
                        <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-gray-900">
                            <MapPin className="h-6 w-6 text-blue-600" />
                            Manage Locations
                        </h1>
                        <div>
                            <button
                                onClick={() => openModal()}
                                className="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                                aria-label="Add new shelf"
                            >
                                <span>Add Shelf</span>
                            </button>
                        </div>
                    </div>
                    <p className="mt-2 text-gray-600">Add, edit, or remove shelves from the library.</p>
                </div>

                {/* Filters */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Search</label>
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by floor, shelf number, or description..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleFilterChange()}
                                    className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                    aria-label="Search shelves"
                                />
                            </div>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setSearch('');
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

                {/* Shelves Table */}
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900">Shelves ({shelves.total})</h2>
                    </div>
                    {shelves.data.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Location
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Description
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Books
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {shelves.data.map((shelf) => (
                                        <tr key={shelf.id} className="transition-colors hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <MapPin className="mr-3 h-8 w-8 text-gray-400" />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{shelf.floor}</div>
                                                        <div className="text-sm text-gray-500">Shelf {shelf.shelf_number}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">{shelf.description || 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">{shelf.book_count}</td>
                                            <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                                                <button
                                                    onClick={() => openModal(shelf)}
                                                    className="mr-4 text-blue-600 transition-colors hover:text-blue-900"
                                                    aria-label={`Edit shelf ${shelf.floor}, ${shelf.shelf_number}`}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(shelf)}
                                                    className="text-red-600 transition-colors hover:text-red-900"
                                                    aria-label={`Delete shelf ${shelf.floor}, ${shelf.shelf_number}`}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            <MapPin className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                            <p>No shelves found.</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {shelves.last_page > 1 && (
                        <div className="flex justify-center space-x-2 p-6">
                            {shelves.links.map((link, index) => (
                                <button
                                    key={index}
                                    onClick={() => handlePageChange(link.url)}
                                    className={`rounded-lg px-4 py-2 ${
                                        link.active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    } transition-colors`}
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

                {/* Modal for Add/Edit Shelf */}
                {isModalOpen && (
                    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
                        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                            <h2 className="mb-4 text-xl font-bold text-gray-900">{editingShelf ? 'Edit Shelf' : 'Add Shelf'}</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Floor</label>
                                    <input
                                        type="text"
                                        value={form.floor}
                                        onChange={(e) => setForm({ ...form, floor: e.target.value })}
                                        className={`w-full rounded-lg border px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                                            formErrors.floor || errors.floor ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        aria-label="Shelf floor"
                                    />
                                    {(formErrors.floor || errors.floor) && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.floor || errors.floor}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Shelf Number</label>
                                    <input
                                        type="text"
                                        value={form.shelf_number}
                                        onChange={(e) => setForm({ ...form, shelf_number: e.target.value })}
                                        className={`w-full rounded-lg border px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                                            formErrors.shelf_number || errors.shelf_number ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        aria-label="Shelf number"
                                    />
                                    {(formErrors.shelf_number || errors.shelf_number) && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.shelf_number || errors.shelf_number}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <input
                                        type="text"
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                        aria-label="Shelf description"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setEditingShelf(null);
                                        setFormErrors({});
                                    }}
                                    className="rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
                                    aria-label="Cancel"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className={`rounded-lg px-4 py-2 text-white transition-colors ${
                                        isSubmitting ? 'cursor-not-allowed bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                    aria-label={editingShelf ? 'Update shelf' : 'Add shelf'}
                                >
                                    {isSubmitting ? 'Submitting...' : editingShelf ? 'Update' : 'Add'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal for Delete Confirmation */}
                {isDeleteModalOpen && deletingShelf && (
                    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
                        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                            <h2 className="mb-4 text-xl font-bold text-gray-900">Confirm Delete</h2>
                            <p className="text-gray-600">
                                Are you sure you want to delete{' '}
                                <span className="font-semibold">
                                    {deletingShelf.floor}, Shelf {deletingShelf.shelf_number}
                                </span>
                                ? Books assigned to this shelf will be unassigned.
                            </p>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
                                    aria-label="Cancel delete"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
                                    aria-label={`Delete shelf ${deletingShelf.floor}, ${deletingShelf.shelf_number}`}
                                >
                                    Delete
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
