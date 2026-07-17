import { Router, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// ── GET /api/messages ─────────────────────────────────────────
// All conversations for current user
router.get('/', async (req: AuthRequest, res: Response) => {
  if (!req.employeeId) {
    res.status(400).json({ error: 'Profile not found' });
    return;
  }

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id, created_at,
      match:matches(id, match_score),
      participant_a:employee_profiles!participant_a(id, full_name, department:departments(name), designation:designations(name)),
      participant_b:employee_profiles!participant_b(id, full_name, department:departments(name), designation:designations(name)),
      messages(id, content, is_read, created_at, sender_id)
    `)
    .or(`participant_a.eq.${req.employeeId},participant_b.eq.${req.employeeId}`)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ data });
});

// ── GET /api/messages/:conversationId ────────────────────────
router.get('/:conversationId', async (req: AuthRequest, res: Response) => {
  if (!req.employeeId) {
    res.status(400).json({ error: 'Profile not found' });
    return;
  }

  // Verify participant
  const { data: conv, error: convErr } = await supabase
    .from('conversations')
    .select('participant_a, participant_b')
    .eq('id', req.params.conversationId)
    .single();

  if (convErr || !conv || (conv.participant_a !== req.employeeId && conv.participant_b !== req.employeeId)) {
    res.status(403).json({ error: 'Not a participant of this conversation' });
    return;
  }

  const { data, error } = await supabase
    .from('messages')
    .select('id, content, is_read, created_at, sender_id')
    .eq('conversation_id', req.params.conversationId)
    .order('created_at', { ascending: true });

  // Mark unread as read
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', req.params.conversationId)
    .neq('sender_id', req.employeeId)
    .eq('is_read', false);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ data });
});

// ── POST /api/messages/:conversationId ───────────────────────
const sendSchema = z.object({ content: z.string().min(1).max(2000) });

router.post('/:conversationId', async (req: AuthRequest, res: Response) => {
  if (!req.employeeId) {
    res.status(400).json({ error: 'Profile not found' });
    return;
  }

  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  // Verify participant
  const { data: conv } = await supabase
    .from('conversations')
    .select('participant_a, participant_b')
    .eq('id', req.params.conversationId)
    .single();

  if (!conv || (conv.participant_a !== req.employeeId && conv.participant_b !== req.employeeId)) {
    res.status(403).json({ error: 'Not a participant of this conversation' });
    return;
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: req.params.conversationId,
      sender_id:       req.employeeId,
      content:         parsed.data.content,
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json({ data });
});

export default router;
