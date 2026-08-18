import { supabase } from '../lib/supabase';

const DEFAULT_CATEGORIES = [
  { name: 'Power Stations', icon: 'Battery', sort_order: 0 },
  { name: 'Generators', icon: 'Power', sort_order: 1 },
  { name: 'Charging Equipment', icon: 'ChargingStation', sort_order: 2 },
  { name: 'Water Systems', icon: 'Water', sort_order: 3 },
  { name: 'Mixing Equipment', icon: 'Science', sort_order: 4 },
  { name: 'Safety Equipment', icon: 'Shield', sort_order: 5 },
  { name: 'Vehicles', icon: 'DirectionsCar', sort_order: 6 },
  { name: 'Trailers', icon: 'RvHookup', sort_order: 7 },
  { name: 'GPS / RTK Equipment', icon: 'GpsFixed', sort_order: 8 },
  { name: 'Communications', icon: 'Radio', sort_order: 9 },
  { name: 'Tools', icon: 'Build', sort_order: 10 },
  { name: 'Other', icon: 'Category', sort_order: 11 },
];

/**
 * Get all categories for a company. Seeds defaults if none exist.
 */
export async function getAssetCategories(companyId) {
  const { data, error } = await supabase
    .from('asset_categories')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;

  // Seed defaults if empty
  if (!data || data.length === 0) {
    const categories = DEFAULT_CATEGORIES.map(c => ({ ...c, company_id: companyId }));
    const { data: seeded, error: seedErr } = await supabase
      .from('asset_categories')
      .insert(categories)
      .select();
    if (seedErr) throw seedErr;
    return seeded;
  }

  return data;
}

/**
 * Create a new category.
 */
export async function createAssetCategory(companyId, name, icon) {
  const { data, error } = await supabase
    .from('asset_categories')
    .insert({ company_id: companyId, name, icon })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Delete a category.
 */
export async function deleteAssetCategory(categoryId) {
  const { error } = await supabase
    .from('asset_categories')
    .update({ is_active: false })
    .eq('id', categoryId);
  if (error) throw error;
}
