import { supabase } from '../lib/supabase';

export async function getEquipment(companyId) {
  const { data, error } = await supabase.from('equipment').select('*, aircraft:aircraft_id(aircraft_name)').eq('company_id', companyId).order('equipment_name');
  if (error) throw error;
  return data;
}

export async function createEquipment(eq) {
  const { data, error } = await supabase.from('equipment').insert(eq).select().single();
  if (error) throw error;
  return data;
}

export async function updateEquipment(id, updates) {
  const { data, error } = await supabase.from('equipment').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteEquipment(id) {
  const { error } = await supabase.from('equipment').delete().eq('id', id);
  if (error) throw error;
}

export async function getEquipmentStats(companyId) {
  const { data, error } = await supabase.from('equipment').select('status, next_calibration').eq('company_id', companyId);
  if (error) throw error;
  const total = data.length;
  const ready = data.filter(e => e.status === 'Ready').length;
  const calibrationDue = data.filter(e => e.next_calibration && new Date(e.next_calibration) < new Date()).length;
  return { total, ready, calibrationDue };
}
