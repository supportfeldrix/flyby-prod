/**
 * FlyBy — DJI SmartFarm Provider
 * 
 * Extends DJI base provider with SmartFarm-specific capabilities.
 * 
 * Current Status:
 * - DJI SmartFarm does NOT currently provide a public OAuth/API for the
 *   Agras T50 that allows third-party route synchronization.
 * - This provider is ARCHITECTURE-READY for when DJI enables official access.
 * - Until then, it falls back to file-based import/export.
 * 
 * IMPORTANT:
 * - No DJI passwords are stored
 * - No private DJI APIs are reverse-engineered
 * - No fake synchronization is displayed
 */

import {
  FlightDataProvider,
  PROVIDER_CAPABILITIES,
  CONNECTION_STATUS,
  ROUTE_SYNC_STATUS,
  DATA_SOURCES,
  providerRegistry,
} from './flightDataProvider';

export class DjiSmartFarmProvider extends FlightDataProvider {
  constructor() {
    super('dji_smartfarm');
    this.capabilities = [
      PROVIDER_CAPABILITIES.FILE_IMPORT,
      PROVIDER_CAPABILITIES.ROUTE_EXPORT,
      // Future: PROVIDER_CAPABILITIES.ROUTE_SYNC,
      // Future: PROVIDER_CAPABILITIES.FLIGHT_DATA_LIVE,
      // Future: PROVIDER_CAPABILITIES.DEVICE_DISCOVERY,
      // Future: PROVIDER_CAPABILITIES.OAUTH_AUTH,
    ];
  }

  getDisplayName() {
    return 'DJI SmartFarm';
  }

  // ─── Connection ─────────────────────────────────────────────────────────

  async getConnectionStatus(pilotId) {
    // SmartFarm official API not yet available for T50
    return {
      status: CONNECTION_STATUS.NOT_CONFIGURED,
      message: 'Direct DJI SmartFarm synchronization is not currently configured for this aircraft.',
      detail: 'DJI SmartFarm API access for the Agras T50 requires official DJI developer integration. Use file import/export in the meantime.',
      supportsOAuth: false,        // Will become true when DJI provides OAuth
      supportsFileImport: true,
      supportsRouteSync: false,    // Will become true when DJI enables it
    };
  }

  async connect(pilotId, config) {
    // When DJI provides official OAuth for SmartFarm:
    // 1. Redirect to DJI OAuth URL
    // 2. Receive callback with auth code
    // 3. Exchange for access token (server-side)
    // 4. Store encrypted token (never in frontend)
    //
    // For now, return not-supported status
    return {
      status: CONNECTION_STATUS.NOT_CONFIGURED,
      message: 'DJI SmartFarm OAuth is not currently available for the Agras T50. Please use file import/export.',
      action: 'file_import', // Suggest file import as alternative
    };
  }

  async disconnect(pilotId) {
    return { success: true, message: 'DJI SmartFarm connection cleared.' };
  }

  // ─── Device Discovery ───────────────────────────────────────────────────

  async discoverDevices(pilotId) {
    // When DJI API is available, this will:
    // 1. Call DJI device list API with pilot's auth token
    // 2. Return discovered T50 aircraft, remotes, batteries
    //
    // For now, return empty with explanation
    return {
      devices: [],
      message: 'Device discovery requires active DJI SmartFarm connection. Import device data manually or register aircraft in Fleet.',
    };
  }

  // ─── Route Sync ─────────────────────────────────────────────────────────

  async syncRoute(route, mission, pilotId) {
    // When DJI API is available, this will:
    // 1. Convert FlyBy route to DJI waypoint format (WPML or KML)
    // 2. Upload to DJI SmartFarm task management
    // 3. Push to T50 remote controller
    // 4. Confirm receipt
    //
    // For now, return not-supported
    return {
      status: ROUTE_SYNC_STATUS.NOT_SUPPORTED,
      message: 'Direct route sync to DJI SmartFarm is not currently available. Export the mission data and import it via the DJI remote controller.',
      alternative: 'export', // Suggest export as alternative
    };
  }

  // ─── Flight Data ────────────────────────────────────────────────────────

  async importFlightData(pilotId, dateRange) {
    // When DJI API is available, this will:
    // 1. Call DJI SmartFarm flight records API
    // 2. Paginate through date range
    // 3. Parse and normalize each flight record
    // 4. Return array of flight_data_records
    //
    // For now, return empty with file import guidance
    return {
      records: [],
      message: 'Automatic flight data import requires active DJI SmartFarm connection. Use "Import Flight Data" to upload DJI flight records manually.',
      action: 'file_import',
    };
  }

