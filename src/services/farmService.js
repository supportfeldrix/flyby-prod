import { supabase } from '../lib/supabase';

export async function getFarms(companyId) {
  const { data, error } = await supabase
    .from('farms')
    .select('*, customers(customer_name)')
    .eq('company_id', companyId)
    .order('farm_name');
  if (error) throw error;
  return data;
}

export async function searchFarms(companyId, query) {
  const { data, error } = await supabase
    .from('farms')
    .select('*, customers(customer_name)')
    .eq('company_id', companyId)
    .ilike('farm_name', `%${query}%`)
    .order('farm_name');
  if (error) throw error;
  return data;
}

export async function getFarm(id) {
  const { data, error } = await supabase
    .from('farms')
    .select('*, customers(customer_name)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getFarmsByCustomer(customerId) {
  const { data, error } = await supabase
    .from('farms')
    .select('*')
    .eq('customer_id', customerId)
    .order('farm_name');
  if (error) throw error;
  return data;
}

export async function createFarm(farm) {
  const { data, error } = await supabase
    .from('farms')
    .insert(farm)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFarm(id, updates) {
  const { data, error } = await supabase
    .from('farms')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFarm(id) {
  const { error } = await supabase
    .from('farms')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function getFarmCount(companyId) {
  const { count, error } = await supabase
    .from('farms')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);
  if (error) throw error;
  return count || 0;
}
