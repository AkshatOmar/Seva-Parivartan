import { Router, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/districts — return all active districts for dropdowns
router.get('/', async (_req: AuthRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('districts')
    .select('id, name, state, is_active')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ data: data || [] });
});

export default router;
