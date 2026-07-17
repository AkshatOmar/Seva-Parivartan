import { Router, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// ── GET /api/connections ───────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  if (!req.employeeId) {
    res.status(400).json({ error: 'Profile not found' });
    return;
  }

  const { data, error } = await supabase
    .from('connection_requests')
    .select(`
      id, status, message, created_at, responded_at,
      sender:employee_profiles!sender_id(id, full_name, department:departments(name), designation:designations(name), current_location:posting_locations(name, state_name)),
      receiver:employee_profiles!receiver_id(id, full_name, department:departments(name), designation:designations(name), current_location:posting_locations(name, state_name)),
      match:matches(id, match_score)
    `)
    .or(`sender_id.eq.${req.employeeId},receiver_id.eq.${req.employeeId}`)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ data });
});

// ── POST /api/connections ─────────────────────────────────────
const sendRequestSchema = z.object({
  match_id: z.string().uuid(),
  message:  z.string().max(500).optional(),
});

router.post('/', async (req: AuthRequest, res: Response) => {
  if (!req.employeeId) {
    res.status(400).json({ error: 'Profile not found' });
    return;
  }

  const parsed = sendRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  // Get match to determine receiver
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('employee_a_id, employee_b_id, status')
    .eq('id', parsed.data.match_id)
    .or(`employee_a_id.eq.${req.employeeId},employee_b_id.eq.${req.employeeId}`)
    .single();

  if (matchError || !match) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  if (match.status !== 'active') {
    res.status(400).json({ error: 'Match is no longer active' });
    return;
  }

  const receiver_id = match.employee_a_id === req.employeeId
    ? match.employee_b_id
    : match.employee_a_id;

  const { data, error } = await supabase
    .from('connection_requests')
    .insert({
      match_id:    parsed.data.match_id,
      sender_id:   req.employeeId,
      receiver_id,
      message:     parsed.data.message,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'Connection request already sent' });
      return;
    }
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json({ data });
});

// ── PUT /api/connections/:id ──────────────────────────────────
const respondSchema = z.object({
  status: z.enum(['accepted', 'rejected', 'withdrawn']),
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  if (!req.employeeId) {
    res.status(400).json({ error: 'Profile not found' });
    return;
  }

  const parsed = respondSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  // Get request first
  const { data: existing, error: fetchError } = await supabase
    .from('connection_requests')
    .select('sender_id, receiver_id, status')
    .eq('id', req.params.id)
    .single();

  if (fetchError || !existing) {
    res.status(404).json({ error: 'Connection request not found' });
    return;
  }

  // withdrawn = only sender can withdraw
  if (parsed.data.status === 'withdrawn' && existing.sender_id !== req.employeeId) {
    res.status(403).json({ error: 'Only sender can withdraw' });
    return;
  }

  // accepted/rejected = only receiver
  if (['accepted', 'rejected'].includes(parsed.data.status) && existing.receiver_id !== req.employeeId) {
    res.status(403).json({ error: 'Only receiver can accept or reject' });
    return;
  }

  const { data, error } = await supabase
    .from('connection_requests')
    .update({ status: parsed.data.status, responded_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ data });
});

export default router;
