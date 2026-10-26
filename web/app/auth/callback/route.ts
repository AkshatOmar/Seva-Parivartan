import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * GET /auth/callback
 *
 * Supabase redirects here after Google OAuth completes.
 * We exchange the ?code= query parameter for a session,
 * then decide where to send the user next:
 *
 *   • Profile incomplete → /dashboard/profile
 *   • Profile complete   → /dashboard (or the original redirectedFrom path)
 *   • Error              → /login?error=...
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const errorParam = searchParams.get('error_description');

  // Handle OAuth cancellation / provider error
  if (errorParam) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorParam)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error?.message ?? 'auth_failed')}`
    );
  }

  // ── Ensure a profile row exists for this user ──────────────
  // We upsert so repeated logins don't create duplicates.
  const user = data.session.user;
  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    '';

  await supabase.from('profiles').upsert(
    {
      id: user.id,
      full_name: fullName,
      // Only set these on first insert; upsert won't overwrite
      // existing values for columns not listed here.
    },
    { onConflict: 'id', ignoreDuplicates: true }
  );

  // ── Check if the profile is complete ──────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('profile_completed')
    .eq('id', user.id)
    .maybeSingle();

  const profileComplete = profile?.profile_completed === true;

  const redirectTo = profileComplete
    ? `${origin}${next}`
    : `${origin}/dashboard/profile?welcome=1`;

  return NextResponse.redirect(redirectTo);
}
