import { Router, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/profile — get your own profile
router.get('/', async (req: AuthRequest, res: Response) => {
  let { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', req.userId!)
    .maybeSingle();

  if (error) { res.status(500).json({ error: error.message }); return; }

  // Auto-initialise profile row if not present (first login via OAuth)
  if (!data) {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(req.userId!);
    const fullName =
      authUser?.user?.user_metadata?.full_name ||
      authUser?.user?.user_metadata?.name ||
      authUser?.user?.email?.split('@')[0] ||
      '';

    const { data: newProfile, error: insertError } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: req.userId!, full_name: fullName })
      .select()
      .maybeSingle();

    if (insertError) { res.status(500).json({ error: insertError.message }); return; }
    data = newProfile;
  }

  res.json({ data });
});

// PUT /api/profile — update your profile
router.put('/', async (req: AuthRequest, res: Response) => {
  // Strip fields the user must not be able to set themselves.
  const {
    full_name,
    mobile,
    designation,
    current_district_id,
    desired_district_id,
    // Legacy text fields — accepted for backward compat but not trusted for matching
    current_dist,
    desired_dist,
  } = req.body;

  // Validate districts differ if both provided
  if (
    current_district_id != null &&
    desired_district_id != null &&
    Number(current_district_id) === Number(desired_district_id)
  ) {
    res.status(400).json({ error: 'current_district_id and desired_district_id must differ' });
    return;
  }

  // Resolve district names for legacy text fields (used in connections display)
  let resolvedCurrentDist = current_dist;
  let resolvedDesiredDist = desired_dist;

  if (current_district_id) {
    const { data: d } = await supabaseAdmin
      .from('districts')
      .select('name')
      .eq('id', current_district_id)
      .maybeSingle();
    if (d) resolvedCurrentDist = d.name;
  }
  if (desired_district_id) {
    const { data: d } = await supabaseAdmin
      .from('districts')
      .select('name')
      .eq('id', desired_district_id)
      .maybeSingle();
    if (d) resolvedDesiredDist = d.name;
  }

  // Determine if the profile is now complete
  const profileCompleted =
    Boolean(full_name?.trim()) &&
    Boolean(designation) &&
    Boolean(current_district_id) &&
    Boolean(desired_district_id) &&
    Number(current_district_id) !== Number(desired_district_id);

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id:                  req.userId!,
      full_name:           full_name ?? undefined,
      mobile:              mobile    ?? undefined,
      designation:         designation ?? undefined,
      current_district_id: current_district_id ?? undefined,
      desired_district_id: desired_district_id ?? undefined,
      current_dist:        resolvedCurrentDist ?? undefined,
      desired_dist:        resolvedDesiredDist ?? undefined,
      profile_completed:   profileCompleted,
      updated_at:          new Date().toISOString(),
      // Explicitly excluded: verification_status, verified_at, is_active
    })
    .select()
    .maybeSingle();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ data });
});

export default router;
