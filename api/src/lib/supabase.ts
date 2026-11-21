import { createClient } from '@supabase/supabase-js';

// Admin client — bypasses RLS, used for auth validation and all data ops
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Anon client — used for verifying user JWTs via auth.getUser()
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
