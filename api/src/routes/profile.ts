import { Router, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// ── GET /api/profile ───────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('employee_profiles')
    .select(`
      *,
      department:departments(id, name, code),
      designation:designations(id, name, pay_level),
      current_location:posting_locations(id, name, state_name, state_code),
      transfer_preferences(
        id, priority, reason,
        desired_location:posting_locations(id, name, state_name, state_code)
      )
    `)
    .eq('user_id', req.user!.id)
    .single();

  if (error) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }
  res.json({ data });
});

// ── PUT /api/profile ───────────────────────────────────────────
const updateProfileSchema = z.object({
  full_name:           z.string().min(2).optional(),
  gender:              z.enum(['male', 'female', 'other']).optional(),
  mobile:              z.string().optional(),
  employee_number:     z.string().optional(),
  department_id:       z.string().uuid().optional(),
  designation_id:      z.string().uuid().optional(),
  date_of_joining:     z.string().optional(),
  current_location_id: z.string().uuid().optional(),
  current_office:      z.string().optional(),
  bio:                 z.string().max(500).optional(),
  is_publicly_listed:  z.boolean().optional(),
});

router.put('/', async (req: AuthRequest, res: Response) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  // Upsert profile
  const { data, error } = await supabase
    .from('employee_profiles')
    .upsert({ user_id: req.user!.id, ...parsed.data }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ data });
});

// ── PUT /api/profile/preferences ──────────────────────────────
const prefSchema = z.object({
  preferences: z.array(z.object({
    desired_location_id: z.string().uuid(),
    priority:            z.number().int().min(1).max(3),
    reason:              z.string().optional(),
  })).max(3),
});

router.put('/preferences', async (req: AuthRequest, res: Response) => {
  if (!req.employeeId) {
    res.status(400).json({ error: 'Complete your profile first' });
    return;
  }

  const parsed = prefSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  // Delete existing then re-insert
  await supabase
    .from('transfer_preferences')
    .delete()
    .eq('employee_id', req.employeeId);

  const rows = parsed.data.preferences.map(p => ({
    employee_id: req.employeeId!,
    ...p,
  }));

  const { data, error } = await supabase
    .from('transfer_preferences')
    .insert(rows)
    .select();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ data });
});

// ── GET /api/profile/meta ─────────────────────────────────────
// Returns departments, designations, locations for dropdowns
router.get('/meta', async (_req, res: Response) => {
  const [depts, locs] = await Promise.all([
    supabase.from('departments').select('id, name, code, designations(id, name, pay_level)').eq('is_active', true),
    supabase.from('posting_locations').select('id, name, state_name, state_code').eq('is_active', true).order('state_name').order('name'),
  ]);

  res.json({
    departments: depts.data || [],
    locations:   locs.data  || [],
  });
});

export default router;
