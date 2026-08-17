/**
 * FlyBy Mission Validation Service
 * Ensures all operational resources are ready before dispatch.
 */

export function validateMission(mission, { aircraft, pilot, battery, equipment, weatherEval, field }) {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!mission.customer_id) errors.push('Customer is required');
  if (!mission.farm_id) errors.push('Farm is required');
  if (!mission.field_id) errors.push('Field is required');
  if (!mission.aircraft_id) errors.push('Aircraft must be assigned');
  if (!mission.pilot_id) errors.push('Pilot must be assigned');

  // Aircraft readiness
  if (aircraft) {
    if (aircraft.status !== 'Ready') errors.push(`Aircraft is "${aircraft.status}" — must be Ready`);
    if (aircraft.next_service_date && new Date(aircraft.next_service_date) < new Date()) warnings.push('Aircraft service is overdue');
  }

  // Pilot availability
  if (pilot) {
    if (pilot.status !== 'Available' && pilot.status !== 'Standby') errors.push(`Pilot is "${pilot.status}" — must be Available or Standby`);
    if (pilot.licence_expiry && new Date(pilot.licence_expiry) < new Date()) errors.push('Pilot licence has expired');
    if (pilot.medical_expiry && new Date(pilot.medical_expiry) < new Date()) errors.push('Pilot medical has expired');
  }

  // Battery
  if (battery) {
    if (battery.status !== 'Ready') warnings.push(`Battery status is "${battery.status}"`);
    if (battery.current_charge < 30) errors.push(`Battery charge is ${battery.current_charge}% — minimum 30% required`);
    if (battery.battery_health < 80) warnings.push(`Battery health is ${battery.battery_health}%`);
  }

  // Weather
  if (weatherEval && weatherEval.status === 'DO NOT FLY') {
    errors.push('Weather conditions unsafe for flight: ' + weatherEval.recommendation);
  } else if (weatherEval && weatherEval.status === 'CAUTION') {
    warnings.push('Weather requires caution: ' + weatherEval.recommendation);
  }

  // Field boundary
  if (field && !field.boundary) {
    warnings.push('Field boundary not drawn — area estimate may be inaccurate');
  }

  const canDispatch = errors.length === 0;
  return { canDispatch, errors, warnings };
}
