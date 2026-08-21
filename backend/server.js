/**
 * FlyBy DJI Cloud API Backend
 * 
 * DJI Pilot 2 → HTTPS (H5 login, wayline API) → this server
 * DJI Pilot 2 → MQTT (device topology, telemetry) → EMQX → this server
 * FlyBy Frontend → POST /api/v1/waylines/sync → this server
 * DJI Pilot 2 → GET waylines → this server → returns wayline for download
 */

import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import config from './config/index.js';
import { connectMqtt } from './mqtt/broker.js';
import healthRoute from './routes/health.js';
import djiLoginRoute from './routes/djiLogin.js';
import djiTokenRoute from './routes/djiToken.js';
import waylinesRoute from './routes/waylines.js';
import devicesRoute from './routes/devices.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/', healthRoute);
app.use('/pilot', djiLoginRoute);
app.use('/pilot', djiTokenRoute);
app.use('/api/v1', waylinesRoute);
app.use('/manage/api/v1', devicesRoute);

// DJI Pilot 2 wayline API (matches DJI expected paths)
app.use('/wayline/api/v1', waylinesRoute);

// Static file serving for wayline downloads
app.use('/storage', express.static(join(__dirname, 'storage')));

// 404
app.use((req, res) => {
  res.status(404).json({ code: 404, message: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[FlyBy Backend Error]', err.message);
  res.status(500).json({ code: 500, message: err.message || 'Internal server error' });
});

// Start server — uses process.env.PORT (provided by Render/hosting)
const PORT = config.port;

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  FlyBy DJI Cloud API Backend');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Server:    http://0.0.0.0:${PORT}`);
  console.log(`  Health:    /health`);
  console.log(`  DJI Login: /pilot/login`);
  console.log(`  Env:       ${config.env}`);
  console.log(`  DJI App:   ${config.dji.appId || 'NOT CONFIGURED'}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
});

// Connect MQTT (non-blocking — server runs even if MQTT is unavailable)
if (config.mqtt.brokerUrl) {
  connectMqtt().catch(err => {
    console.warn(`[MQTT] Connection failed: ${err.message} — server continues without MQTT`);
  });
}
