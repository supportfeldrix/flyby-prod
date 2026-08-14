import { supabase } from '../lib/supabase';

/**
 * Create a new company and link the user as Administrator.
 *
 * Onboarding flow (3 sequential operations):
 *   1. Create the company row
 *   2. Create the company_users membership record
 *   3. Update the user's profile with company_id and role
 *
 * NOTE: Supabase JS client does not support client-side transactions.
 * If step 2 or 3 fails, the company will exist but be unlinked.
 * This is acceptable for onboarding — the user can retry company setup
 * and the orphaned company can be cleaned up by a background job later.
 * For critical multi-step mutations in future, use a Supabase Edge Function
 * with a server-side transaction.
 */
export async function createCompany(userId, companyData) {
  // 1. Create the company
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({
      company_name: companyData.companyName,
      company_code: companyData.companyCode || null,
      email: companyData.email || null,
      phone: companyData.phone || null,
      country: companyData.country || 'South Africa',
      province: companyData.province || null,
      logo_url: companyData.logoUrl || null,
      created_by: userId,
    })
    .select()
    .single();

  if (companyError) throw companyError;

  // 2. Create the company_users membership link
  const { error: linkError } = await supabase
    .from('company_users')
    .insert({
      company_id: company.id,
      user_id: userId,
      role: 'Administrator',
    });

  if (linkError) throw linkError;

  // 3. Update the user's profile with company reference
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      company_id: company.id,
      role: 'Administrator',
    })
    .eq('id', userId);

  if (profileError) throw profileError;

  return company;
}

/**
 * Get the current user's company (with RLS — only returns their own).
 */
export async function getCompany(companyId) {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update company details. Only Administrators can update (enforced by RLS).
 */
export async function updateCompany(companyId, updates) {
  const { data, error } = await supabase
    .from('companies')
    .update(updates)
    .eq('id', companyId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
