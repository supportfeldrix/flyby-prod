import { supabase } from '../lib/supabase';

/**
 * Calculate readiness for a single aircraft.
 * Returns: { status: 'READY' | 'WARNING' | 'NOT READY', checks: [...] }
 */
export function calculateAircraftReadiness(aircraft, batteries, equipment, pilots) {
  const checks = [];
  const today = new Date();

  // Aircraft status
  const aircraftReady = aircraft.status === 'Ready';
  checks.push({ label: 'Aircraft Status', ok: aircraftReady, detail: aircraft.status });

  // Service current
  const serviceCurrent = !aircraft.next_service_date || new Date(aircraft.next_service_date) >= today;
  checks.push({ label: 'Service Current', ok: serviceCurrent, detail: serviceCurrent ? 'Up to date' : 'Overdue' });

  // Battery assigned and ready
  const assignedBatteries = batteries.filter(b => b.aircraft_id === aircraft.id);
  const batteryReady = assignedBatteries.some(b => b.status === 'Ready' && b.current_charge >= 30);
  checks.push({ label: 'Battery Ready', ok: batteryReady, detail: assignedBatteries.length > 0 ? `${assignedBatteries.length} assigned` : 'None assigned' });

  // Pilot assigned
  const assignedPilot = pilots.find(p => p.preferred_aircraft === aircraft.id && (p.status === 'Available' || p.status === 'Standby'));
  checks.push({ label: 'Pilot Available', ok: !!assignedPilot, detail: assignedPilot ? `${assignedPilot.first_name} ${assignedPilot.last_name}` : 'None available' });

  // Equipment
  const assignedEquipment = equipment.filter(e => e.aircraft_id === aircraft.id);
  const equipmentReady = assignedEquipment.length === 0 || assignedEquipment.every(e => e.status === 'Ready' || e.status === 'In Use');
  checks.push({ label: 'Equipment Ready', ok: equipmentReady, detail: assignedEquipment.length > 0 ? `${assignedEquipment.length} items` : 'No equipment' });

  const allOk = checks.every(c => c.ok);
  const anyFail = checks.some(c => !c.ok);
  const criticalFail = !aircraftReady || !batteryReady;

  let status = 'READY';
  if (criticalFail) status = 'NOT READY';
  else if (anyFail) status = 'WARNING';

  return { status, checks, readyCount: checks.filter(c => c.ok).length, totalChecks: checks.length };
}

/**
 * Calculate fleet-wide readiness.
 */
export async function calculateFleetReadiness(companyId) {
  const [
    { data: aircraftData },
    { data: batteryData },
    { data: equipmentData },
    { data: pilotData },
  ] = await Promise.all([
    supabase.from('aircraft').select('*').eq('company_id', companyId),
    supabase.from('battery_sets').select('*').eq('company_id', companyId),
    supabase.from('equipment').select('*').eq('company_id', companyId),
    supabase.from('pilots').select('id, first_name, last_name, status, preferred_aircraft').eq('company_id', companyId),
  ]);

  const aircraft = aircraftData || [];
  const batteries = batteryData || [];
  const equip = equipmentData || [];
  const pilots = pilotData || [];

  const activeAircraft = aircraft.filter(a => a.status !== 'Retired' && a.status !== 'Offline');
  const results = activeAircraft.map(a => ({
    aircraft: a,
    readiness: calculateAircraftReadiness(a, batteries, equip, pilots),
  }));

  const readyCount = results.filter(r => r.readiness.status === 'READY').length;
  const warningCount = results.filter(r => r.readiness.status === 'WARNING').length;
  const notReadyCount = results.filter(r => r.readiness.status === 'NOT READY').length;
  const percentage = activeAircraft.length > 0 ? Math.round((readyCount / activeAircraft.length) * 100) : 0;

  return { results, readyCount, warningCount, notReadyCount, total: activeAircraft.length, percentage };
}
