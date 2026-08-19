-- ═══════════════════════════════════════════════════════════════════════════════
-- FlyBy by Feldrix — Flight Routes & DJI Integration
-- Migration: 015_flight_routes_and_dji.sql
-- Sprint 5.6: Mission Route Planning, DJI Provider Architecture, Flight Data
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. MISSION ROUTES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mission_routes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  mission_id      UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  field_id        UUID REFERENCES public.fields(id) ON DELETE SET NULL,

  -- Route parameters
  route_name      TEXT,
  flight_direction DOUBLE PRECISION,       -- degrees (0-360)
  swath_width     DOUBLE PRECISION,        -- metres
  overlap_pct     DOUBLE PRECISION DEFAULT 0, -- percentage overlap between swaths
  altitude        DOUBLE PRECISION,        -- metres AGL
  speed           DOUBLE PRECISION,        -- m/s
  headland_width  DOUBLE PRECISION DEFAULT 0, -- metres inset from boundary
  entry_point     JSONB,                   -- {lat, lng}
  exit_point      JSONB,                   -- {lat, lng}

  -- Application
  application_rate DOUBLE PRECISION,       -- L/ha
  flow_rate       DOUBLE PRECISION,        -- L/min
  nozzle_type     TEXT,

  -- Computed estimates
  total_distance  DOUBLE PRECISION,        -- metres
  estimated_time  DOUBLE PRECISION,        -- seconds
  estimated_volume DOUBLE PRECISION,       -- litres

  -- Route geometry (GeoJSON LineString or MultiLineString)
  route_geojson   JSONB,

  -- Exclusion zones (array of GeoJSON polygons)
  exclusion_zones JSONB DEFAULT '[]',

  -- Obstacles (array of {lat, lng, radius, height, description})
  obstacles       JSONB DEFAULT '[]',

  -- Status
  status          TEXT NOT NULL DEFAULT 'Draft'
                  CHECK (status IN ('Draft', 'Prepared', 'Exported', 'Waiting for DJI', 'Synced', 'Ready on DJI', 'Executed', 'Failed')),

  -- Provider sync
  provider        TEXT,                    -- 'dji', 'manual', etc.
  provider_ref    TEXT,                    -- external reference ID from provider
  last_sync_at    TIMESTAMPTZ,
  sync_status     TEXT DEFAULT 'none'
                  CHECK (sync_status IN ('none', 'pending', 'synced', 'failed', 'not_supported')),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT idx_mission_routes_unique UNIQUE (mission_id)
);

COMMENT ON TABLE public.mission_routes IS 'Provider-neutral mission route with flight parameters. One route per mission.';

