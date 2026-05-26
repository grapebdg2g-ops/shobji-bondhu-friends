// Server-only helpers for Open-Meteo + alert evaluation. NEVER import from client code.

export type CurrentWeather = {
  temperature: number;
  weather_code: number;
  precipitation_prob: number;
  wind_speed: number;
  humidity: number;
  is_day: boolean;
  time: string;
};

export type HourlyPoint = {
  time: string; // ISO
  temperature: number;
  precipitation_probability: number;
  weather_code: number;
};

export type DailyPoint = {
  date: string; // YYYY-MM-DD
  temp_max: number;
  temp_min: number;
  precipitation_sum: number;
  precipitation_probability_max: number;
  weather_code: number;
};

export type Forecast = {
  current: CurrentWeather;
  hourly: HourlyPoint[]; // next 24h
  daily: DailyPoint[]; // next 7 days
  past_rainfall: { date: string; rainfall: number }[]; // last 7 days
};

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

// ── Alert evaluation ────────────────────────────────────────────────────────

export type AlertType = "STORM" | "HEAVY_RAIN" | "HEAT_WAVE" | "GOOD";
export type Severity = "high" | "medium" | "low";

export type WeatherAlert = {
  type: AlertType;
  severity: Severity;
  title: string;
  body: string;
};

function dhakaHour(): number {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    hour12: false,
  });
  return parseInt(fmt.format(new Date()), 10);
}

/**
 * Returns the alert to send NOW for the given district forecast, or null.
 * Applies time-of-day gates per the product spec.
 */
export function evaluateAlert(
  district: string,
  forecast: Forecast,
  hourOverride?: number,
): WeatherAlert | null {
  const hour = hourOverride ?? dhakaHour();
  const c = forecast.current;
  // Look at next 6 hours for short-term rain risk
  const next6 = forecast.hourly.slice(0, 6);
  const maxRainProb = Math.max(0, ...next6.map((p) => p.precipitation_probability));
  const maxWeatherCode = Math.max(c.weather_code, ...next6.map((p) => p.weather_code));

  // STORM — anytime
  if (maxWeatherCode >= 95) {
    return {
      type: "STORM",
      severity: "high",
      title: "⛈️ বজ্রঝড়ের সতর্কতা!",
      body: `${district} তে আজ বজ্রঝড়ের সম্ভাবনা আছে। মাঠে যাওয়া থেকে বিরত থাকুন।`,
    };
  }
  // HEAVY RAIN — anytime
  if (maxRainProb > 80 && maxWeatherCode >= 61) {
    return {
      type: "HEAVY_RAIN",
      severity: "high",
      title: "🌧️ ভারী বৃষ্টির সতর্কতা",
      body: "আগামী ৬ ঘণ্টায় ভারী বৃষ্টি হতে পারে। ফসল সংরক্ষণ করুন।",
    };
  }
  // HEAT WAVE — 8 AM only
  if (c.temperature > 38 && hour === 8) {
    return {
      type: "HEAT_WAVE",
      severity: "medium",
      title: "🌡️ তাপপ্রবাহ সতর্কতা",
      body: `তাপমাত্রা ${Math.round(c.temperature)}°C — ফসলে বিকেলে অতিরিক্ত পানি দিন।`,
    };
  }
  // GOOD WEATHER — 7 AM only
  if (c.weather_code <= 2 && c.temperature >= 22 && c.temperature <= 30 && hour === 7) {
    return {
      type: "GOOD",
      severity: "low",
      title: "☀️ আজ চাষের ভালো দিন!",
      body: "আজকের আবহাওয়া কৃষিকাজের জন্য উপযুক্ত।",
    };
  }
  return null;
}

// Bengali weather code descriptions (WMO codes)
export function weatherCodeBn(code: number): string {
  if (code === 0) return "পরিষ্কার আকাশ";
  if (code <= 2) return "আংশিক মেঘলা";
  if (code === 3) return "মেঘলা";
  if (code >= 45 && code <= 48) return "কুয়াশা";
  if (code >= 51 && code <= 57) return "হালকা বৃষ্টি";
  if (code >= 61 && code <= 65) return "বৃষ্টি";
  if (code >= 66 && code <= 67) return "ভারী বৃষ্টি";
  if (code >= 71 && code <= 77) return "তুষারপাত";
  if (code >= 80 && code <= 82) return "বৃষ্টির ঝাঁপটা";
  if (code >= 95) return "বজ্রঝড়";
  return "—";
}
