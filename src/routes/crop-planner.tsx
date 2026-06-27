import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Sparkles, ChevronRight, ChevronLeft, Zap, Target, Check,
  Droplets, CloudRain, CloudDrizzle, TrendingUp, Shield, Home,
  Leaf, Scale, X, Star, AlertTriangle, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  getRecommendedCrops, getCrop, type SoilType, type WaterNeed, type CropData,
} from "@/data/master-crop-data";
import { toBn, fmtBdt } from "@/lib/bn";
import { useUser } from "@/contexts/user-context";

export const Route = createFileRoute("/crop-planner")({
  component: CropPlannerPage,
  head: () => ({
    meta: [
      { title: "ফসল পরিকল্পনা — কৃষিবন্ধু" },
      { name: "description", content: "আপনার জমির জন্য সেরা ফসল খুঁজুন — মাটি, পানি ও লক্ষ্যের ভিত্তিতে।" },
    ],
  }),
});

type Screen = "entry" | "step" | "loading" | "results";
type Unit = "শতক" | "বিঘা" | "একর";
const UNIT_TO_SHOTOK: Record<Unit, number> = { শতক: 1, বিঘা: 33, একর: 100 };
type Goal = "profit" | "safe" | "fast" | "food";

const SOILS: { v: SoilType; label: string; icon: string; desc: string }[] = [
  { v: "এঁটেল", label: "এঁটেল", icon: "🟤", desc: "ভারী, আঠালো" },
  { v: "দোআঁশ", label: "দোআঁশ", icon: "🟡", desc: "সেরা, বেশিরভাগ" },
  { v: "বালি", label: "বালি", icon: "⚪", desc: "হালকা, ঝরঝরে" },
  { v: "পলি", label: "পলি", icon: "🔵", desc: "নদীর পাড়" },
];

const WATERS: { v: WaterNeed; icon: typeof Droplets; title: string; sub: string }[] = [
  { v: "বেশি", icon: Droplets, title: "সব সময় সেচ দিতে পারি", sub: "পাম্প, নদী, খাল আছে" },
  { v: "মাঝারি", icon: CloudDrizzle, title: "মাঝে মাঝে সেচ দিতে পারি", sub: "সীমিত পানি আছে" },
  { v: "কম", icon: CloudRain, title: "শুধু বৃষ্টির উপর নির্ভর", sub: "সেচের ব্যবস্থা নেই" },
];

const GOALS: { v: Goal; label: string; sub: string; icon: typeof TrendingUp }[] = [
  { v: "profit", label: "বেশি লাভ", sub: "ROI সর্বোচ্চ", icon: TrendingUp },
  { v: "safe", label: "কম ঝুঁকি", sub: "নিরাপদ ফসল", icon: Shield },
  { v: "fast", label: "দ্রুত ফসল", sub: "৬০-৯০ দিনে", icon: Zap },
  { v: "food", label: "পরিবারের খাবার", sub: "নিজের ঘরের", icon: Home },
];

function CropPlannerPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [screen, setScreen] = useState<Screen>("entry");
  const [step, setStep] = useState(1);

  // Inputs
  const [areaVal, setAreaVal] = useState<number>(50);
  const [unit, setUnit] = useState<Unit>("শতক");
  const [soil, setSoil] = useState<SoilType>("দোআঁশ");
  const [water, setWater] = useState<WaterNeed>("মাঝারি");
  const [goals, setGoals] = useState<Goal[]>(["profit"]);
  const [showSoilHelp, setShowSoilHelp] = useState(false);

  // Compare modal
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const areaShotok = useMemo(() => Math.round(areaVal * UNIT_TO_SHOTOK[unit]), [areaVal, unit]);
  const bighas = areaShotok / 33;
  const month = new Date().getMonth() + 1;
  const primaryGoal: Goal = goals[0] ?? "profit";

  const recs: CropData[] = useMemo(() => {
    if (screen !== "results") return [];
    return getRecommendedCrops({ soilType: soil, waterAvail: water, month, goal: primaryGoal, areaInShotok: areaShotok });
  }, [screen, soil, water, month, primaryGoal, areaShotok]);

  const top = recs[0];
  const others = recs.slice(1);




  // Loading auto-advance
  useEffect(() => {
    if (screen !== "loading") return;
    const t = setTimeout(() => setScreen("results"), 2000);
    return () => clearTimeout(t);
  }, [screen]);

  function startQuick() {
    // Quick: use sensible defaults + profile district
    setSoil("দোআঁশ"); setWater("মাঝারি"); setGoals(["profit"]); setAreaVal(50); setUnit("শতক");
    setScreen("loading");
  }

  function next() {
    if (step < 4) setStep((s) => s + 1);
    else setScreen("loading");
  }
  function prev() {
    if (step > 1) setStep((s) => s - 1);
    else setScreen("entry");
  }

  function toggleGoal(g: Goal) {
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  }

  function toggleCompare(id: string) {
    setCompareIds((prev) => prev.includes(id)
      ? prev.filter((x) => x !== id)
      : prev.length >= 3 ? prev : [...prev, id]);
  }

  return (
    <main className="min-h-screen bg-[#F0FFF4] md:max-w-[560px] md:mx-auto pb-28">
      {/* ===== SCREEN 1: ENTRY ===== */}
      {screen === "entry" && (
        <>
          <header className="px-5 pt-8 pb-8 rounded-b-3xl text-white" style={{ background: "var(--gradient-brand)" }}>
            <button onClick={() => navigate({ to: "/dashboard" })} aria-label="ফিরে যান" className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="mt-5 text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-7 w-7" /> ফসল পরিকল্পনা
            </h1>
            <p className="text-sm text-white/85 mt-2">আপনার জমির জন্য সেরা ফসল খুঁজুন</p>
          </header>

          <section className="px-5 mt-6 space-y-4">
            {/* Option A — Quick */}
            <button
              onClick={startQuick}
              className="w-full text-left rounded-2xl p-5 text-white shadow-lg active:scale-[0.99] transition"
              style={{ background: "linear-gradient(135deg,#2D6A4F 0%,#40916C 100%)" }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold opacity-90">
                <Zap className="h-5 w-5" /> এখনই সুপারিশ দেখুন
              </div>
              <h2 className="text-lg font-bold mt-2">তাৎক্ষণিক ফলাফল</h2>
              <p className="text-sm text-white/85 mt-1">
                {user?.district ? `${user.district} জেলার জন্য ` : "প্রোফাইল থেকে তথ্য নিয়ে "}
                সাধারণ সুপারিশ
              </p>
              <span className="mt-3 inline-flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-full text-sm font-semibold">
                দেখুন <ChevronRight className="h-4 w-4" />
              </span>
            </button>

            {/* Option B — Custom */}
            <button
              onClick={() => { setScreen("step"); setStep(1); }}
              className="w-full text-left rounded-2xl p-5 border-2 border-emerald-300 bg-white active:scale-[0.99] transition"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <Target className="h-5 w-5" /> বিস্তারিত পরিকল্পনা
              </div>
              <h2 className="text-lg font-bold text-gray-900 mt-2">আরো সঠিক পরামর্শ</h2>
              <p className="text-sm text-gray-600 mt-1">জমি, মাটি, পানি — সব দিয়ে নিখুঁত সুপারিশ</p>
              <span className="mt-3 inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-sm font-semibold">
                শুরু করি <ChevronRight className="h-4 w-4" />
              </span>
            </button>

            <Link
              to="/crop-planner/my-plans"
              className="block text-center text-sm text-emerald-700 font-semibold py-3"
            >
              📋 আমার সংরক্ষিত পরিকল্পনা দেখুন →
            </Link>
          </section>
        </>
      )}

      {/* ===== SCREEN 2: STEP-BY-STEP ===== */}
      {screen === "step" && (
        <>
          <header className="px-5 pt-8 pb-5 rounded-b-3xl text-white" style={{ background: "var(--gradient-brand)" }}>
            <button onClick={prev} aria-label="পিছনে" className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="mt-4 flex items-center gap-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className={`h-2 flex-1 rounded-full ${n <= step ? "bg-white" : "bg-white/30"}`} />
              ))}
            </div>
            <p className="text-xs text-white/80 mt-2">ধাপ {toBn(step)}/৪</p>
          </header>

          <section className="px-5 mt-6">
            {/* Step 1: Area */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">আপনার জমি কতটুকু?</h2>
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <input
                    type="number"
                    value={areaVal || ""}
                    onChange={(e) => setAreaVal(Number(e.target.value) || 0)}
                    className="w-full text-5xl font-bold text-center text-emerald-700 border-b-2 border-emerald-200 focus:border-emerald-500 outline-none py-2"
                    min={1}
                  />
                  <div className="mt-4 flex gap-2">
                    {(["শতক", "বিঘা", "একর"] as Unit[]).map((u) => (
                      <button
                        key={u}
                        onClick={() => setUnit(u)}
                        className={`flex-1 py-2 rounded-xl font-semibold text-sm ${unit === u ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700"}`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 text-center text-sm text-gray-600">
                    = {toBn(areaShotok)} শতক = {toBn(Math.round((areaShotok / 33) * 100) / 100)} বিঘা ={" "}
                    {toBn(Math.round((areaShotok / 100) * 100) / 100)} একর
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Soil */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">মাটি কেমন?</h2>
                <div className="grid grid-cols-2 gap-3">
                  {SOILS.map((s) => {
                    const active = soil === s.v;
                    return (
                      <button
                        key={s.v}
                        onClick={() => setSoil(s.v)}
                        className={`p-4 rounded-2xl border-2 text-left transition ${active ? "border-emerald-500 bg-emerald-50" : "border-gray-200 bg-white"}`}
                      >
                        <div className="text-3xl">{s.icon}</div>
                        <div className="font-bold text-gray-900 mt-1">{s.label}</div>
                        <div className="text-xs text-gray-500">{s.desc}</div>
                        {active && <Check className="h-4 w-4 text-emerald-600 mt-1" />}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setShowSoilHelp((x) => !x)}
                  className="w-full text-sm text-emerald-700 font-semibold py-2 inline-flex items-center justify-center gap-1"
                >
                  নিশ্চিত না? আমাকে সাহায্য করুন
                  {showSoilHelp ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {showSoilHelp && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-gray-700 space-y-2">
                    <p className="font-bold">🧪 সহজ পরীক্ষা:</p>
                    <p>এক মুঠো মাটি সামান্য ভেজা করে হাতে চাপুন:</p>
                    <ul className="space-y-1 ml-3">
                      <li>• <b>বল বানিয়ে ফাটে না</b> — এঁটেল</li>
                      <li>• <b>বল বানায় তবে চাপলে ভেঙে যায়</b> — দোআঁশ</li>
                      <li>• <b>বল বানায় না, ঝরে পড়ে</b> — বালি</li>
                      <li>• <b>মসৃণ, পিচ্ছিল লাগে</b> — পলি</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Water */}
            {step === 3 && (
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-gray-900">সেচের ব্যবস্থা কেমন?</h2>
                {WATERS.map((w) => {
                  const Icon = w.icon;
                  const active = water === w.v;
                  return (
                    <button
                      key={w.v}
                      onClick={() => setWater(w.v)}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition flex items-start gap-3 ${active ? "border-emerald-500 bg-emerald-50" : "border-gray-200 bg-white"}`}
                    >
                      <Icon className={`h-6 w-6 mt-0.5 shrink-0 ${active ? "text-emerald-600" : "text-gray-400"}`} />
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">{w.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{w.sub}</div>
                      </div>
                      {active && <Check className="h-5 w-5 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 4: Goals */}
            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">কী চাইছেন?</h2>
                  <p className="text-xs text-gray-500 mt-1">একাধিক বাছাই করতে পারেন</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {GOALS.map((g) => {
                    const Icon = g.icon;
                    const active = goals.includes(g.v);
                    return (
                      <button
                        key={g.v}
                        onClick={() => toggleGoal(g.v)}
                        className={`p-4 rounded-2xl border-2 text-left transition ${active ? "border-emerald-500 bg-emerald-50" : "border-gray-200 bg-white"}`}
                      >
                        <Icon className={`h-6 w-6 ${active ? "text-emerald-600" : "text-gray-400"}`} />
                        <div className="font-bold text-gray-900 mt-2">{g.label}</div>
                        <div className="text-xs text-gray-500">{g.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          <div className="fixed bottom-0 left-0 right-0 md:max-w-[560px] md:left-1/2 md:-translate-x-1/2 bg-white border-t border-gray-100 p-4">
            <button
              onClick={next}
              disabled={(step === 1 && areaShotok <= 0) || (step === 4 && goals.length === 0)}
              className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {step === 4 ? <>ফলাফল দেখুন <Sparkles className="h-5 w-5" /></> : <>পরবর্তী <ChevronRight className="h-5 w-5" /></>}
            </button>
          </div>
        </>
      )}

      {/* ===== SCREEN 3: LOADING ===== */}
      {screen === "loading" && <LoadingScreen />}

      {/* ===== SCREEN 4: RESULTS ===== */}
      {screen === "results" && (
        <>
          <header className="px-5 pt-8 pb-6 rounded-b-3xl text-white" style={{ background: "var(--gradient-brand)" }}>
            <button onClick={() => setScreen("entry")} aria-label="পুনরায়" className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="mt-4 text-2xl font-bold">🌱 আপনার সুপারিশ</h1>
            <p className="text-sm text-white/85 mt-1">
              {toBn(areaShotok)} শতক • {soil} মাটি • সেচ: {water}
            </p>
          </header>

          {recs.length === 0 && (
            <div className="px-5 mt-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-gray-700">
                আপনার শর্তে এই মাসে রোপণযোগ্য ফসল পাওয়া যায়নি। মাটি বা সেচের ব্যবস্থা পরিবর্তন করে আবার চেষ্টা করুন।
              </div>
              <button onClick={() => setScreen("entry")} className="mt-4 w-full py-3 rounded-xl bg-emerald-600 text-white font-bold">
                আবার চেষ্টা করুন
              </button>
            </div>
          )}

          {top && (
            <section className="px-5 mt-6">
              <HeroCropCard
                crop={top}
                soil={soil}
                bighas={bighas}
                goalLabel={GOALS.find((g) => g.v === primaryGoal)?.label ?? ""}
                district={user?.district}
                inCompare={compareIds.includes(top.id)}
                onCompare={() => toggleCompare(top.id)}
              />
            </section>
          )}

          {others.length > 0 && (
            <section className="mt-6">
              <h3 className="px-5 font-bold text-gray-900 mb-3">আরো বিকল্প</h3>
              <div className="flex gap-3 overflow-x-auto px-5 pb-2 snap-x snap-mandatory scrollbar-hide">
                {others.map((c) => (
                  <AltCropCard
                    key={c.id}
                    crop={c}
                    bighas={bighas}
                    inCompare={compareIds.includes(c.id)}
                    onCompare={() => toggleCompare(c.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {recs.length > 0 && <UnsuitableSection soil={soil} water={water} recs={recs} />}

          {/* Floating compare button */}
          {compareIds.length >= 2 && (
            <button
              onClick={() => setCompareOpen(true)}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-emerald-600 text-white px-5 py-3 rounded-full shadow-lg font-bold inline-flex items-center gap-2"
            >
              <Scale className="h-5 w-5" /> তুলনা করুন ({toBn(compareIds.length)})
            </button>
          )}
        </>
      )}

      {/* ===== COMPARE MODAL ===== */}
      {compareOpen && (
        <CompareModal
          ids={compareIds}
          bighas={bighas}
          onClose={() => setCompareOpen(false)}
          onClear={() => { setCompareIds([]); setCompareOpen(false); }}
        />
      )}
    </main>
  );
}

/* ============== Loading Screen ============== */
function LoadingScreen() {
  const STEPS = [
    "আপনার মাটি বিশ্লেষণ",
    "মৌসুম যাচাই করছি",
    "বাজার দর দেখছি",
    "সেরা ফসল নির্বাচন...",
  ];
  const [done, setDone] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDone((d) => Math.min(STEPS.length, d + 1)), 450);
    return () => clearInterval(id);
  }, [STEPS.length]);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 -mt-10">
      <div className="relative h-24 w-24 mb-6">
        <div className="absolute inset-0 rounded-full bg-emerald-200 animate-ping opacity-60" />
        <div className="absolute inset-2 rounded-full bg-emerald-500 flex items-center justify-center">
          <Leaf className="h-10 w-10 text-white" />
        </div>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-5">বিশ্লেষণ করছি...</h2>
      <ul className="w-full max-w-xs space-y-2">
        {STEPS.map((s, i) => (
          <li key={s} className={`flex items-center gap-2 text-sm transition ${i < done ? "text-emerald-700 font-semibold" : "text-gray-400"}`}>
            {i < done ? <Check className="h-4 w-4" /> : <span className="h-4 w-4 rounded-full border-2 border-gray-300" />}
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ============== Hero card with full plan ============== */
function HeroCropCard({
  crop, soil, bighas, goalLabel, district, inCompare, onCompare,
}: {
  crop: CropData; soil: SoilType; bighas: number; goalLabel: string;
  district?: string | null; inCompare: boolean; onCompare: () => void;
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const month = new Date().getMonth() + 1;
  const inSeason = crop.plantingMonths.some((m) => Math.abs(m - month) <= 1);
  const cost = Math.round(crop.totalCost * bighas);
  const profitMin = Math.round(crop.profitMin * bighas);
  const profitMax = Math.round(crop.profitMax * bighas);
  const revenueMin = Math.round(crop.yieldMin * crop.avgMarketPrice * bighas);
  const revenueMax = Math.round(crop.yieldMax * crop.avgMarketPrice * bighas);

  const reasons = [
    crop.soilTypes.includes(soil) && `${soil} মাটিতে আদর্শ`,
    inSeason && `এখন ${crop.seasons[0]} মৌসুম — সঠিক সময়`,
    crop.demandLevel === "বেশি" && (district ? `${district} জেলায় ভালো দাম` : "ভালো বাজার চাহিদা"),
    `ROI ${toBn(crop.roi)}% — ${goalLabel}`,
  ].filter(Boolean) as string[];

  return (
    <div className="bg-white rounded-3xl shadow-lg ring-2 ring-emerald-300 overflow-hidden">
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 px-5 py-3 text-white text-xs font-bold inline-flex items-center gap-1.5">
        <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" /> আপনার জন্য সেরা পছন্দ
      </div>
      <div className="p-5">
        <div className="flex items-center gap-3">
          <span className="text-5xl">{crop.icon}</span>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{crop.name}</h2>
            <p className="text-xs text-gray-500">{crop.seasons.join(", ")} • {toBn(crop.totalDays)} দিন</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="font-bold text-gray-800 text-sm mb-2">কেন সেরা?</p>
          <ul className="space-y-1.5">
            {reasons.map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" /> {r}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="খরচ" value={fmtBdt(cost)} tone="gray" />
          <Stat label="আয়" value={`${fmtBdt(revenueMin)}–${fmtBdt(revenueMax).replace("৳", "")}`} tone="blue" />
          <Stat label="লাভ" value={`${fmtBdt(profitMin)}–${fmtBdt(profitMax).replace("৳", "")}`} tone="emerald" />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-gray-600">সময়: <b className="text-gray-900">{toBn(crop.totalDays)} দিন</b></span>
          <span className={`px-2 py-1 rounded-full font-bold ${crop.riskLevel === "কম" ? "bg-green-100 text-green-700" : crop.riskLevel === "মাঝারি" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
            ঝুঁকি: {crop.riskLevel}
          </span>
        </div>

        {/* Financial breakdown collapsible */}
        <button
          onClick={() => setShowBreakdown((x) => !x)}
          className="mt-4 w-full flex items-center justify-between text-sm font-bold text-emerald-700 py-2"
        >
          💰 বিনিয়োগ ও আয়ের হিসাব
          {showBreakdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showBreakdown && (
          <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1.5">
            <Row label="বীজ ও চারা" value={fmtBdt(crop.seedCostPerBigha * bighas)} />
            <Row label="সার" value={fmtBdt(crop.fertilizerCost * bighas)} />
            <Row label="কীটনাশক" value={fmtBdt(crop.pesticideCost * bighas)} />
            <Row label="শ্রমিক" value={fmtBdt(crop.laborCost * bighas)} />
            <Row label="অন্যান্য" value={fmtBdt(crop.otherCost * bighas)} />
            <div className="border-t pt-1.5 mt-1.5">
              <Row label="মোট খরচ" value={fmtBdt(cost)} bold />
              <Row label="আনুমানিক আয়" value={`${fmtBdt(revenueMin)}–${toBn(revenueMax.toLocaleString("en-IN"))}`} bold />
              <Row label="আনুমানিক লাভ" value={`${fmtBdt(profitMin)}–${toBn(profitMax.toLocaleString("en-IN"))}`} bold tone="emerald" />
            </div>
          </div>
        )}

        <div className="mt-5 space-y-2">
          <Link
            to="/crop-guide/new/$crop"
            params={{ crop: crop.name }}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold inline-flex items-center justify-center gap-2"
          >
            <Check className="h-5 w-5" /> এই ফসল বেছে নিন
          </Link>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/crop-guide"
              className="py-2.5 rounded-xl border border-emerald-300 text-emerald-700 font-semibold text-sm text-center"
            >
              📋 সম্পূর্ণ গাইড
            </Link>
            <button
              onClick={onCompare}
              className={`py-2.5 rounded-xl font-semibold text-sm ${inCompare ? "bg-emerald-600 text-white" : "border border-gray-300 text-gray-700"}`}
            >
              <Scale className="h-4 w-4 inline mr-1" /> {inCompare ? "তুলনায় আছে" : "তুলনা যোগ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "gray" | "blue" | "emerald" }) {
  const cls = { gray: "bg-gray-50 text-gray-900", blue: "bg-blue-50 text-blue-900", emerald: "bg-emerald-50 text-emerald-800" }[tone];
  return (
    <div className={`rounded-lg p-2 ${cls}`}>
      <div className="text-[10px] opacity-70">{label}</div>
      <div className="text-xs font-bold leading-tight">{value}</div>
    </div>
  );
}

function Row({ label, value, bold, tone }: { label: string; value: string; bold?: boolean; tone?: "emerald" }) {
  return (
    <div className={`flex justify-between ${bold ? "font-bold" : ""} ${tone === "emerald" ? "text-emerald-700" : "text-gray-700"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

/* ============== Alt cards ============== */
function AltCropCard({ crop, bighas, inCompare, onCompare }: { crop: CropData; bighas: number; inCompare: boolean; onCompare: () => void }) {
  return (
    <div className="snap-start shrink-0 w-[180px] bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-3">
      <div className="text-3xl">{crop.icon}</div>
      <h4 className="font-bold text-gray-900 mt-1">{crop.name}</h4>
      <div className="mt-2 space-y-0.5 text-[11px] text-gray-600">
        <div>ROI: <b className="text-emerald-700">{toBn(crop.roi)}%</b></div>
        <div>ঝুঁকি: <b className={crop.riskLevel === "কম" ? "text-green-700" : crop.riskLevel === "মাঝারি" ? "text-yellow-700" : "text-red-700"}>{crop.riskLevel}</b></div>
        <div>{toBn(crop.totalDays)} দিন</div>
        <div>লাভ: <b className="text-emerald-700">{fmtBdt(Math.round(((crop.profitMin + crop.profitMax) / 2) * bighas))}</b></div>
      </div>
      <Link
        to="/crop-guide/new/$crop"
        params={{ crop: crop.name }}
        className="mt-2 block text-center py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold"
      >
        দেখুন →
      </Link>
      <button
        onClick={onCompare}
        className={`mt-1 w-full text-[11px] font-semibold py-1 rounded-lg ${inCompare ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
      >
        {inCompare ? "✓ তুলনায়" : "+ তুলনা"}
      </button>
    </div>
  );
}

/* ============== Unsuitable warnings ============== */
function UnsuitableSection({ soil, water, recs }: { soil: SoilType; water: WaterNeed; recs: CropData[] }) {
  // Find crops user could think of but won't work in their conditions
  const recIds = new Set(recs.map((r) => r.id));
  const all = ["onion", "begun", "tomato", "potato", "boro-dhan"].map((id) => getCrop(id)).filter(Boolean) as CropData[];
  const bad: { crop: CropData; reason: string }[] = [];
  for (const c of all) {
    if (recIds.has(c.id)) continue;
    if (!c.soilTypes.includes(soil)) {
      bad.push({ crop: c, reason: `আপনার ${soil} মাটিতে ভালো হবে না` });
    } else if (c.waterRequirement === "বেশি" && water === "কম") {
      bad.push({ crop: c, reason: "পানি কম থাকলে ঝুঁকি বেশি" });
    }
    if (bad.length >= 2) break;
  }
  if (bad.length === 0) return null;
  return (
    <section className="px-5 mt-6">
      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-1.5">
        <AlertTriangle className="h-5 w-5 text-amber-600" /> এড়িয়ে চলুন
      </h3>
      <div className="space-y-2">
        {bad.map(({ crop, reason }) => (
          <div key={crop.id} className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
            <span className="text-2xl">{crop.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-900 text-sm">{crop.name}</div>
              <div className="text-xs text-gray-600">{reason}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============== Compare Modal ============== */
function CompareModal({ ids, bighas, onClose, onClear }: { ids: string[]; bighas: number; onClose: () => void; onClear: () => void }) {
  const crops = ids.map((id) => getCrop(id)).filter(Boolean) as CropData[];
  if (crops.length === 0) return null;

  // Determine best per row (highest profit, lowest risk, etc.)
  const riskRank = { কম: 0, মাঝারি: 1, বেশি: 2 } as const;
  const best = {
    cost: crops.reduce((a, b) => (a.totalCost < b.totalCost ? a : b)).id,
    revenue: crops.reduce((a, b) => (a.yieldMax * a.avgMarketPrice > b.yieldMax * b.avgMarketPrice ? a : b)).id,
    profit: crops.reduce((a, b) => (a.profitMax > b.profitMax ? a : b)).id,
    roi: crops.reduce((a, b) => (a.roi > b.roi ? a : b)).id,
    days: crops.reduce((a, b) => (a.totalDays < b.totalDays ? a : b)).id,
    risk: crops.reduce((a, b) => (riskRank[a.riskLevel] < riskRank[b.riskLevel] ? a : b)).id,
  };

  const rows: { label: string; key: keyof typeof best; val: (c: CropData) => string }[] = [
    { label: "খরচ/বিঘা", key: "cost", val: (c) => fmtBdt(c.totalCost) },
    { label: "আয়/বিঘা", key: "revenue", val: (c) => `${toBn(Math.round(c.yieldMin * c.avgMarketPrice / 1000))}-${toBn(Math.round(c.yieldMax * c.avgMarketPrice / 1000))}হাজার` },
    { label: "লাভ/বিঘা", key: "profit", val: (c) => `${toBn(Math.round(c.profitMin / 1000))}-${toBn(Math.round(c.profitMax / 1000))}হাজার` },
    { label: "ROI", key: "roi", val: (c) => `${toBn(c.roi)}%` },
    { label: "সময়", key: "days", val: (c) => `${toBn(c.totalDays)} দিন` },
    { label: "ঝুঁকি", key: "risk", val: (c) => c.riskLevel },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full md:max-w-[560px] rounded-t-3xl md:rounded-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-bold text-gray-900 inline-flex items-center gap-2"><Scale className="h-5 w-5" /> তুলনা ({toBn(crops.length)} ফসল)</h3>
          <button onClick={onClose} aria-label="বন্ধ"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-auto p-4">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left py-2 font-bold text-gray-600"></th>
                {crops.map((c) => (
                  <th key={c.id} className="text-center py-2 px-1">
                    <div className="text-2xl">{c.icon}</div>
                    <div className="font-bold text-gray-900 text-xs">{c.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t">
                  <td className="py-2 text-gray-600 font-semibold">{r.label}</td>
                  {crops.map((c) => (
                    <td key={c.id} className={`text-center py-2 px-1 ${best[r.key] === c.id ? "bg-emerald-100 text-emerald-800 font-bold rounded" : "text-gray-700"}`}>
                      {r.val(c)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t">
                <td className="py-2 text-gray-600 font-semibold">আপনার লাভ</td>
                {crops.map((c) => (
                  <td key={c.id} className="text-center py-2 px-1 font-bold text-emerald-700">
                    {fmtBdt(Math.round(((c.profitMin + c.profitMax) / 2) * bighas))}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <p className="text-[10px] text-gray-500 mt-2">🟢 সবুজ = সেই বিভাগে সেরা</p>
        </div>
        <div className="p-4 border-t flex gap-2">
          <button onClick={onClear} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm">পরিষ্কার করুন</button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm">বন্ধ করুন</button>
        </div>
      </div>
    </div>
  );
}
