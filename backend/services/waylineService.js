import { getSupabase } from './supabaseAdmin.js';
import { writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WAYLINE_DIR = join(__dirname, '..', 'storage', 'waylines');

if (!existsSync(WAYLINE_DIR)) mkdirSync(WAYLINE_DIR, { recursive: true });

export async function storeWayline(workspaceId, waylineData, metadata) {
  const waylineId = uuid();
  const filename = `${waylineId}.json`;
  writeFileSync(join(WAYLINE_DIR, filename), JSON.stringify(waylineData, null, 2));

  const supabase = getSupabase();
  if (supabase && metadata.mission_id) {
    await supabase.from('mission_routes').update({
      provider: 'dji_cloud', provider_ref: waylineId, sync_status: 'synced', status: 'Synced', last_sync_at: new Date().toISOString(),
    }).eq('mission_id', metadata.mission_id);
  }

  return { wayline_id: waylineId, filename, workspace_id: workspaceId, stored_at: new Date().toISOString() };
}

export async function getWorkspaceWaylines(workspaceId) {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from('mission_routes').select('*, missions(mission_number, scheduled_date)')
      .eq('company_id', workspaceId).not('provider_ref', 'is', null).order('last_sync_at', { ascending: false });
    if (!error && data && data.length > 0) {
      return data.map(r => ({ id: r.provider_ref, name: r.route_name || r.missions?.mission_number || 'FlyBy Mission', template_type: 2, update_time: r.last_sync_at, user_name: 'FlyBy', mission_number: r.missions?.mission_number, sync_status: r.sync_status }));
    }
  }

  // Filesystem fallback
  if (!existsSync(WAYLINE_DIR)) return [];
  return readdirSync(WAYLINE_DIR).filter(f => f.endsWith('.json')).map(f => {
    try {
      const c = JSON.parse(readFileSync(join(WAYLINE_DIR, f), 'utf-8'));
      return { id: f.replace('.json', ''), name: c.mission_name || 'FlyBy Mission', template_type: 2, update_time: c.created_at, user_name: 'FlyBy', sync_status: 'synced' };
    } catch { return null; }
  }).filter(Boolean);
}

export function getWaylineDownloadUrl(waylineId, backendUrl) {
  return `${backendUrl}/api/v1/waylines/${waylineId}/download`;
}
