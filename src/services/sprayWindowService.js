/**
 * FlyBy Spray Window Service
 * Calculates safe spray windows from hourly forecast data.
 * A spray window is a continuous period where all conditions are within safe limits.
 */

import { evaluateFieldConditions } from './weatherDecisionService';

/**
 * Calculate spray windows from hourly forecast.
 * Returns array of { start: Date, end: Date, duration: minutes }
 */
export function calculateSprayWindows(hourlyForecast, fieldWindLimit) {
  if (!hourlyForecast || hourlyForecast.length === 0) return [];

  const windows = [];
  let windowStart = null;

  for (let i = 0; i < hourlyForecast.length; i++) {
    const hour = hourlyForecast[i];
    const evaluation = evaluateFieldConditions(hour, fieldWindLimit);

    if (evaluation.status === 'SAFE' || evaluation.status === 'CAUTION') {
      if (!windowStart) {
        windowStart = hour.time;
      }
    } else {
      if (windowStart) {
        windows.push({
          start: windowStart,
          end: hour.time,
          duration: Math.round((hour.time - windowStart) / 60000),
          status: 'SAFE',
        });
        windowStart = null;
      }
    }
  }

  // Close any open window
  if (windowStart && hourlyForecast.length > 0) {
    const lastHour = hourlyForecast[hourlyForecast.length - 1];
    windows.push({
      start: windowStart,
      end: new Date(lastHour.time.getTime() + 3600000),
      duration: Math.round((lastHour.time.getTime() + 3600000 - windowStart.getTime()) / 60000),
      status: 'SAFE',
    });
  }

  // Filter windows shorter than 30 minutes
  return windows.filter((w) => w.duration >= 30);
}

/**
 * Get today's primary spray window (the longest safe period today).
 */
export function getTodaySprayWindow(hourlyForecast, fieldWindLimit) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86400000);

  const todayHours = hourlyForecast.filter(
    (h) => h.time >= today && h.time < tomorrow
  );

  const windows = calculateSprayWindows(todayHours, fieldWindLimit);
  if (windows.length === 0) return null;

  // Return longest window
  return windows.reduce((best, w) => (w.duration > best.duration ? w : best), windows[0]);
}

/**
 * Format a spray window for display.
 */
export function formatSprayWindow(window) {
  if (!window) return { text: 'No safe window today', subtext: 'Conditions do not permit spraying.' };

  const startStr = window.start.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  const endStr = window.end.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  const hours = Math.floor(window.duration / 60);
  const mins = window.duration % 60;
  const durationStr = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;

  return {
    text: `${startStr} – ${endStr}`,
    subtext: `${durationStr} available`,
    start: startStr,
    end: endStr,
    duration: durationStr,
  };
}

/**
 * Get the reason why a spray window closes.
 */
export function getWindowCloseReason(hourlyForecast, windowEnd, fieldWindLimit) {
  const closingHour = hourlyForecast.find(
    (h) => h.time >= windowEnd && h.time < new Date(windowEnd.getTime() + 3600000)
  );

  if (!closingHour) return 'Forecast data ends';

  const eval_ = evaluateFieldConditions(closingHour, fieldWindLimit);
  const failedChecks = eval_.checks.filter((c) => c.status === 'DO NOT FLY');
  if (failedChecks.length > 0) {
    return `${failedChecks[0].label} exceeds limit (${failedChecks[0].value})`;
  }

  return 'Conditions deteriorating';
}
