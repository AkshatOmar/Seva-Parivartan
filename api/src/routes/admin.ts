import { Router, Response } from 'express';
import { z } from 'zod';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { AuthRequest, adminMiddleware } from '../middleware/auth';

const router = Router();
router.use(adminMiddleware);

// ── GET /api/admin/stats ───────────────────────────────────────
router.get('/stats', async (_req, res: Response) => {
  const [employees, matches, connections, depts] = await Promise.all([
    supabaseAdmin.from('employee_profiles').select('id, is_active, is_profile_complete', { count: 'exact' }),
    supabaseAdmin.from('matches').select('id, status', { count: 'exact' }),
    supabaseAdmin.from('connection_requests').select('id, status', { count: 'exact' }),
    supabaseAdmin.from('departments').select('id, name', { count: 'exact' }),
  ]);

  const empData = employees.data || [];
  const matchData = matches.data || [];
  const connData = connections.data || [];

  res.json({
    employees: {
      total:    empData.length,
      active:   empData.filter(e => e.is_active).length,
      complete: empData.filter(e => e.is_profile_complete).length,
    },
    matches: {
      total:     matchData.length,
      active:    matchData.filter(m => m.status === 'active').length,
      connected: matchData.filter(m => m.status === 'connected').length,
    },
    connections: {
      total:    connData.length,
      pending:  connData.filter(c => c.status === 'pending').length,
      accepted: connData.filter(c => c.status === 'accepted').length,
    },
    departments: depts.data?.length || 0,
  });
});

// ── GET /api/admin/users ───────────────────────────────────────
router.get('/users', async (req: AuthRequest, res: Response) => {
  const page  = parseInt(req.query.page  as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;

  let query = supabaseAdmin
    .from('employee_profiles')
    .select(`
      id, full_name, mobile, employee_number, is_active, is_profile_complete, created_at,
      department:departments(name),
      designation:designations(name),
      current_location:posting_locations(name, state_name)
    `, { count: 'exact' });

  if (search) query = query.ilike('full_name', `%${search}%`);

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ data, count, page, limit });
});

// ── PUT /api/admin/users/:id ──────────────────────────────────
const updateUserSchema = z.object({
  is_active:          z.boolean().optional(),
  is_publicly_listed: z.boolean().optional(),
});

router.put('/users/:id', async (req: AuthRequest, res: Response) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('employee_profiles')
    .update(parsed.data)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ data });
});

// ── GET /api/admin/matches ────────────────────────────────────
router.get('/matches', async (req: AuthRequest, res: Response) => {
  const page  = parseInt(req.query.page  as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const { data, count, error } = await supabaseAdmin
    .from('matches')
    .select(`
      id, match_score, status, created_at,
      employee_a:employee_profiles!employee_a_id(full_name, department:departments(name), designation:designations(name)),
      employee_b:employee_profiles!employee_b_id(full_name, department:departments(name), designation:designations(name))
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ data, count, page, limit });
});

// ── POST /api/admin/matching/run ──────────────────────────────
router.post('/matching/run', async (_req, res: Response) => {
  const { data, error } = await supabaseAdmin.rpc('run_matching');
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ message: 'Matching job complete', affected: data });
});

// ── POST /api/admin/departments ───────────────────────────────
const deptSchema = z.object({
  name:        z.string().min(2),
  code:        z.string().min(2).max(10),
  description: z.string().optional(),
});

router.post('/departments', async (req: AuthRequest, res: Response) => {
  const parsed = deptSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { data, error } = await supabaseAdmin
    .from('departments')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json({ data });
});

// ── POST /api/admin/designations ──────────────────────────────
const desigSchema = z.object({
  department_id: z.string().uuid(),
  name:          z.string().min(2),
  pay_level:     z.number().int().min(1).max(18).optional(),
});

router.post('/designations', async (req: AuthRequest, res: Response) => {
  const parsed = desigSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { data, error } = await supabaseAdmin
    .from('designations')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json({ data });
});

// ── POST /api/admin/locations ─────────────────────────────────
const locSchema = z.object({
  name:       z.string().min(2),
  state_name: z.string().min(2),
  state_code: z.string().length(2),
});

router.post('/locations', async (req: AuthRequest, res: Response) => {
  const parsed = locSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { data, error } = await supabaseAdmin
    .from('posting_locations')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json({ data });
});

export default router;
