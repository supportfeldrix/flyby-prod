import { supabase } from '../lib/supabase';

/**
 * Get assets assigned to a mission.
 */
export async function getMissionAssets(missionId) {
  const { data, error } = await supabase
    .from('mission_assets')
    .select('*, assets(id, asset_name, category_name, brand, model, serial_number, status, photo_url)')
    .eq('mission_id', missionId)
    .order('assigned_at');
  if (error) throw error;
  return data || [];
}

/**
 * Assign assets to a mission. Sets status to 'Reserved'.
 */
export async function assignAssetsToMission(missionId, assetIds, companyId) {
  if (!assetIds || assetIds.length === 0) return;

  // Insert mission_assets records
  const records = assetIds.map(assetId => ({
    company_id: companyId,
    mission_id: missionId,
    asset_id: assetId,
  }));

  const { error: insertErr } = await supabase
    .from('mission_assets')
    .upsert(records, { onConflict: 'mission_id,asset_id' });
  if (insertErr) throw error;

  // Update asset statuses to Reserved
  for (const assetId of assetIds) {
    await supabase.from('assets').update({ status: 'Reserved' }).eq('id', assetId).in('status', ['Available']);
  }
}

/**
 * Remove an asset from a mission.
 */
export async function removeAssetFromMission(missionId, assetId) {
  const { error } = await supabase
    .from('mission_assets')
    .delete()
    .eq('mission_id', missionId)
    .eq('asset_id', assetId);
  if (error) throw error;

  // Release asset back to Available (only if not assigned to another active mission)
  const { data: otherAssignments } = await supabase
    .from('mission_assets')
    .select('id')
    .eq('asset_id', assetId)
    .is('released_at', null);

  if (!otherAssignments || otherAssignments.length === 0) {
    await supabase.from('assets').update({ status: 'Available' }).eq('id', assetId);
  }
}

/**
 * Mark all mission assets as 'In Mission' when mission starts.
 */
export async function activateMissionAssets(missionId) {
  const assets = await getMissionAssets(missionId);
  for (const ma of assets) {
    await supabase.from('assets').update({ status: 'In Mission' }).eq('id', ma.asset_id);
  }
}

/**
 * Release all mission assets when mission completes. Sets status back to 'Available'.
 */
export async function releaseMissionAssets(missionId) {
  const now = new Date().toISOString();

  // Get assigned assets
  const assets = await getMissionAssets(missionId);

  // Mark as released
  await supabase
    .from('mission_assets')
    .update({ released_at: now })
    .eq('mission_id', missionId)
    .is('released_at', null);

  // Set each asset back to Available
  for (const ma of assets) {
    if (!ma.released_at) {
      await supabase.from('assets').update({ status: 'Available' }).eq('id', ma.asset_id);
    }
  }
}

/**
 * Get available assets for assignment (not in mission or reserved).
 */
export async function getAvailableAssets(companyId) {
  const { data, error } = await supabase
    .from('assets')
    .select('*, asset_categories(name)')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .in('status', ['Available'])
    .order('asset_name');
  if (error) throw error;
  return data || [];
}
