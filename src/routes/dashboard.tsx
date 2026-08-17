import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  MapPin,
  Menu,
  ChevronRight,
  Stethoscope,
  MessageSquareText,
  CalendarDays,
  Leaf,
  FlaskConical,
  ShoppingBasket,
  Bug,
  Sprout,
  Camera,
  ThumbsUp,
  MessageCircle,
  Sparkles,
  CircleCheck,
  CloudRain,
  ArrowUpRight,
} from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { useUser } from "@/contexts/user-context";
import { WeatherAlertBanner } from "@/components/krishi/weather-alert-banner";
import { DashboardWeatherWidget } from "@/components/krishi/dashboard-weather-widget";
import { useSidebar } from "@/components/krishi/app-sidebar";
import { CreatePostSheet } from "@/components/krishi/create-post-sheet";
import { CropAdvisoryWidget } from "@/components/krishi/crop-advisory-widget";
import { useMutedIds } from "@/hooks/use-muted-users";
import { supabase } from "@/integrations/supabase/client";
import type { Post } from "@/hooks/use-feed";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "হোম — কৃষিবন্ধু" }] }),
});

function Dashboard() {
  const navigate = useNavigate();
  const { user, loading } = useUser();
  const { unreadCount } = useNotifications(user?.id ?? null);
  const { setCollapsed } = useSidebar();
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!user.district) navigate({ to: "/register" });
  }, [loading, user, navigate]);

  return (
    <main className="min-h-screen bg-[#F6FBF7] md:max-w-[720px] md:mx-auto">
      {/* SECTION 1 — Dynamic Hero */}
      <header className="relative overflow-hidden px-5 pt-8 pb-14 rounded-b-[32px]" style={{ background: "var(--gradient-brand)" }}>
        <div className="home-float pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#74C69D]/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-[#F4A261]/15 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-white/95 ring-1 ring-white/20 backdrop-blur-md">
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">{user?.district ?? "আপনার এলাকা"}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCollapsed(false)}
                aria-label="মেনু খুলুন"
                className="hidden h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20 active:scale-95 md:flex"
              >
                <Menu className="h-5 w-5" strokeWidth={2.5} />
              </button>
              <button
                onClick={() => navigate({ to: "/notifications" })}
                aria-label="বিজ্ঞপ্তি"
                className="relative h-10 w-10 rounded-full bg-white/10 flex items-center justify-center ring-1 ring-white/20 backdrop-blur-md transition hover:bg-white/20 active:scale-95"
              >
                <Bell className="h-5 w-5 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F4A261] text-[#123B2A] text-[10px] font-extrabold flex items-center justify-center ring-2 ring-[#2D6A4F]">
                    {unreadCount > 9 ? "৯+" : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          <div className="mt-7 max-w-xl">
            <p className="text-sm font-semibold text-white/70">শুভ সকাল, {user?.name || "কৃষক"}</p>
            <h1 className="mt-1 text-[2rem] font-black leading-tight tracking-tight text-white">আজ কীভাবে সাহায্য করতে পারি?</h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/75">আপনার ফসল, আবহাওয়া এবং বাজারের খবর এক জায়গায় দেখে আজকের সেরা সিদ্ধান্ত নিন।</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => navigate({ to: "/disease-detection" })}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-extrabold text-[#1B4332] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 active:scale-[0.97]"
              >
                <Bug className="h-4 w-4" /> রোগের ছবি তুলুন
              </button>
              <button
                onClick={() => navigate({ to: "/ai-bondhu/chat" })}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-xs font-extrabold text-white ring-1 ring-white/25 backdrop-blur-md transition hover:bg-white/20 active:scale-[0.97]"
              >
                <Sparkles className="h-4 w-4" /> AI বন্ধুকে জিজ্ঞেস করুন
              </button>
            </div>
          </div>
        </div>
      </header>

      <WeatherAlertBanner district={user?.district} />

      {/* SECTION 2 — Weather */}
      <div className="-mt-8">
        <DashboardWeatherWidget district={user?.district} upazila={user?.upazila} />
      </div>

      <TodayBrief onCreatePost={() => setCreateOpen(true)} />

      {/* Crop Advisory urgent tasks */}
      <CropAdvisoryWidget />

      {/* SECTION 3 — AI কৃষি সমাধান */}
      <AiSolutionsSection />


      {/* SECTION 4 — Quick Actions */}
      <QuickActionsSection />

      {/* SECTION 5 — Community Feed */}
      <CommunityFeedSection userName={user?.name ?? null} onCompose={() => setCreateOpen(true)} />

      <CreatePostSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          /* refresh handled via query invalidation in sheet */
        }}
      />
    </main>
  );
}

