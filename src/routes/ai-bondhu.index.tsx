import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Stethoscope, MessageSquareText, CalendarDays, FlaskConical, Sprout } from "lucide-react";

export const Route = createFileRoute("/ai-bondhu/")({
  component: AiBondhuHub,
  head: () => ({
    meta: [
      { title: "AI কৃষি সমাধান — কৃষিবন্ধু" },
      { name: "description", content: "রোগ শনাক্ত, ফসল ক্যালেন্ডার, সার ও কীটনাশক — সবকিছু এক জায়গায়।" },
    ],
  }),
});

type Card = {
  to: string;
  Icon: typeof Stethoscope;
  title: string;
  desc: string;
  bg: string;
  color: string;
};

const ROW1: Card[] = [
  { to: "/ai-bondhu/disease", Icon: Stethoscope, title: "গাছের ডাক্তার", desc: "ছবি তুলে রোগ শনাক্ত", bg: "bg-emerald-100", color: "text-emerald-700" },
  { to: "/ai-bondhu/chat", Icon: MessageSquareText, title: "বলো বন্ধু", desc: "AI-কে প্রশ্ন করুন", bg: "bg-purple-100", color: "text-purple-700" },
];
const ROW2: Card[] = [
  { to: "/ai-bondhu/calendar", Icon: CalendarDays, title: "চাষের ক্যালেন্ডার", desc: "মাস অনুযায়ী সময়সূচি", bg: "bg-orange-100", color: "text-orange-700" },
  { to: "/ai-bondhu/calculator", Icon: FlaskConical, title: "সার ক্যালকুলেটর", desc: "সঠিক NPK মাত্রা", bg: "bg-blue-100", color: "text-blue-700" },
];
const FULL: Card = { to: "/ai-bondhu/pesticide", Icon: Sprout, title: "কীটনাশক গাইড", desc: "নিরাপদ কীটনাশকের তালিকা", bg: "bg-lime-100", color: "text-lime-700" };

function GridCard({ c }: { c: Card }) {
  return (
    <Link
      to={c.to}
      className="h-[120px] bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform flex flex-col justify-between"
    >
      <div className={`h-11 w-11 rounded-2xl ${c.bg} flex items-center justify-center`}>
        <c.Icon className={`h-6 w-6 ${c.color}`} strokeWidth={2.2} />
      </div>
      <div>
        <h3 className="font-bold text-sm text-gray-900 leading-tight">{c.title}</h3>
        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{c.desc}</p>
      </div>
    </Link>
  );
}

function AiBondhuHub() {
  const navigate = useNavigate();
  return (
    <main className="min-h-screen bg-[#F0FFF4] md:max-w-[560px] md:mx-auto">
      <header className="px-5 pt-8 pb-10 rounded-b-3xl" style={{ background: "var(--gradient-brand)" }}>
        <button onClick={() => navigate({ to: "/dashboard" })} className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center text-white">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="mt-4 text-2xl font-bold text-white">AI কৃষি সমাধান</h1>
        <p className="text-sm text-white/85 mt-1">বুদ্ধিমান AI দিয়ে আপনার চাষের সমস্যা সমাধান</p>
      </header>

      <section className="px-4 -mt-6 pb-8 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {ROW1.map((c) => <GridCard key={c.to} c={c} />)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {ROW2.map((c) => <GridCard key={c.to} c={c} />)}
        </div>
        <Link
          to={FULL.to}
          className="h-[120px] w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform flex items-center gap-4"
        >
          <div className={`h-14 w-14 rounded-2xl ${FULL.bg} flex items-center justify-center shrink-0`}>
            <FULL.Icon className={`h-7 w-7 ${FULL.color}`} strokeWidth={2.2} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">{FULL.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{FULL.desc}</p>
          </div>
        </Link>
      </section>
    </main>
  );
}
