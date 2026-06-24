import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { VEGETABLES, CATEGORY_LABELS, type VegCategory } from "@/data/vegetable-guide";
import { CropAdvisoryWidget } from "@/components/krishi/crop-advisory-widget";

export const Route = createFileRoute("/vegetable-guide")({
  component: VegetableGuidePage,
  head: () => ({
    meta: [
      { title: "সবজি চাষ গাইড — কৃষিবন্ধু" },
      { name: "description", content: "জনপ্রিয় সবজির চাষ পদ্ধতি, মৌসুম ও যত্ন সম্পর্কে বিস্তারিত নির্দেশিকা।" },
    ],
  }),
});

type Filter = "all" | VegCategory;
const FILTERS: Filter[] = ["all", "winter", "summer", "all-year", "fruit", "root"];

function VegetableGuidePage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const s = q.trim();
    return VEGETABLES.filter((v) => {
      const matchQ = !s || v.name.includes(s) || v.season.includes(s);
      const matchF = filter === "all" || v.category.includes(filter);
      return matchQ && matchF;
    });
  }, [q, filter]);

  return (
    <main className="min-h-screen bg-[#F0FFF4] md:max-w-[560px] md:mx-auto pb-8">
      <header className="px-5 pt-8 pb-8 rounded-b-3xl text-white" style={{ background: "var(--gradient-brand)" }}>
        <button onClick={() => navigate({ to: "/dashboard" })} className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="mt-4 text-2xl font-bold">সবজি চাষ গাইড</h1>
        <p className="text-sm text-white/85 mt-1">২২+ সবজির পূর্ণাঙ্গ চাষ পদ্ধতি</p>
      </header>

      <CropAdvisoryWidget />

      <div className="px-4 mt-4">
        <Link
          to="/crop-guide"
          className="block bg-white rounded-2xl p-4 border border-emerald-200 active:scale-[0.99] transition"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">📋</span>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-sm">ফসল পরামর্শ</p>
              <p className="text-[11px] text-gray-500 mt-0.5">রোপণ থেকে বিক্রি পর্যন্ত সম্পূর্ণ গাইড</p>
            </div>
            <span className="text-emerald-600 text-sm font-semibold">দেখুন →</span>
          </div>
        </Link>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-400 ml-1" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="সবজি খুঁজুন..."
            className="flex-1 h-9 outline-none text-sm bg-transparent"
          />
        </div>
      </div>

      <div className="px-4 mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border transition ${
              filter === f
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            {CATEGORY_LABELS[f]}
          </button>
        ))}
      </div>

      <section className="px-4 mt-4 grid grid-cols-2 gap-3">
        {filtered.map((v) => (
          <Link
            key={v.slug}
            to="/vegetable-guide/$slug"
            params={{ slug: v.slug }}
            className="bg-white rounded-2xl p-4 border border-gray-100 active:scale-[0.98] transition block"
          >
            <div className="text-3xl mb-2">{v.emoji}</div>
            <h3 className="font-bold text-gray-900 text-base">{v.name}</h3>
            <p className="text-[11px] text-gray-500 mt-1">{v.season}</p>
            <p className="text-[11px] text-emerald-700 mt-1 font-semibold">ফলন: {v.yieldPerBigha}</p>
            <p className="text-[11px] text-emerald-600 mt-2 font-semibold">বিস্তারিত →</p>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center text-gray-500 py-12 text-sm">কোন সবজি পাওয়া যায়নি</div>
        )}
      </section>
    </main>
  );
}
