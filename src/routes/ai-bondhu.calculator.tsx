import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ArrowLeft, FlaskConical } from "lucide-react";

export const Route = createFileRoute("/ai-bondhu/calculator")({
  component: CalculatorPage,
  head: () => ({ meta: [{ title: "সার ক্যালকুলেটর — কৃষিবন্ধু" }] }),
});

// kg per শতাংশ (decimal) — approximate BARI/DAE recommendations
// 1 শতাংশ = 40.46 m² ; 1 একর = 100 শতাংশ
const CROPS: Record<string, { urea: number; tsp: number; mop: number; label: string }> = {
  "বোরো ধান":   { urea: 2.4, tsp: 1.2, mop: 1.4, label: "বোরো ধান" },
  "আমন ধান":    { urea: 1.6, tsp: 0.8, mop: 1.0, label: "আমন ধান" },
  "আউশ ধান":    { urea: 1.8, tsp: 1.0, mop: 1.1, label: "আউশ ধান" },
  "গম":         { urea: 2.0, tsp: 1.4, mop: 1.2, label: "গম" },
  "ভুট্টা":     { urea: 3.0, tsp: 1.6, mop: 1.5, label: "ভুট্টা" },
  "আলু":        { urea: 3.4, tsp: 2.0, mop: 2.6, label: "আলু" },
  "টমেটো":      { urea: 2.8, tsp: 2.4, mop: 2.0, label: "টমেটো" },
  "পেঁয়াজ":    { urea: 2.4, tsp: 1.8, mop: 1.8, label: "পেঁয়াজ" },
  "সরিষা":      { urea: 1.6, tsp: 1.2, mop: 0.8, label: "সরিষা" },
  "পাট":        { urea: 1.8, tsp: 0.6, mop: 0.8, label: "পাট" },
};

function bnNum(n: number) {
  return n.toLocaleString("bn-BD", { maximumFractionDigits: 1 });
}

function CalculatorPage() {
  const navigate = useNavigate();
  const [crop, setCrop] = useState("বোরো ধান");
  const [unit, setUnit] = useState<"shotok" | "bigha" | "acre">("shotok");
  const [amount, setAmount] = useState("10");

  const shotok = useMemo(() => {
    const a = parseFloat(amount) || 0;
    if (unit === "shotok") return a;
    if (unit === "bigha") return a * 33;     // 1 বিঘা ≈ 33 শতাংশ
    return a * 100;                          // 1 একর = 100 শতাংশ
  }, [amount, unit]);

  const dose = CROPS[crop];
  const urea = dose.urea * shotok;
  const tsp = dose.tsp * shotok;
  const mop = dose.mop * shotok;

  return (
    <main className="min-h-screen bg-[#F0FFF4] md:max-w-[560px] md:mx-auto pb-8">
      <header className="px-5 pt-8 pb-8 rounded-b-3xl text-white" style={{ background: "var(--gradient-brand)" }}>
        <button onClick={() => navigate({ to: "/ai-bondhu" })} className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="mt-4 text-2xl font-bold">সার ক্যালকুলেটর</h1>
        <p className="text-sm text-white/85 mt-1">জমির পরিমাণ অনুযায়ী সঠিক সারের মাত্রা</p>
      </header>

      <section className="px-4 -mt-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600">ফসল</label>
            <select value={crop} onChange={(e) => setCrop(e.target.value)} className="mt-1 w-full h-11 px-3 rounded-xl bg-gray-100 text-sm">
              {Object.keys(CROPS).map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600">জমির পরিমাণ</label>
            <div className="mt-1 flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 h-11 px-3 rounded-xl bg-gray-100 text-sm"
              />
              <select value={unit} onChange={(e) => setUnit(e.target.value as "shotok" | "bigha" | "acre")} className="h-11 px-3 rounded-xl bg-gray-100 text-sm">
                <option value="shotok">শতাংশ</option>
                <option value="bigha">বিঘা</option>
                <option value="acre">একর</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="h-5 w-5 text-blue-700" />
            <h2 className="font-bold text-gray-900">প্রয়োজনীয় সার ({bnNum(shotok)} শতাংশের জন্য)</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="ইউরিয়া" value={`${bnNum(urea)} কেজি`} color="bg-emerald-50 text-emerald-700" />
            <Stat label="টিএসপি" value={`${bnNum(tsp)} কেজি`} color="bg-orange-50 text-orange-700" />
            <Stat label="এমওপি" value={`${bnNum(mop)} কেজি`} color="bg-purple-50 text-purple-700" />
          </div>
          <p className="mt-4 text-[11px] text-gray-500 leading-relaxed">
            * উপস্থাপিত মাত্রা DAE/BARI সুপারিশ অনুযায়ী আনুমানিক। মাটির গুণাগুণ পরীক্ষা করে স্থানীয় কৃষি অফিসারের পরামর্শ নিন।
          </p>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`rounded-xl p-3 text-center ${color}`}>
      <p className="text-[11px] font-semibold opacity-80">{label}</p>
      <p className="text-base font-bold mt-1">{value}</p>
    </div>
  );
}
