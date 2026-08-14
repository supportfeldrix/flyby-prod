import { supabase } from '../lib/supabase';

export async function getFields(companyId) {
  const { data, error } = await supabase
    .from('fields')
    .select('*, farms(farm_name, customers(customer_name))')
    .eq('company_id', companyId)
    .order('field_name');
  if (error) throw error;
  return data;
}

export async function searchFields(companyId, query) {
  const { data, error } = await supabase
    .from('fields')
    .select('*, farms(farm_name, customers(customer_name))')
    .eq('company_id', companyId)
    .or(`field_name.ilike.%${query}%,crop.ilike.%${query}%`)
    .order('field_name');
  if (error) throw error;
  return data;
}

export async function getField(id) {
  const { data, error } = await supabase
    .from('fields')
    .select('*, farms(farm_name, customers(customer_name))')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getFieldsByFarm(farmId) {
  const { data, error } = await supabase
    .from('fields')
    .select('*')
    .eq('farm_id', farmId)
    .order('field_name');
  if (error) throw error;
  return data;
}

export async function createField(field) {
  const { data, error } = await supabase
    .from('fields')
    .insert(field)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateField(id, updates) {
  const { data, error } = await supabase
    .from('fields')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteField(id) {
  const { error } = await supabase
    .from('fields')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function getFieldCount(companyId) {
  const { count, error } = await supabase
    .from('fields')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);
  if (error) throw error;
  return count || 0;
}
