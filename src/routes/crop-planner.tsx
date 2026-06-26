import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Sparkles, ChevronRight, TrendingUp, Shield, Zap, Wheat } from "lucide-react";
import {
  getRecommendedCrops,
  type SoilType,
  type WaterNeed,
  type CropData,
} from "@/data/master-crop-data";
import { toBn } from "@/lib/bn";

export const Route = createFileRoute("/crop-planner")({
  component: CropPlannerPage,
  head: () => ({
    meta: [
      { title: "ফসল পরিকল্পনা — কৃষিবন্ধু" },
      { name: "description", content: "মাটি, পানি, ঋতু ও লক্ষ্যের ভিত্তিতে আপনার জন্য সেরা ফসল সুপারিশ।" },
    ],
  }),
});

const SOILS: { v: SoilType; label: string }[] = [
  { v: "এঁটেল", label: "এঁটেল" },
  { v: "দোআঁশ", label: "দোআঁশ" },
  { v: "বালি", label: "বালি" },
  { v: "পলি", label: "পলি" },
  { v: "বেলে-দোআঁশ", label: "বেলে-দোআঁশ" },
];

const WATERS: { v: WaterNeed; label: string }[] = [
  { v: "কম", label: "কম (বৃষ্টিনির্ভর)" },
  { v: "মাঝারি", label: "মাঝারি" },
  { v: "বেশি", label: "প্রচুর (সেচ আছে)" },
];

type Goal = "profit" | "safe" | "fast" | "food";
const GOALS: { v: Goal; label: string; icon: typeof TrendingUp; desc: string }[] = [
  { v: "profit", label: "সর্বোচ্চ লাভ", icon: TrendingUp, desc: "ROI বেশি এমন ফসল" },
  { v: "safe", label: "নিরাপদ চাষ", icon: Shield, desc: "কম ঝুঁকির ফসল" },
  { v: "fast", label: "দ্রুত ফসল", icon: Zap, desc: "অল্প দিনে কাটা যায়" },
  { v: "food", label: "খাদ্য নিরাপত্তা", icon: Wheat, desc: "পরিবারের খাদ্য" },
];

