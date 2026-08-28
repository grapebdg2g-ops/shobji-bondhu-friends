import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  ArrowLeft,
  FlaskConical,
  Sprout,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Droplets,
  Thermometer,
  Info,
  ChevronRight,
  ClipboardList,
  Leaf,
} from "lucide-react";
import { toast } from "sonner";
import { analyzeSoil, type SoilAnalysisResult } from "@/lib/soil.functions";
import { BengaliButton } from "@/components/krishi/bengali-button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ai-bondhu/soil")({
  component: SoilAnalysisPage,
  head: () => ({
    meta: [
      { title: "মৃত্তিকা বিশ্লেষণ — কৃষক বন্ধু" },
      { name: "description", content: "AI দিয়ে আপনার মাটির স্বাস্থ্য পরীক্ষা করুন এবং সারের সঠিক পরিমাণ জানুন।" },
    ],
  }),
});

const SOIL_TYPES = ["দোআঁশ", "এঁটেল", "বেলে", "বেলে-দোআঁশ", "এঁটেল-দোআঁশ", "পলি"];
const NUTRIENT_LEVELS = [
  { value: "low", label: "কম", color: "text-red-500" },
  { value: "medium", label: "মাঝারি", color: "text-amber-500" },
  { value: "high", label: "বেশি", color: "text-emerald-500" },
  { value: "unknown", label: "অজানা", color: "text-gray-400" },
];

