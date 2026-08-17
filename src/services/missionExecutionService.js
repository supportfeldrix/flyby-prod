import { supabase } from '../lib/supabase';
import { addLogEntry } from './flightLogService';
import { createChecklist } from './checklistService';

/**
 * Dispatch a mission — creates checklist, changes status, logs event.
 */
export async function dispatchMission(mission, companyId, user) {
  // Create pre-flight checklist
  await createChecklist(mission.id, companyId);

  // Update mission status
  const { error } = await supabase
    .from('missions')
    .update({ status: 'Dispatched', dispatched_at: new Date().toISOString() })
    .eq('id', mission.id);
  if (error) throw error;

  // Log
  await addLogEntry(mission.id, companyId, 'dispatched', 'Mission dispatched', user?.id, user?.full_name || 'System');
}

/**
 * Start mission — Pre Flight → Flying. Updates resource statuses.
 */
export async function startMission(mission, companyId, user) {
  const now = new Date().toISOString();

  // Update mission
  const { error: mErr } = await supabase.from('missions')
    .update({ status: 'Flying', started_at: now })
    .eq('id', mission.id);
  if (mErr) throw mErr;

  // Update aircraft to Flying
  if (mission.aircraft_id) {
    await supabase.from('aircraft').update({ status: 'In Mission' }).eq('id', mission.aircraft_id);
  }

  // Update pilot to Flying
  if (mission.pilot_id) {
    await supabase.from('pilots').update({ status: 'Flying' }).eq('id', mission.pilot_id);
  }

  // Update battery to In Use
  if (mission.battery_id) {
    await supabase.from('battery_sets').update({ status: 'In Use', last_used_at: now }).eq('id', mission.battery_id);
  }

  await addLogEntry(mission.id, companyId, 'takeoff', 'Mission started — aircraft airborne', user?.id, user?.full_name);
}

/**
 * Pause mission.
 */
export async function pauseMission(missionId, companyId, user, reason) {
  await supabase.from('missions').update({ status: 'Paused' }).eq('id', missionId);
  await addLogEntry(missionId, companyId, 'paused', 'Mission paused', user?.id, user?.full_name, reason);
}

/**
 * Resume mission.
 */
export async function resumeMission(missionId, companyId, user) {
  await supabase.from('missions').update({ status: 'Flying' }).eq('id', missionId);
  await addLogEntry(missionId, companyId, 'resumed', 'Mission resumed', user?.id, user?.full_name);
}

/**
 * Complete mission — updates all operational resources.
 */
export async function completeMission(mission, companyId, user, completionData = {}) {
  const now = new Date();
  const startedAt = mission.started_at ? new Date(mission.started_at) : now;
  const actualDuration = Math.round((now - startedAt) / 60000); // minutes
  const actualArea = completionData.actual_area || mission.estimated_area || 0;
  const actualBatteryUsed = completionData.actual_battery_used || mission.estimated_battery_usage || 0;

  // Update mission
  await supabase.from('missions').update({
    status: 'Completed',
    completed_at: now.toISOString(),
    actual_duration: actualDuration,
    actual_area: actualArea,
    actual_battery_used: actualBatteryUsed,
    completion_notes: completionData.notes || null,
  }).eq('id', mission.id);

  // Restore aircraft to Ready + increment hours
  if (mission.aircraft_id) {
    const { data: ac } = await supabase.from('aircraft').select('flight_hours, total_missions, total_hectares').eq('id', mission.aircraft_id).single();
    await supabase.from('aircraft').update({
      status: 'Ready',
      flight_hours: (ac?.flight_hours || 0) + (actualDuration / 60),
      total_missions: (ac?.total_missions || 0) + 1,
      total_hectares: (ac?.total_hectares || 0) + actualArea,
      last_flight_date: now.toISOString().split('T')[0],
    }).eq('id', mission.aircraft_id);
  }

  // Restore pilot to Available + increment hours
  if (mission.pilot_id) {
    const { data: pi } = await supabase.from('pilots').select('total_flight_hours, total_missions, total_hectares').eq('id', mission.pilot_id).single();
    await supabase.from('pilots').update({
      status: 'Available',
      total_flight_hours: (pi?.total_flight_hours || 0) + (actualDuration / 60),
      total_missions: (pi?.total_missions || 0) + 1,
      total_hectares: (pi?.total_hectares || 0) + actualArea,
    }).eq('id', mission.pilot_id);
  }

  // Update battery — decrement charge, increment cycles
  if (mission.battery_id) {
    const { data: bat } = await supabase.from('battery_sets').select('current_charge, charge_cycles').eq('id', mission.battery_id).single();
    await supabase.from('battery_sets').update({
      status: 'Cooling',
      current_charge: Math.max(0, (bat?.current_charge || 100) - actualBatteryUsed),
      charge_cycles: (bat?.charge_cycles || 0) + 1,
    }).eq('id', mission.battery_id);
  }

  await addLogEntry(mission.id, companyId, 'completed', `Mission completed — ${actualArea} ha in ${actualDuration} min`, user?.id, user?.full_name);
}

/**
 * Abort mission — emergency or pilot-initiated.
 */
export async function abortMission(mission, companyId, user, reason, isEmergency = false) {
  const status = isEmergency ? 'Emergency' : 'Aborted';
  await supabase.from('missions').update({ status, completed_at: new Date().toISOString(), completion_notes: reason }).eq('id', mission.id);

  // Restore resources
  if (mission.aircraft_id) await supabase.from('aircraft').update({ status: 'Ready' }).eq('id', mission.aircraft_id);
  if (mission.pilot_id) await supabase.from('pilots').update({ status: 'Available' }).eq('id', mission.pilot_id);
  if (mission.battery_id) await supabase.from('battery_sets').update({ status: 'Cooling' }).eq('id', mission.battery_id);

  await addLogEntry(mission.id, companyId, isEmergency ? 'emergency' : 'aborted', `Mission ${status.toLowerCase()}: ${reason}`, user?.id, user?.full_name);
}

/**
 * Cancel a planned mission.
 */
export async function cancelMission(missionId, companyId, user, reason) {
  await supabase.from('missions').update({ status: 'Cancelled', completion_notes: reason }).eq('id', missionId);
  await addLogEntry(missionId, companyId, 'cancelled', 'Mission cancelled', user?.id, user?.full_name, reason);
}

/**
 * Get live operations stats.
 */
export async function getLiveOpsStats(companyId) {
  const { data, error } = await supabase
    .from('missions')
    .select('status, aircraft_id, pilot_id')
    .eq('company_id', companyId)
    .in('status', ['Flying', 'Paused', 'Dispatched', 'Pre Flight', 'Ready']);
  if (error) return { flying: 0, ready: 0, dispatched: 0 };

  return {
    flying: data.filter(m => m.status === 'Flying' || m.status === 'Paused').length,
    ready: data.filter(m => m.status === 'Ready').length,
    dispatched: data.filter(m => m.status === 'Dispatched' || m.status === 'Pre Flight').length,
  };
}
