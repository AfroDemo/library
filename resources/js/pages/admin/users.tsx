'use client';

import { Head, router, usePage } from '@inertiajs/react';
import { AlertTriangle, Download, Edit, Search, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLayout from '../../layouts/app-layout';
import type { BreadcrumbItem, PageProps, ToastMessage } from '../../types';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    member_id: string | null;
}

interface UsersPageProps extends PageProps {
    users: {
        data: User[];
        current_page: number;
        last_page: number;
        links: { url: string | null; label: string; active: boolean }[];
        total: number;
    };
    filters: {
        search?: string;
        role?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Manage Users', href: '/admin/users' },
];

export default function ManageUsers() {
    const { users, filters, errors, success } = usePage<UsersPageProps>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [role, setRole] = useState(filters.role || '');
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [form, setForm] = useState({ name: '', email: '', role: 'student', password: '', member_id: '' });

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
        router.get(route('admin.users.index'), { search, role }, { preserveState: true, replace: true });
    };

    const handlePageChange = (url: string | null) => {
        if (url) router.get(url, { search, role }, { preserveState: true });
    };

    const exportUsers = () => {
        const csvContent = [
            ['ID', 'Name', 'Email', 'Role', 'Member ID'],
            ...users.data.map((user) => [user.id, user.name, user.email, user.role, user.member_id || 'N/A']),
        ];
        const csv = csvContent.map((row) => row.map((field) => `"${field}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const openModal = (user: User | null = null) => {
        setEditingUser(user);
        setForm(
            user
                ? { name: user.name, email: user.email, role: user.role, password: '', member_id: user.member_id || '' }
                : { name: '', email: '', role: 'student', password: '', member_id: '' },
        );
        setIsModalOpen(true);
    };

    const handleSubmit = () => {
        const data = { ...form };
        if (!data.password) delete data.password; // Don't send empty password on update
        if (editingUser) {
            router.put(route('admin.users.update', editingUser.id), data, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingUser(null);
                },
            });
        } else {
            router.post(route('admin.users.store'), data, {
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const handleDelete = (user: User) => {
        if (confirm('Are you sure you want to delete this user?')) {
            router.delete(route('admin.users.destroy', user.id));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Users" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-gray-900">
                            <Users className="h-6 w-6 text-blue-600" />
                            Manage Users
                        </h1>
                        <div className="flex gap-3">
                            <button
                                onClick={exportUsers}
                                className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                                aria-label="Export users as CSV"
                            >
                                <Download className="h-4 w-4" />
                                <span>Export CSV</span>
                            </button>
                            <button
                                onClick={() => openModal()}
                                className="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                                aria-label="Add new user"
                            >
                                <span>Add User</span>
                            </button>
                        </div>
                    </div>
                    <p className="text-gray-600">Manage students, staff, and librarians in the library system.</p>
                </div>

                {/* Filters */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Search</label>
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleFilterChange()}
                                    className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                    aria-label="Search users"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Role</label>
                            <select
                                value={role}
                                onChange={(e) => {
                                    setRole(e.target.value);
                                    handleFilterChange();
                                }}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                aria-label="Filter by role"
                            >
                                <option value="">All Roles</option>
                                <option value="student">Student</option>
                                <option value="staff">Staff</option>
                                <option value="librarian">Librarian</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setRole('');
                                    handleFilterChange();
                                }}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
                                aria-label="Clear filters"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900">Users ({users.total})</h2>
                    </div>
                    {users.data.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            User
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Email
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Role
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Member ID
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {users.data.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">{user.name}</td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">{user.email}</td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900 capitalize">{user.role}</td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">{user.member_id || 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                                                <button
                                                    onClick={() => openModal(user)}
                                                    className="mr-4 text-blue-600 hover:text-blue-900"
                                                    aria-label={`Edit user ${user.name}`}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    className="text-red-600 hover:text-red-900"
                                                    aria-label={`Delete user ${user.name}`}
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
                            <Users className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                            <p>No users found.</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {users.last_page > 1 && (
                        <div className="flex justify-center space-x-2 p-6">
                            {users.links.map((link, index) => (
                                <button
                                    key={index}
                                    onClick={() => handlePageChange(link.url)}
                                    className={`rounded-lg px-4 py-2 ${
                                        link.active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
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

                {/* Modal for Add/Edit User */}
                {isModalOpen && (
                    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
                        <div className="w-full max-w-md rounded-lg bg-white p-6">
                            <h2 className="mb-4 text-xl font-bold text-gray-900">{editingUser ? 'Edit User' : 'Add User'}</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                        aria-label="User name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                        aria-label="User email"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Role</label>
                                    <select
                                        value={form.role}
                                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                        aria-label="User role"
                                    >
                                        <option value="student">Student</option>
                                        <option value="staff">Staff</option>
                                        <option value="librarian">Librarian</option>
                                    </select>
                                </div>
                                {form.role === 'student' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Member ID</label>
                                        <input
                                            type="text"
                                            value={form.member_id}
                                            onChange={(e) => setForm({ ...form, member_id: e.target.value })}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                            aria-label="Student member ID"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Password {editingUser ? '(Optional)' : ''}</label>
                                    <input
                                        type="password"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                        aria-label="User password"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
                                    aria-label="Cancel"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                                    aria-label={editingUser ? 'Update user' : 'Add user'}
                                >
                                    {editingUser ? 'Update' : 'Add'}
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
