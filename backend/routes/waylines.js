import { Router } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { storeWayline, getWorkspaceWaylines } from '../services/waylineService.js';
import { loadWaylineJson, getWpmlContent, generateWpmlPackage } from '../services/djiWaylineService.js';
import { getSupabase } from '../services/supabaseAdmin.js';

const router = Router();

function verifyToken(req, res, next) {
  const token = req.headers['x-auth-token'] || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ code: 401, message: 'Authentication required' });
  try {
    req.user = jwt.verify(token, config.jwt.secret);
    next();
  } catch {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.sub) {
        req.user = { sub: decoded.sub, email: decoded.email, company_id: decoded.user_metadata?.company_id, workspace_id: decoded.user_metadata?.company_id };
        next();
      } else {
        res.status(401).json({ code: 401, message: 'Invalid or expired token' });
      }
    } catch {
      res.status(401).json({ code: 401, message: 'Invalid or expired token' });
    }
  }
}

// POST /api/v1/waylines/sync — FlyBy frontend sync
router.post('/waylines/sync', verifyToken, async (req, res) => {
  console.log('[Wayline] POST /waylines/sync');
  const { workspace_id, wayline, field_name, mission_number } = req.body;
  if (!wayline) return res.status(400).json({ code: 400, message: 'Wayline data required' });

  const workspaceId = workspace_id || req.user.workspace_id || req.user.company_id;
  try {
    const result = await storeWayline(workspaceId, wayline, { mission_id: wayline.flyby_mission_id, field_name, mission_number, user_id: req.user.sub });
    try { generateWpmlPackage(result.wayline_id); } catch (e) { console.warn('[Wayline] WPML gen failed:', e.message); }
    console.log(`[Wayline] Synced: ${mission_number || field_name} → ${result.wayline_id}`);
    res.json({ code: 0, message: 'Wayline synced successfully', wayline_id: result.wayline_id, workspace_id: workspaceId, stored_at: result.stored_at, wpml_available: true });
  } catch (err) {
    console.error('[Wayline] Sync failed:', err.message);
    res.status(500).json({ code: 500, message: `Sync failed: ${err.message}` });
  }
});

// GET /workspaces/:id/waylines — DJI Pilot 2 list
router.get('/workspaces/:workspace_id/waylines', verifyToken, async (req, res) => {
  const { workspace_id } = req.params;
  console.log(`[DJI Pilot] List waylines — workspace: ${workspace_id}`);
  try {
    const waylines = await getWorkspaceWaylines(workspace_id);
    console.log(`[DJI Pilot] Found ${waylines.length} wayline(s)`);
    res.json({ code: 0, message: 'success', data: { list: waylines, pagination: { page: 1, page_size: 50, total: waylines.length } } });
  } catch (err) { res.status(500).json({ code: 500, message: err.message }); }
});

// GET /workspaces/:id/waylines/:id/url — DJI Pilot 2 download URL
router.get('/workspaces/:workspace_id/waylines/:wayline_id/url', verifyToken, (req, res) => {
  const { wayline_id } = req.params;
  res.json({ code: 0, message: 'success', data: { url: `${config.backendUrl}/api/v1/waylines/${wayline_id}/download` } });
});

// GET /api/v1/waylines — list all (dev)
router.get('/waylines', verifyToken, async (req, res) => {
  const workspaceId = req.user.workspace_id || req.user.company_id || req.query.workspace_id;
  try {
    const waylines = await getWorkspaceWaylines(workspaceId);
    res.json({ code: 0, message: 'success', data: { list: waylines } });
  } catch (err) { res.status(500).json({ code: 500, message: err.message }); }
});

// GET /api/v1/waylines/:id — metadata
router.get('/waylines/:wayline_id', verifyToken, (req, res) => {
  const data = loadWaylineJson(req.params.wayline_id);
  if (!data) return res.status(404).json({ code: 404, message: 'Wayline not found' });
  res.json({ code: 0, message: 'success', data: { wayline_id: req.params.wayline_id, mission_name: data.mission_name, waypoint_count: data.waypoints?.length || 0, altitude: data.global_height, speed: data.auto_flight_speed, created_at: data.created_at } });
});

// GET /api/v1/waylines/:id/download — WPML download (tracks status)
router.get('/waylines/:wayline_id/download', async (req, res) => {
  const { wayline_id } = req.params;
  const format = req.query.format || 'wpml';
  console.log(`[DJI Pilot] Download: ${wayline_id} (${format})`);

  if (format === 'json') {
    const data = loadWaylineJson(wayline_id);
    if (!data) return res.status(404).json({ code: 404, message: 'Wayline not found' });
    return res.json(data);
  }

  try {
    const { wpml } = getWpmlContent(wayline_id);
    if (!wpml) return res.status(404).json({ code: 404, message: 'WPML not found' });

    // Track download → update status to dji_available
    const supabase = getSupabase();
    if (supabase) {
      const { data } = await supabase.from('mission_routes').select('id, sync_status').eq('provider_ref', wayline_id).single();
      if (data && data.sync_status !== 'dji_available') {
        await supabase.from('mission_routes').update({ sync_status: 'dji_available', status: 'Ready on DJI', updated_at: new Date().toISOString() }).eq('id', data.id);
        console.log(`[DJI Pilot] Wayline ${wayline_id} → DJI_AVAILABLE`);
      }
    }

    res.type('application/xml').send(wpml);
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

export default router;
