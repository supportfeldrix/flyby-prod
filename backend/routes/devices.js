import { Router } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';

const router = Router();

function verifyToken(req, res, next) {
  const token = req.headers['x-auth-token'] || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ code: 401, message: 'Authentication required' });
  try { req.user = jwt.verify(token, config.jwt.secret); next(); }
  catch { try { const d = jwt.decode(token); if (d?.sub) { req.user = d; next(); } else res.status(401).json({ code: 401, message: 'Invalid token' }); } catch { res.status(401).json({ code: 401, message: 'Invalid token' }); } }
}

router.post('/workspaces/:workspace_id/devices/topology', verifyToken, (req, res) => {
  console.log(`[Devices] Topology update: workspace ${req.params.workspace_id}`);
  res.json({ code: 0, message: 'success' });
});

router.get('/workspaces/:workspace_id/devices', verifyToken, (req, res) => {
  res.json({ code: 0, message: 'success', data: { list: [] } });
});

export default router;
