import { supabase } from '../lib/supabase';

export async function addLogEntry(missionId, companyId, eventType, eventLabel, userId, userName, notes, metadata) {
  const { data, error } = await supabase
    .from('mission_execution_logs')
    .insert({
      mission_id: missionId,
      company_id: companyId,
      event_type: eventType,
      event_label: eventLabel,
      user_id: userId || null,
      user_name: userName || null,
      notes: notes || null,
      metadata: metadata || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getFlightLog(missionId) {
  const { data, error } = await supabase
    .from('mission_execution_logs')
    .select('*')
    .eq('mission_id', missionId)
    .order('created_at');
  if (error) throw error;
  return data;
}