CREATE INDEX IF NOT EXISTS idx_mission_routes_company ON public.mission_routes(company_id);
CREATE INDEX IF NOT EXISTS idx_mission_routes_mission ON public.mission_routes(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_routes_status ON public.mission_routes(status);

ALTER TABLE public.mission_routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mission_routes_all" ON public.mission_routes;
CREATE POLICY "mission_routes_all" ON public.mission_routes FOR ALL
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ROUTE WAYPOINTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mission_route_waypoints (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  route_id    UUID NOT NULL REFERENCES public.mission_routes(id) ON DELETE CASCADE,
  sequence    INTEGER NOT NULL,
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,
  altitude    DOUBLE PRECISION,            -- metres AGL
  speed       DOUBLE PRECISION,            -- m/s at this point
  action      TEXT DEFAULT 'fly'
              CHECK (action IN ('fly', 'spray_on', 'spray_off', 'hover', 'photo', 'turn', 'land', 'takeoff')),
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.mission_route_waypoints IS 'Ordered waypoints for a mission route.';

CREATE INDEX IF NOT EXISTS idx_route_waypoints_route ON public.mission_route_waypoints(route_id);
CREATE INDEX IF NOT EXISTS idx_route_waypoints_seq ON public.mission_route_waypoints(route_id, sequence);

ALTER TABLE public.mission_route_waypoints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "route_waypoints_all" ON public.mission_route_waypoints;
CREATE POLICY "route_waypoints_all" ON public.mission_route_waypoints FOR ALL
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. FLIGHT DATA RECORDS (actual data from DJI / manual import)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.flight_data_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  mission_id      UUID REFERENCES public.missions(id) ON DELETE SET NULL,
  pilot_id        UUID REFERENCES public.pilots(id) ON DELETE SET NULL,
  aircraft_id     UUID REFERENCES public.aircraft(id) ON DELETE SET NULL,

  -- Source identification
  source          TEXT NOT NULL DEFAULT 'manual'
                  CHECK (source IN ('dji', 'dji_smartfarm', 'manual', 'import', 'test')),
  provider_ref    TEXT,                    -- external flight ID from provider
  is_test_data    BOOLEAN NOT NULL DEFAULT FALSE,

  -- Flight timing
  flight_start    TIMESTAMPTZ,
  flight_end      TIMESTAMPTZ,
  flight_duration INTEGER,                 -- seconds

  -- Coverage
  area_covered    DOUBLE PRECISION,        -- hectares
  gps_track       JSONB,                   -- GeoJSON LineString

  -- Battery
  battery_start   INTEGER,                 -- percentage
  battery_end     INTEGER,                 -- percentage
  battery_used    INTEGER,                 -- percentage

  -- Application data
  application_rate DOUBLE PRECISION,       -- L/ha
  flow_rate       DOUBLE PRECISION,        -- L/min
  application_volume DOUBLE PRECISION,     -- litres total
  chemical_name   TEXT,
  estimated_usage DOUBLE PRECISION,        -- litres (calculated)
  actual_usage    DOUBLE PRECISION,        -- litres (recorded by DJI)

  -- Source labels for each value
  data_sources    JSONB DEFAULT '{}'::JSONB,
  -- e.g. {"area_covered": "dji_recorded", "application_rate": "flyby_calculated", "battery_used": "manual"}

  -- Matching
  match_status    TEXT DEFAULT 'unmatched'
                  CHECK (match_status IN ('unmatched', 'auto_matched', 'manual_matched', 'no_match')),
  matched_at      TIMESTAMPTZ,
  matched_by      TEXT,

  -- Raw provider data (full JSON from DJI/SmartFarm)
  raw_data        JSONB,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.flight_data_records IS 'Actual flight data from DJI/SmartFarm/manual. Matched to FlyBy missions.';

CREATE INDEX IF NOT EXISTS idx_flight_data_company ON public.flight_data_records(company_id);
CREATE INDEX IF NOT EXISTS idx_flight_data_mission ON public.flight_data_records(mission_id);
CREATE INDEX IF NOT EXISTS idx_flight_data_source ON public.flight_data_records(source);
CREATE INDEX IF NOT EXISTS idx_flight_data_match ON public.flight_data_records(match_status);

ALTER TABLE public.flight_data_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "flight_data_all" ON public.flight_data_records;
CREATE POLICY "flight_data_all" ON public.flight_data_records FOR ALL
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. DJI CONNECTIONS (per-pilot provider connection state)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dji_connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  pilot_id        UUID NOT NULL REFERENCES public.pilots(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL DEFAULT 'dji_smartfarm'
                  CHECK (provider IN ('dji', 'dji_smartfarm', 'dji_flighthub')),
  connection_status TEXT NOT NULL DEFAULT 'not_configured'
                  CHECK (connection_status IN ('not_configured', 'pending', 'connected', 'disconnected', 'error')),
  last_sync_at    TIMESTAMPTZ,
  token_expires_at TIMESTAMPTZ,
  config          JSONB DEFAULT '{}'::JSONB,  -- non-sensitive config only
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT idx_dji_connections_unique UNIQUE (pilot_id, provider)
);

COMMENT ON TABLE public.dji_connections IS 'Pilot DJI/SmartFarm connection state. Tokens stored server-side only.';

CREATE INDEX IF NOT EXISTS idx_dji_connections_company ON public.dji_connections(company_id);
CREATE INDEX IF NOT EXISTS idx_dji_connections_pilot ON public.dji_connections(pilot_id);

ALTER TABLE public.dji_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dji_connections_all" ON public.dji_connections;
CREATE POLICY "dji_connections_all" ON public.dji_connections FOR ALL
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. DJI DEVICES (discovered or registered aircraft from DJI)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dji_devices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  aircraft_id     UUID REFERENCES public.aircraft(id) ON DELETE SET NULL,  -- linked FlyBy aircraft
  pilot_id        UUID REFERENCES public.pilots(id) ON DELETE SET NULL,

  -- Device info from DJI
  manufacturer    TEXT DEFAULT 'DJI',
  model           TEXT,
  serial_number   TEXT,
  remote_controller TEXT,
  firmware_version TEXT,
  last_seen       TIMESTAMPTZ,
  connection_status TEXT DEFAULT 'unknown'
                  CHECK (connection_status IN ('online', 'offline', 'unknown')),

  -- Raw DJI device data
  device_data     JSONB DEFAULT '{}'::JSONB,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT idx_dji_devices_serial UNIQUE (company_id, serial_number)
);

COMMENT ON TABLE public.dji_devices IS 'DJI devices discovered or imported. Linked to FlyBy aircraft records.';

CREATE INDEX IF NOT EXISTS idx_dji_devices_company ON public.dji_devices(company_id);
CREATE INDEX IF NOT EXISTS idx_dji_devices_aircraft ON public.dji_devices(aircraft_id);

ALTER TABLE public.dji_devices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dji_devices_all" ON public.dji_devices;
CREATE POLICY "dji_devices_all" ON public.dji_devices FOR ALL
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. EXTEND MISSIONS — add route/flight data status columns
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE public.missions ADD COLUMN route_status TEXT DEFAULT 'none';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.missions ADD COLUMN flight_data_status TEXT DEFAULT 'none';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.missions ADD COLUMN dji_sync_status TEXT DEFAULT 'none';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE. Flight Routes & DJI Integration schema ready.
-- ═══════════════════════════════════════════════════════════════════════════════
