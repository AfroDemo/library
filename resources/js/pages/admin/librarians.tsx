'use client';

import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import AppLayout from '../../layouts/app-layout';
import { UserCheck, Search, Download, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import type { PageProps, ToastMessage, BreadcrumbItem } from '../../types';

interface Librarian {
  id: number;
  name: string;
  email: string;
}

interface LibrariansPageProps extends PageProps {
  librarians: {
    data: Librarian[];
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
  { title: 'Admin', href: '/admin' },
  { title: 'Manage Librarians', href: '/admin/librarians' },
];

export default function ManageLibrarians() {
  const { librarians, filters, errors, success } = usePage<LibrariansPageProps>().props;
  const [search, setSearch] = useState(filters.search || '');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLibrarian, setEditingLibrarian] = useState<Librarian | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

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
    router.get(route('admin.librarians.index'), { search }, { preserveState: true, replace: true });
  };

  const handlePageChange = (url: string | null) => {
    if (url) router.get(url, { search }, { preserveState: true });
  };

  const exportLibrarians = () => {
    const csvContent = [
      ['ID', 'Name', 'Email'],
      ...librarians.data.map((librarian) => [librarian.id, librarian.name, librarian.email]),
    ];
    const csv = csvContent.map((row) => row.map((field) => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `librarians_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const openModal = (librarian: Librarian | null = null) => {
    setEditingLibrarian(librarian);
    setForm(librarian ? { name: librarian.name, email: librarian.email, password: '' } : { name: '', email: '', password: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    const data = { ...form };
    if (!data.password) delete data.password; // Don't send empty password on update
    if (editingLibrarian) {
      router.put(route('admin.librarians.update', editingLibrarian.id), data, {
        onSuccess: () => {
          setIsModalOpen(false);
          setEditingLibrarian(null);
        },
      });
    } else {
      router.post(route('admin.librarians.store'), data, {
        onSuccess: () => setIsModalOpen(false),
      });
    }
  };

  const handleDelete = (librarian: Librarian) => {
    if (confirm('Are you sure you want to delete this librarian?')) {
      router.delete(route('admin.librarians.destroy', librarian.id));
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Manage Librarians" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-blue-600" />
              Manage Librarians
            </h1>
            <div className="flex gap-3">
              <button
                onClick={exportLibrarians}
                className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                aria-label="Export librarians as CSV"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => openModal()}
                className="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                aria-label="Add new librarian"
              >
                <span>Add Librarian</span>
              </button>
            </div>
          </div>
          <p className="text-gray-600">Manage librarian accounts for the library system.</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  aria-label="Search librarians"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearch('');
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

        {/* Librarians Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Librarians ({librarians.total})</h2>
          </div>
          {librarians.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {librarians.data.map((librarian) => (
                    <tr key={librarian.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{librarian.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{librarian.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openModal(librarian)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          aria-label={`Edit librarian ${librarian.name}`}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(librarian)}
                          className="text-red-600 hover:text-red-900"
                          aria-label={`Delete librarian ${librarian.name}`}
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
              <UserCheck className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p>No librarians found.</p>
            </div>
          )}

          {/* Pagination */}
          {librarians.last_page > 1 && (
            <div className="flex justify-center space-x-2 p-6">
              {librarians.links.map((link, index) => (
                <button
                  key={index}
                  onClick={() => handlePageChange(link.url)}
                  className={`px-4 py-2 rounded-lg ${
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

        {/* Modal for Add/Edit Librarian */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{editingLibrarian ? 'Edit Librarian' : 'Add Librarian'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    aria-label="Librarian name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    aria-label="Librarian email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password {editingLibrarian ? '(Optional)' : ''}</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    aria-label="Librarian password"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                  aria-label="Cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  aria-label={editingLibrarian ? 'Update librarian' : 'Add librarian'}
                >
                  {editingLibrarian ? 'Update' : 'Add'}
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
                toast.type === 'success'
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : 'border-red-200 bg-red-50 text-red-800'
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
