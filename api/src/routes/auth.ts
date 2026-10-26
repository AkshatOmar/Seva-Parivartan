import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, full_name } = req.body;
  if (!email || !password || !full_name) {
    res.status(400).json({ error: 'email, password, and full_name are required' });
    return;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,          // skip email verification for simplicity
    user_metadata: { full_name },
  });

  if (error) { res.status(400).json({ error: error.message }); return; }

  // Create the profile row immediately
  await supabaseAdmin.from('profiles').upsert({
    id: data.user.id,
    full_name,
  });

  res.status(201).json({ message: 'Registered successfully', userId: data.user.id });
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
  if (error) { res.status(401).json({ error: 'Invalid email or password' }); return; }

  // Ensure user has a profile record
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!existingProfile) {
    const fullName = data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || '';
    await supabaseAdmin.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
    });
  }

  res.json({
    access_token:  data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: { id: data.user.id, email: data.user.email },
  });
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  const { refresh_token } = req.body;
  if (!refresh_token) { res.status(400).json({ error: 'refresh_token required' }); return; }

  const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token });
  if (error) { res.status(401).json({ error: error.message }); return; }

  res.json({
    access_token:  data.session?.access_token,
    refresh_token: data.session?.refresh_token,
  });
});

export default router;
