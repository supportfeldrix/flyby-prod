/**
 * FlyBy Report Template Service
 * 
 * Handles report template rendering logic — formatting, section assembly,
 * display helpers, and report type definitions.
 */

// ─── Report Type Definitions ────────────────────────────────────────────────

export const REPORT_TYPES = {
  mission_report: {
    label: 'Mission Report',
    description: 'Complete mission documentation including all operational details',
    icon: 'FlightTakeoff',
    color: '#16A34A',
  },
  aerial_application: {
    label: 'Aerial Application Report',
    description: 'Chemical application details and compliance documentation',
    icon: 'Grass',
    color: '#2563EB',
  },
  mission_summary: {
    label: 'Mission Summary',
    description: 'Condensed overview of mission outcomes',
    icon: 'Summarize',
    color: '#7C3AED',
  },
  pilot_flight_report: {
    label: 'Pilot Flight Report',
    description: 'Pilot-specific flight log and performance data',
    icon: 'Person',
    color: '#0EA5E9',
  },
  aircraft_utilisation: {
    label: 'Aircraft Utilisation Report',
    description: 'Aircraft operational hours and maintenance tracking',
    icon: 'AirplanemodeActive',
    color: '#D97706',
  },
  battery_usage: {
    label: 'Battery Usage Report',
    description: 'Battery consumption, cycles, and health tracking',
    icon: 'BatteryChargingFull',
    color: '#EF4444',
  },
  weather_summary: {
    label: 'Weather Summary Report',
    description: 'Weather conditions and spray window analysis',
    icon: 'Cloud',
    color: '#64748B',
  },
};

// ─── Status Display ─────────────────────────────────────────────────────────

