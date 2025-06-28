'use client';
import type React from 'react';
import { useEffect, useState } from 'react';

import { Head, useForm } from '@inertiajs/react';
import axios from 'axios';
import { BookOpen, Edit, Plus, Search, Trash2 } from 'lucide-react';
import AppLayout from '../../layouts/app-layout';
import type { Book, BreadcrumbItem } from '../../types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Books', href: '/admin/books' },
];

export default function AdminBooks() {
    const [books, setBooks] = useState<Book[]>([]);
    const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingBook, setEditingBook] = useState<Book | null>(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        isbn: '',
        title: '',
        author: '',
        publisher: '',
        publication_year: '',
        category: '',
        available: true,
    });

    useEffect(() => {
        fetchBooks();
    }, []);

    useEffect(() => {
        filterBooks();
    }, [books, searchTerm]);

    const fetchBooks = async () => {
        try {
            const response = await axios.get('/api/admin/books');
            setBooks(response.data);
        } catch (error) {
            console.error('Failed to fetch books:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterBooks = () => {
        let filtered = [...books];

        if (searchTerm) {
            filtered = filtered.filter(
                (book) =>
                    book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    book.isbn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    book.category?.toLowerCase().includes(searchTerm.toLowerCase()),
            );
        }

        setFilteredBooks(filtered);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingBook) {
                await axios.put(`/api/admin/books/${editingBook.id}`, data);
            } else {
                await axios.post('/api/admin/books', data);
            }

            await fetchBooks();
            handleCloseModal();
            alert(editingBook ? 'Book updated successfully!' : 'Book added successfully!');
        } catch (error: any) {
            console.error('Failed to save book:', error);
            if (error.response?.data?.errors) {
                // Handle validation errors
                alert('Please check the form for errors.');
            } else {
                alert('Failed to save book. Please try again.');
            }
        }
    };

    const handleEdit = (book: Book) => {
        setEditingBook(book);
        setData({
            isbn: book.isbn || '',
            title: book.title || '',
            author: book.author || '',
            publisher: book.publisher || '',
            publication_year: book.publication_year?.toString() || '',
            category: book.category || '',
            available: book.available ?? true,
        });
        setShowAddModal(true);
    };

    const handleDelete = async (book: Book) => {
        if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
            try {
                await axios.delete(`/api/admin/books/${book.id}`);
                await fetchBooks();
                alert('Book deleted successfully!');
            } catch (error) {
                console.error('Failed to delete book:', error);
                alert('Failed to delete book. Please try again.');
            }
        }
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setEditingBook(null);
        reset();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Books" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="mb-2 text-2xl font-bold text-gray-900">Book Management</h1>
                            <p className="text-gray-600">Add, edit, and manage your library's book collection</p>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Add Book</span>
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search books by title, author, ISBN, or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Books Table */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900">Books ({filteredBooks.length})</h2>
                    </div>

                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-500">Loading books...</p>
                        </div>
                    ) : filteredBooks.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Book Details
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Author</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {filteredBooks.map((book) => (
                                        <tr key={book.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <BookOpen className="mr-3 h-8 w-8 text-gray-400" />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{book.title}</div>
                                                        <div className="text-sm text-gray-500">ISBN: {book.isbn}</div>
                                                        {book.publisher && (
                                                            <div className="text-sm text-gray-500">
                                                                {book.publisher} ({book.publication_year})
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">{book.author}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                                    {book.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        book.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {book.available ? 'Available' : 'Borrowed'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                                                <div className="flex space-x-2">
                                                    <button onClick={() => handleEdit(book)} className="text-blue-600 hover:text-blue-900">
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(book)} className="text-red-600 hover:text-red-900">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                            <p>No books found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
                    <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">{editingBook ? 'Edit Book' : 'Add New Book'}</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">ISBN</label>
                                <input
                                    type="text"
                                    value={data.isbn}
                                    onChange={(e) => setData('isbn', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Author</label>
                                <input
                                    type="text"
                                    value={data.author}
                                    onChange={(e) => setData('author', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Publisher</label>
                                <input
                                    type="text"
                                    value={data.publisher}
                                    onChange={(e) => setData('publisher', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Publication Year</label>
                                <input
                                    type="number"
                                    value={data.publication_year}
                                    onChange={(e) => setData('publication_year', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                                <select
                                    value={data.category}
                                    onChange={(e) => setData('category', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    <option value="Fiction">Fiction</option>
                                    <option value="Non-Fiction">Non-Fiction</option>
                                    <option value="Science">Science</option>
                                    <option value="Technology">Technology</option>
                                    <option value="History">History</option>
                                    <option value="Biography">Biography</option>
                                    <option value="Education">Education</option>
                                    <option value="Reference">Reference</option>
                                </select>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="available"
                                    checked={data.available}
                                    onChange={(e) => setData('available', e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="available" className="ml-2 text-sm text-gray-700">
                                    Available for borrowing
                                </label>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {processing ? 'Saving...' : editingBook ? 'Update Book' : 'Add Book'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 rounded-lg bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
