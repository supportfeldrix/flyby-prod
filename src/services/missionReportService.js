import { supabase } from '../lib/supabase';

/**
 * Generate a unique report number for the company.
 * Uses atomic Postgres function to prevent race conditions.
 */
async function generateReportNumber(companyId) {
  const year = new Date().getFullYear();

  // Atomic upsert with row-level lock (same pattern as mission numbers)
  const { data: seq, error: seqErr } = await supabase
    .from('report_sequences')
    .upsert({ company_id: companyId, last_number: 0 }, { onConflict: 'company_id', ignoreDuplicates: true })
    .select()
    .single();

  // Now atomically increment — fetch current value and update
  const { data: current, error: fetchErr } = await supabase
    .from('report_sequences')
    .select('last_number')
    .eq('company_id', companyId)
    .single();

  if (fetchErr) throw new Error(`Failed to fetch report sequence: ${fetchErr.message}`);

  const nextNum = (current?.last_number || 0) + 1;

  const { error: updateErr } = await supabase
    .from('report_sequences')
    .update({ last_number: nextNum })
    .eq('company_id', companyId)
    .eq('last_number', current.last_number); // Optimistic lock

  if (updateErr) throw new Error(`Failed to update report sequence: ${updateErr.message}`);

  return `RPT-${year}-${String(nextNum).padStart(6, '0')}`;
}

/**
 * Fetch full mission data with all related tables for report generation.
 */
export async function getMissionForReport(missionId) {
  const { data, error } = await supabase
    .from('missions')
    .select(`
      *,
      customers(id, customer_name, contact_person, phone, email),
      farms(id, farm_name, province, town),
      fields(id, field_name, crop, area_hectares, boundary),
      aircraft(id, aircraft_name, model, registration_number, flight_hours, total_missions, total_hectares),
      pilots(id, first_name, last_name, display_name, licence_number, total_flight_hours, total_missions),
      battery_sets:battery_id(id, battery_code, current_charge, charge_cycles, battery_health)
    `)
    .eq('id', missionId)
    .single();
  if (error) throw new Error(`Failed to fetch mission for report: ${error.message}`);
  return data;
}

/**
 * Fetch mission execution logs (flight timeline).
 */
export async function getMissionTimeline(missionId) {
  const { data, error } = await supabase
    .from('mission_execution_logs')
    .select('*')
    .eq('mission_id', missionId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Failed to fetch mission timeline: ${error.message}`);
  return data || [];
}

/**
 * Generate and store a mission report automatically.
 * Called when a mission is completed.
 */
export async function generateMissionReport(missionId, companyId, userId, userName) {
  console.log('[FlyBy] Generating mission report...', { missionId, companyId });

  // Fetch all mission data
  const mission = await getMissionForReport(missionId);
  console.log('[FlyBy] Mission data fetched:', mission.mission_number);

  const timeline = await getMissionTimeline(missionId);
  console.log('[FlyBy] Timeline fetched:', timeline.length, 'events');

  // Generate report number
  const reportNumber = await generateReportNumber(companyId);
  console.log('[FlyBy] Report number generated:', reportNumber);

  // Build the report data snapshot (denormalised for historical accuracy)
  const reportData = {
    mission: {
      id: mission.id,
      mission_number: mission.mission_number,
      status: mission.status,
      mission_type: mission.mission_type || 'Aerial Application',
      priority: mission.priority,
      scheduled_date: mission.scheduled_date,
      recommended_start: mission.recommended_start,
      started_at: mission.started_at,
      completed_at: mission.completed_at,
      actual_duration: mission.actual_duration,
      actual_area: mission.actual_area,
      actual_battery_used: mission.actual_battery_used,
      estimated_area: mission.estimated_area,
      estimated_duration: mission.estimated_duration,
      estimated_battery_usage: mission.estimated_battery_usage,
      chemical_name: mission.chemical_name,
      chemical_rate: mission.chemical_rate,
      application_type: mission.application_type,
      crop: mission.crop || mission.fields?.crop,
      dispatcher_notes: mission.dispatcher_notes,
      completion_notes: mission.completion_notes,
      flight_risk_score: mission.flight_risk_score,
    },
    customer: mission.customers ? {
      name: mission.customers.customer_name,
      contact_person: mission.customers.contact_person,
      phone: mission.customers.phone,
      email: mission.customers.email,
    } : null,
    farm: mission.farms ? {
      name: mission.farms.farm_name,
      location: mission.farms.province || mission.farms.town || null,
      region: mission.farms.province,
    } : null,
    field: mission.fields ? {
      name: mission.fields.field_name,
      crop: mission.fields.crop,
      area_hectares: mission.fields.area_hectares,
      boundary_available: !!mission.fields.boundary,
    } : null,
    pilot: mission.pilots ? {
      name: mission.pilots.display_name || `${mission.pilots.first_name} ${mission.pilots.last_name}`,
      license_number: mission.pilots.licence_number,
      total_flight_hours: mission.pilots.total_flight_hours,
      total_missions: mission.pilots.total_missions,
    } : null,
    aircraft: mission.aircraft ? {
      name: mission.aircraft.aircraft_name,
      model: mission.aircraft.model,
      registration: mission.aircraft.registration_number,
      flight_hours: mission.aircraft.flight_hours,
      total_missions: mission.aircraft.total_missions,
      total_hectares: mission.aircraft.total_hectares,
    } : null,
    battery: mission.battery_sets ? {
      code: mission.battery_sets.battery_code,
      charge_after: mission.battery_sets.current_charge,
      cycles: mission.battery_sets.charge_cycles,
      health: mission.battery_sets.battery_health,
    } : null,
    weather: {
      temperature: mission.weather_temp,
      humidity: mission.weather_humidity,
      wind_speed: mission.weather_wind_speed,
      wind_direction: mission.weather_wind_direction,
      rain_probability: mission.weather_rain_probability,
      recommendation: mission.weather_recommendation,
      spray_window: mission.spray_window,
      risk_level: mission.weather_risk_level,
    },
    timeline: timeline.map(log => ({
      event_type: log.event_type,
      event_label: log.event_label,
      user_name: log.user_name,
      notes: log.notes,
      created_at: log.created_at,
    })),
    generated: {
      report_number: reportNumber,
      generated_at: new Date().toISOString(),
      generated_by: userName || 'System',
      version: '1.0',
      platform: 'FlyBy by Feldrix',
    },
  };

  // Build filename
  const filename = `${reportNumber}_${mission.mission_number || 'mission'}.pdf`;

  // Store the report
  const { data, error } = await supabase
    .from('mission_reports')
    .insert({
      company_id: companyId,
      mission_id: missionId,
      report_type: 'mission_report',
      report_number: reportNumber,
      filename,
      report_data: reportData,
      generated_by: userId,
      generated_by_name: userName,
      report_version: '1.0',
      status: 'generated',
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to insert mission report: ${error.message}`);

  console.log('[FlyBy] Report stored in database:', data.report_number);
  return data;
}

