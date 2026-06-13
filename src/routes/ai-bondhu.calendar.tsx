import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Sprout } from "lucide-react";

export const Route = createFileRoute("/ai-bondhu/calendar")({
  component: CalendarPage,
  head: () => ({ meta: [{ title: "চাষের ক্যালেন্ডার — কৃষিবন্ধু" }] }),
});

const MONTHS = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
];

// month index (0-11) → crops to plant
const CROPS_BY_MONTH: Record<number, { name: string; season: string; duration: string }[]> = {
  0: [{ name: "আলু", season: "রবি", duration: "৯০-১০০ দিন" }, { name: "টমেটো", season: "রবি", duration: "১২০ দিন" }, { name: "ফুলকপি", season: "রবি", duration: "৮০ দিন" }],
  1: [{ name: "মুগ ডাল", season: "খরিফ-১", duration: "৭০ দিন" }, { name: "তিল", season: "খরিফ-১", duration: "৯০ দিন" }, { name: "ভুট্টা", season: "রবি", duration: "১১০ দিন" }],
  2: [{ name: "পাট", season: "খরিফ", duration: "১২০ দিন" }, { name: "আউশ ধান", season: "খরিফ-১", duration: "১১০ দিন" }, { name: "মরিচ", season: "খরিফ", duration: "১৫০ দিন" }],
  3: [{ name: "আউশ ধান", season: "খরিফ-১", duration: "১১০ দিন" }, { name: "পাট", season: "খরিফ", duration: "১২০ দিন" }, { name: "শসা", season: "গ্রীষ্ম", duration: "৬০ দিন" }],
  4: [{ name: "আমন ধান (বীজতলা)", season: "খরিফ-২", duration: "১৩০ দিন" }, { name: "করলা", season: "গ্রীষ্ম", duration: "৭০ দিন" }, { name: "ঢেঁড়স", season: "গ্রীষ্ম", duration: "৫৫ দিন" }],
  5: [{ name: "আমন ধান (রোপণ)", season: "খরিফ-২", duration: "১৩০ দিন" }, { name: "পটল", season: "গ্রীষ্ম", duration: "১২০ দিন" }, { name: "চিচিঙ্গা", season: "গ্রীষ্ম", duration: "৭০ দিন" }],
  6: [{ name: "আমন ধান (রোপণ)", season: "খরিফ-২", duration: "১৩০ দিন" }, { name: "বরবটি", season: "খরিফ", duration: "৬৫ দিন" }],
  7: [{ name: "ফুলকপি (বীজতলা)", season: "রবি", duration: "৮০ দিন" }, { name: "বাঁধাকপি (বীজতলা)", season: "রবি", duration: "৯০ দিন" }, { name: "মুলা", season: "রবি", duration: "৫০ দিন" }],
  8: [{ name: "ফুলকপি", season: "রবি", duration: "৮০ দিন" }, { name: "বাঁধাকপি", season: "রবি", duration: "৯০ দিন" }, { name: "টমেটো (বীজতলা)", season: "রবি", duration: "১২০ দিন" }],
  9: [{ name: "গম", season: "রবি", duration: "১১০ দিন" }, { name: "সরিষা", season: "রবি", duration: "৯০ দিন" }, { name: "মসুর", season: "রবি", duration: "১১০ দিন" }, { name: "আলু", season: "রবি", duration: "৯০ দিন" }],
  10: [{ name: "আলু", season: "রবি", duration: "৯০ দিন" }, { name: "ভুট্টা", season: "রবি", duration: "১১০ দিন" }, { name: "গম", season: "রবি", duration: "১১০ দিন" }, { name: "মটরশুঁটি", season: "রবি", duration: "৮০ দিন" }],
  11: [{ name: "বোরো ধান (বীজতলা)", season: "রবি", duration: "১৪০ দিন" }, { name: "পেঁয়াজ", season: "রবি", duration: "১২০ দিন" }, { name: "রসুন", season: "রবি", duration: "১৫০ দিন" }],
};

function CalendarPage() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(new Date().getMonth());
  const crops = CROPS_BY_MONTH[month] ?? [];

  return (
    <main className="min-h-screen bg-[#F0FFF4] md:max-w-[560px] md:mx-auto pb-8">
      <header className="px-5 pt-8 pb-8 rounded-b-3xl text-white" style={{ background: "var(--gradient-brand)" }}>
        <button onClick={() => navigate({ to: "/ai-bondhu" })} className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="mt-4 text-2xl font-bold">চাষের ক্যালেন্ডার</h1>
        <p className="text-sm text-white/85 mt-1">মাস অনুযায়ী বপনের উপযুক্ত ফসল</p>
      </header>

      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl p-3 shadow-sm flex gap-2 overflow-x-auto no-scrollbar">
          {MONTHS.map((m, i) => (
            <button
              key={i}
              onClick={() => setMonth(i)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition ${month === i ? "bg-[#2D6A4F] text-white" : "bg-gray-100 text-gray-700"}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <section className="px-4 mt-5 space-y-3">
        <h2 className="font-bold text-gray-900 px-1">{MONTHS[month]} মাসে যা লাগাবেন</h2>
        {crops.length === 0 ? (
          <p className="text-sm text-gray-500 px-1">এই মাসে কোনো সুপারিশ নেই।</p>
        ) : crops.map((c, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Sprout className="h-6 w-6 text-emerald-700" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">{c.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">মৌসুম: {c.season} • সময়: {c.duration}</p>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
