import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { AlertTriangle, BookOpen, Folder, LayoutGrid, Locate, TimerReset, User } from 'lucide-react';
import AppLogo from './app-logo';

import type { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';

function getMainNavItems(role: string): NavItem[] {
    const items: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
        },
    ];
    if (role === 'librarian' || role === 'admin') {
        items.push(
            {
                title: 'Returns',
                href: '/librarian/returns',
                icon: BookOpen,
            },
            {
                title: 'Overdue Books',
                href: '/librarian/overdue',
                icon: AlertTriangle,
            },
            {
                title: 'Transactions',
                href: '/librarian/transactions',
                icon: Folder,
            },
        );
    }
    if (role === 'librarian') {
        items.push();
    }
    if (role === 'admin') {
        items.push(
            {
                title: 'Manage Books',
                href: '/admin/books',
                icon: BookOpen,
            },
            {
                title: 'Manage User',
                href: '/admin/users',
                icon: User,
            },
            {
                title: 'Manage Locations',
                href: '/admin/location',
                icon: Locate,
            },
        );
    }
    if (role === 'student' || role === 'staff') {
        items.push(
            {
                title: 'Books',
                href: '/user/search',
                icon: BookOpen,
            },
            {
                title: 'Borrow History',
                href: '/user/history',
                icon: TimerReset,
            },
        );
    }
    return items;
}

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

function AppSidebar() {
    const page = usePage<PageProps>();
    // Default to 'user' if not found
    const role = page.props?.auth?.user?.role || 'user';
    const mainNavItems = getMainNavItems(role);
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

export default AppSidebar;
