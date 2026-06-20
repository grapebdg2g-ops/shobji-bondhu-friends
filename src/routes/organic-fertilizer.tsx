import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, ChevronRight } from "lucide-react";
import { ORGANIC_FERTILIZER_GUIDE, type OrganicFertilizerKey } from "@/data/organic-fertilizer-guide";

export const Route = createFileRoute("/organic-fertilizer")({
  component: OrganicFertilizerPage,
  head: () => ({
    meta: [
      { title: "জৈব সার প্রস্তুত প্রণালী — সবজি বন্ধু" },
      { name: "description", content: "গোবর, কম্পোস্ট, ভার্মি কম্পোস্ট, সবুজ সার ও জৈব বালাইনাশক তৈরির সম্পূর্ণ গাইড।" },
    ],
  }),
});

type Item = (typeof ORGANIC_FERTILIZER_GUIDE)[OrganicFertilizerKey];

const KEYS: OrganicFertilizerKey[] = ["goborSar", "compost", "vermicompost", "greenManure", "biopesticide"];

function OrganicFertilizerPage() {
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState<OrganicFertilizerKey | null>(null);

  const selected = selectedKey ? ORGANIC_FERTILIZER_GUIDE[selectedKey] : null;

  return (
    <main className="min-h-screen bg-[#F0FFF4] md:max-w-[560px] md:mx-auto pb-16">
      <header className="px-5 pt-8 pb-8 rounded-b-3xl" style={{ background: "var(--gradient-brand)" }}>
        <button
          onClick={() => (selected ? setSelectedKey(null) : navigate({ to: "/dashboard" }))}
          className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center text-white"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="mt-4 text-2xl font-bold text-white">
          {selected ? selected.name : "জৈব সার গাইড"}
        </h1>
        <p className="text-sm text-white/85 mt-1">
          {selected ? selected.shortDesc : "ঘরে বসেই তৈরি করুন প্রাকৃতিক সার ও বালাইনাশক"}
        </p>
      </header>

      {!selected ? (
        <ListView onPick={setSelectedKey} />
      ) : (
        <DetailView item={selected} />
      )}
    </main>
  );
}

