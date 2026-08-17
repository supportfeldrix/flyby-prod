import { supabase } from '../lib/supabase';

export async function getAircraft(companyId) {
  const { data, error } = await supabase
    .from('aircraft')
    .select('*')
    .eq('company_id', companyId)
    .order('aircraft_name');
  if (error) throw error;
  return data;
}

export async function searchAircraft(companyId, query) {
  const { data, error } = await supabase
    .from('aircraft')
    .select('*')
    .eq('company_id', companyId)
    .or(`aircraft_name.ilike.%${query}%,registration_number.ilike.%${query}%,manufacturer.ilike.%${query}%,model.ilike.%${query}%`)
    .order('aircraft_name');
  if (error) throw error;
  return data;
}

export async function getAircraftById(id) {
  const { data, error } = await supabase
    .from('aircraft')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createAircraft(aircraft) {
  const { data, error } = await supabase
    .from('aircraft')
    .insert(aircraft)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAircraft(id, updates) {
  const { data, error } = await supabase
    .from('aircraft')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAircraft(id) {
  const { error } = await supabase
    .from('aircraft')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function getAircraftStats(companyId) {
  const { data, error } = await supabase
    .from('aircraft')
    .select('status, flight_hours, purchase_date')
    .eq('company_id', companyId);
  if (error) throw error;

  const total = data.length;
  const ready = data.filter((a) => a.status === 'Ready').length;
  const inMission = data.filter((a) => a.status === 'In Mission').length;
  const maintenance = data.filter((a) => a.status === 'Maintenance').length;
  const avgFlightHours = total > 0 ? Math.round(data.reduce((sum, a) => sum + (a.flight_hours || 0), 0) / total) : 0;

  return { total, ready, inMission, maintenance, avgFlightHours };
}

export async function getAircraftCount(companyId) {
  const { count, error } = await supabase
    .from('aircraft')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);
  if (error) throw error;
  return count || 0;
}

/**
 * Upload aircraft photo to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadAircraftPhoto(file, aircraftId) {
  const ext = file.name.split('.').pop();
  const path = `${aircraftId}/photo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('aircraft')
    .upload(path, file, { upsert: true, cacheControl: '3600' });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('aircraft')
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Delete aircraft photo from storage.
 */
export async function deleteAircraftPhoto(aircraftId, photoUrl) {
  if (!photoUrl) return;
  const ext = photoUrl.split('.').pop().split('?')[0];
  const path = `${aircraftId}/photo.${ext}`;

  await supabase.storage.from('aircraft').remove([path]);
}
