/**
 * FlyBy Weather Decision Engine
 * Evaluates weather conditions against drone spray operation thresholds.
 * Every decision answers: "Can we safely fly and spray this field?"
 */

// ─── DEFAULT THRESHOLDS ──────────────────────────────────────────────────────
const THRESHOLDS = {
  wind: { green: 12, yellow: 18, red: 19 },         // km/h
  rain: { green: 0, yellow: 30, red: 31 },          // %
  temperature: { coldRed: 5, coldYellow: 10, hotYellow: 30, hotRed: 35 }, // °C
  humidity: { dryRed: 30, dryYellow: 40, wetYellow: 80, wetRed: 90 },     // %
  visibility: { min: 3 },                           // km
};

/**
 * Evaluate a single weather condition.
 * Returns: { status: 'SAFE' | 'CAUTION' | 'DO NOT FLY', checks: [...], recommendation: string }
 */
export function evaluateFieldConditions(weather, fieldWindLimit) {
  const checks = [];
  const windLimit = fieldWindLimit || THRESHOLDS.wind.red;

  // Wind
  const wind = weather.windSpeed || 0;
  const effectiveWindLimit = Math.min(windLimit, THRESHOLDS.wind.red);
  let windStatus = 'SAFE';
  if (wind >= effectiveWindLimit) windStatus = 'DO NOT FLY';
  else if (wind > THRESHOLDS.wind.green) windStatus = 'CAUTION';
  checks.push({ label: 'Wind', value: `${wind} km/h`, status: windStatus, threshold: `≤${effectiveWindLimit} km/h` });

  // Rain
  const rain = weather.rainProbability || 0;
  let rainStatus = 'SAFE';
  if (rain > THRESHOLDS.rain.yellow) rainStatus = 'DO NOT FLY';
  else if (rain > THRESHOLDS.rain.green) rainStatus = 'CAUTION';
  checks.push({ label: 'Rain', value: `${rain}%`, status: rainStatus, threshold: '≤30%' });

  // Temperature
  const temp = weather.temperature || 20;
  let tempStatus = 'SAFE';
  if (temp < THRESHOLDS.temperature.coldRed || temp > THRESHOLDS.temperature.hotRed) tempStatus = 'DO NOT FLY';
  else if (temp < THRESHOLDS.temperature.coldYellow || temp > THRESHOLDS.temperature.hotYellow) tempStatus = 'CAUTION';
  checks.push({ label: 'Temperature', value: `${temp}°C`, status: tempStatus, threshold: '10–30°C' });

  // Humidity
  const humidity = weather.humidity || 60;
  let humStatus = 'SAFE';
  if (humidity < THRESHOLDS.humidity.dryRed || humidity > THRESHOLDS.humidity.wetRed) humStatus = 'DO NOT FLY';
  else if (humidity < THRESHOLDS.humidity.dryYellow || humidity > THRESHOLDS.humidity.wetYellow) humStatus = 'CAUTION';
  checks.push({ label: 'Humidity', value: `${humidity}%`, status: humStatus, threshold: '40–80%' });

  // Visibility
  const vis = weather.visibility || 10;
  let visStatus = vis < THRESHOLDS.visibility.min ? 'DO NOT FLY' : 'SAFE';
  checks.push({ label: 'Visibility', value: `${vis} km`, status: visStatus, threshold: '≥3 km' });

  // Overall status
  const hasDNF = checks.some((c) => c.status === 'DO NOT FLY');
  const hasCaution = checks.some((c) => c.status === 'CAUTION');
  let overall = 'SAFE';
  if (hasDNF) overall = 'DO NOT FLY';
  else if (hasCaution) overall = 'CAUTION';

  // Recommendation
  let recommendation = '';
  if (overall === 'SAFE') {
    recommendation = 'Excellent spraying conditions. All parameters within safe limits.';
  } else if (overall === 'CAUTION') {
    const cautionItems = checks.filter((c) => c.status === 'CAUTION').map((c) => c.label.toLowerCase());
    recommendation = `Proceed with caution. Monitor ${cautionItems.join(' and ')} closely.`;
  } else {
    const dnfItems = checks.filter((c) => c.status === 'DO NOT FLY').map((c) => c.label.toLowerCase());
    recommendation = `Do not fly. ${dnfItems.join(' and ')} exceed safe operating limits.`;
  }

  return { status: overall, checks, recommendation };
}

/**
 * Generate operational recommendation for Mission Control.
 */
export function generateOperationalRecommendation(weather) {
  const evaluation = evaluateFieldConditions(weather);

  if (evaluation.status === 'SAFE') {
    return { status: 'GOOD', label: 'Excellent Conditions', color: '#16A34A', description: 'All systems go. Safe to dispatch missions.' };
  } else if (evaluation.status === 'CAUTION') {
    return { status: 'CAUTION', label: 'Proceed with Caution', color: '#D97706', description: 'Some conditions approaching limits. Monitor closely.' };
  } else {
    return { status: 'UNSAFE', label: 'Operations Suspended', color: '#EF4444', description: 'Conditions exceed safe operating limits. Do not dispatch.' };
  }
}

/**
 * Calculate flight risk level (0–100).
 */
export function calculateFlightRisk(weather) {
  let risk = 0;
  const wind = weather.windSpeed || 0;
  const rain = weather.rainProbability || 0;
  const temp = weather.temperature || 20;

  // Wind contribution (0-40)
  if (wind > 18) risk += 40;
  else if (wind > 12) risk += (wind - 12) / 6 * 25;
  else risk += wind / 12 * 10;

  // Rain contribution (0-30)
  risk += (rain / 100) * 30;

  // Temperature contribution (0-20)
  if (temp < 5 || temp > 35) risk += 20;
  else if (temp < 10 || temp > 30) risk += 10;

  // Visibility (0-10)
  const vis = weather.visibility || 10;
  if (vis < 3) risk += 10;
  else if (vis < 5) risk += 5;

  return Math.min(100, Math.round(risk));
}
