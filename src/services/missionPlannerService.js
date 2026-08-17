import { supabase } from '../lib/supabase';

export async function getMissions(companyId) {
  const { data, error } = await supabase
    .from('missions')
    .select('*, customers(customer_name), farms(farm_name), fields(field_name, crop, area_hectares, boundary), aircraft(aircraft_name), pilots(first_name, last_name, display_name), battery_sets:battery_id(battery_code)')
    .eq('company_id', companyId)
    .order('scheduled_date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getTodayMissions(companyId) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('missions')
    .select('*, customers(customer_name), farms(farm_name), fields(field_name, crop, area_hectares), aircraft(aircraft_name), pilots(first_name, last_name, display_name)')
    .eq('company_id', companyId)
    .eq('scheduled_date', today)
    .order('recommended_start');
  if (error) throw error;
  return data;
}

export async function searchMissions(companyId, query) {
  const { data, error } = await supabase
    .from('missions')
    .select('*, customers(customer_name), farms(farm_name), fields(field_name), aircraft(aircraft_name), pilots(first_name, last_name)')
    .eq('company_id', companyId)
    .or(`mission_number.ilike.%${query}%,chemical_name.ilike.%${query}%,crop.ilike.%${query}%`)
    .order('scheduled_date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createMission(mission) {
  const { data, error } = await supabase.from('missions').insert(mission).select().single();
  if (error) throw error;
  return data;
}

export async function updateMission(id, updates) {
  const { data, error } = await supabase.from('missions').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteMission(id) {
  const { error } = await supabase.from('missions').delete().eq('id', id);
  if (error) throw error;
}

export async function getMissionStats(companyId) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('missions')
    .select('status, scheduled_date')
    .eq('company_id', companyId);
  if (error) throw error;

  const todayMissions = data.filter(m => m.scheduled_date === today);
  return {
    total: data.length,
    today: todayMissions.length,
    todayReady: todayMissions.filter(m => m.status === 'Ready').length,
    todayDraft: todayMissions.filter(m => m.status === 'Draft').length,
    todayCompleted: todayMissions.filter(m => m.status === 'Completed').length,
    todayDispatched: todayMissions.filter(m => m.status === 'Dispatched' || m.status === 'In Progress').length,
    planned: data.filter(m => m.status === 'Planned').length,
    completed: data.filter(m => m.status === 'Completed').length,
  };
}

export async function generateMissionNumber(companyId) {
  const year = new Date().getFullYear();

  // Upsert sequence row
  const { data: seq, error: seqErr } = await supabase
    .from('mission_sequences')
    .upsert({ company_id: companyId, last_number: 1 }, { onConflict: 'company_id' })
    .select()
    .single();

  if (seqErr) {
    // Fallback: increment
    const { data: existing } = await supabase
      .from('mission_sequences')
      .select('last_number')
      .eq('company_id', companyId)
      .single();

    const nextNum = (existing?.last_number || 0) + 1;
    await supabase.from('mission_sequences').update({ last_number: nextNum }).eq('company_id', companyId);
    return `FLY-${year}-${String(nextNum).padStart(6, '0')}`;
  }

  // Increment
  const nextNum = seq.last_number + 1;
  await supabase.from('mission_sequences').update({ last_number: nextNum }).eq('company_id', companyId);
  return `FLY-${year}-${String(nextNum).padStart(6, '0')}`;
}

export function calculateDuration(areaHectares) {
  // Estimate: ~4 hectares per hour for spray drone
  if (!areaHectares) return 0;
  return Math.round((areaHectares / 4) * 60); // minutes
}

export function estimateBatteryUsage(durationMinutes) {
  // Estimate: ~3.3% per minute of flight
  if (!durationMinutes) return 0;
  return Math.min(100, Math.round(durationMinutes * 3.3));
}
