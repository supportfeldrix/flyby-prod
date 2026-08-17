import { supabase } from '../lib/supabase';

const DEFAULT_CHECKLIST_ITEMS = [
  { item_key: 'aircraft_inspection', item_label: 'Aircraft visual inspection complete', sort_order: 1 },
  { item_key: 'battery_installed', item_label: 'Battery installed and secured', sort_order: 2 },
  { item_key: 'weather_confirmed', item_label: 'Weather conditions confirmed safe', sort_order: 3 },
  { item_key: 'gps_lock', item_label: 'GPS lock acquired', sort_order: 4 },
  { item_key: 'field_verified', item_label: 'Field boundary verified', sort_order: 5 },
  { item_key: 'equipment_calibrated', item_label: 'Spray equipment calibrated', sort_order: 6 },
  { item_key: 'chemical_loaded', item_label: 'Chemical loaded and verified', sort_order: 7 },
  { item_key: 'ppe_confirmed', item_label: 'PPE and safety equipment confirmed', sort_order: 8 },
];

export async function createChecklist(missionId, companyId) {
  const items = DEFAULT_CHECKLIST_ITEMS.map(item => ({
    ...item,
    mission_id: missionId,
    company_id: companyId,
  }));
  const { data, error } = await supabase.from('mission_checklists').insert(items).select();
  if (error) throw error;
  return data;
}

export async function getChecklist(missionId) {
  const { data, error } = await supabase
    .from('mission_checklists')
    .select('*')
    .eq('mission_id', missionId)
    .order('sort_order');
  if (error) throw error;
  return data;
}

export async function toggleChecklistItem(itemId, checked, userId, userName) {
  const { data, error } = await supabase
    .from('mission_checklists')
    .update({
      checked,
      checked_by: checked ? userId : null,
      checked_at: checked ? new Date().toISOString() : null,
    })
    .eq('id', itemId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function isChecklistComplete(checklist) {
  if (!checklist || checklist.length === 0) return false;
  return checklist.every(item => item.checked);
}

export function getChecklistProgress(checklist) {
  if (!checklist || checklist.length === 0) return 0;
  const completed = checklist.filter(item => item.checked).length;
  return Math.round((completed / checklist.length) * 100);
}
