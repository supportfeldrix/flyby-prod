import { supabase } from '../lib/supabase';

const STORAGE_BUCKET = 'asset-images';

/**
 * Get all assets for a company with optional filters.
 */
export async function getAssets(companyId, { category, status, search } = {}) {
  let query = supabase
    .from('assets')
    .select('*, asset_categories(name, icon)')
    .eq('company_id', companyId)
    .eq('is_active', true);

  if (category && category !== 'all') query = query.eq('category_id', category);
  if (status && status !== 'all') query = query.eq('status', status);

  query = query.order('asset_name');

  const { data, error } = await query;
  if (error) throw error;

  if (search && search.trim()) {
    const term = search.toLowerCase();
    return data.filter(a =>
      a.asset_name?.toLowerCase().includes(term) ||
      a.brand?.toLowerCase().includes(term) ||
      a.model?.toLowerCase().includes(term) ||
      a.serial_number?.toLowerCase().includes(term) ||
      a.asset_number?.toLowerCase().includes(term) ||
      a.category_name?.toLowerCase().includes(term)
    );
  }

  return data;
}

/**
 * Get a single asset by ID.
 */
export async function getAssetById(assetId) {
  const { data, error } = await supabase
    .from('assets')
    .select('*, asset_categories(name, icon)')
    .eq('id', assetId)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Sanitise asset data — convert empty strings to null for unique constraint fields.
 */
function sanitiseAsset(asset) {
  const cleaned = { ...asset };
  if (!cleaned.asset_number?.trim()) cleaned.asset_number = null;
  if (!cleaned.serial_number?.trim()) cleaned.serial_number = null;
  if (!cleaned.purchase_price) cleaned.purchase_price = null;
  if (!cleaned.purchase_date) cleaned.purchase_date = null;
  if (!cleaned.warranty_expiry) cleaned.warranty_expiry = null;
  if (!cleaned.category_id) cleaned.category_id = null;
  return cleaned;
}

/**
 * Create a new asset.
 */
export async function createAsset(asset, companyId) {
  const { data, error } = await supabase
    .from('assets')
    .insert({ ...sanitiseAsset(asset), company_id: companyId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Update an asset.
 */
export async function updateAsset(assetId, updates) {
  const { data, error } = await supabase
    .from('assets')
    .update(sanitiseAsset(updates))
    .eq('id', assetId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Soft-delete (retire) an asset.
 */
export async function retireAsset(assetId) {
  const { error } = await supabase
    .from('assets')
    .update({ status: 'Retired', is_active: false })
    .eq('id', assetId);
  if (error) throw error;
}

/**
 * Delete an asset permanently.
 */
export async function deleteAsset(assetId) {
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', assetId);
  if (error) throw error;
}

/**
 * Update asset status.
 */
export async function updateAssetStatus(assetId, status) {
  const { error } = await supabase
    .from('assets')
    .update({ status })
    .eq('id', assetId);
  if (error) throw error;
}

/**
 * Get asset stats for the dashboard.
 */
export async function getAssetStats(companyId) {
  const { data, error } = await supabase
    .from('assets')
    .select('status, category_id, asset_categories(name)')
    .eq('company_id', companyId)
    .eq('is_active', true);
  if (error) throw error;

  const stats = {
    total: data.length,
    available: data.filter(a => a.status === 'Available').length,
    reserved: data.filter(a => a.status === 'Reserved').length,
    inMission: data.filter(a => a.status === 'In Mission').length,
    maintenance: data.filter(a => a.status === 'Maintenance').length,
    retired: data.filter(a => a.status === 'Retired').length,
  };

  // Category breakdown
  const categories = {};
  data.forEach(a => {
    const cat = a.asset_categories?.name || 'Uncategorised';
    categories[cat] = (categories[cat] || 0) + 1;
  });
  stats.categories = Object.entries(categories).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  return stats;
}

/**
 * Upload asset photo and return URL.
 */
export async function uploadAssetPhoto(file, companyId, assetId) {
  const path = `${companyId}/${assetId}/${Date.now()}_${file.name}`;
  const { error: uploadErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });
  if (uploadErr) throw new Error(`Photo upload failed: ${uploadErr.message}`);

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