function ListView({ onPick }: { onPick: (k: OrganicFertilizerKey) => void }) {
  return (
    <section className="px-4 -mt-4 space-y-3">
      {KEYS.map((k) => {
        const it = ORGANIC_FERTILIZER_GUIDE[k];
        return (
          <button
            key={k}
            onClick={() => onPick(k)}
            className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
          >
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{ background: it.bgColor }}
            >
              {it.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-900">{it.name}</div>
              <div className="text-xs text-gray-600 mt-0.5 line-clamp-2">{it.shortDesc}</div>
              {"totalTime" in it && (
                <div className="flex gap-2 mt-1.5">
                  <Chip>{(it as any).totalTime}</Chip>
                  <Chip>{(it as any).difficulty}</Chip>
                </div>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 shrink-0" />
          </button>
        );
      })}
    </section>
  );
}

function DetailView({ item }: { item: Item }) {
  const anyItem = item as any;
  return (
    <section className="px-4 -mt-4 space-y-4">
      {/* Quick facts */}
      {(anyItem.totalTime || anyItem.difficulty || anyItem.cost) && (
        <div className="grid grid-cols-3 gap-2">
          {anyItem.totalTime && <Fact label="সময়" value={anyItem.totalTime} />}
          {anyItem.difficulty && <Fact label="কঠিনতা" value={anyItem.difficulty} />}
          {anyItem.cost && <Fact label="খরচ" value={anyItem.cost} />}
        </div>
      )}

      {/* Benefits */}
      {anyItem.benefits && (
        <Card title="✨ উপকারিতা">
          <ul className="space-y-2">
            {anyItem.benefits.map((b: string) => (
              <li key={b} className="flex gap-2 text-sm text-gray-800">
                <span className="text-emerald-600">✅</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Nutrient content */}
      {anyItem.nutrientContent && (
        <Card title="🧪 পুষ্টি উপাদান">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(anyItem.nutrientContent).map(([k, v]) => (
              <div key={k} className="bg-gray-50 rounded-xl p-2.5">
                <div className="text-[11px] text-gray-500 uppercase">{k}</div>
                <div className="font-bold text-gray-900">{String(v)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Materials */}
      {anyItem.materials && (
        <Card title="📋 উপকরণ">
          <ul className="divide-y divide-gray-100">
            {anyItem.materials.map((m: { name: string; amount: string }) => (
              <li key={m.name} className="py-2 flex justify-between text-sm">
                <span className="text-gray-800">{m.name}</span>
                <span className="font-semibold text-gray-900">{m.amount}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Preparation steps */}
      {anyItem.preparationSteps && (
        <Card title="📝 প্রস্তুত প্রণালী">
          <ol className="space-y-3">
            {anyItem.preparationSteps.map((s: any) => (
              <li key={s.step} className="flex gap-3">
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-white shrink-0"
                  style={{ background: item.color }}
                >
                  {s.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{s.icon}</span>
                    <div className="font-semibold text-gray-900">{s.title}</div>
                  </div>
                  <p className="text-sm text-gray-700 mt-1 leading-relaxed">{s.desc}</p>
                  {s.duration && (
                    <div className="text-[11px] text-gray-500 mt-1">⏱ {s.duration}</div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* Application rates */}
      {anyItem.applicationRates && (
        <Card title="📏 প্রয়োগ মাত্রা">
          <ul className="divide-y divide-gray-100">
            {Object.entries(anyItem.applicationRates).map(([crop, info]: any) => (
              <li key={crop} className="py-2 flex justify-between text-sm">
                <span className="text-gray-800">{crop}</span>
                <span className="font-semibold text-gray-900">
                  {info.amount} {info.unit}
                </span>
              </li>
            ))}
          </ul>
          {anyItem.applicationTime && (
            <div className="mt-3 text-xs text-gray-600 bg-amber-50 rounded-lg px-3 py-2">
              ⏰ <strong>সময়:</strong> {anyItem.applicationTime}
            </div>
          )}
        </Card>
      )}

      {/* Recipes (biopesticide) */}
      {anyItem.recipes && (
        <Recipes recipes={anyItem.recipes} color={item.color} />
      )}

      {/* Tips */}
      {anyItem.tips && (
        <Card title="💡 পরামর্শ">
          <ul className="space-y-2">
            {anyItem.tips.map((t: string) => (
              <li key={t} className="text-sm text-gray-800 leading-relaxed">{t}</li>
            ))}
          </ul>
        </Card>
      )}

      {anyItem.generalTips && (
        <Card title="💡 সাধারণ নিয়ম">
          <ul className="space-y-2">
            {anyItem.generalTips.map((t: string) => (
              <li key={t} className="text-sm text-gray-800 leading-relaxed">{t}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Nitrogen provided (green manure) */}
      {anyItem.nitrogenProvided && (
        <Card title="🌱 নাইট্রোজেন সরবরাহ">
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-emerald-50 rounded-xl p-3">
              <div className="text-xs text-emerald-700">প্রতি বিঘায়</div>
              <div className="font-bold text-emerald-900">{anyItem.nitrogenProvided.perBigha}</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-3">
              <div className="text-xs text-amber-700">ইউরিয়া সাশ্রয়</div>
              <div className="font-bold text-amber-900">{anyItem.nitrogenProvided.equivalentUrea}</div>
            </div>
          </div>
        </Card>
      )}

      {anyItem.suitableCrops && (
        <Card title="🌾 উপযুক্ত ফসল">
          <ul className="space-y-1.5">
            {anyItem.suitableCrops.map((c: string) => (
              <li key={c} className="text-sm text-gray-800">• {c}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Business potential */}
      {anyItem.businessPotential && (
        <Card title="💰 ব্যবসায়িক সম্ভাবনা">
          <div className="space-y-2 text-sm">
            <Row k="মাসিক উৎপাদন" v={anyItem.businessPotential.productionPerMonth} />
            <Row k="বিক্রয় মূল্য" v={anyItem.businessPotential.sellingPrice} />
            <Row k="মাসিক আয়" v={anyItem.businessPotential.monthlyIncome} />
          </div>
          <p className="mt-3 text-xs text-emerald-800 bg-emerald-50 rounded-lg px-3 py-2">
            {anyItem.businessPotential.note}
          </p>
        </Card>
      )}

      {/* Video links */}
      {anyItem.videoLinks && (
        <Card title="🎥 ভিডিও ও রেফারেন্স">
          <ul className="space-y-2">
            {anyItem.videoLinks.map((v: any) => (
              <li key={v.url}>
                <a
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50"
                >
                  <ExternalLink className="h-4 w-4 mt-0.5 text-blue-600 shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{v.title}</div>
                    <div className="text-[11px] text-gray-500">
                      {v.source}{v.duration ? ` • ${v.duration}` : ""}
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}

function Recipes({ recipes, color }: { recipes: any[]; color: string }) {
  const [open, setOpen] = useState<string | null>(recipes[0]?.name ?? null);
  return (
    <div className="space-y-3">
      {recipes.map((r) => {
        const isOpen = open === r.name;
        return (
          <div key={r.name} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => setOpen(isOpen ? null : r.name)}
              className="w-full p-4 flex items-center gap-3 text-left"
            >
              <span className="text-2xl">{r.icon}</span>
              <div className="flex-1">
                <div className="font-bold text-gray-900">{r.name}</div>
                <div className="text-xs text-gray-500">{r.effectiveness}</div>
              </div>
              <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`} />
            </button>
            {isOpen && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1">উপকরণ</div>
                  <ul className="space-y-1">
                    {r.ingredients.map((i: string) => (
                      <li key={i} className="text-sm text-gray-800">• {i}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1">পদ্ধতি</div>
                  <ol className="space-y-1.5">
                    {r.steps.map((s: string, i: number) => (
                      <li key={s} className="flex gap-2 text-sm text-gray-800">
                        <span
                          className="h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                          style={{ background: color }}
                        >
                          {i + 1}
                        </span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1">টার্গেট পোকা</div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.targetPests.map((p: string) => (
                      <span key={p} className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                {r.caution && (
                  <div className="text-xs text-amber-900 bg-amber-50 rounded-lg px-3 py-2">
                    ⚠️ {r.caution}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <h3 className="font-bold text-gray-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-2.5 text-center">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="text-xs font-bold text-gray-900 mt-0.5 leading-tight">{value}</div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
      {children}
    </span>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{k}</span>
      <span className="font-semibold text-gray-900">{v}</span>
    </div>
  );
}

// Keep useMemo import used (avoid unused) — referenced for potential future memoization
void useMemo;
