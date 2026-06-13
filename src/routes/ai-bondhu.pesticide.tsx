import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ArrowLeft, Search, Bug } from "lucide-react";

export const Route = createFileRoute("/ai-bondhu/pesticide")({
  component: PesticidePage,
  head: () => ({ meta: [{ title: "কীটনাশক গাইড — কৃষিবন্ধু" }] }),
});

type Item = {
  pest: string;
  crops: string;
  pesticide: string;
  dose: string;
  safety: string;
};

const GUIDE: Item[] = [
  { pest: "মাজরা পোকা", crops: "ধান", pesticide: "কার্টাপ ৫০ ইসি", dose: "১ মিলি / লিটার পানি", safety: "ছিটানোর ৭ দিন পর ফসল কাটুন" },
  { pest: "বাদামি গাছফড়িং", crops: "ধান", pesticide: "ইমিডাক্লোপ্রিড ২০ এসএল", dose: "০.৫ মিলি / লিটার", safety: "ছিটানোর ১৪ দিন পর ফসল" },
  { pest: "পাতা মোড়ানো পোকা", crops: "ধান, সবজি", pesticide: "ক্লোরপাইরিফস ২০ ইসি", dose: "২ মিলি / লিটার", safety: "মৌমাছি কম থাকার সময় ছিটান" },
  { pest: "জাব পোকা (এফিড)", crops: "সরিষা, সবজি", pesticide: "ম্যালাথিয়ন ৫৭ ইসি", dose: "২ মিলি / লিটার", safety: "ছিটানোর ৭ দিন পর ফসল" },
  { pest: "সাদা মাছি", crops: "টমেটো, বেগুন", pesticide: "অ্যাসিটামিপ্রিড ২০ এসপি", dose: "০.৫ গ্রাম / লিটার", safety: "সকাল/বিকেলে ছিটান" },
  { pest: "ফল ছিদ্রকারী পোকা", crops: "বেগুন, করলা", pesticide: "স্পিনোসাড ৪৫ এসসি", dose: "০.৪ মিলি / লিটার", safety: "জৈব বিকল্প: নিম তেল" },
  { pest: "লাল মাকড়", crops: "শসা, লাউ", pesticide: "অ্যাবামেকটিন ১.৮ ইসি", dose: "১ মিলি / লিটার", safety: "পাতার নিচের দিকে ছিটান" },
  { pest: "কাটুই পোকা", crops: "চারা ফসল", pesticide: "কার্বোফুরান ৫জি", dose: "১০ কেজি / একর মাটিতে", safety: "শিশু/পশু থেকে দূরে রাখুন" },
  { pest: "ব্লাস্ট রোগ", crops: "ধান", pesticide: "ট্রাইসাইক্লাজল ৭৫ ডব্লিউপি", dose: "০.৬ গ্রাম / লিটার", safety: "শীষ বের হওয়ার আগে" },
  { pest: "ব্লাইট রোগ", crops: "আলু, টমেটো", pesticide: "ম্যানকোজেব ৮০ ডব্লিউপি", dose: "২ গ্রাম / লিটার", safety: "১০ দিন পর পুনরায়" },
];

function PesticidePage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return GUIDE;
    return GUIDE.filter((g) =>
      g.pest.toLowerCase().includes(s) ||
      g.crops.toLowerCase().includes(s) ||
      g.pesticide.toLowerCase().includes(s),
    );
  }, [q]);

  return (
    <main className="min-h-screen bg-[#F0FFF4] md:max-w-[560px] md:mx-auto pb-8">
      <header className="px-5 pt-8 pb-8 rounded-b-3xl text-white" style={{ background: "var(--gradient-brand)" }}>
        <button onClick={() => navigate({ to: "/ai-bondhu" })} className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="mt-4 text-2xl font-bold">কীটনাশক গাইড</h1>
        <p className="text-sm text-white/85 mt-1">পোকা ও রোগ অনুযায়ী অনুমোদিত কীটনাশক</p>
      </header>

      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-400 ml-1" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="পোকা / ফসল / কীটনাশক খুঁজুন..."
            className="flex-1 h-9 outline-none text-sm"
          />
        </div>
      </div>

      <section className="px-4 mt-4 space-y-3">
        {filtered.map((g, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Bug className="h-5 w-5 text-amber-700" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900">{g.pest}</h3>
                <p className="text-[11px] text-gray-500">ফসল: {g.crops}</p>
              </div>
            </div>
            <div className="mt-3 space-y-1.5 text-sm">
              <Row label="কীটনাশক" value={g.pesticide} />
              <Row label="মাত্রা" value={g.dose} />
              <Row label="নিরাপত্তা" value={g.safety} />
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-8">কোনো ফলাফল পাওয়া যায়নি</p>
        )}
        <p className="text-[11px] text-gray-500 leading-relaxed px-1 pt-2">
          * ব্যবহারের আগে লেবেল পড়ুন ও মাস্ক/গ্লাভস পরুন। অনুমোদিত মাত্রার বেশি ব্যবহার করবেন না।
        </p>
      </section>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-xs text-gray-500 w-20 shrink-0">{label}:</span>
      <span className="text-sm text-gray-800 flex-1">{value}</span>
    </div>
  );
}
