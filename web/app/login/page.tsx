'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

/** Inline Google icon SVG (no external dependency) */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

/**
 * Inner component — isolated so the useSearchParams() call is
 * inside a Suspense boundary (required by Next.js App Router).
 */
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState('');

  const errorParam = searchParams.get('error');
  const redirectedFrom = searchParams.get('redirectedFrom') || '/dashboard';

  // Surface OAuth errors from the callback URL
  useEffect(() => {
    if (errorParam) {
      const messages: Record<string, string> = {
        missing_code: 'Sign-in was cancelled or the link expired. Please try again.',
        auth_failed: 'Authentication failed. Please try again.',
      };
      setError(messages[errorParam] ?? decodeURIComponent(errorParam));
    }
  }, [errorParam]);

  // If the user is already signed in (e.g. navigated back) -> redirect
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace(redirectedFrom);
      } else {
        setCheckingSession(false);
      }
    });
  }, [router, redirectedFrom]);

  async function handleGoogleLogin() {
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectedFrom)}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (oauthError) throw oauthError;
      // The browser will navigate away to Google -- loader stays visible.
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="px-4 sm:px-6 h-14 flex items-center border-b border-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <ArrowLeftRight className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm text-foreground">Seva Parivartan</span>
        </Link>
      </header>

      {/* Sign-in card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
              <ArrowLeftRight className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-1">
              Sign in to Seva Parivartan
            </h1>
            <p className="text-sm text-muted-foreground">
              Find your mutual transfer match across 750+ districts.
            </p>
          </div>

          <div className="border border-border rounded-lg bg-card p-6 space-y-4">
            {error && (
              <p
                role="alert"
                className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2"
              >
                {error}
              </p>
            )}

            <Button
              id="google-signin-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
              variant="outline"
              className="w-full h-10 gap-3 font-medium"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              {loading ? 'Redirecting to Google...' : 'Continue with Google'}
            </Button>

            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              By continuing, you agree to use this service for legitimate
              mutual transfer purposes. Your Google profile name and email
              will be used to create your account.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}