'use client';

import { Head, router, usePage } from '@inertiajs/react';
import { AlertTriangle, BookOpen, Download, Edit, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLayout from '../../layouts/app-layout';
import type { BreadcrumbItem, PageProps, Shelf, ToastMessage } from '../../types';

interface Book {
    id: number;
    title: string;
    author: string;
    isbn: string;
    available: boolean;
    shelf?: Shelf;
}

interface BooksPageProps extends PageProps {
    books: {
        data: Book[];
        current_page: number;
        last_page: number;
        links: { url: string | null; label: string; active: boolean }[];
        total: number;
    };
    filters: {
        search?: string;
        available?: string;
    };
    shelves: Shelf[] | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Manage Books', href: '/admin/books' },
];

export default function AdminBooks() {
    const { books, filters, shelves = [], errors, success } = usePage<BooksPageProps>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [available, setAvailable] = useState(filters.available || '');
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingBook, setEditingBook] = useState<Book | null>(null);
    const [deletingBook, setDeletingBook] = useState<Book | null>(null);
    const [form, setForm] = useState({ title: '', author: '', isbn: '', shelf_id: '', available: true });
    const [formErrors, setFormErrors] = useState<{ title?: string; author?: string; isbn?: string }>({});
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
        router.get(route('admin.books.index'), { search, available }, { preserveState: true, replace: true });
    };

    const handlePageChange = (url: string | null) => {
        if (url) router.get(url, { search, available }, { preserveState: true });
    };

    const exportBooks = () => {
        const csvContent = [
            ['ID', 'Title', 'Author', 'ISBN', 'Available', 'Floor', 'Shelf Number'],
            ...books.data.map((book) => [
                book.id,
                `"${book.title.replace(/"/g, '""')}"`,
                `"${book.author.replace(/"/g, '""')}"`,
                book.isbn,
                book.available ? 'Yes' : 'No',
                book.shelf?.floor || 'N/A',
                book.shelf?.shelf_number || 'N/A',
            ]),
        ];
        const csv = csvContent.map((row) => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `books_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const openModal = (book: Book | null = null) => {
        setEditingBook(book);
        setForm(
            book
                ? { title: book.title, author: book.author, isbn: book.isbn, shelf_id: book.shelf?.id.toString() || '', available: book.available }
                : { title: '', author: '', isbn: '', shelf_id: '', available: true },
        );
        setFormErrors({});
        setIsModalOpen(true);
    };

    const validateForm = () => {
        const errors: { title?: string; author?: string; isbn?: string } = {};
        if (!form.title.trim()) errors.title = 'Title is required';
        if (!form.author.trim()) errors.author = 'Author is required';
        if (!form.isbn.trim()) errors.isbn = 'ISBN is required';
        else if (form.isbn.length !== 10) errors.isbn = 'ISBN must be 10 characters';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = () => {
        if (!validateForm()) return;
        setIsSubmitting(true);

        if (editingBook) {
            router.put(route('admin.books.update', editingBook.id), form, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingBook(null);
                    setIsSubmitting(false);
                },
                onError: (errors) => {
                    Object.values(errors).forEach((error) => showToast('error', error));
                    setIsSubmitting(false);
                },
            });
        } else {
            router.post(route('admin.books.store'), form, {
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

    const openDeleteModal = (book: Book) => {
        setDeletingBook(book);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = () => {
        if (deletingBook) {
            router.delete(route('admin.books.destroy', deletingBook.id), {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setDeletingBook(null);
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
            <Head title="Manage Books" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                {/* Header */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col items-center justify-between sm:flex-row">
                        <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-gray-900">
                            <BookOpen className="h-6 w-6 text-blue-600" />
                            Manage Books
                        </h1>
                        <div className="flex gap-3">
                            <button
                                onClick={exportBooks}
                                className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                                aria-label="Export books as CSV"
                            >
                                <Download className="h-4 w-4" />
                                <span>Export CSV</span>
                            </button>
                            <button
                                onClick={() => openModal()}
                                className="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                                aria-label="Add new book"
                            >
                                <span>Add Book</span>
                            </button>
                        </div>
                    </div>
                    <p className="mt-2 text-gray-600">Add, edit, or remove books from the library collection.</p>
                </div>

                {/* Filters */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Search</label>
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by title, author, or ISBN..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleFilterChange()}
                                    className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                    aria-label="Search books"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Availability</label>
                            <select
                                value={available}
                                onChange={(e) => {
                                    setAvailable(e.target.value);
                                    handleFilterChange();
                                }}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                aria-label="Filter by availability"
                            >
                                <option value="">All</option>
                                <option value="true">Available</option>
                                <option value="false">Unavailable</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setAvailable('');
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

                {/* Books Table */}
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900">Books ({books.total})</h2>
                    </div>
                    {books.data.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Book
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            ISBN
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Location
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {books.data.map((book) => (
                                        <tr key={book.id} className="transition-colors hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <BookOpen className="mr-3 h-8 w-8 text-gray-400" />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{book.title}</div>
                                                        <div className="text-sm text-gray-500">{book.author}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">{book.isbn}</td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                {book.shelf ? `${book.shelf.floor}, Shelf ${book.shelf.shelf_number}` : 'Not assigned'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        book.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {book.available ? 'Available' : 'Unavailable'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                                                <button
                                                    onClick={() => openModal(book)}
                                                    className="mr-4 text-blue-600 transition-colors hover:text-blue-900"
                                                    aria-label={`Edit book ${book.title}`}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(book)}
                                                    className="text-red-600 transition-colors hover:text-red-900"
                                                    aria-label={`Delete book ${book.title}`}
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
                            <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                            <p>No books found.</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {books.last_page > 1 && (
                        <div className="flex justify-center space-x-2 p-6">
                            {books.links.map((link, index) => (
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

                {/* Modal for Add/Edit Book */}
                {isModalOpen && (
                    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
                        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                            <h2 className="mb-4 text-xl font-bold text-gray-900">{editingBook ? 'Edit Book' : 'Add Book'}</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Title</label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        className={`w-full rounded-lg border px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                                            formErrors.title || errors.title ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        aria-label="Book title"
                                    />
                                    {(formErrors.title || errors.title) && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.title || errors.title}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Author</label>
                                    <input
                                        type="text"
                                        value={form.author}
                                        onChange={(e) => setForm({ ...form, author: e.target.value })}
                                        className={`w-full rounded-lg border px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                                            formErrors.author || errors.author ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        aria-label="Book author"
                                    />
                                    {(formErrors.author || errors.author) && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.author || errors.author}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">ISBN</label>
                                    <input
                                        type="text"
                                        value={form.isbn}
                                        onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                                        className={`w-full rounded-lg border px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                                            formErrors.isbn || errors.isbn ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        aria-label="Book ISBN"
                                    />
                                    {(formErrors.isbn || errors.isbn) && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.isbn || errors.isbn}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Shelf Location</label>
                                    <select
                                        value={form.shelf_id}
                                        onChange={(e) => setForm({ ...form, shelf_id: e.target.value })}
                                        className={`w-full rounded-lg border px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                                            errors.shelf_id ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        aria-label="Shelf location"
                                    >
                                        <option value="">No shelf</option>
                                        {shelves && shelves.length > 0 ? (
                                            shelves.map((shelf) => (
                                                <option key={shelf.id} value={shelf.id}>
                                                    {shelf.floor}, Shelf {shelf.shelf_number}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>
                                                No shelves available
                                            </option>
                                        )}
                                    </select>
                                    {errors.shelf_id && <p className="mt-1 text-sm text-red-600">{errors.shelf_id}</p>}
                                </div>
                                <div>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={form.available}
                                            onChange={(e) => setForm({ ...form, available: e.target.checked })}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            aria-label="Book availability"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Available</span>
                                    </label>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setEditingBook(null);
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
                                    aria-label={editingBook ? 'Update book' : 'Add book'}
                                >
                                    {isSubmitting ? 'Submitting...' : editingBook ? 'Update' : 'Add'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal for Delete Confirmation */}
                {isDeleteModalOpen && deletingBook && (
                    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
                        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                            <h2 className="mb-4 text-xl font-bold text-gray-900">Confirm Delete</h2>
                            <p className="text-gray-600">
                                Are you sure you want to delete <span className="font-semibold">{deletingBook.title}</span>?
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
                                    aria-label={`Delete book ${deletingBook.title}`}
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
