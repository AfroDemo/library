'use client';

import { Head, usePage } from '@inertiajs/react';
import { BookOpen, Search } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '../../layouts/app-layout';
import type { Book, BreadcrumbItem, PageProps } from '../../types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Search Books', href: '/user/search' },
];

interface BooksPageProps extends PageProps {
    books: {
        data: Book[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        available?: string;
    };
}

export default function UserBookSearch() {
    const { books, filters } = usePage<BooksPageProps>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [available, setAvailable] = useState(filters.available || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        window.location.href = `/user/search?search=${encodeURIComponent(search)}${available ? `&available=${available}` : ''}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Search Books" />
            <div className="flex flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="mb-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h1 className="mb-2 text-2xl font-bold text-gray-900">Search Books</h1>
                    <form onSubmit={handleSearch} className="flex flex-col items-center gap-3 md:flex-row">
                        <div className="flex flex-1 items-center gap-2">
                            <Search className="h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by title, author, or ISBN..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <select
                            value={available}
                            onChange={(e) => setAvailable(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All</option>
                            <option value="true">Available Only</option>
                            <option value="false">Unavailable Only</option>
                        </select>
                        <button type="submit" className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
                            Search
                        </button>
                    </form>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900">Results ({books.data.length})</h2>
                    </div>
                    {books.data.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {books.data.map((book) => (
                                <div key={book.id} className="flex items-center space-x-4 p-6 hover:bg-gray-50">
                                    <BookOpen className="h-8 w-8 text-gray-400" />
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">{book.title}</div>
                                        <div className="text-sm text-gray-500">{book.author}</div>
                                        <div className="text-sm text-gray-500">ISBN: {book.isbn}</div>
                                        <div className="text-sm text-gray-500">
                                            Location: {book.shelf ? `${book.shelf.floor}, Shelf ${book.shelf.shelf_number}` : 'Not assigned'}
                                        </div>
                                    </div>
                                    <div>
                                        {book.available ? (
                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                Available
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                                Unavailable
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                            <p>No books found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
