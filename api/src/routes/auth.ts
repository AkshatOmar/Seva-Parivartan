import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';

const router = Router();

const registerSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
});

// ── POST /api/auth/register ────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { email, password, full_name } = parsed.data;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name } },
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(201).json({
    message: 'Registration successful. Please verify your email.',
    user: { id: data.user?.id, email: data.user?.email },
  });
});

// ── POST /api/auth/login ───────────────────────────────────────
const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string(),
});

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  res.json({
    access_token:  data.session?.access_token,
    refresh_token: data.session?.refresh_token,
    user:          { id: data.user.id, email: data.user.email },
  });
});

// ── POST /api/auth/logout ──────────────────────────────────────
router.post('/logout', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) await supabase.auth.admin.signOut(token);
  res.json({ message: 'Logged out' });
});

// ── POST /api/auth/refresh ─────────────────────────────────────
router.post('/refresh', async (req: Request, res: Response) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    res.status(400).json({ error: 'refresh_token required' });
    return;
  }

  const { data, error } = await supabase.auth.refreshSession({ refresh_token });
  if (error) {
    res.status(401).json({ error: error.message });
    return;
  }

  res.json({
    access_token:  data.session?.access_token,
    refresh_token: data.session?.refresh_token,
  });
});

export default router;
