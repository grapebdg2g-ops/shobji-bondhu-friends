import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, ChevronRight } from "lucide-react";
import { FARMING_STAGES } from "@/data/farming-guide";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/user-context";
import { toBn } from "@/lib/bn";
import { daysSince } from "@/lib/bn-date";

export const Route = createFileRoute("/crop-guide/")({
  component: CropGuideIndex,
  head: () => ({
    meta: [
      { title: "ফসল পরামর্শ — কৃষিবন্ধু" },
      { name: "description", content: "রোপণ থেকে বিক্রি পর্যন্ত সম্পূর্ণ ফসল চাষ গাইড।" },
    ],
  }),
});

type Plan = {
  id: string;
  crop_type: string;
  planting_date: string;
  is_active: boolean;
  created_at: string;
};

function CropGuideIndex() {
  const navigate = useNavigate();
  const { user, loading } = useUser();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("user_crop_plans" as never)
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setPlans((data as Plan[]) ?? []);
      setLoadingPlans(false);
    })();
  }, [loading, user, navigate]);

  const crops = Object.keys(FARMING_STAGES);

  return (
    <main className="min-h-screen bg-[#F0FFF4] pb-24 md:max-w-[560px] md:mx-auto">
      <header className="px-5 pt-8 pb-6 rounded-b-3xl text-white" style={{ background: "var(--gradient-brand)" }}>
        <div className="flex items-center gap-3 mb-4">
          <Link to="/dashboard" aria-label="ফিরে যান" className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>
        <h1 className="text-2xl font-bold">ফসল পরামর্শ</h1>
        <p className="mt-1 text-sm text-white/85">রোপণ থেকে বিক্রি পর্যন্ত সম্পূর্ণ গাইড</p>
      </header>

      {/* My active plans */}
      {!loadingPlans && plans.length > 0 && (
        <section className="px-5 mt-5">
          <h2 className="text-lg font-bold text-gray-900 mb-3">আমার ফসল</h2>
          <div className="space-y-3">
            {plans.map((p) => {
              const guide = FARMING_STAGES[p.crop_type];
              if (!guide) return null;
              const days = Math.max(0, daysSince(p.planting_date));
              const pct = Math.min(100, Math.round((days / guide.totalDays) * 100));
              const currentStage = guide.stages.find((s) => days >= s.startDay && days < s.endDay) ?? guide.stages[guide.stages.length - 1];
              return (
                <Link
                  key={p.id}
                  to="/crop-guide/plan/$planId"
                  params={{ planId: p.id }}
                  className="block bg-white rounded-2xl p-4 shadow-sm ring-1 ring-emerald-100 active:scale-[0.99] transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{guide.icon}</span>
                      <span className="font-bold text-gray-900">{p.crop_type}</span>
                    </div>
                    <span className="text-xs text-gray-500">{toBn(days)} দিন হয়েছে</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{currentStage.icon} {currentStage.name}</p>
                  <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">{toBn(pct)}%</span>
                    <span className="text-emerald-600 text-sm font-semibold inline-flex items-center gap-1">দেখুন <ChevronRight className="h-4 w-4" /></span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Crop selector */}
      <section className="px-5 mt-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          {plans.length > 0 ? "নতুন ফসল যোগ করুন" : "ফসল নির্বাচন করুন"}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {crops.map((crop) => {
            const g = FARMING_STAGES[crop];
            return (
              <Link
                key={crop}
                to="/crop-guide/new/$crop"
                params={{ crop }}
                className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100 flex flex-col items-center text-center active:scale-95 transition"
              >
                <span className="text-4xl mb-2">{g.icon}</span>
                <span className="font-bold text-gray-900 text-sm">{crop}</span>
                <span className="text-[11px] text-gray-500 mt-1 line-clamp-1">{g.season}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {plans.length > 0 && (
        <div className="px-5 mt-6">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="w-full py-3 rounded-xl border-2 border-dashed border-emerald-300 text-emerald-700 font-semibold inline-flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" /> নতুন ফসল যোগ করুন
          </button>
        </div>
      )}
    </main>
  );
}
