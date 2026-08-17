import { supabase } from '../lib/supabase';

export async function getPilots(companyId) {
  const { data, error } = await supabase
    .from('pilots')
    .select('*, aircraft:preferred_aircraft(aircraft_name)')
    .eq('company_id', companyId)
    .order('last_name');
  if (error) throw error;
  return data;
}

export async function searchPilots(companyId, query) {
  const { data, error } = await supabase
    .from('pilots')
    .select('*, aircraft:preferred_aircraft(aircraft_name)')
    .eq('company_id', companyId)
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,pilot_code.ilike.%${query}%,email.ilike.%${query}%,licence_number.ilike.%${query}%`)
    .order('last_name');
  if (error) throw error;
  return data;
}

export async function getPilot(id) {
  const { data, error } = await supabase
    .from('pilots')
    .select('*, aircraft:preferred_aircraft(aircraft_name)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createPilot(pilot) {
  const { data, error } = await supabase.from('pilots').insert(pilot).select().single();
  if (error) throw error;
  return data;
}

export async function updatePilot(id, updates) {
  const { data, error } = await supabase.from('pilots').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deletePilot(id) {
  const { error } = await supabase.from('pilots').delete().eq('id', id);
  if (error) throw error;
}

export async function getPilotStats(companyId) {
  const { data, error } = await supabase
    .from('pilots')
    .select('status, total_flight_hours, licence_expiry, medical_expiry')
    .eq('company_id', companyId);
  if (error) throw error;

  const total = data.length;
  const available = data.filter((p) => p.status === 'Available').length;
  const flying = data.filter((p) => p.status === 'Flying').length;
  const onLeave = data.filter((p) => p.status === 'On Leave').length;
  const training = data.filter((p) => p.status === 'Training').length;
  const totalHours = Math.round(data.reduce((s, p) => s + (p.total_flight_hours || 0), 0));
  const avgHours = total > 0 ? Math.round(totalHours / total) : 0;

  const today = new Date();
  const thirtyDays = new Date(today.getTime() + 30 * 86400000);
  const licenceExpiring = data.filter((p) => p.licence_expiry && new Date(p.licence_expiry) < thirtyDays).length;
  const medicalExpiring = data.filter((p) => p.medical_expiry && new Date(p.medical_expiry) < thirtyDays).length;

  return { total, available, flying, onLeave, training, totalHours, avgHours, licenceExpiring, medicalExpiring };
}

export async function uploadPilotPhoto(file, pilotId) {
  const ext = file.name.split('.').pop();
  const path = `${pilotId}/photo.${ext}`;
  const { error } = await supabase.storage.from('pilots').upload(path, file, { upsert: true, cacheControl: '3600' });
  if (error) throw error;
  const { data } = supabase.storage.from('pilots').getPublicUrl(path);
  return data.publicUrl;
}
