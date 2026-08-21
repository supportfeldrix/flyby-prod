import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WAYLINE_DIR = join(__dirname, '..', 'storage', 'waylines');
const WPML_DIR = join(__dirname, '..', 'storage', 'wpml');

if (!existsSync(WPML_DIR)) mkdirSync(WPML_DIR, { recursive: true });

export function loadWaylineJson(waylineId) {
  const filepath = join(WAYLINE_DIR, `${waylineId}.json`);
  if (!existsSync(filepath)) return null;
  return JSON.parse(readFileSync(filepath, 'utf-8'));
}

export function convertToWpml(waylineData) {
  if (!waylineData) throw new Error('No wayline data');
  const speed = waylineData.auto_flight_speed || 7;
  const altitude = waylineData.global_height || 3;
  const waypoints = waylineData.waypoints || [];
  const missionName = waylineData.mission_name || 'FlyBy Mission';

  const wpml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:wpml="http://www.dji.com/wpmz/1.0.6">
<Document>
<wpml:missionConfig>
<wpml:flyToWaylineMode>safely</wpml:flyToWaylineMode>
<wpml:finishAction>goHome</wpml:finishAction>
<wpml:exitOnRCLost>executeLostAction</wpml:exitOnRCLost>
<wpml:globalTransitionalSpeed>${speed}</wpml:globalTransitionalSpeed>
</wpml:missionConfig>
<Folder>
<wpml:templateId>0</wpml:templateId>
<wpml:waylineId>0</wpml:waylineId>
<wpml:autoFlightSpeed>${speed}</wpml:autoFlightSpeed>
${waypoints.map((wp, i) => `<Placemark><Point><coordinates>${wp.longitude},${wp.latitude}</coordinates></Point><wpml:index>${i}</wpml:index><wpml:executeHeight>${wp.altitude || altitude}</wpml:executeHeight><wpml:waypointSpeed>${wp.speed || speed}</wpml:waypointSpeed></Placemark>`).join('\n')}
</Folder>
</Document>
</kml>`;

  const templateKml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:wpml="http://www.dji.com/wpmz/1.0.6">
<Document>
<wpml:author>FlyBy by Feldrix</wpml:author>
<wpml:createTime>${new Date().toISOString()}</wpml:createTime>
<Folder>
<wpml:templateType>waypoint</wpml:templateType>
<wpml:templateId>0</wpml:templateId>
<name>${missionName}</name>
<wpml:autoFlightSpeed>${speed}</wpml:autoFlightSpeed>
${waypoints.map((wp, i) => `<Placemark><Point><coordinates>${wp.longitude},${wp.latitude},${wp.altitude || altitude}</coordinates></Point><wpml:index>${i}</wpml:index><wpml:height>${wp.altitude || altitude}</wpml:height></Placemark>`).join('\n')}
</Folder>
</Document>
</kml>`;

  return { wpml, templateKml, missionName, waypointCount: waypoints.length };
}

export function generateWpmlPackage(waylineId) {
  const data = loadWaylineJson(waylineId);
  if (!data) throw new Error(`Wayline ${waylineId} not found`);
  const { wpml, templateKml, missionName, waypointCount } = convertToWpml(data);
  const dir = join(WPML_DIR, waylineId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'waylines.wpml'), wpml);
  writeFileSync(join(dir, 'template.kml'), templateKml);
  return { wayline_id: waylineId, mission_name: missionName, waypoint_count: waypointCount, generated_at: new Date().toISOString() };
}

export function getWpmlContent(waylineId) {
  const wpmlPath = join(WPML_DIR, waylineId, 'waylines.wpml');
  if (!existsSync(wpmlPath)) generateWpmlPackage(waylineId);
  const wpmlFile = join(WPML_DIR, waylineId, 'waylines.wpml');
  const templateFile = join(WPML_DIR, waylineId, 'template.kml');
  return {
    wpml: existsSync(wpmlFile) ? readFileSync(wpmlFile, 'utf-8') : null,
    template: existsSync(templateFile) ? readFileSync(templateFile, 'utf-8') : null,
  };
}