export const REPORT_STATUSES = {
  generated: { label: 'Generated', color: '#16A34A', bg: 'rgba(22,163,74,0.08)' },
  downloaded: { label: 'Downloaded', color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
  printed: { label: 'Printed', color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
  archived: { label: 'Archived', color: '#64748B', bg: 'rgba(100,116,139,0.08)' },
  deleted: { label: 'Deleted', color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
};

// ─── Timeline Event Icons & Colors ──────────────────────────────────────────

export const TIMELINE_EVENTS = {
  created: { label: 'Mission Created', color: '#64748B', icon: 'Add' },
  planned: { label: 'Mission Planned', color: '#2563EB', icon: 'Event' },
  dispatched: { label: 'Mission Dispatched', color: '#7C3AED', icon: 'Send' },
  checklist_complete: { label: 'Checklist Completed', color: '#0EA5E9', icon: 'CheckCircle' },
  takeoff: { label: 'Mission Started', color: '#16A34A', icon: 'FlightTakeoff' },
  flying: { label: 'Flying', color: '#16A34A', icon: 'Flight' },
  paused: { label: 'Mission Paused', color: '#D97706', icon: 'Pause' },
  resumed: { label: 'Mission Resumed', color: '#16A34A', icon: 'PlayArrow' },
  landing: { label: 'Landing', color: '#0EA5E9', icon: 'FlightLand' },
  completed: { label: 'Mission Completed', color: '#16A34A', icon: 'CheckCircle' },
  cancelled: { label: 'Mission Cancelled', color: '#94A3B8', icon: 'Cancel' },
  aborted: { label: 'Mission Aborted', color: '#EF4444', icon: 'Warning' },
  emergency: { label: 'Emergency Stop', color: '#EF4444', icon: 'Error' },
  note: { label: 'Note', color: '#64748B', icon: 'Note' },
};

// ─── Formatting Helpers ─────────────────────────────────────────────────────

/**
 * Format a date string for display.
 */
export function formatReportDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format a time string for display.
 */
export function formatReportTime(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format a full date+time for display.
 */
export function formatReportDateTime(dateStr) {
  if (!dateStr) return '—';
  return `${formatReportDate(dateStr)} at ${formatReportTime(dateStr)}`;
}

/**
 * Format duration in minutes to human-readable.
 */
export function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return '—';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Format area in hectares.
 */
export function formatArea(ha) {
  if (!ha && ha !== 0) return '—';
  return `${Number(ha).toFixed(1)} ha`;
}

/**
 * Get a display-friendly report type label.
 */
export function getReportTypeLabel(type) {
  return REPORT_TYPES[type]?.label || type;
}

/**
 * Get report status styling.
 */
export function getReportStatusStyle(status) {
  return REPORT_STATUSES[status] || REPORT_STATUSES.generated;
}

/**
 * Get timeline event styling.
 */
export function getTimelineEventStyle(eventType) {
  return TIMELINE_EVENTS[eventType] || TIMELINE_EVENTS.note;
}

// ─── Report Section Assembly ────────────────────────────────────────────────

/**
 * Extract and assemble sections from report_data for preview rendering.
 * Returns an array of sections in display order.
 */
export function assembleReportSections(reportData) {
  if (!reportData) return [];

  const sections = [];

  // Mission Information
  if (reportData.mission) {
    sections.push({
      key: 'mission_info',
      title: 'Mission Information',
      type: 'grid',
      columns: 4,
      items: [
        { label: 'Mission Number', value: reportData.mission.mission_number },
        { label: 'Status', value: reportData.mission.status, badge: true },
        { label: 'Mission Type', value: reportData.mission.mission_type },
        { label: 'Priority', value: reportData.mission.priority },
        { label: 'Scheduled Date', value: formatReportDate(reportData.mission.scheduled_date) },
        { label: 'Start Time', value: formatReportTime(reportData.mission.started_at) },
        { label: 'Finish Time', value: formatReportTime(reportData.mission.completed_at) },
        { label: 'Duration', value: formatDuration(reportData.mission.actual_duration) },
        { label: 'Dispatcher', value: reportData.generated?.generated_by },
        { label: 'Pilot', value: reportData.pilot?.name },
        { label: 'Aircraft', value: reportData.aircraft?.name },
        { label: 'Battery', value: reportData.battery?.code },
      ],
    });
  }

  // Customer & Application
  if (reportData.customer || reportData.field) {
    sections.push({
      key: 'customer_info',
      title: 'Customer & Application Details',
      type: 'grid',
      columns: 4,
      items: [
        { label: 'Customer', value: reportData.customer?.name },
        { label: 'Farm', value: reportData.farm?.name },
        { label: 'Field', value: reportData.field?.name },
        { label: 'Crop', value: reportData.mission?.crop || reportData.field?.crop },
        { label: 'Area Sprayed', value: formatArea(reportData.mission?.actual_area || reportData.field?.area_hectares) },
        { label: 'Application Type', value: reportData.mission?.application_type },
        { label: 'Chemical Used', value: reportData.mission?.chemical_name },
        { label: 'Application Rate', value: reportData.mission?.chemical_rate ? `${reportData.mission.chemical_rate} L/ha` : null },
      ],
      notes: [
        reportData.mission?.dispatcher_notes ? { label: 'Dispatcher Notes', text: reportData.mission.dispatcher_notes } : null,
        reportData.mission?.completion_notes ? { label: 'Pilot Notes', text: reportData.mission.completion_notes } : null,
      ].filter(Boolean),
    });
  }

  // Weather Snapshot
  const w = reportData.weather;
  if (w && (w.temperature != null || w.humidity != null || w.wind_speed != null)) {
    sections.push({
      key: 'weather',
      title: 'Weather Snapshot',
      type: 'grid',
      columns: 4,
      items: [
        { label: 'Temperature', value: w.temperature != null ? `${w.temperature}°C` : null },
        { label: 'Humidity', value: w.humidity != null ? `${w.humidity}%` : null },
        { label: 'Wind Speed', value: w.wind_speed != null ? `${w.wind_speed} km/h` : null },
        { label: 'Wind Direction', value: w.wind_direction },
        { label: 'Rain Probability', value: w.rain_probability != null ? `${w.rain_probability}%` : null },
        { label: 'Recommendation', value: w.recommendation },
        { label: 'Safe Spray Window', value: w.spray_window },
        { label: 'Weather Risk', value: w.risk_level, highlight: w.risk_level === 'High' ? 'error' : w.risk_level === 'Medium' ? 'warning' : 'success' },
      ],
    });
  }

  // Mission Timeline
  if (reportData.timeline && reportData.timeline.length > 0) {
    sections.push({
      key: 'timeline',
      title: 'Mission Timeline',
      type: 'timeline',
      events: reportData.timeline,
    });
  }

  // Field Information
  if (reportData.field) {
    sections.push({
      key: 'field_info',
      title: 'Field Information',
      type: 'grid',
      columns: 3,
      items: [
        { label: 'Customer', value: reportData.customer?.name },
        { label: 'Farm', value: reportData.farm?.name },
        { label: 'Field', value: reportData.field?.name },
        { label: 'Crop', value: reportData.field?.crop },
        { label: 'Area', value: formatArea(reportData.field?.area_hectares) },
        { label: 'Boundary Available', value: reportData.field?.boundary_available ? 'Yes' : 'No' },
      ],
      placeholders: ['Field Boundary Map', 'Mission Route', 'Drone Flight Path'],
    });
  }

  // Operational Summary
  sections.push({
    key: 'operational_summary',
    title: 'Operational Summary',
    type: 'grid',
    columns: 4,
    items: [
      { label: 'Pilot Flight Hours', value: reportData.pilot?.total_flight_hours ? `${Number(reportData.pilot.total_flight_hours).toFixed(1)} hrs` : null },
      { label: 'Aircraft Flight Hours', value: reportData.aircraft?.flight_hours ? `${Number(reportData.aircraft.flight_hours).toFixed(1)} hrs` : null },
      { label: 'Battery Charge Used', value: reportData.mission?.actual_battery_used ? `${reportData.mission.actual_battery_used}%` : null },
      { label: 'Battery Health', value: reportData.battery?.health || 'Good' },
      { label: 'Battery Cycles', value: reportData.battery?.cycles != null ? String(reportData.battery.cycles) : null },
      { label: 'Area Sprayed', value: formatArea(reportData.mission?.actual_area) },
      { label: 'Mission Duration', value: formatDuration(reportData.mission?.actual_duration) },
      { label: 'Mission Success', value: reportData.mission?.status === 'Completed' ? 'Yes ✓' : 'No' },
    ],
    placeholders: ['Average Flight Speed', 'Average Altitude'],
  });

  return sections;
}

// ─── Report Summary for Cards ───────────────────────────────────────────────

/**
 * Extract a concise summary from report data for card display.
 */
export function getReportSummary(report) {
  const rd = report.report_data;
  if (!rd) return {};

  return {
    missionNumber: rd.mission?.mission_number,
    missionStatus: rd.mission?.status,
    customer: rd.customer?.name,
    farm: rd.farm?.name,
    field: rd.field?.name,
    pilot: rd.pilot?.name,
    aircraft: rd.aircraft?.name,
    date: rd.mission?.scheduled_date,
    duration: rd.mission?.actual_duration,
    area: rd.mission?.actual_area,
    reportNumber: rd.generated?.report_number || report.report_number,
    generatedAt: report.generated_at,
  };
}