function CropPlannerPage() {
  const navigate = useNavigate();
  const [soil, setSoil] = useState<SoilType>("দোআঁশ");
  const [water, setWater] = useState<WaterNeed>("মাঝারি");
  const [area, setArea] = useState<number>(33); // 1 bigha ≈ 33 shotok
  const [goal, setGoal] = useState<Goal>("profit");
  const [submitted, setSubmitted] = useState(false);

  const month = new Date().getMonth() + 1;

  const recs: CropData[] = useMemo(() => {
    if (!submitted) return [];
    return getRecommendedCrops({ soilType: soil, waterAvail: water, month, goal, areaInShotok: area });
  }, [submitted, soil, water, month, goal, area]);

  return (
    <main className="min-h-screen bg-[#F0FFF4] md:max-w-[560px] md:mx-auto pb-24">
      <header className="px-5 pt-8 pb-6 rounded-b-3xl text-white" style={{ background: "var(--gradient-brand)" }}>
        <button onClick={() => navigate({ to: "/dashboard" })} className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="mt-4 text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6" /> ফসল পরিকল্পনা
        </h1>
        <p className="text-sm text-white/85 mt-1">আপনার জমি ও লক্ষ্য বলুন — সেরা ফসল সুপারিশ পান</p>
      </header>

      <section className="px-4 mt-5 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          {/* Soil */}
          <div>
            <label className="text-sm font-semibold text-gray-800 mb-2 block">মাটির ধরন</label>
            <div className="flex flex-wrap gap-2">
              {SOILS.map((s) => (
                <button
                  key={s.v}
                  onClick={() => setSoil(s.v)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold ${soil === s.v ? "bg-[#2D6A4F] text-white" : "bg-gray-100 text-gray-700"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Water */}
          <div>
            <label className="text-sm font-semibold text-gray-800 mb-2 block">সেচ সুবিধা</label>
            <div className="flex flex-wrap gap-2">
              {WATERS.map((w) => (
                <button
                  key={w.v}
                  onClick={() => setWater(w.v)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold ${water === w.v ? "bg-[#2D6A4F] text-white" : "bg-gray-100 text-gray-700"}`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* Area */}
          <div>
            <label className="text-sm font-semibold text-gray-800 mb-2 block">জমির পরিমাণ (শতক)</label>
            <input
              type="number"
              value={area}
              onChange={(e) => setArea(Number(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
              min={1}
            />
            <p className="text-xs text-gray-500 mt-1">≈ {toBn(Math.round((area / 33) * 100) / 100)} বিঘা</p>
          </div>

          {/* Goal */}
          <div>
            <label className="text-sm font-semibold text-gray-800 mb-2 block">আপনার লক্ষ্য</label>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map((g) => {
                const Icon = g.icon;
                const active = goal === g.v;
                return (
                  <button
                    key={g.v}
                    onClick={() => setGoal(g.v)}
                    className={`p-3 rounded-xl text-left border-2 transition ${active ? "border-emerald-500 bg-emerald-50" : "border-gray-100 bg-white"}`}
                  >
                    <Icon className={`h-5 w-5 mb-1 ${active ? "text-emerald-600" : "text-gray-500"}`} />
                    <div className="text-sm font-bold text-gray-900">{g.label}</div>
                    <div className="text-[11px] text-gray-500 leading-tight">{g.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setSubmitted(true)}
            className="w-full py-3 rounded-xl bg-[#2D6A4F] text-white font-bold inline-flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <Sparkles className="h-5 w-5" /> সুপারিশ পান
          </button>
        </div>

        {/* Results */}
        {submitted && (
          <div className="space-y-3">
            <h2 className="font-bold text-gray-900 px-1">
              {recs.length > 0 ? `🌱 সেরা ${toBn(recs.length)}টি সুপারিশ` : "কোনো সুপারিশ পাওয়া যায়নি"}
            </h2>
            {recs.length === 0 && (
              <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 p-3 rounded-xl px-1">
                আপনার শর্তে এই মাসে রোপণযোগ্য ফসল নেই। মাটি বা সেচ পরিবর্তন করে দেখুন।
              </p>
            )}
            {recs.map((c, idx) => {
              const bighas = area / 33;
              const profitMid = Math.round(((c.profitMin + c.profitMax) / 2) * bighas);
              return (
                <Link
                  key={c.id}
                  to="/crop-guide/new/$crop"
                  params={{ crop: c.name }}
                  className="block bg-white rounded-2xl p-4 shadow-sm ring-1 ring-emerald-100 active:scale-[0.99]"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center text-2xl shrink-0">
                      {c.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          #{toBn(idx + 1)}
                        </span>
                        <h3 className="font-bold text-gray-900 truncate">{c.name}</h3>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {c.seasons.join("/")} • {toBn(c.totalDays)} দিন • ROI {toBn(c.roi)}%
                      </p>
                      <div className="mt-2 grid grid-cols-3 gap-1 text-[11px]">
                        <div className="bg-gray-50 rounded p-1.5">
                          <div className="text-gray-500">খরচ</div>
                          <div className="font-bold text-gray-900">৳{toBn(Math.round(c.totalCost * bighas))}</div>
                        </div>
                        <div className="bg-emerald-50 rounded p-1.5">
                          <div className="text-emerald-700">লাভ</div>
                          <div className="font-bold text-emerald-800">৳{toBn(profitMid)}</div>
                        </div>
                        <div className={`rounded p-1.5 ${c.riskLevel === "কম" ? "bg-green-50" : c.riskLevel === "মাঝারি" ? "bg-yellow-50" : "bg-red-50"}`}>
                          <div className="text-gray-600">ঝুঁকি</div>
                          <div className="font-bold text-gray-900">{c.riskLevel}</div>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 shrink-0 mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
