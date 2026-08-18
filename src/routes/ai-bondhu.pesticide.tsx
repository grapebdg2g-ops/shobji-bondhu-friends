import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Search,
  AlertTriangle,
  Leaf,
  FlaskConical,
  ShieldAlert,
  ChevronRight,
  CheckCircle2,
  ImagePlus,
  Share2,
} from "lucide-react";
import { PESTICIDE_GUIDE, type Problem } from "@/data/pesticide-guide";

export const Route = createFileRoute("/ai-bondhu/pesticide")({
  component: PesticidePage,
  head: () => ({ meta: [{ title: "কীটনাশক গাইড — কৃষিবন্ধু" }] }),
});

const CROP_FILTERS = ["সব ফসল", "ধান", "টমেটো", "বেগুন", "আলু", "শসা", "লাউ"];

type Severity = "low" | "medium" | "high";
const SEVERITY_LABEL: Record<Severity, string> = {
  low: "হালকা",
  medium: "মাঝারি",
  high: "বেশি",
};

function PesticidePage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"insect" | "disease">("insect");
  const [cropFilter, setCropFilter] = useState("সব ফসল");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [photoName, setPhotoName] = useState("");
  const [selected, setSelected] = useState<Problem | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return PESTICIDE_GUIDE.filter((p) => p.type === tab)
      .filter((p) => cropFilter === "সব ফসল" || p.crops.includes(cropFilter))
      .filter((p) =>
        !s
          ? true
          : p.name.toLowerCase().includes(s) ||
            p.crops.toLowerCase().includes(s) ||
            p.symptoms.toLowerCase().includes(s),
      );
  }, [q, tab, cropFilter]);

  if (selected) {
    return (
      <SolutionDetail
        problem={selected}
        severity={severity}
        photoName={photoName}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#F0FFF4] md:max-w-[560px] md:mx-auto pb-8">
      <header
        className="px-5 pt-8 pb-8 rounded-b-3xl text-white"
        style={{ background: "var(--gradient-brand)" }}
      >
        <button
          onClick={() => navigate({ to: "/ai-bondhu" })}
          className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="mt-4 text-2xl font-bold">কীটনাশক গাইড</h1>
        <p className="text-sm text-white/85 mt-1">
          ফসল, লক্ষণ ও আক্রান্তির মাত্রা মিলিয়ে নিরাপদ সমাধান
        </p>
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

      <div className="px-4 mt-3 space-y-3">
        <div className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-400 ml-1" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="পোকা, রোগ বা লক্ষণ লিখুন..."
            className="flex-1 h-9 outline-none text-sm bg-transparent"
            aria-label="পোকা, রোগ বা লক্ষণ খুঁজুন"
          />
        </div>
        <div
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
          role="tablist"
          aria-label="ফসল বাছাই"
        >
          {CROP_FILTERS.map((crop) => (
            <button
              key={crop}
              type="button"
              onClick={() => setCropFilter(crop)}
              className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold transition ${cropFilter === crop ? "bg-emerald-700 text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200"}`}
            >
              {crop}
            </button>
          ))}
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-emerald-950">আক্রান্তির মাত্রা</p>
              <p className="mt-0.5 text-[11px] text-emerald-800">
                সমাধান খুললে এই তথ্যটি সঙ্গে থাকবে
              </p>
            </div>
            <div className="flex gap-1.5">
              {(Object.keys(SEVERITY_LABEL) as Severity[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSeverity(level)}
                  className={`rounded-full px-2.5 py-1.5 text-[11px] font-bold ${severity === level ? "bg-emerald-700 text-white" : "bg-white text-emerald-800"}`}
                >
                  {SEVERITY_LABEL[level]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-emerald-300 bg-white p-3 shadow-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <ImagePlus className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-gray-900">
              পাতার বা পোকার ছবি যোগ করুন{" "}
              <span className="font-normal text-gray-500">(ঐচ্ছিক)</span>
            </span>
            <span className="mt-0.5 block truncate text-[11px] text-gray-500">
              {photoName || "ছবি দেখে স্থানীয় কৃষি কর্মকর্তার সঙ্গে যাচাই করুন"}
            </span>
          </span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => setPhotoName(e.target.files?.[0]?.name ?? "")}
          />
        </label>
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
          <div className="rounded-2xl bg-white px-5 py-8 text-center shadow-sm">
            <p className="text-sm font-bold text-gray-800">মিল পাওয়া যায়নি</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              ফসলের filter পরিবর্তন করুন বা লক্ষণ দিয়ে আবার খুঁজুন। গুরুতর হলে নিকটস্থ কৃষি
              কর্মকর্তার পরামর্শ নিন।
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function SolutionDetail({
  problem,
  severity,
  photoName,
  onBack,
}: {
  problem: Problem;
  severity: Severity;
  photoName: string;
  onBack: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#F0FFF4] md:max-w-[560px] md:mx-auto pb-10">
      <header
        className="px-5 pt-8 pb-8 rounded-b-3xl text-white"
        style={{ background: "var(--gradient-brand)" }}
      >
        <button
          onClick={onBack}
          className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="mt-4 flex items-center gap-3">
          <div className="text-4xl">{problem.emoji}</div>
          <div>
            <h1 className="text-2xl font-bold">{problem.name}</h1>
            <p className="text-sm text-white/85">ফসল: {problem.crops}</p>
            <span className="mt-2 inline-flex rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white">
              আক্রান্তি: {SEVERITY_LABEL[severity]}
            </span>
          </div>
        </div>
      </header>

      <section className="px-4 mt-4 space-y-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            <p className="text-xs font-bold text-gray-500">সম্ভাব্য সমস্যা</p>
          </div>
          <p className="text-sm leading-relaxed text-gray-800">{problem.symptoms}</p>
          {photoName && (
            <p className="mt-2 truncate text-[11px] text-emerald-700">
              ছবি যোগ করা হয়েছে: {photoName}
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <p className="text-xs font-bold text-sky-900">৩ ধাপের নিরাপদ পদ্ধতি</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-sky-900">
            <span className="rounded-xl bg-white/80 px-2 py-2">১. সমস্যা মিলান</span>
            <span className="rounded-xl bg-white/80 px-2 py-2">২. জৈব পদ্ধতি</span>
            <span className="rounded-xl bg-white/80 px-2 py-2">৩. লেবেল মেনে চলুন</span>
          </div>
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
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            নিচের তথ্যটি সাধারণ গাইড। পণ্যের formulation, registration ও label অনুযায়ী dose এবং
            ব্যবহার পদ্ধতি অবশ্যই যাচাই করুন।
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
            <li>🐝 ফুলে মৌমাছি থাকলে এবং বাতাস বেশি হলে স্প্রে এড়িয়ে চলুন</li>
            <li>
              ⏰ ফসল তোলার অন্তত {problem.phi ?? "১৪ দিন"} আগে স্প্রে বন্ধ রাখুন; label-এর PHI
              অগ্রাধিকার দিন
            </li>
            <li>💧 ব্যবহারের পর হাত-মুখ ভালো করে ধুয়ে নিন এবং পাত্র নিরাপদে নষ্ট করুন</li>
            <li>👶 শিশু ও পশু থেকে দূরে রাখুন</li>
          </ul>
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed px-1 pt-3">
          * তথ্যসূত্র: কৃষি সম্প্রসারণ অধিদপ্তর (DAE) অনুমোদিত তালিকা। ব্যবহারের পূর্বে স্থানীয়
          কৃষি কর্মকর্তার পরামর্শ নিন।
        </p>
      </section>

      <div className="px-4 mt-4 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={async () => {
            const text = `${problem.name} — ${problem.crops}\nলক্ষণ: ${problem.symptoms}\nআক্রান্তি: ${SEVERITY_LABEL[severity]}\n\nকৃষিবন্ধু কীটনাশক গাইড`;
            if (navigator.share) {
              try {
                await navigator.share({ title: problem.name, text });
              } catch {
                /* cancelled */
              }
            } else {
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
            }
          }}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-800 active:bg-gray-50"
        >
          <Share2 className="h-4 w-4" /> শেয়ার
        </button>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 text-sm font-bold text-white active:bg-emerald-800"
        >
          অন্য সমস্যা দেখুন <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </main>
  );
}
