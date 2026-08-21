import 'dotenv/config';

const config = {
  port: parseInt(process.env.PORT || '3002'),
  env: process.env.NODE_ENV || 'development',
  backendUrl: process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 3002}`,

  dji: {
    appId: process.env.DJI_APP_ID || '',
    appKey: process.env.DJI_APP_KEY || '',
    appLicense: process.env.DJI_APP_LICENSE || '',
  },

  mqtt: {
    brokerUrl: process.env.MQTT_BROKER_URL || '',
    username: process.env.MQTT_USERNAME || '',
    password: process.env.MQTT_PASSWORD || '',
    clientId: `flyby-backend-${Date.now()}`,
  },

  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
  },
};

// Validation warnings (non-fatal)
const missing = [];
if (!config.supabase.url) missing.push('SUPABASE_URL');
if (!config.supabase.serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

if (missing.length > 0) {
  console.warn(`[FlyBy Backend] Warning: Missing env vars: ${missing.join(', ')} — some features will be unavailable`);
}

export default config;
