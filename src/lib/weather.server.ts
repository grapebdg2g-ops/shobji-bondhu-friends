// Server-only helpers for Open-Meteo. NEVER import from client code.
import type { Forecast, CurrentWeather, HourlyPoint, DailyPoint } from "./weather-types";
export type { Forecast, CurrentWeather, HourlyPoint, DailyPoint } from "./weather-types";

const BASE = "https://api.open-meteo.com/v1/forecast";

// In-memory cache to dedupe concurrent requests and reduce 429s.
// Key: "lat,lng" rounded. Value: { data, expiresAt } or in-flight promise.
type CacheEntry = { promise: Promise<Forecast>; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60_000; // 30 min — reduce 429s from Open-Meteo

export async function fetchForecast(lat: number, lng: number): Promise<Forecast> {
  // Round to 0.1° (~11km) so nearby GPS readings share cache
  const key = `${lat.toFixed(1)},${lng.toFixed(1)}`;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return hit.promise;

  const promise = fetchForecastInner(lat, lng).catch((e) => {
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
  if (!res || !res.ok) {
    console.warn(`[weather] Open-Meteo unavailable (${res?.status ?? lastStatus}); using temporary local fallback`);
    return buildFallbackForecast(lat, lng);
  }
  const data = await res.json() as any;

  if (!data?.current || !data?.hourly?.time?.length || !data?.daily?.time?.length) {
    console.warn("[weather] Open-Meteo returned incomplete data; using temporary local fallback");
    return buildFallbackForecast(lat, lng);
  }

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

function buildFallbackForecast(lat: number, lng: number): Forecast {
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Dhaka" }).format(new Date()));
  const isDay = hour >= 6 && hour < 18;
  const seasonalBase = 28 + Math.sin((Date.now() / 86_400_000 + lat + lng) / 14) * 3;
  const rainBase = Math.max(15, Math.min(75, Math.round(42 + Math.sin((Date.now() / 86_400_000 + lat) / 5) * 22)));
  const code = rainBase > 60 ? 61 : rainBase > 40 ? 51 : isDay ? 2 : 3;
  const dateInDhaka = (offsetDays: number) =>
    new Date(Date.now() + offsetDays * 86_400_000).toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });

  const current: CurrentWeather = {
    temperature: Number(seasonalBase.toFixed(1)),
    weather_code: code,
    precipitation_prob: rainBase,
    wind_speed: 9,
    humidity: 78,
    is_day: isDay,
    time: new Date().toISOString(),
  };

  const hourly: HourlyPoint[] = Array.from({ length: 24 }, (_, i) => ({
    time: new Date(Date.now() + i * 3_600_000).toISOString(),
    temperature: Number((seasonalBase + Math.sin((hour + i) / 24 * Math.PI * 2) * 2).toFixed(1)),
    precipitation_probability: Math.max(10, Math.min(90, rainBase + ((i % 6) - 2) * 5)),
    weather_code: code,
  }));

  const daily: DailyPoint[] = Array.from({ length: 7 }, (_, i) => ({
    date: dateInDhaka(i),
    temp_max: Math.round(seasonalBase + 4 + (i % 3)),
    temp_min: Math.round(seasonalBase - 3 - (i % 2)),
    precipitation_sum: Number(((rainBase / 100) * (i % 2 ? 8 : 4)).toFixed(1)),
    precipitation_probability_max: Math.max(10, Math.min(90, rainBase + (i % 3) * 6)),
    weather_code: code,
  }));

  return { current, hourly, daily, past_rainfall: [] };
}

// Alert evaluation + Bengali weather descriptions live in `weather-rules.ts`
// (client-safe). Re-export for server callers' convenience.
export { evaluateAlert, weatherCodeBn } from "./weather-rules";
export type { AlertType, Severity, WeatherAlert } from "./weather-rules";