  async importFlightDataFromFile(file) {
    // SmartFarm exports are typically JSON or CSV
    try {
      const text = await file.text();
      let raw;

      if (file.name.endsWith('.csv')) {
        // Parse CSV (basic implementation)
        raw = this._parseCSV(text);
      } else {
        raw = JSON.parse(text);
      }

      // SmartFarm-specific field mapping
      const record = {
        source: 'dji_smartfarm',
        provider_ref: raw.task_id || raw.flight_id || raw.id || null,
        flight_start: raw.start_time || raw.flight_start || null,
        flight_end: raw.end_time || raw.flight_end || null,
        flight_duration: raw.duration || raw.flight_duration || null,
        area_covered: raw.operation_area || raw.sprayed_area || raw.area_covered || null,
        battery_start: raw.battery_before || raw.battery_start || null,
        battery_end: raw.battery_after || raw.battery_end || null,
        battery_used: raw.battery_consumption || raw.battery_used || null,
        application_rate: raw.spray_rate || raw.application_rate || null,
        flow_rate: raw.flow_rate || null,
        application_volume: raw.spray_volume || raw.application_volume || null,
        chemical_name: raw.pesticide_name || raw.chemical_name || null,
        estimated_usage: raw.estimated_consumption || null,
        actual_usage: raw.actual_consumption || raw.spray_volume || null,
        gps_track: raw.flight_route || raw.gps_track || null,
        raw_data: raw,
        is_test_data: false,
        data_sources: {
          area_covered: DATA_SOURCES.SMARTFARM_RECORDED,
          application_rate: raw.spray_rate ? DATA_SOURCES.SMARTFARM_RECORDED : null,
          application_volume: raw.spray_volume ? DATA_SOURCES.SMARTFARM_RECORDED : null,
          battery_used: raw.battery_consumption ? DATA_SOURCES.SMARTFARM_RECORDED : null,
          flight_duration: raw.duration ? DATA_SOURCES.SMARTFARM_RECORDED : null,
        },
      };

      return record;
    } catch (err) {
      throw new Error(`Failed to parse SmartFarm data: ${err.message}`);
    }
  }

  _parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return {};
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    const values = lines[1].split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i]; });
    return obj;
  }

  // ─── Test Data ──────────────────────────────────────────────────────────

  /**
   * Generate sample T50 test flight data for demonstration.
   * CLEARLY LABELLED AS TEST DATA.
   */
  generateTestFlightData(mission) {
    const area = mission?.actual_area || mission?.estimated_area || 12.5;
    const duration = Math.round(area * 1.6 * 60); // ~1.6 min per hectare
    const appRate = mission?.application_rate || 15;
    const volume = Math.round(area * appRate * 10) / 10;

    return {
      source: 'test',
      provider_ref: `TEST-${Date.now()}`,
      is_test_data: true,
      flight_start: new Date(Date.now() - duration * 1000).toISOString(),
      flight_end: new Date().toISOString(),
      flight_duration: duration,
      area_covered: area,
      battery_start: 96,
      battery_end: 96 - Math.round(area * 1.6),
      battery_used: Math.round(area * 1.6),
      application_rate: appRate,
      flow_rate: 4.2,
      application_volume: volume,
      chemical_name: mission?.chemical_name || 'Roundup PowerMAX',
      estimated_usage: volume,
      actual_usage: Math.round(volume * (0.95 + Math.random() * 0.1) * 10) / 10,
      gps_track: null, // Would be GeoJSON LineString
      raw_data: { _test: true, _note: 'This is test data generated by FlyBy. Not real DJI data.' },
      data_sources: {
        area_covered: DATA_SOURCES.TEST,
        application_rate: DATA_SOURCES.TEST,
        application_volume: DATA_SOURCES.TEST,
        battery_used: DATA_SOURCES.TEST,
        flight_duration: DATA_SOURCES.TEST,
        actual_usage: DATA_SOURCES.TEST,
      },
    };
  }
}

// Register provider
const djiSmartFarmProvider = new DjiSmartFarmProvider();
providerRegistry.register(djiSmartFarmProvider);

export default djiSmartFarmProvider;
