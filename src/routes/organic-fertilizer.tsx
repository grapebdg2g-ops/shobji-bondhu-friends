import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Bell, Check, Loader2 } from "lucide-react";
import { useUser } from "@/contexts/user-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/organic-fertilizer")({
  component: OrganicFertilizerPage,
  head: () => ({
    meta: [
      { title: "জৈব সার প্রস্তুত প্রণালী — শীঘ্রই আসছে" },
      { name: "description", content: "জৈব সার তৈরির পদ্ধতি — গোবর, কম্পোস্ট, ভার্মি ও সবুজ সার।" },
    ],
  }),
});

const FEATURE = "organic_fertilizer";

const ITEMS = [
  "গোবর সার তৈরির পদ্ধতি",
  "কম্পোস্ট সার তৈরি",
  "ভার্মি কম্পোস্ট",
  "জৈব বালাইনাশক তৈরি",
  "সবুজ সার",
];

function OrganicFertilizerPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!user) { setChecking(false); return; }
      const { data } = await supabase
        .from("feature_waitlist")
        .select("id")
        .eq("user_id", user.id)
        .eq("feature", FEATURE)
        .maybeSingle();
      if (!cancel) {
        setSubscribed(!!data);
        setChecking(false);
      }
    })();
    return () => { cancel = true; };
  }, [user]);

  const subscribe = async () => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("feature_waitlist")
      .insert({ user_id: user.id, feature: FEATURE });
    setLoading(false);
    if (error && !error.message.includes("duplicate")) {
      toast.error("সমস্যা হয়েছে, আবার চেষ্টা করুন");
      return;
    }
    setSubscribed(true);
    toast.success("✅ আপডেট পাবেন!");
  };

  return (
    <main className="min-h-screen bg-[#F0FFF4] md:max-w-[560px] md:mx-auto">
      <header className="px-5 pt-8 pb-10 rounded-b-3xl" style={{ background: "var(--gradient-brand)" }}>
        <button onClick={() => navigate({ to: "/dashboard" })} className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center text-white">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="mt-4 text-2xl font-bold text-white">জৈব সার</h1>
      </header>

      <section className="px-4 -mt-6 pb-10">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="text-6xl mb-3">🌿</div>
          <h2 className="text-xl font-bold text-gray-900">জৈব সার প্রস্তুত প্রণালী</h2>
          <p className="text-sm text-gray-500 mt-1">শীঘ্রই আসছে...</p>

          <div className="mt-6 text-left">
            <p className="text-sm font-semibold text-gray-700 mb-3">এখানে যা থাকবে:</p>
            <ul className="space-y-2">
              {ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-800">
                  <span className="text-emerald-600 mt-0.5">✅</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={subscribe}
            disabled={loading || subscribed || checking}
            className={`mt-6 w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
              subscribed
                ? "bg-emerald-100 text-emerald-700 cursor-default"
                : "bg-[#2D6A4F] text-white active:scale-[0.98]"
            }`}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : subscribed ? (
              <><Check className="h-4 w-4" /> সাবস্ক্রাইব করেছেন</>
            ) : (
              <><Bell className="h-4 w-4" /> আপডেট পেতে সাবস্ক্রাইব করুন</>
            )}
          </button>
        </div>
      </section>
    </main>
  );
}
