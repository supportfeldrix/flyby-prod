/**
 * FlyBy Flight Data Provider — Abstract Interface
 * 
 * All drone data providers (DJI, SmartFarm, future providers) must implement
 * this interface. FlyBy core code only interacts through this abstraction.
 * 
 * Provider-neutral. The application never depends on DJI-specific code directly.
 */

/**
 * Provider capability flags.
 */
export const PROVIDER_CAPABILITIES = {
  ROUTE_EXPORT: 'route_export',         // Can export routes to the provider
  ROUTE_SYNC: 'route_sync',             // Can sync routes bidirectionally
  FLIGHT_DATA_IMPORT: 'flight_data_import', // Can import flight records
  FLIGHT_DATA_LIVE: 'flight_data_live', // Can receive live flight data
  DEVICE_DISCOVERY: 'device_discovery', // Can discover connected devices
  OAUTH_AUTH: 'oauth_auth',             // Supports OAuth authentication
  FILE_IMPORT: 'file_import',           // Supports file-based import/export
};

/**
 * Standard data source labels for flight data values.
 */
export const DATA_SOURCES = {
  DJI_RECORDED: 'dji_recorded',         // Verified by DJI telemetry
  DJI_ESTIMATED: 'dji_estimated',       // Estimated by DJI algorithms
  SMARTFARM_RECORDED: 'smartfarm_recorded',
  FLYBY_CALCULATED: 'flyby_calculated', // Calculated by FlyBy from inputs
  MANUAL: 'manual',                     // Manually entered by user
  IMPORTED: 'imported',                 // Imported from file
  TEST: 'test',                         // Test/demo data
};

/**
 * Route sync statuses (matches DB enum).
 */
export const ROUTE_SYNC_STATUS = {
  NONE: 'none',
  PENDING: 'pending',
  SYNCED: 'synced',
  FAILED: 'failed',
  NOT_SUPPORTED: 'not_supported',
};

/**
 * Connection statuses.
 */
export const CONNECTION_STATUS = {
  NOT_CONFIGURED: 'not_configured',
  PENDING: 'pending',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
};

/**
 * Abstract Flight Data Provider class.
 * Concrete providers extend this and implement the methods.
 */
export class FlightDataProvider {
  constructor(providerName) {
    this.name = providerName;
    this.capabilities = [];
  }

  /** Check if this provider supports a capability. */
  hasCapability(capability) {
    return this.capabilities.includes(capability);
  }

  /** Get provider display name. */
  getDisplayName() {
    return this.name;
  }

  // ─── Authentication ─────────────────────────────────────────────────────

  /** Check current connection status. */
  async getConnectionStatus(pilotId) {
    return { status: CONNECTION_STATUS.NOT_CONFIGURED, message: 'Provider not configured' };
  }

  /** Initiate connection/authentication flow. */
  async connect(pilotId, config) {
    throw new Error(`${this.name}: connect() not implemented`);
  }

  /** Disconnect/revoke access. */
  async disconnect(pilotId) {
    throw new Error(`${this.name}: disconnect() not implemented`);
  }

  // ─── Device Discovery ───────────────────────────────────────────────────

  /** Discover devices from provider. */
  async discoverDevices(pilotId) {
    return [];
  }

  // ─── Route Export/Sync ──────────────────────────────────────────────────

  /** Export a route to the provider's format. Returns file blob or sync result. */
  async exportRoute(route, mission) {
    throw new Error(`${this.name}: exportRoute() not implemented`);
  }

  /** Check if route can be synced to provider. */
  async validateRouteForExport(route, mission) {
    return { valid: false, errors: [`${this.name} route export not configured`] };
  }

  /** Sync route to provider (push). Returns sync status. */
  async syncRoute(route, mission, pilotId) {
    return { status: ROUTE_SYNC_STATUS.NOT_SUPPORTED, message: `${this.name} route sync not available` };
  }

  // ─── Flight Data Import ─────────────────────────────────────────────────

  /** Import flight data records from provider. */
  async importFlightData(pilotId, dateRange) {
    return [];
  }

  /** Import flight data from a file. */
  async importFlightDataFromFile(file) {
    throw new Error(`${this.name}: importFlightDataFromFile() not implemented`);
  }

  /** Match imported flight data to a FlyBy mission. */
  async matchFlightToMission(flightData, missions) {
    return { matched: false, mission: null, confidence: 0 };
  }
}

/**
 * Provider Registry — manages available providers.
 */
class ProviderRegistry {
  constructor() {
    this.providers = new Map();
  }

  register(provider) {
    this.providers.set(provider.name, provider);
  }

  get(name) {
    return this.providers.get(name) || null;
  }

  getAll() {
    return Array.from(this.providers.values());
  }

  getByCapability(capability) {
    return this.getAll().filter(p => p.hasCapability(capability));
  }
}

export const providerRegistry = new ProviderRegistry();
