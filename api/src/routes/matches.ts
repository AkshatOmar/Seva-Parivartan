import { Router, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/matches
 *
 * Returns teachers who form a 2-way district swap with the current user:
 *   - their current_district_id == my desired_district_id
 *   - their desired_district_id == my current_district_id
 *   - same designation
 *   - both profiles active and completed
 *
 * Mobile numbers are NOT included in the match list —
 * they are only revealed after a connection is accepted.
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  // Get my own profile
  const { data: me, error: meError } = await supabaseAdmin
    .from('profiles')
    .select('current_district_id, desired_district_id, designation, profile_completed')
    .eq('id', req.userId!)
    .maybeSingle();

  if (meError) { res.status(500).json({ error: meError.message }); return; }

  if (
    !me ||
    !me.current_district_id ||
    !me.desired_district_id ||
    !me.designation ||
    !me.profile_completed
  ) {
    res.json({ data: [], message: 'Complete your profile to see matches.' });
    return;
  }

  // Use the match_candidates view which joins district names
  const { data, error } = await supabaseAdmin
    .from('match_candidates')
    .select(
      'id, full_name, designation, ' +
      'current_district_id, current_district_name, current_district_state, ' +
      'desired_district_id, desired_district_name, desired_district_state, ' +
      'verification_status'
    )
    .eq('current_district_id', me.desired_district_id)   // their location == my wish
    .eq('desired_district_id', me.current_district_id)   // their wish   == my location
    .eq('designation', me.designation)                   // same post
    .neq('id', req.userId!);                             // not myself

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ data: data || [] });
});

export default router;
