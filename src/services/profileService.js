import { supabase } from '../lib/supabase';

/**
 * Fetch the current user's profile (with company data joined).
 */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      companies (
        id,
        company_name,
        phone,
        email,
        country,
        province,
        logo_url
      )
    `)
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update the current user's profile.
 */
export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Check if a user has completed company setup.
 */
export async function hasCompanySetup(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return !!data?.company_id;
}
