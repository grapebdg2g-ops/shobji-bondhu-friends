import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ArrowLeft, Search, AlertTriangle, Leaf, FlaskConical, ShieldAlert, ChevronRight } from "lucide-react";
import { PESTICIDE_GUIDE, type Problem } from "@/data/pesticide-guide";

export const Route = createFileRoute("/ai-bondhu/pesticide")({
  component: PesticidePage,
  head: () => ({ meta: [{ title: "কীটনাশক গাইড — কৃষিবন্ধু" }] }),
});

function PesticidePage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"insect" | "disease">("insect");
  const [selected, setSelected] = useState<Problem | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return PESTICIDE_GUIDE.filter((p) => p.type === tab).filter((p) =>
      !s
        ? true
        : p.name.toLowerCase().includes(s) ||
          p.crops.toLowerCase().includes(s) ||
          p.symptoms.toLowerCase().includes(s),
    );
  }, [q, tab]);

  if (selected) {
    return <SolutionDetail problem={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <main className="min-h-screen bg-[#F0FFF4] md:max-w-[560px] md:mx-auto pb-8">
      <header className="px-5 pt-8 pb-8 rounded-b-3xl text-white" style={{ background: "var(--gradient-brand)" }}>
        <button
          onClick={() => navigate({ to: "/ai-bondhu" })}
          className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="mt-4 text-2xl font-bold">কীটনাশক গাইড</h1>
        <p className="text-sm text-white/85 mt-1">পোকা ও রোগ অনুযায়ী নিরাপদ সমাধান</p>
      </header>

      <div className="px-4 -mt-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[12px] text-amber-900 leading-relaxed">
            <p className="font-bold">কীটনাশক ব্যবহারে সতর্ক থাকুন</p>
            <p>লেবেলের নির্দেশিকা মেনে চলুন। অতিরিক্ত মাত্রা ক্ষতিকর।</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-3">
        <div className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-400 ml-1" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="পোকা বা রোগ লিখুন..."
            className="flex-1 h-9 outline-none text-sm bg-transparent"
          />
        </div>
      </div>

      <div className="px-4 mt-3">
        <div className="bg-white rounded-2xl p-1 flex shadow-sm">
          {(["insect", "disease"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 h-10 rounded-xl text-sm font-bold transition-colors ${
                tab === t ? "bg-green-600 text-white" : "text-gray-600"
              }`}
            >
              {t === "insect" ? "🐛 পোকামাকড়" : "🦠 রোগবালাই"}
            </button>
          ))}
        </div>
      </div>

      <section className="px-4 mt-4 space-y-3">
        {filtered.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            className="w-full text-left bg-white rounded-2xl p-4 border border-gray-100 active:scale-[0.99] transition-transform"
          >
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-xl bg-green-50 flex items-center justify-center shrink-0 text-2xl">
                {p.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900">{p.name}</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">ফসল: {p.crops}</p>
                <p className="text-[12px] text-gray-700 mt-1 line-clamp-2">
                  <span className="text-gray-500">লক্ষণ: </span>
                  {p.symptoms}
                </p>
                <div className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-green-700">
                  সমাধান দেখুন <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-8">কোনো ফলাফল পাওয়া যায়নি</p>
        )}
      </section>
    </main>
  );
}

function SolutionDetail({ problem, onBack }: { problem: Problem; onBack: () => void }) {
  return (
    <main className="min-h-screen bg-[#F0FFF4] md:max-w-[560px] md:mx-auto pb-10">
      <header className="px-5 pt-8 pb-8 rounded-b-3xl text-white" style={{ background: "var(--gradient-brand)" }}>
        <button onClick={onBack} className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="mt-4 flex items-center gap-3">
          <div className="text-4xl">{problem.emoji}</div>
          <div>
            <h1 className="text-2xl font-bold">{problem.name}</h1>
            <p className="text-sm text-white/85">ফসল: {problem.crops}</p>
          </div>
        </div>
      </header>

      <section className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">লক্ষণ</p>
          <p className="text-sm text-gray-800">{problem.symptoms}</p>
        </div>
      </section>

      <section className="px-4 mt-4">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Leaf className="h-5 w-5 text-green-700" />
            <h2 className="font-bold text-green-900">জৈব পদ্ধতি (আগে চেষ্টা করুন)</h2>
          </div>
          <ul className="space-y-2">
            {problem.organic.map((o, i) => (
              <li key={i} className="flex gap-2 text-sm text-green-900">
                <span>✅</span>
                <span className="flex-1">{o}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="h-5 w-5 text-amber-600" />
            <h2 className="font-bold text-gray-900">রাসায়নিক (শেষ উপায়)</h2>
          </div>
          <div className="space-y-3">
            {problem.chemicals.map((c, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                <p className="font-bold text-sm text-gray-900">💊 {c.name}</p>
                <div className="mt-1.5 grid grid-cols-2 gap-2 text-[12px]">
                  <div>
                    <p className="text-gray-500">মাত্রা</p>
                    <p className="text-gray-800 font-medium">{c.dose}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">প্রয়োগ</p>
                    <p className="text-gray-800 font-medium">{c.method}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 mt-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <h2 className="font-bold text-red-900">নিরাপত্তা সতর্কতা</h2>
          </div>
          <ul className="space-y-1.5 text-sm text-red-900">
            <li>🧤 সুরক্ষা সরঞ্জাম (মাস্ক, গ্লাভস) পরুন</li>
            <li>🚫 ফুল/ফল আসার পর সরাসরি স্প্রে করবেন না</li>
            <li>⏰ ফসল তোলার {problem.phi ?? "১৪ দিন"} আগে স্প্রে বন্ধ করুন</li>
            <li>💧 ব্যবহারের পর হাত-মুখ ভালো করে ধুয়ে নিন</li>
            <li>👶 শিশু ও পশু থেকে দূরে রাখুন</li>
          </ul>
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed px-1 pt-3">
          * তথ্যসূত্র: কৃষি সম্প্রসারণ অধিদপ্তর (DAE) অনুমোদিত তালিকা। ব্যবহারের পূর্বে স্থানীয় কৃষি কর্মকর্তার পরামর্শ নিন।
        </p>
      </section>
    </main>
  );
}
