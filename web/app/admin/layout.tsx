'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LayoutDashboard, Users, ArrowLeftRight, Building2, MapPin, Tag, LogOut, Menu, X } from 'lucide-react';

const adminNav = [
  { href: '/admin',              label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/admin/users',        label: 'Users',         icon: Users },
  { href: '/admin/matches',      label: 'Matches',       icon: ArrowLeftRight },
  { href: '/admin/departments',  label: 'Departments',   icon: Building2 },
  { href: '/admin/locations',    label: 'Locations',     icon: MapPin },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('sp_token');
    if (!token) router.push('/login');
  }, [router]);

  function logout() {
    localStorage.clear();
    router.push('/login');
  }

  return (
    <div className="min-h-screen flex bg-muted/20">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-60 bg-card border-r border-border flex flex-col
        transition-transform duration-300
        lg:translate-x-0 lg:relative lg:flex
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <div className="flex items-center gap-2">
              <span>🇮🇳</span>
              <span className="font-bold text-sm">Seva Parivartan</span>
            </div>
            <span className="text-xs text-muted-foreground font-medium px-0.5 mt-0.5 block">Admin Panel</span>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden"><X className="w-4 h-4" /></button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {adminNav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
          <Separator className="my-2" />
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted">
            ← Employee Portal
          </Link>
        </nav>

        <div className="p-3 border-t">
          <Button variant="ghost" size="sm" onClick={logout} className="w-full gap-2 text-muted-foreground justify-start">
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex items-center gap-3">
          <button onClick={() => setOpen(true)} className="lg:hidden"><Menu className="w-5 h-5" /></button>
          <span className="text-sm font-semibold text-muted-foreground">Admin Panel</span>
        </header>
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
