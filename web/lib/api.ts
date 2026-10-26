/**
 * Seva Parivartan – shared API types
 *
 * Used by both the Express backend (via import) and the
 * Next.js frontend (via @/lib/api).
 */

// In production (Vercel), the /api/* rewrite routes requests to the Express
// service on the same domain, so no base URL is needed. Locally, set
// NEXT_PUBLIC_API_URL=http://localhost:4000 in web/.env.local.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

/**
 * Get the Supabase access token from the active session.
 * Falls back to a legacy localStorage key so old sessions
 * keep working during the transition to Supabase OAuth.
 *
 * In a browser context we import the Supabase browser client
 * lazily to avoid circular-import issues.
 */
async function getToken(): Promise<string> {
  if (typeof window === 'undefined') return '';

  try {
    // Dynamic import avoids SSR issues.
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) return data.session.access_token;
  } catch {
    // Supabase client unavailable — fall through
  }

  // Legacy fallback (email/password era)
  return localStorage.getItem('sp_token') || '';
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (err: any) {
    if (
      err.name === 'TypeError' ||
      err.message?.includes('fetch') ||
      err.message?.includes('NetworkError')
    ) {
      throw new Error(
        `Cannot connect to backend server${API_URL ? ` (${API_URL})` : ''
        }. Please ensure the API is running.`
      );
    }
    throw err;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Error ${res.status}`);
  }
  return res.json();
}

// ── API surface ──────────────────────────────────────────────

export const api = {
  profile: {
    get: () => apiFetch<{ data: Profile }>('/api/profile'),
    update: (body: Partial<Profile>) =>
      apiFetch('/api/profile', { method: 'PUT', body: JSON.stringify(body) }),
  },
  districts: {
    list: () => apiFetch<{ data: District[] }>('/api/districts'),
  },
  matches: {
    list: () => apiFetch<{ data: MatchProfile[] }>('/api/matches'),
  },
  connections: {
    list: () => apiFetch<{ data: Connection[] }>('/api/connections'),
    send: (target_id: string, message?: string) =>
      apiFetch('/api/connections', {
        method: 'POST',
        body: JSON.stringify({ target_id, message }),
      }),
    respond: (id: string, status: 'accepted' | 'rejected' | 'withdrawn') =>
      apiFetch(`/api/connections/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
  },
};

// ── Type definitions ─────────────────────────────────────────

export interface District {
  id: number;
  name: string;
  state: string;
  is_active: boolean;
}

export interface Profile {
  id: string;
  full_name: string;
  mobile: string;
  designation: 'PGT' | 'TGT' | 'PRT' | 'Lecturer' | null;
  // Legacy free-text (kept for backward compat during migration)
  current_dist: string;
  desired_dist: string;
  // New district FK fields
  current_district_id: number | null;
  desired_district_id: number | null;
  // Status flags
  is_active: boolean;
  profile_completed: boolean;
  verification_status: 'unverified' | 'pending' | 'verified';
  verified_at: string | null;
  created_at: string;
  updated_at: string | null;
}

/** Subset of Profile returned in match lists (mobile excluded until connected) */
export interface MatchProfile {
  id: string;
  full_name: string;
  designation: Profile['designation'];
  current_district_id: number | null;
  current_district_name: string;
  current_district_state: string;
  desired_district_id: number | null;
  desired_district_name: string;
  desired_district_state: string;
  verification_status: Profile['verification_status'];
}

export interface Connection {
  id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  message: string;
  created_at: string;
  responded_at: string | null;
  requester: Profile;
  target: Profile;
}
