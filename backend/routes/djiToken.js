import { Router } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { getSupabase } from '../services/supabaseAdmin.js';

const router = Router();

router.post('/token', async (req, res) => {
  const { email, password } = req.body;
  console.log(`[Pilot Auth] Login attempt: ${email}`);

  if (!email || !password) {
    return res.status(400).json({ code: 400, message: 'Email and password required' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(503).json({ code: 503, message: 'Database not configured' });
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !authData?.user) {
      console.log(`[Pilot Auth] Failed: ${email} — ${authError?.message || 'invalid'}`);
      return res.status(401).json({ code: 401, message: 'Invalid credentials' });
    }

    const user = authData.user;
    const { data: profile } = await supabase.from('profiles').select('company_id, full_name').eq('id', user.id).single();
    if (!profile?.company_id) {
      return res.status(403).json({ code: 403, message: 'No company associated with this account' });
    }

    const { data: company } = await supabase.from('companies').select('company_name').eq('id', profile.company_id).single();

    const token = jwt.sign({ sub: user.id, email: user.email, company_id: profile.company_id, workspace_id: profile.company_id }, config.jwt.secret, { expiresIn: '24h' });

    console.log(`[Pilot Auth] Success: ${email} → workspace: ${profile.company_id} (${company?.company_name})`);

    res.json({
      code: 0,
      message: 'success',
      access_token: token,
      user_id: user.id,
      workspace_id: profile.company_id,
      workspace_name: company?.company_name || 'FlyBy Operations',
    });
  } catch (err) {
    console.error('[Token] Error:', err.message);
    res.status(500).json({ code: 500, message: 'Authentication failed' });
  }
});

router.get('/token/verify', (req, res) => {
  const token = req.headers['x-auth-token'] || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ code: 401, message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    res.json({ code: 0, message: 'valid', user_id: decoded.sub, workspace_id: decoded.workspace_id });
  } catch {
    res.status(401).json({ code: 401, message: 'Token expired or invalid' });
  }
});

export default router;
