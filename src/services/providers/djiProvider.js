/**
 * FlyBy — DJI Provider (Base)
 * 
 * Base DJI provider for common DJI functionality.
 * This handles file-based import/export which works regardless of API access.
 * 
 * IMPORTANT:
 * - Does NOT store DJI passwords
 * - Does NOT bypass DJI authentication
 * - Does NOT reverse-engineer private DJI APIs
 * - Uses only official DJI-supported mechanisms
 */

import {
  FlightDataProvider,
  PROVIDER_CAPABILITIES,
  CONNECTION_STATUS,
  ROUTE_SYNC_STATUS,
  DATA_SOURCES,
  providerRegistry,
} from './flightDataProvider';

export class DjiProvider extends FlightDataProvider {
  constructor() {
    super('dji');
    this.capabilities = [
      PROVIDER_CAPABILITIES.FILE_IMPORT,
      PROVIDER_CAPABILITIES.ROUTE_EXPORT,
    ];
  }

  getDisplayName() {
    return 'DJI';
  }

  // ─── Connection ─────────────────────────────────────────────────────────

  async getConnectionStatus(pilotId) {
    // DJI base provider uses file import — no live connection needed
    return {
      status: CONNECTION_STATUS.NOT_CONFIGURED,
      message: 'Direct DJI synchronization is not currently configured for this aircraft. Use Import/Export instead.',
      supportsOAuth: false,
      supportsFileImport: true,
    };
  }

  // ─── Route Export ───────────────────────────────────────────────────────

  async validateRouteForExport(route, mission) {
    const errors = [];
    const warnings = [];

    if (!route) errors.push('No route data available');
    if (!route?.route_geojson) errors.push('Route has no flight path defined');
    if (!route?.altitude) warnings.push('No altitude specified — DJI will use default');
    if (!route?.speed) warnings.push('No speed specified — DJI will use default');

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      message: errors.length === 0
        ? 'Route is ready for export. DJI route export format requires DJI integration configuration.'
        : 'Route cannot be exported — fix the errors above.',
    };
  }

  async exportRoute(route, mission) {
    // Generate a provider-neutral mission data export (JSON)
    // The exact DJI-compatible format depends on DJI's official integration specs
    const exportData = {
      _flyby_export: true,
      _version: '1.0',
      _format: 'flyby_mission_data',
      _note: 'DJI route export format requires DJI integration configuration. This is FlyBy mission data for manual transfer.',
      mission: {
        mission_number: mission?.mission_number,
        field_name: mission?.fields?.field_name,
        area_hectares: mission?.actual_area || mission?.estimated_area,
        scheduled_date: mission?.scheduled_date,
      },
      route: {
        altitude: route.altitude,
        speed: route.speed,
        swath_width: route.swath_width,
        overlap_pct: route.overlap_pct,
        flight_direction: route.flight_direction,
        application_rate: route.application_rate,
        total_distance: route.total_distance,
        estimated_time: route.estimated_time,
        route_geojson: route.route_geojson,
        exclusion_zones: route.exclusion_zones,
      },
      field_boundary: mission?.fields?.boundary || null,
      aircraft: mission?.aircraft?.aircraft_name,
      generated_at: new Date().toISOString(),
      generated_by: 'FlyBy by Feldrix',
    };

    return {
      data: exportData,
      filename: `${mission?.mission_number || 'mission'}_route.json`,
      format: 'flyby_json',
      message: 'Mission data exported. DJI route file generation requires DJI integration configuration.',
    };
  }

  // ─── Flight Data Import ─────────────────────────────────────────────────

  async importFlightDataFromFile(file) {
    // Parse JSON flight data file
    try {
      const text = await file.text();
      const raw = JSON.parse(text);

      // Extract standard flight metrics from raw data
      const record = {
        source: 'dji',
        provider_ref: raw.flight_id || raw.id || null,
        flight_start: raw.flight_start || raw.start_time || raw.takeoff_time || null,
        flight_end: raw.flight_end || raw.end_time || raw.landing_time || null,
        flight_duration: raw.flight_duration || raw.duration || null,
        area_covered: raw.area_covered || raw.sprayed_area || raw.area || null,
        battery_start: raw.battery_start || raw.battery?.start || null,
        battery_end: raw.battery_end || raw.battery?.end || null,
        battery_used: raw.battery_used || raw.battery?.used || null,
        application_rate: raw.application_rate || raw.spray_rate || null,
        flow_rate: raw.flow_rate || null,
        application_volume: raw.application_volume || raw.total_sprayed || raw.volume || null,
        chemical_name: raw.chemical_name || raw.chemical || null,
        actual_usage: raw.actual_usage || raw.application_volume || null,
        gps_track: raw.gps_track || raw.flight_path || raw.track || null,
        raw_data: raw,
        is_test_data: false,
        data_sources: {
          area_covered: raw.area_covered ? DATA_SOURCES.DJI_RECORDED : null,
          application_rate: raw.application_rate ? DATA_SOURCES.DJI_RECORDED : null,
          application_volume: raw.application_volume ? DATA_SOURCES.DJI_RECORDED : null,
          battery_used: raw.battery_used ? DATA_SOURCES.DJI_RECORDED : null,
          flight_duration: raw.flight_duration ? DATA_SOURCES.DJI_RECORDED : null,
        },
      };

      return record;
    } catch (err) {
      throw new Error(`Failed to parse DJI flight data file: ${err.message}`);
    }
  }

  // ─── Mission Matching ───────────────────────────────────────────────────

  async matchFlightToMission(flightData, missions) {
    if (!flightData || !missions || missions.length === 0) {
      return { matched: false, mission: null, confidence: 0 };
    }

    const flightDate = flightData.flight_start ? new Date(flightData.flight_start).toISOString().split('T')[0] : null;

    // Score each mission
    const scored = missions.map(m => {
      let score = 0;

      // Date match
      if (flightDate && m.scheduled_date === flightDate) score += 40;

      // Aircraft match
      if (flightData.aircraft_id && m.aircraft_id === flightData.aircraft_id) score += 30;

      // Pilot match
      if (flightData.pilot_id && m.pilot_id === flightData.pilot_id) score += 20;

      // Area similarity (within 20%)
      if (flightData.area_covered && m.estimated_area) {
        const ratio = flightData.area_covered / m.estimated_area;
        if (ratio >= 0.8 && ratio <= 1.2) score += 10;
      }

      return { mission: m, score };
    }).filter(s => s.score > 0).sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
      return { matched: false, mission: null, confidence: 0 };
    }

    const best = scored[0];
    return {
      matched: best.score >= 60,
      mission: best.mission,
      confidence: Math.min(100, best.score),
      alternatives: scored.slice(1, 4).map(s => ({ mission: s.mission, confidence: s.score })),
    };
  }
}

// Register provider
const djiProvider = new DjiProvider();
providerRegistry.register(djiProvider);

export default djiProvider;