/* ──────────────────────────── SECTION 3 ──────────────────────────── */

const AI_CARDS = [
  {
    href: "/ai-bondhu/disease",
    Icon: Stethoscope,
    title: "AI গাছের ডাক্তার",
    desc: "ফসলের ছবি তুলে রোগ শনাক্ত করুন",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
  },
  {
    href: "/ai-bondhu/chat",
    Icon: MessageSquareText,
    title: "AI বন্ধু",
    desc: "ভয়েস বা টেক্সটে পরামর্শ নিন",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-700",
  },
  {
    href: "/ai-bondhu/calendar",
    Icon: CalendarDays,
    title: "ফসল চাষের ক্যালেন্ডার",
    desc: "আপনার এলাকার চাষের সময়সূচি দেখুন",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-700",
  },
  {
    href: "/ai-bondhu/calculator",
    Icon: FlaskConical,
    title: "সার ক্যালকুলেটর",
    desc: "জমির জন্য প্রয়োজনীয় সার হিসাব করুন",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-700",
  },
  {
    href: "/ai-bondhu/pesticide",
    Icon: Leaf,
    title: "কীটনাশক গাইড",
    desc: "পোকা ও রোগ দমনের নিরাপদ পদ্ধতি",
    iconBg: "bg-red-100",
    iconColor: "text-red-700",
  },
  {
    href: "/crop-planner",
    Icon: Sparkles,
    title: "ফসল পরিকল্পনা",
    desc: "মাটি ও লক্ষ্য অনুযায়ী সেরা ফসল সুপারিশ",
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-700",
  },
];

