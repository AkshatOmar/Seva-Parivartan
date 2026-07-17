import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';

export interface AuthRequest extends Request {
  user?: { id: string; email?: string };
  employeeId?: string;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.user = { id: user.id, email: user.email };

  // Attach employee profile id if it exists
  const { data: profile } = await supabase
    .from('employee_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (profile) req.employeeId = profile.id;

  next();
}

export async function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { data: admin } = await supabase
    .from('admin_users')
    .select('role, is_active')
    .eq('user_id', req.user.id)
    .single();

  if (!admin || !admin.is_active) {
    res.status(403).json({ error: 'Forbidden – admin access required' });
    return;
  }
  next();
}