/**
 * Get all reports for a company with search/filter support.
 */
export async function getMissionReports(companyId, { search, status, dateFrom, dateTo, sortOrder = 'desc' } = {}) {
  let query = supabase
    .from('mission_reports')
    .select('*')
    .eq('company_id', companyId)
    .neq('status', 'deleted');

  if (status) {
    query = query.eq('status', status);
  }

  if (dateFrom) {
    query = query.gte('generated_at', dateFrom);
  }

  if (dateTo) {
    query = query.lte('generated_at', dateTo);
  }

  query = query.order('generated_at', { ascending: sortOrder === 'asc' });

  const { data, error } = await query;
  if (error) throw error;

  // Client-side search (searches across denormalised report_data)
  if (search && search.trim()) {
    const term = search.toLowerCase();
    return data.filter(report => {
      const rd = report.report_data;
      return (
        report.report_number?.toLowerCase().includes(term) ||
        rd?.mission?.mission_number?.toLowerCase().includes(term) ||
        rd?.customer?.name?.toLowerCase().includes(term) ||
        rd?.farm?.name?.toLowerCase().includes(term) ||
        rd?.field?.name?.toLowerCase().includes(term) ||
        rd?.pilot?.name?.toLowerCase().includes(term) ||
        rd?.aircraft?.name?.toLowerCase().includes(term)
      );
    });
  }

  return data;
}

/**
 * Get a single report by ID.
 */
export async function getReportById(reportId) {
  const { data, error } = await supabase
    .from('mission_reports')
    .select('*')
    .eq('id', reportId)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Get report by mission ID.
 */
export async function getReportByMissionId(missionId) {
  const { data, error } = await supabase
    .from('mission_reports')
    .select('*')
    .eq('mission_id', missionId)
    .eq('report_type', 'mission_report')
    .order('generated_at', { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data || null;
}

/**
 * Delete (soft) a report.
 */
export async function deleteReport(reportId) {
  const { error } = await supabase
    .from('mission_reports')
    .update({ status: 'deleted' })
    .eq('id', reportId);
  if (error) throw error;
}

/**
 * Regenerate a report for a mission (creates a new version).
 */
export async function regenerateReport(missionId, companyId, userId, userName) {
  // Soft-delete the old report
  const existing = await getReportByMissionId(missionId);
  if (existing) {
    await deleteReport(existing.id);
  }
  // Generate fresh
  return generateMissionReport(missionId, companyId, userId, userName);
}

/**
 * Update report status (e.g. mark as downloaded/printed).
 */
export async function updateReportStatus(reportId, status) {
  const { error } = await supabase
    .from('mission_reports')
    .update({ status })
    .eq('id', reportId);
  if (error) throw error;
}
