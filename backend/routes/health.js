import { Router } from 'express';
import config from '../config/index.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'flyby-dji-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    mqtt: false,
    waylines: true,
    dji_app_id: config.dji.appId || null,
    dji_configured: !!(config.dji.appId && config.dji.appKey && config.dji.appLicense),
  });
});

export default router;
