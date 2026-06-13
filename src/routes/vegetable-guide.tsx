import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ArrowLeft, Search, Leaf, X } from "lucide-react";

export const Route = createFileRoute("/vegetable-guide")({
  component: VegetableGuidePage,
  head: () => ({
    meta: [
      { title: "সবজি চাষ গাইড — কৃষিবন্ধু" },
      { name: "description", content: "জনপ্রিয় সবজির চাষ পদ্ধতি, মৌসুম ও যত্ন সম্পর্কে বিস্তারিত নির্দেশিকা।" },
    ],
  }),
});

type Veg = {
  name: string;
  season: string;
  emoji: string;
  duration: string;
  spacing: string;
  soil: string;
  irrigation: string;
  tips: string[];
};

const VEGS: Veg[] = [
  {
    name: "টমেটো", emoji: "🍅", season: "রবি (অক্টোবর–ফেব্রুয়ারি)",
    duration: "১১০–১২০ দিন", spacing: "৬০ × ৪৫ সেমি",
    soil: "বেলে-দোআঁশ, pH ৬–৭", irrigation: "৭–১০ দিন অন্তর",
    tips: ["চারা রোপণের ২০ দিন পর প্রথম সার", "ফুল আসার সময় বোরন স্প্রে", "মাচা বেঁধে দিলে ফলন বাড়ে"],
  },
  {
    name: "বেগুন", emoji: "🍆", season: "প্রায় সারা বছর",
    duration: "১৫০ দিন", spacing: "৭৫ × ৬০ সেমি",
    soil: "দোআঁশ মাটি, pH ৫.৫–৬.৫", irrigation: "১০ দিন অন্তর",
    tips: ["ফল ছিদ্রকারী পোকা থেকে সাবধান", "নিয়মিত পরিচর্যা ও আগাছা পরিষ্কার", "জৈব সার বেশি দিন"],
  },
  {
    name: "ফুলকপি", emoji: "🥦", season: "রবি (সেপ্টেম্বর–জানুয়ারি)",
    duration: "৮০–৯০ দিন", spacing: "৬০ × ৪৫ সেমি",
    soil: "দোআঁশ, পানি ধরে রাখে এমন", irrigation: "৭ দিন অন্তর",
    tips: ["ফুল আসার পর পাতা ভাঁজ করে ঢেকে দিন", "সাদা থাকার জন্য রোদ থেকে রক্ষা", "ছত্রাকনাশক স্প্রে প্রয়োজনে"],
  },
  {
    name: "বাঁধাকপি", emoji: "🥬", season: "রবি", duration: "৯০–১০০ দিন",
    spacing: "৬০ × ৪৫ সেমি", soil: "দোআঁশ, উর্বর", irrigation: "১০ দিন অন্তর",
    tips: ["পোকার আক্রমণে নিম তেল স্প্রে", "শক্ত মাথা না হওয়া পর্যন্ত পানি দিন"],
  },
  {
    name: "শসা", emoji: "🥒", season: "গ্রীষ্ম ও বর্ষা",
    duration: "৬০ দিন", spacing: "১.৫ × ০.৬ মিটার",
    soil: "বেলে-দোআঁশ", irrigation: "৫–৭ দিন অন্তর",
    tips: ["মাচায় চাষ করলে ভালো ফলন", "ফুল আসলে নিয়মিত পানি", "ছত্রাক প্রতিরোধে স্প্রে"],
  },
  {
    name: "মরিচ", emoji: "🌶️", season: "প্রায় সারা বছর",
    duration: "১৫০–১৮০ দিন", spacing: "৬০ × ৪৫ সেমি",
    soil: "দোআঁশ, ভালো নিকাশ", irrigation: "১০ দিন অন্তর",
    tips: ["চারা ২৫–৩০ দিনের হলে রোপণ", "ভাইরাস রোগে সাদা মাছি দমন জরুরি"],
  },
  {
    name: "লাউ", emoji: "🥥", season: "গ্রীষ্ম ও বর্ষা",
    duration: "৭০ দিন (ফল)", spacing: "২ × ২ মিটার",
    soil: "দোআঁশ, জৈব পদার্থ সমৃদ্ধ", irrigation: "৫ দিন অন্তর",
    tips: ["মাচা অবশ্যই দিন", "মূলে গোড়া পচা রোধে শুকনো রাখুন"],
  },
  {
    name: "ঢেঁড়স", emoji: "🌿", season: "গ্রীষ্ম",
    duration: "৫৫–৬০ দিন", spacing: "৪৫ × ৩০ সেমি",
    soil: "দোআঁশ", irrigation: "৭ দিন অন্তর",
    tips: ["প্রতি ২–৩ দিন অন্তর ফল তুলুন", "হলুদ পাতা দেখলে ইউরিয়া স্প্রে"],
  },
  {
    name: "আলু", emoji: "🥔", season: "রবি (নভেম্বর–জানুয়ারি)",
    duration: "৯০–১০০ দিন", spacing: "৬০ × ২৫ সেমি",
    soil: "বেলে-দোআঁশ, pH ৫.৫–৬.৫", irrigation: "১০–১২ দিন অন্তর",
    tips: ["লেট ব্লাইট রোগে ম্যানকোজেব স্প্রে", "মাটি চাপা দিয়ে গাছ ঢাকুন"],
  },
];

function VegetableGuidePage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [active, setActive] = useState<Veg | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return VEGS.filter((v) => !s || v.name.includes(q.trim()) || v.season.toLowerCase().includes(s));
  }, [q]);

  return (
    <main className="min-h-screen bg-[#F0FFF4] md:max-w-[560px] md:mx-auto pb-8">
      <header className="px-5 pt-8 pb-8 rounded-b-3xl text-white" style={{ background: "var(--gradient-brand)" }}>
        <button onClick={() => navigate({ to: "/dashboard" })} className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="mt-4 text-2xl font-bold">সবজি চাষ গাইড</h1>
        <p className="text-sm text-white/85 mt-1">জনপ্রিয় সবজির পূর্ণাঙ্গ চাষ পদ্ধতি</p>
      </header>

      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-400 ml-1" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="সবজি খুঁজুন..."
            className="flex-1 h-9 outline-none text-sm"
          />
        </div>
      </div>

      <section className="px-4 mt-4 grid grid-cols-2 gap-3">
        {filtered.map((v) => (
          <button
            key={v.name}
            onClick={() => setActive(v)}
            className="bg-white rounded-2xl p-4 border border-gray-100 text-left active:scale-[0.98] transition"
          >
            <div className="text-3xl mb-2">{v.emoji}</div>
            <h3 className="font-bold text-gray-900">{v.name}</h3>
            <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{v.season}</p>
          </button>
        ))}
      </section>

      {active && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setActive(null)}>
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{active.emoji}</span>
                <h2 className="text-lg font-bold">{active.name}</h2>
              </div>
              <button onClick={() => setActive(null)} className="h-9 w-9 rounded-full hover:bg-gray-100 flex items-center justify-center">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <Info label="মৌসুম" value={active.season} />
              <Info label="ফসলের সময়" value={active.duration} />
              <Info label="দূরত্ব" value={active.spacing} />
              <Info label="মাটি" value={active.soil} />
              <Info label="সেচ" value={active.irrigation} />
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1"><Leaf className="h-4 w-4 text-emerald-600" /> পরামর্শ</p>
                <ul className="space-y-1.5">
                  {active.tips.map((t, i) => (
                    <li key={i} className="flex gap-2 text-gray-800">
                      <span className="text-emerald-600">•</span><span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs text-gray-500 w-24 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800 flex-1">{value}</span>
    </div>
  );
}
