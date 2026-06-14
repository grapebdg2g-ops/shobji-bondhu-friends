import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { ArrowLeft, Leaf, Droplets, Bug, Sprout, Package, TrendingUp, Calculator, Stethoscope, BarChart3 } from "lucide-react";
import { getVegetableBySlug } from "@/data/vegetable-guide";

export const Route = createFileRoute("/vegetable-guide/$slug")({
  component: VegetableDetailPage,
  loader: ({ params }) => {
    const veg = getVegetableBySlug(params.slug);
    if (!veg) throw notFound();
    return { veg };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.veg.name ?? "সবজি"} চাষ গাইড — কৃষিবন্ধু` },
      { name: "description", content: loaderData?.veg.intro ?? "সবজি চাষ পদ্ধতি।" },
    ],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <p className="text-gray-700 mb-3">সবজি পাওয়া যায়নি</p>
        <Link to="/vegetable-guide" className="text-emerald-600 font-semibold">← গাইডে ফিরুন</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <p className="text-gray-700 mb-3">ত্রুটি: {error.message}</p>
        <button onClick={reset} className="text-emerald-600 font-semibold">পুনরায় চেষ্টা</button>
      </div>
    </div>
  ),
});

function VegetableDetailPage() {
  const { veg } = Route.useLoaderData();
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-[#F0FFF4] md:max-w-[560px] md:mx-auto pb-12">
      <header className="px-5 pt-8 pb-8 rounded-b-3xl text-white" style={{ background: "var(--gradient-brand)" }}>
        <button onClick={() => navigate({ to: "/vegetable-guide" })} className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-5xl">{veg.emoji}</span>
          <div>
            <h1 className="text-2xl font-bold">{veg.name}</h1>
            <p className="text-sm text-white/85 mt-0.5">{veg.season}</p>
          </div>
        </div>
        <div className="mt-3 inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">
          ফলন: {veg.yieldPerBigha} / বিঘা
        </div>
      </header>

      <div className="px-4 mt-4 space-y-3">
        <Section icon={<Leaf className="h-5 w-5 text-emerald-600" />} title="পরিচিতি ও পুষ্টিগুণ">
          <p className="text-gray-700 leading-relaxed">{veg.intro}</p>
          <div className="mt-2 bg-emerald-50 p-3 rounded-lg">
            <p className="text-xs font-semibold text-emerald-700 mb-1">পুষ্টিগুণ</p>
            <p className="text-sm text-gray-800">{veg.nutrition}</p>
          </div>
        </Section>

        <Section icon={<Sprout className="h-5 w-5 text-emerald-600" />} title="উপযুক্ত মৌসুম ও জলবায়ু">
          <Row label="মৌসুম" value={veg.season} />
          <Row label="জলবায়ু" value={veg.climate} />
        </Section>

        <Section icon={<Sprout className="h-5 w-5 text-emerald-600" />} title="জমি তৈরি ও বীজ বপন">
          <Row label="জমি তৈরি" value={veg.landPrep} />
          <Row label="বীজ বপন" value={veg.seedSowing} />
        </Section>

        <Section icon={<Leaf className="h-5 w-5 text-emerald-600" />} title="সার ব্যবস্থাপনা">
          <p className="text-sm text-gray-800">{veg.fertilizer}</p>
          <Link
            to="/ai-bondhu/calculator"
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-white bg-emerald-600 px-4 py-2 rounded-lg"
          >
            <Calculator className="h-4 w-4" /> সার ক্যালকুলেটর
          </Link>
        </Section>

        <Section icon={<Droplets className="h-5 w-5 text-blue-600" />} title="সেচ ব্যবস্থাপনা">
          <p className="text-sm text-gray-800">{veg.irrigation}</p>
        </Section>

        <Section icon={<Bug className="h-5 w-5 text-red-600" />} title="রোগ ও পোকা দমন">
          <div className="space-y-2">
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">পোকামাকড়</p>
              {veg.pests.map((p, i) => (
                <div key={i} className="bg-red-50 p-2 rounded mb-1.5">
                  <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-700 mt-0.5">{p.control}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">রোগ</p>
              {veg.diseases.map((d, i) => (
                <div key={i} className="bg-orange-50 p-2 rounded mb-1.5">
                  <p className="text-sm font-semibold text-gray-900">{d.name}</p>
                  <p className="text-xs text-gray-700 mt-0.5">{d.control}</p>
                </div>
              ))}
            </div>
          </div>
          <Link
            to="/disease-detection"
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-white bg-red-600 px-4 py-2 rounded-lg"
          >
            <Stethoscope className="h-4 w-4" /> রোগ শনাক্ত করুন
          </Link>
        </Section>

        <Section icon={<Package className="h-5 w-5 text-amber-600" />} title="ফসল সংগ্রহ ও সংরক্ষণ">
          <Row label="সংগ্রহ" value={veg.harvest} />
          <Row label="সংরক্ষণ" value={veg.storage} />
        </Section>

        <Section icon={<TrendingUp className="h-5 w-5 text-emerald-600" />} title="বাজার ও মূল্য">
          <p className="text-sm text-gray-800">{veg.marketTips}</p>
          <Link
            to="/prices"
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-white bg-emerald-600 px-4 py-2 rounded-lg"
          >
            <BarChart3 className="h-4 w-4" /> আজকের বাজার দর
          </Link>
        </Section>
      </div>
    </main>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h2 className="font-bold text-gray-900">{title}</h2>
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 mb-1.5">
      <span className="text-xs text-gray-500 w-20 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800 flex-1">{value}</span>
    </div>
  );
}
