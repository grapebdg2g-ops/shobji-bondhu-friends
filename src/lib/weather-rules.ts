// Pure rules — safe to import from both client and server.
import type { Forecast } from "./weather.server";

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

export function evaluateAlert(
  district: string,
  forecast: Forecast,
  hourOverride?: number,
): WeatherAlert | null {
  const hour = hourOverride ?? dhakaHour();
  const c = forecast.current;
  const next6 = forecast.hourly.slice(0, 6);
  const maxRainProb = Math.max(0, ...next6.map((p) => p.precipitation_probability));
  const maxWeatherCode = Math.max(c.weather_code, ...next6.map((p) => p.weather_code));

  if (maxWeatherCode >= 95) {
    return {
      type: "STORM",
      severity: "high",
      title: "⛈️ বজ্রঝড়ের সতর্কতা!",
      body: `${district} তে আজ বজ্রঝড়ের সম্ভাবনা আছে। মাঠে যাওয়া থেকে বিরত থাকুন।`,
    };
  }
  if (maxRainProb > 80 && maxWeatherCode >= 61) {
    return {
      type: "HEAVY_RAIN",
      severity: "high",
      title: "🌧️ ভারী বৃষ্টির সতর্কতা",
      body: "আগামী ৬ ঘণ্টায় ভারী বৃষ্টি হতে পারে। ফসল সংরক্ষণ করুন।",
    };
  }
  if (c.temperature > 38 && hour === 8) {
    return {
      type: "HEAT_WAVE",
      severity: "medium",
      title: "🌡️ তাপপ্রবাহ সতর্কতা",
      body: `তাপমাত্রা ${Math.round(c.temperature)}°C — ফসলে বিকেলে অতিরিক্ত পানি দিন।`,
    };
  }
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