function SoilAnalysisPage() {
  const navigate = useNavigate();
  const analyzeFn = useServerFn(analyzeSoil);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SoilAnalysisResult | null>(null);

  // Form State
  const [soilType, setSoilType] = useState("");
  const [phLevel, setPhLevel] = useState<string>("");
  const [nitrogen, setNitrogen] = useState("unknown");
  const [phosphorus, setPhosphorus] = useState("unknown");
  const [potassium, setPotassium] = useState("unknown");
  const [organicMatter, setOrganicMatter] = useState("unknown");
  const [lastCrop, setLastCrop] = useState("");
  const [plannedCrop, setPlannedCrop] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!soilType) {
      toast.error("দয়া করে মাটির ধরন নির্বাচন করুন");
      return;
    }

    setLoading(true);
    try {
      const data = await analyzeFn({
        data: {
          soilType,
          phLevel: phLevel ? parseFloat(phLevel) : undefined,
          nitrogen: nitrogen !== "unknown" ? nitrogen : undefined,
          phosphorus: phosphorus !== "unknown" ? phosphorus : undefined,
          potassium: potassium !== "unknown" ? potassium : undefined,
          organicMatter: organicMatter !== "unknown" ? organicMatter : undefined,
          lastCrop,
          plannedCrop,
        },
      });
      setResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error("বিশ্লেষণ করা যায়নি, আবার চেষ্টা করুন");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setSoilType("");
    setPhLevel("");
    setNitrogen("unknown");
    setPhosphorus("unknown");
    setPotassium("unknown");
    setOrganicMatter("unknown");
    setLastCrop("");
    setPlannedCrop("");
  };

  return (
    <main className="min-h-screen bg-[#F6FBF7] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-emerald-100 px-4 py-3">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <button
            onClick={() => (result ? setResult(null) : navigate({ to: "/dashboard" }))}
            className="home-pressable flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-black text-gray-900 leading-none">মৃত্তিকা বিশ্লেষণ</h1>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-1">AI Soil Doctor</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative h-24 w-24">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-100 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-t-4 border-emerald-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <FlaskConical className="h-10 w-10 text-emerald-600" />
              </div>
            </div>
            <h2 className="mt-6 text-xl font-black text-gray-900">মাটি বিশ্লেষণ করা হচ্ছে...</h2>
            <p className="mt-2 text-sm text-gray-500 max-w-xs">আমাদের AI আপনার মাটির পুষ্টিগুণ এবং স্বাস্থ্য পরীক্ষা করছে। দয়া করে অপেক্ষা করুন।</p>
          </div>
        ) : result ? (
          <ResultView result={result} onReset={reset} />
        ) : (
          <div className="space-y-6">
            {/* Intro Card */}
            <div className="rounded-3xl bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] p-6 text-white shadow-xl">
              <div className="flex items-start justify-between">
                <div className="max-w-[70%]">
                  <h2 className="text-xl font-black">মাটির স্বাস্থ্য পরীক্ষা করুন</h2>
                  <p className="mt-2 text-xs leading-relaxed text-emerald-50/80">আপনার মাটির তথ্য দিন এবং AI-এর মাধ্যমে সারের সঠিক পরিমাণ ও চাষের পরামর্শ পান।</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-6 flex items-center gap-4 border-t border-white/10 pt-4 text-[10px] font-bold uppercase tracking-widest">
                <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> স্মার্ট রিপোর্ট</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> সারের পরিমাণ</div>
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-5 pb-10">
              <div className="rounded-3xl bg-white p-5 shadow-sm border border-emerald-50">
                <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="h-4 w-4 text-emerald-600" /> মাটির সাধারণ তথ্য
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">মাটির ধরন *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {SOIL_TYPES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSoilType(t)}
                          className={cn(
                            "rounded-xl py-2.5 text-xs font-bold transition-all border",
                            soilType === t
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200"
                              : "bg-gray-50 border-gray-100 text-gray-600 hover:border-emerald-200"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">pH লেভেল (ঐচ্ছিক)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="14"
                      value={phLevel}
                      onChange={(e) => setPhLevel(e.target.value)}
                      placeholder="উদা: ৬.৫"
                      className="w-full rounded-xl bg-gray-50 border border-gray-100 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm border border-emerald-50">
                <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-emerald-600" /> পুষ্টির মাত্রা (যদি জানা থাকে)
                </h3>
                
                <div className="space-y-5">
                  <NutrientSelect label="নাইট্রোজেন (N)" value={nitrogen} onChange={setNitrogen} />
                  <NutrientSelect label="ফসফরাস (P)" value={phosphorus} onChange={setPhosphorus} />
                  <NutrientSelect label="পটাশিয়াম (K)" value={potassium} onChange={setPotassium} />
                  <NutrientSelect label="জৈব উপাদান" value={organicMatter} onChange={setOrganicMatter} />
                </div>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm border border-emerald-50">
                <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                  <Sprout className="h-4 w-4 text-emerald-600" /> চাষাবাদ পরিকল্পনা
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">আগের ফসল</label>
                    <input
                      type="text"
                      value={lastCrop}
                      onChange={(e) => setLastCrop(e.target.value)}
                      placeholder="উদা: ধান"
                      className="w-full rounded-xl bg-gray-50 border border-gray-100 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">পরিকল্পিত ফসল</label>
                    <input
                      type="text"
                      value={plannedCrop}
                      onChange={(e) => setPlannedCrop(e.target.value)}
                      placeholder="উদা: আলু"
                      className="w-full rounded-xl bg-gray-50 border border-gray-100 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <BengaliButton
                type="submit"
                variant="primary"
                className="w-full py-4 text-base rounded-2xl shadow-lg shadow-emerald-200"
                disabled={loading}
              >
                বিশ্লেষণ শুরু করুন
              </BengaliButton>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

function NutrientSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">{label}</label>
      <div className="flex gap-2">
        {NUTRIENT_LEVELS.map((n) => (
          <button
            key={n.value}
            type="button"
            onClick={() => onChange(n.value)}
            className={cn(
              "flex-1 rounded-xl py-2 text-xs font-bold border transition-all",
              value === n.value
                ? "bg-white border-emerald-500 text-emerald-700 shadow-sm"
                : "bg-gray-50 border-gray-100 text-gray-500"
            )}
          >
            {n.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultView({ result, onReset }: { result: SoilAnalysisResult; onReset: () => void }) {
  const toBn = (n: number | string) => n.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Health Score Card */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-emerald-50 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Activity className="h-24 w-24 text-emerald-900" />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-full border-8 border-emerald-50 bg-emerald-600 text-white text-3xl font-black mb-4">
            {toBn(result.healthScore)}%
          </div>
          <h2 className="text-xl font-black text-gray-900">মাটির স্বাস্থ্য স্কোর</h2>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed px-4">{result.summary}</p>
        </div>
      </div>

      {/* Nutrient Status */}
      <div className="rounded-3xl bg-white p-5 shadow-sm border border-emerald-50">
        <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-emerald-600" /> পুষ্টির অবস্থা
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StatusItem label="নাইট্রোজেন" value={result.nutrientStatus.nitrogen} icon={Droplets} />
          <StatusItem label="ফসফরাস" value={result.nutrientStatus.phosphorus} icon={Activity} />
          <StatusItem label="পটাশিয়াম" value={result.nutrientStatus.potassium} icon={Activity} />
          <StatusItem label="pH লেভেল" value={result.nutrientStatus.ph} icon={Thermometer} />
        </div>
      </div>

      {/* Recommendations */}
      <div className="rounded-3xl bg-white p-5 shadow-sm border border-emerald-50">
        <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-emerald-600" /> সারের সুপারিশ
        </h3>
        <div className="space-y-3">
          {result.recommendations.fertilizers.map((f, i) => (
            <div key={i} className="flex items-start gap-3 rounded-2xl bg-emerald-50/50 p-3 border border-emerald-100/50">
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                {toBn(i + 1)}
              </div>
              <div>
                <div className="font-bold text-gray-900 text-sm">{f.name}</div>
                <div className="text-xs text-emerald-700 font-bold mt-0.5">{f.amount}</div>
                <div className="text-[10px] text-gray-500 mt-1">{f.timing}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Organic & Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-emerald-50">
          <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
            <Leaf className="h-4 w-4 text-emerald-600" /> জৈব ব্যবস্থাপনা
          </h3>
          <ul className="space-y-2">
            {result.recommendations.organicAmendments.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-emerald-50">
          <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-emerald-600" /> চাষাবাদ পরামর্শ
          </h3>
          <ul className="space-y-2">
            {result.recommendations.soilManagement.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Suitable Crops */}
      <div className="rounded-3xl bg-emerald-900 p-5 text-white shadow-lg">
        <h3 className="text-sm font-black mb-4 flex items-center gap-2">
          <Sprout className="h-4 w-4 text-emerald-400" /> উপযুক্ত ফসল
        </h3>
        <div className="flex flex-wrap gap-2">
          {result.suitableCrops.map((crop, i) => (
            <span key={i} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold ring-1 ring-white/20">
              {crop}
            </span>
          ))}
        </div>
      </div>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="rounded-3xl bg-amber-50 p-5 border border-amber-100">
          <h3 className="text-sm font-black text-amber-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> গুরুত্বপূর্ণ সতর্কতা
          </h3>
          <ul className="space-y-2">
            {result.warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      <BengaliButton
        variant="outline"
        className="w-full py-4 text-base rounded-2xl border-emerald-200 text-emerald-700"
        onClick={onReset}
      >
        নতুন বিশ্লেষণ করুন
      </BengaliButton>
    </div>
  );
}

function StatusItem({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-3 border border-gray-100">
      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="text-xs font-bold text-gray-800 leading-tight">{value}</div>
    </div>
  );
}
