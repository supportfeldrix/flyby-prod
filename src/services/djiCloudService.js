/**
 * FlyBy — DJI Cloud Backend Service
 * 
 * Communicates with the FlyBy DJI backend server for:
 * - Wayline synchronization (POST /api/v1/waylines/sync)
 * - Wayline listing (GET /api/v1/waylines)
 * - Wayline metadata (GET /api/v1/waylines/:id)
 * - Backend health check (GET /health)
 * 
 * The backend URL is configured via VITE_DJI_BACKEND_URL environment variable.
 * Local: http://localhost:3002
 * Production: https://flyby-prod.onrender.com
 */

import { supabase } from '../lib/supabase';

const DJI_BACKEND_URL = import.meta.env.VITE_DJI_BACKEND_URL || '';

// ─── Health Check ───────────────────────────────────────────────────────────

/**
 * Check if the FlyBy DJI backend is reachable.
 */
export async function checkBackendHealth() {
  if (!DJI_BACKEND_URL) {
    return { available: false, reason: 'DJI backend URL not configured (VITE_DJI_BACKEND_URL)' };
  }

  try {
    const response = await fetch(`${DJI_BACKEND_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return { available: true, url: DJI_BACKEND_URL, ...data };
    }

    return { available: false, reason: `Backend returned ${response.status}` };
  } catch (err) {
    return { available: false, reason: `Cannot reach backend: ${err.message}` };
  }
}

// ─── Wayline Sync ───────────────────────────────────────────────────────────

/**
 * Sync a field/route to the FlyBy DJI backend.
 * 
 * Transforms the route into DJI wayline format and sends to the backend.
 * The backend stores it and generates WPML for DJI Pilot 2.
 */
export async function syncWaylineToBackend(field, route, mission, companyId) {
  if (!DJI_BACKEND_URL) {
    return { success: false, error: 'DJI backend URL not configured. Set VITE_DJI_BACKEND_URL.' };
  }

  // Validate field boundary
  if (!field?.boundary?.coordinates?.[0]) {
    return { success: false, error: 'Field has no valid boundary for sync.' };
  }

  // Build the wayline payload
  const coordinates = field.boundary.coordinates[0];
  const waylineData = {
    mission_name: mission?.mission_number || `FlyBy-${field.field_name || 'Mission'}`,
    template_type: 2,
    payload_type: 'sprayer',
    wayline_id: mission?.id || undefined,
    flyby_mission_id: mission?.id || undefined,

    auto_flight_speed: route?.speed || 7,
    global_height: route?.altitude || 3,
    finish_action: 'goHome',

    boundary: coordinates.map(([lng, lat]) => ({ longitude: lng, latitude: lat, altitude: route?.altitude || 3 })),

    waypoints: route?.route_geojson?.coordinates?.map(([lng, lat], idx) => ({
      index: idx,
      longitude: lng,
      latitude: lat,
      altitude: route?.altitude || 3,
      speed: route?.speed || 7,
    })) || [],

    spray_params: {
      application_rate: route?.application_rate || 15,
      swath_width: route?.swath_width || 7,
    },

    flyby_field_id: field.id,
    created_at: new Date().toISOString(),
  };

  // Get the access token
  const token = await getAccessToken();

  try {
    const response = await fetch(`${DJI_BACKEND_URL}/api/v1/waylines/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        workspace_id: companyId,
        wayline: waylineData,
        field_name: field.field_name,
        mission_number: mission?.mission_number,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return { success: false, error: errData.message || `Backend returned ${response.status}` };
    }

    const result = await response.json();

    // Update mission_routes in Supabase with sync status
    if (route?.id) {
      await supabase.from('mission_routes').update({
        status: 'Synced',
        sync_status: 'synced',
        provider: 'dji_cloud',
        provider_ref: result.wayline_id,
        last_sync_at: new Date().toISOString(),
      }).eq('id', route.id);
    } else if (mission?.id) {
      await supabase.from('mission_routes').update({
        status: 'Synced',
        sync_status: 'synced',
        provider: 'dji_cloud',
        provider_ref: result.wayline_id,
        last_sync_at: new Date().toISOString(),
      }).eq('mission_id', mission.id);
    }

    return {
      success: true,
      wayline_id: result.wayline_id,
      message: result.message || 'Wayline synced to FlyBy DJI backend',
    };
  } catch (err) {
    return { success: false, error: `Sync failed: ${err.message}` };
  }
}

// ─── Wayline Retrieval ──────────────────────────────────────────────────────

/**
 * List waylines from the backend.
 */
export async function getBackendWaylines() {
  if (!DJI_BACKEND_URL) return [];

  const token = await getAccessToken();
  try {
    const response = await fetch(`${DJI_BACKEND_URL}/api/v1/waylines`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data?.data?.list || [];
  } catch { return []; }
}

/**
 * Get wayline metadata from the backend.
 */
export async function getBackendWaylineMetadata(waylineId) {
  if (!DJI_BACKEND_URL || !waylineId) return null;

  const token = await getAccessToken();
  try {
    const response = await fetch(`${DJI_BACKEND_URL}/api/v1/waylines/${waylineId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.data || null;
  } catch { return null; }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || '';
}

/**
 * Check if the DJI backend is configured.
 */
export function isBackendConfigured() {
  return !!DJI_BACKEND_URL;
}

/**
 * Get the configured backend URL (for display only).
 */
export function getBackendUrl() {
  return DJI_BACKEND_URL || null;
}
