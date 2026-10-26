'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeftRight, Users, UserCircle, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

const nav = [
  { href: '/dashboard',             label: 'Matches',     icon: ArrowLeftRight },
  { href: '/dashboard/connections', label: 'Connections', icon: Users },
  { href: '/dashboard/profile',     label: 'Profile',     icon: UserCircle },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail]       = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Read the current session once on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
      } else {
        setUserEmail(session.user.email || '');
        setCheckingAuth(false);
      }
    });

    // Keep the UI in sync if the session changes (e.g. token refresh, sign-out)
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.replace('/login');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [router]);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // The onAuthStateChange listener above will trigger the redirect.
  }

  // Show a minimal spinner while we verify the session to prevent flashing.
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <ArrowLeftRight className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm text-foreground hidden sm:inline">
                Seva Parivartan
              </span>
            </Link>

            <nav className="flex items-center gap-0.5">
              {nav.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link key={href} href={href}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      size="sm"
                      className={isActive ? 'font-medium' : 'text-muted-foreground'}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{label}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {userEmail && (
              <span className="text-xs text-muted-foreground hidden md:inline truncate max-w-[160px]">
                {userEmail}
              </span>
            )}
            <Button
              id="signout-btn"
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-muted-foreground"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
