import { supabase } from '../lib/supabase';

/**
 * Calculate the area of a polygon using the Shoelace formula on projected coordinates.
 * Uses a simple equirectangular approximation suitable for agricultural fields.
 * Returns area in square metres.
 */
export function calculateAreaSqm(coordinates) {
  if (!coordinates || coordinates.length < 4) return 0;

  // Convert lat/lng to approximate metres using equirectangular projection
  const toRadians = (deg) => (deg * Math.PI) / 180;
  const centroidLat = coordinates.reduce((sum, c) => sum + c[1], 0) / coordinates.length;
  const cosLat = Math.cos(toRadians(centroidLat));

  // Convert to metres from a reference point
  const refLng = coordinates[0][0];
  const refLat = coordinates[0][1];

  const projected = coordinates.map(([lng, lat]) => ({
    x: (lng - refLng) * cosLat * 111320,
    y: (lat - refLat) * 110540,
  }));

  // Shoelface formula
  let area = 0;
  for (let i = 0; i < projected.length - 1; i++) {
    area += projected[i].x * projected[i + 1].y;
    area -= projected[i + 1].x * projected[i].y;
  }

  return Math.abs(area) / 2;
}

/**
 * Convert square metres to hectares.
 */
export function sqmToHectares(sqm) {
  return sqm / 10000;
}

/**
 * Calculate area in hectares from GeoJSON coordinates.
 */
export function calculateArea(coordinates) {
  const sqm = calculateAreaSqm(coordinates);
  return {
    squareMetres: Math.round(sqm),
    hectares: Math.round(sqmToHectares(sqm) * 100) / 100,
  };
}

/**
 * Convert an array of Leaflet LatLng points to a GeoJSON Polygon.
 * Ensures the ring is closed (first point === last point).
 */
export function convertToGeoJSON(latLngs) {
  if (!latLngs || latLngs.length < 3) return null;

  // GeoJSON uses [lng, lat] order
  const coordinates = latLngs.map((p) => [p.lng, p.lat]);

  // Close the ring if not already closed
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    coordinates.push([...first]);
  }

  return {
    type: 'Polygon',
    coordinates: [coordinates],
  };
}

/**
 * Convert GeoJSON Polygon coordinates back to Leaflet LatLng array.
 */
export function geoJSONToLatLngs(geojson) {
  if (!geojson?.coordinates?.[0]) return [];
  // GeoJSON is [lng, lat], Leaflet is { lat, lng }
  const ring = geojson.coordinates[0];
  // Remove the closing point (duplicate of first)
  const points = ring.slice(0, -1);
  return points.map(([lng, lat]) => ({ lat, lng }));
}

/**
 * Validate a GeoJSON polygon boundary.
 * Returns { valid: boolean, errors: string[] }
 */
export function validateBoundary(geojson) {
  const errors = [];

  if (!geojson) {
    errors.push('No boundary data provided.');
    return { valid: false, errors };
  }

  if (geojson.type !== 'Polygon') {
    errors.push('Boundary must be a Polygon type.');
    return { valid: false, errors };
  }

  if (!geojson.coordinates || !geojson.coordinates[0]) {
    errors.push('Boundary has no coordinate ring.');
    return { valid: false, errors };
  }

  const ring = geojson.coordinates[0];

  if (ring.length < 5) {
    // 4 points + closing point = 5
    errors.push('Boundary must have at least 4 points.');
    return { valid: false, errors };
  }

  // Check ring is closed
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    errors.push('Boundary ring is not closed.');
    return { valid: false, errors };
  }

  // Check for self-intersection (simple check)
  if (hasSelfIntersection(ring)) {
    errors.push('Boundary polygon has self-intersecting edges.');
    return { valid: false, errors };
  }

  // Check area is calculable
  const area = calculateArea(ring);
  if (area.hectares <= 0) {
    errors.push('Boundary area could not be calculated.');
    return { valid: false, errors };
  }

  return { valid: true, errors: [] };
}

/**
 * Simple self-intersection check using line segment intersection test.
 */
function hasSelfIntersection(ring) {
  const n = ring.length - 1; // exclude closing point
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue; // adjacent segments share a point
      if (segmentsIntersect(ring[i], ring[i + 1], ring[j], ring[(j + 1) % n])) {
        return true;
      }
    }
  }
  return false;
}

function segmentsIntersect(p1, p2, p3, p4) {
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  return false;
}

function direction(pi, pj, pk) {
  return (pk[0] - pi[0]) * (pj[1] - pi[1]) - (pj[0] - pi[0]) * (pk[1] - pi[1]);
}

/**
 * Save boundary GeoJSON to a field record.
 */
export async function saveBoundary(fieldId, geojson) {
  const validation = validateBoundary(geojson);
  if (!validation.valid) {
    throw new Error(validation.errors.join(' '));
  }

  const area = calculateArea(geojson.coordinates[0]);

  const { data, error } = await supabase
    .from('fields')
    .update({
      boundary: geojson,
      area_hectares: area.hectares,
    })
    .eq('id', fieldId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Load boundary for a field.
 */
export async function loadBoundary(fieldId) {
  const { data, error } = await supabase
    .from('fields')
    .select('boundary, area_hectares, latitude, longitude')
    .eq('id', fieldId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete boundary from a field.
 */
export async function deleteBoundary(fieldId) {
  const { error } = await supabase
    .from('fields')
    .update({ boundary: null })
    .eq('id', fieldId);

  if (error) throw error;
}


/**
 * Calculate the centroid (geometric centre) of a GeoJSON Polygon.
 * Returns { lat, lng } or null if invalid.
 */
export function getPolygonCentroid(geojson) {
  if (!geojson?.coordinates?.[0] || geojson.coordinates[0].length < 4) return null;

  const ring = geojson.coordinates[0];
  // Average of all points (excluding closing duplicate)
  const points = ring.slice(0, -1);
  const n = points.length;
  if (n === 0) return null;

  const sumLng = points.reduce((s, p) => s + p[0], 0);
  const sumLat = points.reduce((s, p) => s + p[1], 0);

  return {
    lat: sumLat / n,
    lng: sumLng / n,
  };
}

/**
 * Resolve a field's location for weather requests.
 * Priority: explicit lat/lng → boundary centroid → null
 */
export function resolveFieldLocation(field) {
  if (!field) return null;

  // Priority 1: explicit coordinates
  if (field.latitude && field.longitude) {
    return { lat: field.latitude, lng: field.longitude };
  }

  // Priority 2: boundary centroid
  if (field.boundary?.coordinates) {
    return getPolygonCentroid(field.boundary);
  }

  return null;
}
