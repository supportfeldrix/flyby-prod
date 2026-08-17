import { supabase } from '../lib/supabase';

export async function getBatteries(companyId) {
  const { data, error } = await supabase.from('battery_sets').select('*, aircraft:aircraft_id(aircraft_name)').eq('company_id', companyId).order('battery_code');
  if (error) throw error;
  return data;
}

export async function getBatteriesByAircraft(aircraftId) {
  const { data, error } = await supabase.from('battery_sets').select('*').eq('aircraft_id', aircraftId).order('battery_code');
  if (error) throw error;
  return data;
}

export async function createBattery(battery) {
  const { data, error } = await supabase.from('battery_sets').insert(battery).select().single();
  if (error) throw error;
  return data;
}

export async function updateBattery(id, updates) {
  const { data, error } = await supabase.from('battery_sets').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteBattery(id) {
  const { error } = await supabase.from('battery_sets').delete().eq('id', id);
  if (error) throw error;
}

export async function getBatteryStats(companyId) {
  const { data, error } = await supabase.from('battery_sets').select('status, current_charge, battery_health').eq('company_id', companyId);
  if (error) throw error;
  const total = data.length;
  const ready = data.filter(b => b.status === 'Ready').length;
  const charging = data.filter(b => b.status === 'Charging').length;
  const cooling = data.filter(b => b.status === 'Cooling').length;
  const maintenance = data.filter(b => b.status === 'Maintenance').length;
  const lowCharge = data.filter(b => b.current_charge < 30).length;
  const lowHealth = data.filter(b => b.battery_health < 80).length;
  return { total, ready, charging, cooling, maintenance, lowCharge, lowHealth };
}
