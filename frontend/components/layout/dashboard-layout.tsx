'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Receipt,
  FolderOpen,
  Wallet,
  BarChart3,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    // Load user profile
    authApi
      .getProfile()
      .then((response) => {
        setUser(response.data);
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  const handleLogout = () => {
    authApi.logout();
    router.push('/login');
  };

  const navItems = [
    { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { href: '/dashboard/expenses', label: 'Chi tiêu', icon: Receipt },
    { href: '/dashboard/categories', label: 'Danh mục', icon: FolderOpen },
    { href: '/dashboard/wallets', label: 'Ví', icon: Wallet },
    { href: '/dashboard/reports', label: 'Báo cáo', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 relative pointer-events-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 relative z-50 pointer-events-auto">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-primary">
                Quản lý chi tiêu
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1 relative z-50 pointer-events-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="pointer-events-auto">
                    <Button variant="ghost" className="flex items-center gap-2 relative z-50 pointer-events-auto">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="hidden md:flex items-center gap-4 relative z-50 pointer-events-auto">
              {user && (
                <div className="text-sm">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-muted-foreground text-xs">{user.email}</div>
                </div>
              )}
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Đăng xuất
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 relative z-[110]">
            <nav className="px-4 py-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start flex items-center gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
              {user && (
                <div className="px-3 py-2 text-sm border-t border-gray-200 mt-2">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-muted-foreground text-xs">{user.email}</div>
                </div>
              )}
              <Button
                variant="ghost"
                className="w-full justify-start flex items-center gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

