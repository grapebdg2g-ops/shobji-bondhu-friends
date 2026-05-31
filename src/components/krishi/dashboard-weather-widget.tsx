import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { MapPin, RefreshCw, Navigation } from "lucide-react";
import { getWeatherForecast } from "@/lib/weather.functions";
import { weatherCodeBn } from "@/lib/weather-rules";
import { useGeolocation } from "@/hooks/use-geolocation";
import type { Forecast, DailyPoint, CurrentWeather } from "@/lib/weather-types";

const BN_DAYS = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"];

const toBn = (n: number | string) =>
  String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

function weatherEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 2) return "⛅";
  if (code === 3) return "☁️";
  if (code >= 45 && code <= 48) return "🌫️";
  if (code >= 51 && code <= 57) return "🌦️";
  if (code >= 61 && code <= 65) return "🌧️";
  if (code >= 71 && code <= 77) return "🌨️";
  if (code >= 80 && code <= 82) return "🌧️";
  if (code === 95) return "⛈️";
  if (code >= 96) return "🌩️";
  return "🌤️";
}

function farmingAdvice(c: CurrentWeather, today: DailyPoint | undefined): {
  text: string;
  tone: "good" | "warn" | "danger";
} {
  if (c.weather_code === 95 || c.weather_code >= 96)
    return { text: "⛈️ বজ্রপাতের সম্ভাবনা — মাঠে যাবেন না", tone: "danger" };
  if (c.wind_speed > 30)
    return { text: "💨 ঝড়ো বাতাস — ফসল বেঁধে রাখুন", tone: "danger" };
  const rainProb = Math.max(c.precipitation_prob, today?.precipitation_probability_max ?? 0);
  if (rainProb > 70)
    return { text: "⚠️ আজ সেচ দেওয়ার প্রয়োজন নেই — বৃষ্টির সম্ভাবনা", tone: "warn" };
  if (c.temperature > 35)
    return { text: "🌡️ গরম বেশি — ফসলে সকালে পানি দিন", tone: "warn" };
  return { text: "✅ আজকের আবহাওয়া চাষের জন্য ভালো", tone: "good" };
}

const toneStyles: Record<"good" | "warn" | "danger", string> = {
  good: "bg-green-50 border-green-200 text-green-900",
  warn: "bg-yellow-50 border-yellow-200 text-yellow-900",
  danger: "bg-orange-50 border-orange-200 text-orange-900",
};

export function DashboardWeatherWidget({
  district,
  upazila,
}: {
  district: string | null | undefined;
  upazila?: string | null;
}) {
  const fetchForecast = useServerFn(getWeatherForecast);
  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["weather-dashboard", district, upazila ?? null],
    queryFn: () => fetchForecast({ data: { district: district!, upazila: upazila ?? null } }),
    enabled: !!district,
    staleTime: 30 * 60_000,
    refetchInterval: 30 * 60_000,
  });

  if (!district) return null;

  if (isLoading) {
    return (
      <section className="px-5 mt-4">
        <div className="rounded-2xl bg-card border border-border p-4 animate-pulse h-44" />
      </section>
    );
  }

  if (error || !data || !data.forecast) {
    return (
      <section className="px-5 mt-4">
        <div className="rounded-2xl bg-card border border-border p-4 text-sm text-muted-foreground">
          আবহাওয়া তথ্য আনা যায়নি।{" "}
          <button onClick={() => refetch()} className="text-primary font-semibold">আবার চেষ্টা</button>
        </div>
      </section>
    );
  }

  const f: Forecast = data.forecast;
  const c = f.current;
  const today = f.daily[0];
  const advice = farmingAdvice(c, today);
  const loc = upazila ? `${upazila}, ${district}` : district;

  return (
    <section className="px-5 mt-4 space-y-3">
      <Link
        to="/weather"
        className="block rounded-2xl bg-card border border-border shadow-[var(--shadow-card)] overflow-hidden active:scale-[0.99] transition"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{loc}</span>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); refetch(); }}
            aria-label="আপডেট"
            className="flex items-center gap-1 text-xs text-muted-foreground"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            আপডেট
          </button>
        </div>

        {/* Current */}
        <div className="grid grid-cols-[auto_1fr] gap-4 p-4">
          <div className="flex items-center justify-center w-24 text-6xl">
            {weatherEmoji(c.weather_code)}
          </div>
          <div className="space-y-0.5 text-sm">
            <div className="text-xs text-muted-foreground">{weatherCodeBn(c.weather_code)}</div>
            <div><span className="text-muted-foreground">তাপমাত্রা:</span> <span className="font-bold">{toBn(Math.round(c.temperature))}°C</span></div>
            <div><span className="text-muted-foreground">আর্দ্রতা:</span> <span className="font-bold">{toBn(Math.round(c.humidity))}%</span></div>
            <div><span className="text-muted-foreground">বাতাস:</span> <span className="font-bold">{toBn(Math.round(c.wind_speed))} km/h</span></div>
            <div><span className="text-muted-foreground">বৃষ্টির সম্ভাবনা:</span> <span className="font-bold">{toBn(c.precipitation_prob)}%</span></div>
          </div>
        </div>

        {/* 5-day */}
        <div className="border-t border-border px-2 py-3">
          <div className="flex gap-2 overflow-x-auto px-2 no-scrollbar">
            {f.daily.slice(0, 5).map((d, i) => {
              const date = new Date(d.date);
              const label = i === 0 ? "আজ" : i === 1 ? "কাল" : BN_DAYS[date.getDay()];
              return (
                <div key={d.date} className="shrink-0 w-16 text-center rounded-lg bg-muted/30 py-2">
                  <p className="text-xs font-semibold">{label}</p>
                  <p className="text-2xl leading-7">{weatherEmoji(d.weather_code)}</p>
                  <p className="text-xs font-bold">{toBn(Math.round(d.temp_max))}°</p>
                </div>
              );
            })}
          </div>
        </div>
      </Link>

      {/* Farming advice */}
      <div className={`rounded-xl border p-3 text-sm font-medium ${toneStyles[advice.tone]}`}>
        {advice.text}
      </div>
    </section>
  );
}
