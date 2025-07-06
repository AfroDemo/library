import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    role: 'student' | 'staff' | 'librarian' | 'admin';
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface Student {
    id: number;
    user_id: number;
    member_id: string;
    name: string;
    email: string;
}

export interface Book {
    id: number;
    isbn: string;
    title: string;
    author: string;
    available: boolean;
}

export interface Transaction {
    id: number;
    user_id?: number;
    book_id?: number;
    member_id?: string;
    member_name?: string;
    book_title: string;
    book_isbn?: string;
    borrowed_at: string;
    due_date: string;
    returned_at?: string;
}

export interface PageProps {
    auth: {
        user: User;
    };
    errors: Record<string, string>;
    [key: string]: unknown;
}

export interface Breadcrumb {
    title: string;
    href: string;
}

export interface ToastMessage {
    type: 'success' | 'error' | 'info';
    message: string;
    id: string;
}

export interface DashboardStats {
    // Admin/Librarian
    totalBooks?: number;
    availableBooks?: number;
    borrowedBooks?: number;
    totalStudents?: number;
    totalTransactions?: number;
    overdueBooks?: number;
    activeTransactions?: number;
    // Member (student/staff)
    myBorrowedBooks?: number;
    activeLoans?: number;
    returnedBooks?: number;
}
