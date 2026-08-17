/**
 * FlyBy Weather Service
 * Fetches weather data from OpenWeatherMap API.
 * Uses field reference GPS coordinates for per-field forecasts.
 */

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const ONE_CALL_URL = 'https://api.openweathermap.org/data/3.0/onecall';

/**
 * Get current weather for a location.
 */
export async function getCurrentWeather(lat, lng) {
  if (!API_KEY) return getMockCurrentWeather();

  const res = await fetch(
    `${BASE_URL}/weather?lat=${lat}&lon=${lng}&units=metric&appid=${API_KEY}`
  );
  if (!res.ok) throw new Error('Failed to fetch weather data');
  const data = await res.json();

  return {
    temperature: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    pressure: data.main.pressure,
    windSpeed: Math.round(data.wind.speed * 3.6), // m/s to km/h
    windDirection: data.wind.deg,
    windGust: data.wind.gust ? Math.round(data.wind.gust * 3.6) : null,
    visibility: data.visibility / 1000, // metres to km
    cloudCover: data.clouds.all,
    condition: data.weather[0].main,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    rain: data.rain?.['1h'] || 0,
    sunrise: new Date(data.sys.sunrise * 1000),
    sunset: new Date(data.sys.sunset * 1000),
    timestamp: new Date(),
  };
}

/**
 * Get hourly forecast (48 hours) for a location.
 */
export async function getHourlyForecast(lat, lng) {
  if (!API_KEY) return getMockHourlyForecast();

  const res = await fetch(
    `${BASE_URL}/forecast?lat=${lat}&lon=${lng}&units=metric&cnt=48&appid=${API_KEY}`
  );
  if (!res.ok) throw new Error('Failed to fetch forecast data');
  const data = await res.json();

  return data.list.map((item) => ({
    time: new Date(item.dt * 1000),
    temperature: Math.round(item.main.temp),
    humidity: item.main.humidity,
    windSpeed: Math.round(item.wind.speed * 3.6),
    windDirection: item.wind.deg,
    windGust: item.wind.gust ? Math.round(item.wind.gust * 3.6) : null,
    rainProbability: Math.round((item.pop || 0) * 100),
    rain: item.rain?.['3h'] || 0,
    cloudCover: item.clouds.all,
    visibility: (item.visibility || 10000) / 1000,
    condition: item.weather[0].main,
    description: item.weather[0].description,
    icon: item.weather[0].icon,
  }));
}

/**
 * Get daily forecast (5 days).
 */
export async function getDailyForecast(lat, lng) {
  if (!API_KEY) return getMockDailyForecast();

  const hourly = await getHourlyForecast(lat, lng);
  // Group by day
  const days = {};
  hourly.forEach((h) => {
    const key = h.time.toISOString().split('T')[0];
    if (!days[key]) days[key] = [];
    days[key].push(h);
  });

  return Object.entries(days).slice(0, 5).map(([date, hours]) => ({
    date,
    dayName: new Date(date).toLocaleDateString('en-ZA', { weekday: 'short' }),
    tempMin: Math.min(...hours.map((h) => h.temperature)),
    tempMax: Math.max(...hours.map((h) => h.temperature)),
    windMax: Math.max(...hours.map((h) => h.windSpeed)),
    rainProbability: Math.max(...hours.map((h) => h.rainProbability)),
    condition: hours[Math.floor(hours.length / 2)]?.condition || 'Clear',
    icon: hours[Math.floor(hours.length / 2)]?.icon || '01d',
  }));
}

// ─── MOCK DATA (when no API key is configured) ──────────────────────────────

function getMockCurrentWeather() {
  return {
    temperature: 18,
    feelsLike: 16,
    humidity: 65,
    pressure: 1018,
    windSpeed: 10,
    windDirection: 135,
    windGust: 14,
    visibility: 10,
    cloudCover: 30,
    condition: 'Clouds',
    description: 'scattered clouds',
    icon: '03d',
    rain: 0,
    sunrise: new Date(new Date().setHours(6, 15, 0)),
    sunset: new Date(new Date().setHours(17, 45, 0)),
    timestamp: new Date(),
  };
}

function getMockHourlyForecast() {
  const now = new Date();
  return Array.from({ length: 24 }, (_, i) => {
    const time = new Date(now.getTime() + i * 3600000);
    const hour = time.getHours();
    const isDay = hour >= 6 && hour <= 18;
    const windBase = isDay ? (hour >= 10 && hour <= 15 ? 14 : 8) : 5;
    return {
      time,
      temperature: isDay ? 14 + Math.round(Math.sin((hour - 6) / 12 * Math.PI) * 8) : 12,
      humidity: isDay ? 55 + Math.round(Math.random() * 15) : 75,
      windSpeed: windBase + Math.round(Math.random() * 4),
      windDirection: 120 + Math.round(Math.random() * 40),
      windGust: windBase + 4 + Math.round(Math.random() * 3),
      rainProbability: hour >= 14 && hour <= 17 ? 20 + Math.round(Math.random() * 15) : 5,
      rain: 0,
      cloudCover: isDay ? 25 + Math.round(Math.random() * 20) : 40,
      visibility: 10,
      condition: hour >= 14 ? 'Clouds' : 'Clear',
      description: hour >= 14 ? 'scattered clouds' : 'clear sky',
      icon: isDay ? (hour >= 14 ? '03d' : '01d') : '01n',
    };
  });
}

function getMockDailyForecast() {
  const days = ['Today', 'Tomorrow'];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const now = new Date();

  return Array.from({ length: 5 }, (_, i) => {
    const date = new Date(now.getTime() + i * 86400000);
    return {
      date: date.toISOString().split('T')[0],
      dayName: i < 2 ? days[i] : dayNames[date.getDay()],
      tempMin: 10 + Math.round(Math.random() * 5),
      tempMax: 20 + Math.round(Math.random() * 8),
      windMax: 8 + Math.round(Math.random() * 12),
      rainProbability: Math.round(Math.random() * 40),
      condition: i === 3 ? 'Rain' : 'Clear',
      icon: i === 3 ? '10d' : '01d',
    };
  });
}
