import { Router, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// ── Helper: select fields for a profile within a connection ──
// Mobile is included here; the API decides whether to expose it
// based on connection status before sending to the client.
const PROFILE_SELECT =
  'id, full_name, designation, mobile, current_dist, desired_dist, current_district_id, desired_district_id';

const CONNECTION_SELECT = `
  id, status, message, created_at, responded_at,
  requester:requester_id(${PROFILE_SELECT}),
  target:target_id(${PROFILE_SELECT})
`;

// GET /api/connections — list all connections (sent + received)
router.get('/', async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('connections')
    .select(CONNECTION_SELECT)
    .or(`requester_id.eq.${req.userId!},target_id.eq.${req.userId!}`)
    .order('created_at', { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }

  // Strip mobile numbers unless the connection is accepted
  const sanitised = (data || []).map((conn: any) => {
    if (conn.status !== 'accepted') {
      if (conn.requester) conn.requester.mobile = undefined;
      if (conn.target)    conn.target.mobile    = undefined;
    }
    return conn;
  });

  res.json({ data: sanitised });
});

// POST /api/connections — send a connection request
router.post('/', async (req: AuthRequest, res: Response) => {
  const { target_id, message } = req.body;
  if (!target_id) { res.status(400).json({ error: 'target_id is required' }); return; }

  // Prevent self-connection at the API layer (DB also enforces this)
  if (target_id === req.userId) {
    res.status(400).json({ error: 'You cannot connect with yourself' });
    return;
  }

  // Verify the target has a complete, active profile before allowing a request
  const { data: targetProfile } = await supabaseAdmin
    .from('profiles')
    .select('is_active, profile_completed')
    .eq('id', target_id)
    .maybeSingle();

  if (!targetProfile?.is_active || !targetProfile?.profile_completed) {
    res.status(400).json({ error: 'That teacher profile is not available for connection requests.' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('connections')
    .insert({ requester_id: req.userId!, target_id, message: message || '' })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'You already sent a request to this person.' });
      return;
    }
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json({ data });
});

// PUT /api/connections/:id — accept, reject, or withdraw a request
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const allowed = ['accepted', 'rejected', 'withdrawn'] as const;

  if (!allowed.includes(status)) {
    res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
    return;
  }

  // Fetch the connection to verify participant roles
  const { data: existing } = await supabaseAdmin
    .from('connections')
    .select('requester_id, target_id, status')
    .eq('id', req.params.id)
    .maybeSingle();

  if (!existing) {
    res.status(404).json({ error: 'Connection not found' });
    return;
  }

  if (existing.status !== 'pending') {
    res.status(409).json({ error: 'Only pending requests can be updated' });
    return;
  }

  // Authorisation check: target can accept/reject; requester can withdraw
  const isTarget    = existing.target_id    === req.userId;
  const isRequester = existing.requester_id === req.userId;

  if (status === 'withdrawn' && !isRequester) {
    res.status(403).json({ error: 'Only the sender can withdraw a request' });
    return;
  }
  if ((status === 'accepted' || status === 'rejected') && !isTarget) {
    res.status(403).json({ error: 'Only the recipient can accept or reject a request' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('connections')
    .update({ status })
    .eq('id', req.params.id)
    .select()
    .maybeSingle();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ data });
});

export default router;
