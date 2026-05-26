// Server-only helpers for Open-Meteo. NEVER import from client code.
import type { Forecast, CurrentWeather, HourlyPoint, DailyPoint } from "./weather-types";
export type { Forecast, CurrentWeather, HourlyPoint, DailyPoint } from "./weather-types";

const BASE = "https://api.open-meteo.com/v1/forecast";

// In-memory cache to dedupe concurrent requests and reduce 429s.
// Key: "lat,lng" rounded. Value: { data, expiresAt } or in-flight promise.
type CacheEntry = { promise: Promise<Forecast>; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60_000; // 15 min

export async function fetchForecast(lat: number, lng: number): Promise<Forecast> {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return hit.promise;

  const promise = fetchForecastInner(lat, lng).catch((e) => {
    // Don't cache failures
    if (cache.get(key)?.promise === promise) cache.delete(key);
    throw e;
  });
  cache.set(key, { promise, expiresAt: now + CACHE_TTL_MS });
  return promise;
}

async function fetchForecastInner(lat: number, lng: number): Promise<Forecast> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    current: "temperature_2m,weather_code,precipitation_probability,wind_speed_10m,relative_humidity_2m,is_day",
    hourly: "temperature_2m,precipitation_probability,weather_code",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weather_code",
    timezone: "Asia/Dhaka",
    past_days: "7",
    forecast_days: "7",
  });

  const url = `${BASE}?${params}`;
  let res: Response | null = null;
  let lastStatus = 0;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      res = await fetch(url, { headers: { "accept": "application/json" } });
      if (res.ok) break;
      lastStatus = res.status;
      // Retry on 429 / 5xx
      if (res.status !== 429 && res.status < 500) break;
    } catch (e) {
      lastStatus = -1;
    }
    // Exponential backoff with jitter: 400ms, 900ms, 1900ms
    const delay = 400 * Math.pow(2, attempt) + Math.floor(Math.random() * 200);
    await new Promise((r) => setTimeout(r, delay));
  }
  if (!res || !res.ok) throw new Error(`Open-Meteo ${res?.status ?? lastStatus}`);
  const data = await res.json() as any;

  const c = data.current;
  const current: CurrentWeather = {
    temperature: c.temperature_2m,
    weather_code: c.weather_code,
    precipitation_prob: c.precipitation_probability ?? 0,
    wind_speed: c.wind_speed_10m ?? 0,
    humidity: c.relative_humidity_2m ?? 0,
    is_day: c.is_day === 1,
    time: c.time,
  };

  const h = data.hourly;
  const nowMs = Date.now();
  const hourly: HourlyPoint[] = [];
  for (let i = 0; i < h.time.length; i++) {
    const t = new Date(h.time[i]).getTime();
    if (t < nowMs - 60 * 60_000) continue;
    if (hourly.length >= 24) break;
    hourly.push({
      time: h.time[i],
      temperature: h.temperature_2m[i],
      precipitation_probability: h.precipitation_probability[i] ?? 0,
      weather_code: h.weather_code[i],
    });
  }

  const d = data.daily;
  const allDaily: DailyPoint[] = d.time.map((t: string, i: number) => ({
    date: t,
    temp_max: d.temperature_2m_max[i],
    temp_min: d.temperature_2m_min[i],
    precipitation_sum: d.precipitation_sum[i] ?? 0,
    precipitation_probability_max: d.precipitation_probability_max[i] ?? 0,
    weather_code: d.weather_code[i],
  }));
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  const daily = allDaily.filter((x) => x.date >= todayStr).slice(0, 7);
  const past_rainfall = allDaily
    .filter((x) => x.date < todayStr)
    .slice(-7)
    .map((x) => ({ date: x.date, rainfall: x.precipitation_sum }));

  return { current, hourly, daily, past_rainfall };
}

// Alert evaluation + Bengali weather descriptions live in `weather-rules.ts`
// (client-safe). Re-export for server callers' convenience.
export { evaluateAlert, weatherCodeBn } from "./weather-rules";
export type { AlertType, Severity, WeatherAlert } from "./weather-rules";
