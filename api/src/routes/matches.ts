import { Router, Response } from 'express';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// ── GET /api/matches ───────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  if (!req.employeeId) {
    res.status(400).json({ error: 'Profile not found' });
    return;
  }

  const { data, error } = await supabase
    .from('matches')
    .select(`
      id, match_score, status, created_at,
      employee_a:employee_profiles!employee_a_id(
        id, full_name, employee_number,
        department:departments(name),
        designation:designations(name, pay_level),
        current_location:posting_locations(name, state_name),
        transfer_preferences(
          priority,
          desired_location:posting_locations(name, state_name)
        )
      ),
      employee_b:employee_profiles!employee_b_id(
        id, full_name, employee_number,
        department:departments(name),
        designation:designations(name, pay_level),
        current_location:posting_locations(name, state_name),
        transfer_preferences(
          priority,
          desired_location:posting_locations(name, state_name)
        )
      )
    `)
    .or(`employee_a_id.eq.${req.employeeId},employee_b_id.eq.${req.employeeId}`)
    .eq('status', 'active')
    .order('match_score', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  // Normalize: always return "other" employee as the match
  const normalized = (data || []).map((m: any) => ({
    id:         m.id,
    match_score: m.match_score,
    status:     m.status,
    created_at: m.created_at,
    matched_employee: m.employee_a_id === req.employeeId ? m.employee_b : m.employee_a,
  }));

  res.json({ data: normalized, count: normalized.length });
});

// ── GET /api/matches/:id ───────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      id, match_score, status, created_at,
      employee_a:employee_profiles!employee_a_id(
        id, full_name, mobile, employee_number, bio,
        department:departments(name),
        designation:designations(name, pay_level),
        current_location:posting_locations(name, state_name),
        transfer_preferences(priority, reason, desired_location:posting_locations(name, state_name))
      ),
      employee_b:employee_profiles!employee_b_id(
        id, full_name, mobile, employee_number, bio,
        department:departments(name),
        designation:designations(name, pay_level),
        current_location:posting_locations(name, state_name),
        transfer_preferences(priority, reason, desired_location:posting_locations(name, state_name))
      ),
      connection_requests(id, status, sender_id, receiver_id, message, created_at)
    `)
    .eq('id', req.params.id)
    .or(`employee_a_id.eq.${req.employeeId},employee_b_id.eq.${req.employeeId}`)
    .single();

  if (error) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }
  res.json({ data });
});

// ── POST /api/matches/refresh ─────────────────────────────────
router.post('/refresh', async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabaseAdmin.rpc('run_matching');
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ message: 'Matching complete', affected: data });
});

export default router;
