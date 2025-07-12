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
    [key: string]: unknown;
}

export interface Student {
    id: number;
    user_id: number;
    member_id: string;
    name: string;
    email: string;
}

export interface Shelf {
    id: number;
    floor: string;
    shelf_number: string;
    description?: string;
}

export interface Book {
    id: number;
    isbn: string;
    title: string;
    author: string;
    available: boolean;
    shelf?: Shelf;
}

export interface Fine {
    id: number;
    transaction_id: number;
    user_id: number;
    amount: number;
    paid: boolean;
    paid_at?: string;
}

export interface ExtensionRequest {
    id: number;
    transaction_id: number;
    user_id: number;
    requested_days: number;
    status: 'pending' | 'approved' | 'rejected';
    processed_at?: string;
    processed_by?: number;
}

export interface Transaction {
    id: number;
    user_id?: number;
    book_id?: number;
    member_id?: string;
    student_name?: string;
    book_title: string;
    book_isbn: string;
    borrowed_at: string;
    due_date: string;
    returned_at?: string | null;
    fine_amount: number | null;
    fine_paid: boolean | null;
    extension_status: 'pending' | 'approved' | 'rejected' | null;
    requested_days: number | null;
    extension_id: number | null;
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
    totalBooks?: number;
    availableBooks?: number;
    borrowedBooks?: number;
    totalStudents?: number;
    totalLibrarians?: number;
    totalUsers?: number;
    totalTransactions?: number;
    activeTransactions?: number;
    recentTransactions?: number;
    myBorrowedBooks?: number;
    activeLoans?: number;
    returnedBooks?: number;
    overdueBooks?: number;
}

export interface Settings {
    loan_duration_days: number;
    max_books_per_user: number;
    overdue_fine_per_day: number;
}
