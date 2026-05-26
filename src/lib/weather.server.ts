// Server-only helpers for Open-Meteo. NEVER import from client code.
import type { Forecast, CurrentWeather, HourlyPoint, DailyPoint } from "./weather-types";
export type { Forecast, CurrentWeather, HourlyPoint, DailyPoint } from "./weather-types";

const BASE = "https://api.open-meteo.com/v1/forecast";

export async function fetchForecast(lat: number, lng: number): Promise<Forecast> {
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

  const res = await fetch(`${BASE}?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
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
