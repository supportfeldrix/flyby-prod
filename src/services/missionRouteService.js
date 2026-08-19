import { supabase } from '../lib/supabase';

/**
 * FlyBy Mission Route Service
 * 
 * CRUD for mission routes and waypoints.
 * Route generation from field boundaries.
 * Provider-neutral — works with any flight data provider.
 */

// ─── Route CRUD ─────────────────────────────────────────────────────────────

/**
 * Get route for a mission.
 */
export async function getMissionRoute(missionId) {
  const { data, error } = await supabase
    .from('mission_routes')
    .select('*')
    .eq('mission_id', missionId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

/**
 * Create or update a mission route.
 */
export async function saveMissionRoute(missionId, companyId, routeData) {
  const existing = await getMissionRoute(missionId);

  if (existing) {
    const { data, error } = await supabase
      .from('mission_routes')
      .update({ ...routeData, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('mission_routes')
    .insert({
      company_id: companyId,
      mission_id: missionId,
      ...routeData,
    })
    .select()
    .single();
  if (error) throw error;

  // Update mission route_status
  await supabase.from('missions').update({ route_status: 'prepared' }).eq('id', missionId);

  return data;
}

/**
 * Delete a mission route.
 */
export async function deleteMissionRoute(missionId) {
  const { error } = await supabase
    .from('mission_routes')
    .delete()
    .eq('mission_id', missionId);
  if (error) throw error;
  await supabase.from('missions').update({ route_status: 'none' }).eq('id', missionId);
}

/**
 * Update route status.
 */
export async function updateRouteStatus(routeId, status, syncStatus) {
  const updates = { status, updated_at: new Date().toISOString() };
  if (syncStatus) updates.sync_status = syncStatus;
  const { error } = await supabase.from('mission_routes').update(updates).eq('id', routeId);
  if (error) throw error;
}

// ─── Waypoints ──────────────────────────────────────────────────────────────

/**
 * Get waypoints for a route.
 */
export async function getRouteWaypoints(routeId) {
  const { data, error } = await supabase
    .from('mission_route_waypoints')
    .select('*')
    .eq('route_id', routeId)
    .order('sequence');
  if (error) throw error;
  return data || [];
}

/**
 * Save waypoints for a route (replaces all existing).
 */
export async function saveRouteWaypoints(routeId, companyId, waypoints) {
  // Delete existing
  await supabase.from('mission_route_waypoints').delete().eq('route_id', routeId);

  if (!waypoints || waypoints.length === 0) return [];

  const records = waypoints.map((wp, i) => ({
    company_id: companyId,
    route_id: routeId,
    sequence: i,
    latitude: wp.latitude || wp.lat,
    longitude: wp.longitude || wp.lng,
    altitude: wp.altitude || null,
    speed: wp.speed || null,
    action: wp.action || 'fly',
    metadata: wp.metadata || null,
  }));

  const { data, error } = await supabase
    .from('mission_route_waypoints')
    .insert(records)
    .select();
  if (error) throw error;
  return data;
}

// ─── Route Generation ───────────────────────────────────────────────────────

/**
 * Generate a boustrophedon (back-and-forth) spray route from a field boundary.
 * 
 * This is a simplified route planner that generates parallel flight lines
 * inside the field boundary polygon.
 * 
 * @param {Array} boundary - Array of {lat, lng} points forming the boundary polygon
 * @param {Object} params - Route parameters
 * @returns {Object} Generated route with GeoJSON and waypoints
 */
export function generateRouteFromBoundary(boundary, params = {}) {
  if (!boundary || boundary.length < 3) {
    throw new Error('Field boundary must have at least 3 points');
  }

  const {
    swathWidth = 7,         // metres (T50 default ~7m spray width)
    overlap = 0,            // percentage overlap
    altitude = 3,           // metres AGL
    speed = 7,              // m/s
    flightDirection = 0,    // degrees (0 = North-South)
    headlandWidth = 0,      // metres inset
    applicationRate = 15,   // L/ha
  } = params;

  // Calculate effective spacing between lines
  const effectiveWidth = swathWidth * (1 - overlap / 100);

  // Get bounding box
  const lats = boundary.map(p => p.lat || p.latitude);
  const lngs = boundary.map(p => p.lng || p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // Convert swath width to approximate degrees
  const latPerMeter = 1 / 111320;
  const lngPerMeter = 1 / (111320 * Math.cos((minLat + maxLat) / 2 * Math.PI / 180));
  const spacingLat = effectiveWidth * latPerMeter;
  const spacingLng = effectiveWidth * lngPerMeter;

  // Generate parallel flight lines (simplified: North-South or East-West)
  const waypoints = [];
  const routeCoords = [];
  let lineCount = 0;

  // Simple N-S lines based on direction
  const isNorthSouth = flightDirection < 45 || flightDirection > 315 || (flightDirection > 135 && flightDirection < 225);

  if (isNorthSouth) {
    // Generate E-W spaced N-S lines
    let lng = minLng + (headlandWidth * lngPerMeter);
    const endLng = maxLng - (headlandWidth * lngPerMeter);
    let goingNorth = true;

    while (lng <= endLng) {
      const startLat = goingNorth ? minLat + (headlandWidth * latPerMeter) : maxLat - (headlandWidth * latPerMeter);
      const endLat = goingNorth ? maxLat - (headlandWidth * latPerMeter) : minLat + (headlandWidth * latPerMeter);

      waypoints.push({ lat: startLat, lng, altitude, speed, action: lineCount === 0 ? 'takeoff' : 'spray_on' });
      waypoints.push({ lat: endLat, lng, altitude, speed, action: 'spray_off' });
      routeCoords.push([lng, startLat]);
      routeCoords.push([lng, endLat]);

      lng += spacingLng;
      goingNorth = !goingNorth;
      lineCount++;
    }
  } else {
    // Generate N-S spaced E-W lines
    let lat = minLat + (headlandWidth * latPerMeter);
    const endLat = maxLat - (headlandWidth * latPerMeter);
    let goingEast = true;

    while (lat <= endLat) {
      const startLng = goingEast ? minLng + (headlandWidth * lngPerMeter) : maxLng - (headlandWidth * lngPerMeter);
      const endLng = goingEast ? maxLng - (headlandWidth * lngPerMeter) : minLng + (headlandWidth * lngPerMeter);

      waypoints.push({ lat, lng: startLng, altitude, speed, action: lineCount === 0 ? 'takeoff' : 'spray_on' });
      waypoints.push({ lat, lng: endLng, altitude, speed, action: 'spray_off' });
      routeCoords.push([startLng, lat]);
      routeCoords.push([endLng, lat]);

      lat += spacingLat;
      goingEast = !goingEast;
      lineCount++;
    }
  }

  // Calculate estimates
  let totalDistance = 0;
  for (let i = 1; i < routeCoords.length; i++) {
    const [lng1, lat1] = routeCoords[i - 1];
    const [lng2, lat2] = routeCoords[i];
    const dlat = (lat2 - lat1) / latPerMeter;
    const dlng = (lng2 - lng1) / lngPerMeter;
    totalDistance += Math.sqrt(dlat * dlat + dlng * dlng);
  }

  const estimatedTime = speed > 0 ? totalDistance / speed : 0;
  const areaHa = calculatePolygonArea(boundary);
  const estimatedVolume = areaHa * applicationRate;

  // Build GeoJSON
  const routeGeoJson = {
    type: 'LineString',
    coordinates: routeCoords,
  };

  return {
    route_geojson: routeGeoJson,
    waypoints: waypoints.map((wp, i) => ({ ...wp, sequence: i })),
    total_distance: Math.round(totalDistance),
    estimated_time: Math.round(estimatedTime),
    estimated_volume: Math.round(estimatedVolume * 10) / 10,
    flight_direction: flightDirection,
    swath_width: swathWidth,
    overlap_pct: overlap,
    altitude,
    speed,
    headland_width: headlandWidth,
    application_rate: applicationRate,
    line_count: lineCount,
    area_hectares: Math.round(areaHa * 100) / 100,
  };
}

/**
 * Calculate polygon area in hectares using the Shoelace formula.
 */
export function calculatePolygonArea(points) {
  if (!points || points.length < 3) return 0;

  const R = 6371000; // Earth radius in meters
  const toRad = (d) => d * Math.PI / 180;

  // Convert to planar coordinates (approximate for small areas)
  const refLat = points[0].lat || points[0].latitude;
  const refLng = points[0].lng || points[0].longitude;

  const planar = points.map(p => {
    const lat = p.lat || p.latitude;
    const lng = p.lng || p.longitude;
    return {
      x: (lng - refLng) * Math.cos(toRad(refLat)) * R * toRad(1),
      y: (lat - refLat) * R * toRad(1),
    };
  });

  // Shoelace formula
  let area = 0;
  for (let i = 0; i < planar.length; i++) {
    const j = (i + 1) % planar.length;
    area += planar[i].x * planar[j].y;
    area -= planar[j].x * planar[i].y;
  }
  area = Math.abs(area) / 2;

  return area / 10000; // Convert m² to hectares
}

// ─── Route Preview Data ─────────────────────────────────────────────────────

/**
 * Build a complete route preview for display.
 */
export function buildRoutePreview(route, mission) {
  if (!route) return null;

  return {
    field: mission?.fields?.field_name || '—',
    area: route.area_hectares || mission?.estimated_area || '—',
    distance: route.total_distance ? `${(route.total_distance / 1000).toFixed(1)} km` : '—',
    estimatedTime: route.estimated_time ? formatSeconds(route.estimated_time) : '—',
    altitude: route.altitude ? `${route.altitude} m` : '—',
    speed: route.speed ? `${route.speed} m/s` : '—',
    swathWidth: route.swath_width ? `${route.swath_width} m` : '—',
    overlap: route.overlap_pct != null ? `${route.overlap_pct}%` : '—',
    applicationRate: route.application_rate ? `${route.application_rate} L/ha` : '—',
    estimatedVolume: route.estimated_volume ? `${route.estimated_volume} L` : '—',
    lineCount: route.line_count || '—',
    status: route.status,
    syncStatus: route.sync_status,
  };
}

function formatSeconds(s) {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}