function AiSolutionsSection() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeCard, setActiveCard] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCard(Number(entry.target.getAttribute("data-card-index")));
          }
        });
      },
      { root: el, threshold: 0.6 }
    );
    el.querySelectorAll("[data-card-index]").forEach((card: Element) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="mt-6 px-4">
      <div className="relative overflow-hidden rounded-[28px] p-4 shadow-[0_20px_44px_-24px_rgba(27,67,50,0.9)]" style={{ background: "var(--gradient-brand)" }}>
        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#74C69D]/25 blur-3xl" />
        <div className="relative z-10">
          <button onClick={() => navigate({ to: "/ai-bondhu" })} className="flex w-full items-start justify-between text-left text-white">
            <div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                  <Sparkles className="h-4 w-4" />
                  <span className="home-soft-pulse absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#F4A261] ring-2 ring-[#2D6A4F]" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/65">কৃষি সহায়ক</p>
                  <h2 className="text-lg font-black">AI বন্ধু এখন online</h2>
                </div>
              </div>
              <p className="mt-3 max-w-xs text-xs leading-relaxed text-white/75">আপনার ফসলের যেকোনো প্রশ্ন করুন—ভয়েস বা টেক্সটে সহজ উত্তর পান।</p>
            </div>
            <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-white/80" strokeWidth={2.5} />
          </button>

          <div className="mt-4 flex flex-wrap gap-2">
            {["টমেটোর পাতায় দাগ", "আজ কী সার দেব?", "বাজারদর কেমন?"] .map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => navigate({ to: "/ai-bondhu/chat" })}
                className="rounded-full bg-white/10 px-3 py-2 text-[11px] font-bold text-white ring-1 ring-white/20 backdrop-blur-md transition hover:bg-white/20 active:scale-[0.97]"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div ref={scrollRef} className="mt-4 flex gap-3 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1" style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
            {AI_CARDS.map((c, i) => (
              <button
                key={c.href}
                data-card-index={i}
                onClick={() => navigate({ to: c.href })}
                className="snap-start shrink-0 w-[148px] min-w-[148px] rounded-2xl bg-white/95 p-3.5 text-left shadow-lg shadow-black/10 transition active:scale-[0.97]"
                style={{ scrollSnapAlign: "start" }}
              >
                <div className={`mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl ${c.iconBg}`}>
                  <c.Icon className={`h-5 w-5 ${c.iconColor}`} strokeWidth={2.2} />
                </div>
                <h3 className="text-sm font-extrabold leading-tight text-gray-900">{c.title}</h3>
                <p className="mt-1 text-[11px] leading-snug text-gray-500">{c.desc}</p>
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-1.5">
              {AI_CARDS.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === activeCard ? "w-5 bg-white" : "w-1.5 bg-white/45"}`} />)}
            </div>
            <button type="button" onClick={() => navigate({ to: "/ai-bondhu/chat" })} className="inline-flex items-center gap-1.5 rounded-full bg-[#F4A261] px-3 py-2 text-[11px] font-extrabold text-[#123B2A] shadow-sm transition active:scale-[0.97]">
              <MessageSquareText className="h-3.5 w-3.5" /> প্রশ্ন করুন
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}


/* ──────────────────────────── SECTION 4 ──────────────────────────── */

const QUICK_ACTIONS = [
  { href: "/disease-detection", Icon: Bug, label: "রোগ শনাক্ত", desc: "ছবি তুলে পরীক্ষা করুন", bg: "bg-[#E8F7EC]", color: "text-[#2D6A4F]" },
  { href: "/prices", Icon: ShoppingBasket, label: "বাজারদর", desc: "আজকের দাম দেখুন", bg: "bg-[#FFF1E5]", color: "text-[#D96B27]" },
  { href: "/ai-bondhu/chat", Icon: Sparkles, label: "AI বন্ধু", desc: "ফসল নিয়ে জিজ্ঞেস করুন", bg: "bg-[#F0EBFF]", color: "text-[#7457C7]" },
  { href: "/crop-planner", Icon: Sprout, label: "ফসল পরিকল্পনা", desc: "চাষের ধাপ সাজান", bg: "bg-[#E7F4FB]", color: "text-[#3186B7]" },
];

function QuickActionsSection() {
  return (
    <section className="mt-6 px-4">
      <div className="mb-3 flex items-end justify-between px-1">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#52B788]">দ্রুত শুরু করুন</p>
          <h2 className="mt-1 text-lg font-black tracking-tight text-gray-900">আজ আপনার কী দরকার?</h2>
        </div>
        <Link to="/ai-bondhu" className="text-xs font-bold text-[#2D6A4F] hover:underline">সব টুল</Link>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {QUICK_ACTIONS.map((q) => (
          <Link
            key={q.label}
            to={q.href as never}
            className="group rounded-[22px] border border-white/80 bg-white p-3.5 shadow-[0_8px_24px_-18px_rgba(27,67,50,0.55)] transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${q.bg}`}>
              <q.Icon className={`h-5 w-5 ${q.color}`} strokeWidth={2.2} />
            </div>
            <div className="mt-3 flex items-end justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">{q.label}</h3>
                <p className="mt-1 text-[11px] leading-snug text-gray-500">{q.desc}</p>
              </div>
              <ArrowUpRight className={`h-4 w-4 shrink-0 ${q.color} transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5`} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function TodayBrief({ onCreatePost }: { onCreatePost: () => void }) {
  const navigate = useNavigate();

  return (
    <section className="relative z-10 -mt-7 px-4">
      <div className="rounded-[28px] border border-white/80 bg-white/95 p-4 shadow-[0_18px_42px_-24px_rgba(27,67,50,0.55)] backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#52B788]">আজকের ফোকাস</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-gray-900">আপনার কৃষি সারাংশ</h2>
          </div>
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#F0FFF4] text-[#2D6A4F]">
            <svg viewBox="0 0 36 36" className="absolute inset-0 h-full w-full -rotate-90">
              <path d="M18 3a15 15 0 1 1 0 30a15 15 0 1 1 0-30" fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth="3" />
              <path d="M18 3a15 15 0 1 1 0 30a15 15 0 1 1 0-30" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="72 100" />
            </svg>
            <span className="text-[10px] font-black">২/৩</span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-[#F6FBF7] px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#D8F3DC] text-[#2D6A4F]"><CircleCheck className="h-4 w-4" /></span>
          <p className="text-xs font-semibold leading-relaxed text-gray-600">আজকের ৩টি কাজের মধ্যে ২টি আপনার জন্য প্রস্তুত।</p>
          <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-[#2D6A4F]" />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => navigate({ to: "/weather" })}
            className="group rounded-2xl bg-[#EAF6FF] p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-sky-600 shadow-sm"><CloudRain className="h-5 w-5" /></span>
            <p className="mt-3 text-sm font-extrabold text-gray-900">বৃষ্টির প্রস্তুতি</p>
            <p className="mt-1 text-[11px] leading-snug text-gray-500">আবহাওয়া দেখে কাজ ঠিক করুন</p>
          </button>
          <button
            type="button"
            onClick={onCreatePost}
            className="group rounded-2xl bg-[#FFF3E7] p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-[#E07A2C] shadow-sm"><MessageCircle className="h-5 w-5" /></span>
            <p className="mt-3 text-sm font-extrabold text-gray-900">অভিজ্ঞতা শেয়ার</p>
            <p className="mt-1 text-[11px] leading-snug text-gray-500">কমিউনিটিতে আপনার খবর দিন</p>
          </button>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────── SECTION 5 ──────────────────────────── */

function CommunityFeedSection({ userName, onCompose }: { userName: string | null; onCompose: () => void }) {
  const { data: mutedIds = [] } = useMutedIds();
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["dashboard-feed", mutedIds.join(",")],
    queryFn: async () => {
      let q = supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(5);
      if (mutedIds.length > 0) {
        q = q.not("user_id", "in", `(${mutedIds.join(",")})`);
      }
      const { data } = await q;
      return (data as Post[]) ?? [];
    },
    staleTime: 60_000,
  });

  return (
    <section className="mt-6 px-4 pb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-3 px-1">কমিউনিটি আপডেট</h2>

      {/* Composer */}
      <button
        onClick={onCompose}
        className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex items-center gap-3 active:scale-[0.99] transition-transform"
      >
        <div className="h-10 w-10 rounded-full bg-[#2D6A4F] text-white font-bold flex items-center justify-center shrink-0">
          {userName?.[0] ?? "ক"}
        </div>
        <span className="flex-1 text-left text-sm text-gray-500">পোস্ট করুন...</span>
        <div className="h-9 w-9 rounded-full bg-[#F0FFF4] flex items-center justify-center text-[#2D6A4F]">
          <Camera className="h-4 w-4" />
        </div>
      </button>

      {/* Posts */}
      <div className="mt-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-white border border-gray-100 animate-pulse" />
          ))
        ) : posts.length === 0 ? (
          <div className="rounded-2xl bg-white border border-gray-100 p-6 text-center text-sm text-gray-500">
            এখনো কোনো পোস্ট নেই — প্রথম পোস্টটি আপনিই করুন!
          </div>
        ) : (
          posts.map((p, i) => (
            <div
              key={p.id}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
            >
              <MiniPostCard post={p} />
            </div>
          ))
        )}
      </div>

      <Link
        to="/feed"
        className="mt-4 w-full inline-flex items-center justify-center gap-1 h-12 rounded-2xl bg-white border border-[#2D6A4F]/20 text-[#2D6A4F] font-bold text-sm active:scale-[0.98] transition-transform"
      >
        আরো পোস্ট দেখুন
        <ChevronRight className="h-4 w-4" strokeWidth={2.6} />
      </Link>
    </section>
  );
}

function MiniPostCard({ post }: { post: Post }) {
  return (
    <Link
      to="/feed"
      className="block rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden active:scale-[0.99] transition-transform"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-[#2D6A4F]/15 text-[#2D6A4F] flex items-center justify-center font-bold shrink-0">
            {post.user_name?.[0] ?? "ক"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900 truncate">{post.user_name}</p>
            <p className="text-[11px] text-gray-500">
              {post.upazila ? `${post.upazila}, ${post.district ?? "—"}` : (post.district ?? "—")}
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-800 line-clamp-3 leading-relaxed">{post.content}</p>
      </div>
      {post.image_url && (
        <img src={post.image_url} alt="" loading="lazy" className="w-full aspect-[4/3] object-cover bg-gray-100" />
      )}
      <div className="px-4 py-2 flex items-center gap-4 border-t border-gray-100 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <ThumbsUp className="h-3.5 w-3.5" /> {post.likes_count}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" /> {post.comments_count}
        </span>
      </div>
    </Link>
  );
}
