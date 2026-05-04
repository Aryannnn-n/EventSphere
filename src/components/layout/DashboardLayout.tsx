'use client';

import { Button } from '@/components/ui/button';
import {
  CalendarCheck,
  ChevronLeft,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import NotificationBell from './NotificationBell';

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

const roleNavItems: Record<string, NavItem[]> = {
  ADMIN: [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Manage Users', href: '/admin/users', icon: Users },
  ],
  HOST: [
    { label: 'Dashboard', href: '/host', icon: LayoutDashboard },
    { label: 'My Events', href: '/host', icon: ClipboardList },
  ],
  HOD: [
    { label: 'Dashboard', href: '/hod', icon: LayoutDashboard },
    { label: 'Events', href: '/hod', icon: ClipboardList },
  ],
  PRINCIPAL: [
    { label: 'Dashboard', href: '/principal', icon: LayoutDashboard },
    { label: 'Events', href: '/principal', icon: ClipboardList },
  ],
  STUDENT: [
    { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
    { label: 'Events', href: '/student', icon: ClipboardList },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const role = (session?.user as any)?.role || 'STUDENT';
  const navItems = roleNavItems[role] || roleNavItems.STUDENT;
  const userName = session?.user?.name || 'User';
  const userEmail = session?.user?.email || '';
  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isActive = (href: string) => {
    if (href === `/${role.toLowerCase()}`) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* ===== Mobile Sidebar Overlay ===== */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ===== Sidebar ===== */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen bg-sidebar border-r border-sidebar-border flex flex-col
          transition-all duration-300 ease-in-out
          lg:sticky lg:top-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'w-[72px]' : 'w-64'}
        `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between h-18 px-4 border-b border-sidebar-border">
          <Link href={`/${role.toLowerCase()}`} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0 border border-border/50 overflow-hidden">
              <Image src="/logo.png" alt="MET Logo" width={40} height={40} className="object-contain" />
            </div>
            {!collapsed && (
              <span className="text-lg font-bold tracking-tight whitespace-nowrap">
                Event<span className="text-primary">Sphere</span>
              </span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-7 h-7 rounded-lg hover:bg-sidebar-accent items-center justify-center text-muted-foreground transition-colors"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-7 h-7 rounded-lg hover:bg-sidebar-accent flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {!collapsed && (
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Navigation
            </p>
          )}
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Profile - Pinned to bottom */}
        <div className="mt-auto border-t border-sidebar-border p-3">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl bg-sidebar-accent/50 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{userName}</p>
                <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider font-medium">{role}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ===== Main Content ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-lg border-b border-border/50 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight">{role.charAt(0) + role.slice(1).toLowerCase()} Dashboard</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Welcome back, {userName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <form
              action={async () => {
                await signOut({ redirectTo: '/login' });
              }}
            >
              <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </form>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
