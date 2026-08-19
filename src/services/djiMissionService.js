import { supabase } from '../lib/supabase';
import djiProvider from './providers/djiProvider';
import djiSmartFarmProvider from './providers/djiSmartFarmProvider';
import { providerRegistry } from './providers/flightDataProvider';

/**
 * FlyBy DJI Mission Service
 * 
 * High-level orchestration for DJI export, import, validation, and matching.
 * Uses the provider abstraction — never calls DJI directly.
 */

// ─── Export ─────────────────────────────────────────────────────────────────

/**
 * Export a mission route for DJI.
 * Returns exportable data and triggers download.
 */
export async function exportMission(route, mission) {
  const provider = providerRegistry.get('dji') || djiProvider;

  // Validate first
  const validation = await provider.validateRouteForExport(route, mission);
  if (!validation.valid) {
    return { success: false, errors: validation.errors, message: validation.message };
  }

  // Generate export
  const result = await provider.exportRoute(route, mission);

  // Trigger file download
  const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Update route status
  if (route?.id) {
    await supabase.from('mission_routes')
      .update({ status: 'Exported', updated_at: new Date().toISOString() })
      .eq('id', route.id);
  }

  return { success: true, message: result.message, filename: result.filename };
}

/**
 * Validate a route for DJI export without actually exporting.
 */
export async function validateDjiMission(route, mission) {
  const provider = providerRegistry.get('dji') || djiProvider;
  return provider.validateRouteForExport(route, mission);
}

/**
 * Get DJI export status for a mission route.
 */
export async function getDjiExportStatus(missionId) {
  const { data, error } = await supabase
    .from('mission_routes')
    .select('status, sync_status, last_sync_at, provider, provider_ref')
    .eq('mission_id', missionId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return { status: 'none', message: 'No route prepared for this mission' };

  return {
    status: data.status,
    syncStatus: data.sync_status,
    lastSync: data.last_sync_at,
    provider: data.provider,
    providerRef: data.provider_ref,
  };
}

// ─── Import Flight Data ─────────────────────────────────────────────────────

/**
 * Import flight data from a file (DJI/SmartFarm export).
 */
export async function importFlightDataFromFile(file, companyId, pilotId, aircraftId) {
  // Determine provider based on file contents or name
  let provider = djiSmartFarmProvider;
  if (file.name.toLowerCase().includes('smartfarm')) {
    provider = djiSmartFarmProvider;
  }

  const record = await provider.importFlightDataFromFile(file);

  // Store in database
  const { data, error } = await supabase
    .from('flight_data_records')
    .insert({
      company_id: companyId,
      pilot_id: pilotId || null,
      aircraft_id: aircraftId || null,
      source: record.source,
      provider_ref: record.provider_ref,
      is_test_data: record.is_test_data || false,
      flight_start: record.flight_start,
      flight_end: record.flight_end,
      flight_duration: record.flight_duration,
      area_covered: record.area_covered,
      gps_track: record.gps_track,
      battery_start: record.battery_start,
      battery_end: record.battery_end,
      battery_used: record.battery_used,
      application_rate: record.application_rate,
      flow_rate: record.flow_rate,
      application_volume: record.application_volume,
      chemical_name: record.chemical_name,
      estimated_usage: record.estimated_usage,
      actual_usage: record.actual_usage,
      data_sources: record.data_sources,
      raw_data: record.raw_data,
      match_status: 'unmatched',
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to store flight data: ${error.message}`);

  return data;
}

/**
 * Generate and store test flight data for a mission.
 */
export async function generateTestFlightData(mission, companyId) {
  const testData = djiSmartFarmProvider.generateTestFlightData(mission);

  const { data, error } = await supabase
    .from('flight_data_records')
    .insert({
      company_id: companyId,
      mission_id: mission.id,
      pilot_id: mission.pilot_id,
      aircraft_id: mission.aircraft_id,
      source: 'test',
      provider_ref: testData.provider_ref,
      is_test_data: true,
      flight_start: testData.flight_start,
      flight_end: testData.flight_end,
      flight_duration: testData.flight_duration,
      area_covered: testData.area_covered,
      battery_start: testData.battery_start,
      battery_end: testData.battery_end,
      battery_used: testData.battery_used,
      application_rate: testData.application_rate,
      flow_rate: testData.flow_rate,
      application_volume: testData.application_volume,
      chemical_name: testData.chemical_name,
      estimated_usage: testData.estimated_usage,
      actual_usage: testData.actual_usage,
      data_sources: testData.data_sources,
      raw_data: testData.raw_data,
      match_status: 'auto_matched',
      matched_at: new Date().toISOString(),
      matched_by: 'system_test',
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to store test flight data: ${error.message}`);

  // Update mission
  await supabase.from('missions').update({ flight_data_status: 'received' }).eq('id', mission.id);

  return data;
}

// ─── Mission Matching ───────────────────────────────────────────────────────

/**
 * Attempt to match unmatched flight data to FlyBy missions.
 */
export async function matchFlightDataToMission(flightDataId, missionId) {
  const { error } = await supabase
    .from('flight_data_records')
    .update({
      mission_id: missionId,
      match_status: 'manual_matched',
      matched_at: new Date().toISOString(),
      matched_by: 'user',
      updated_at: new Date().toISOString(),
    })
    .eq('id', flightDataId);
  if (error) throw error;

  // Update mission flight_data_status
  await supabase.from('missions').update({ flight_data_status: 'received' }).eq('id', missionId);
}

/**
 * Auto-match a flight data record against completed missions.
 */
export async function autoMatchFlightData(flightDataRecord, companyId) {
  // Get recent completed missions
  const { data: missions } = await supabase
    .from('missions')
    .select('*, aircraft(aircraft_name), pilots(first_name, last_name)')
    .eq('company_id', companyId)
    .eq('status', 'Completed')
    .is('flight_data_status', null)
    .order('completed_at', { ascending: false })
    .limit(20);

  if (!missions || missions.length === 0) return { matched: false };

  const provider = djiProvider;
  const result = await provider.matchFlightToMission(flightDataRecord, missions);

  if (result.matched && result.mission) {
    await matchFlightDataToMission(flightDataRecord.id, result.mission.id);
    return { matched: true, mission: result.mission, confidence: result.confidence };
  }

  return { matched: false, alternatives: result.alternatives || [] };
}

// ─── Flight Data Retrieval ──────────────────────────────────────────────────

/**
 * Get flight data for a mission.
 */
export async function getMissionFlightData(missionId) {
  const { data, error } = await supabase
    .from('flight_data_records')
    .select('*')
    .eq('mission_id', missionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

/**
 * Get all unmatched flight data for a company.
 */
export async function getUnmatchedFlightData(companyId) {
  const { data, error } = await supabase
    .from('flight_data_records')
    .select('*')
    .eq('company_id', companyId)
    .eq('match_status', 'unmatched')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ─── DJI Connection ─────────────────────────────────────────────────────────

/**
 * Get DJI connection status for a pilot.
 */
export async function getDjiConnection(pilotId) {
  const { data, error } = await supabase
    .from('dji_connections')
    .select('*')
    .eq('pilot_id', pilotId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

/**
 * Get DJI devices for a company.
 */
export async function getDjiDevices(companyId) {
  const { data, error } = await supabase
    .from('dji_devices')
    .select('*, aircraft(aircraft_name)')
    .eq('company_id', companyId)
    .order('last_seen', { ascending: false });
  if (error) throw error;
  return data || [];
}
