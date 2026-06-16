import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bell, MapPin, Menu, ChevronRight, Stethoscope, MessageSquareText,
  CalendarDays, Leaf, FlaskConical, ShoppingBasket, Award, Repeat2,
  CloudSun, Bug, Sprout, Plus, Camera, ThumbsUp, MessageCircle, HelpCircle,
} from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { useUser } from "@/contexts/user-context";
import { WeatherAlertBanner } from "@/components/krishi/weather-alert-banner";
import { DashboardWeatherWidget } from "@/components/krishi/dashboard-weather-widget";
import { useSidebar } from "@/components/krishi/app-sidebar";
import { CreatePostSheet } from "@/components/krishi/create-post-sheet";
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
    if (!user) { navigate({ to: "/login" }); return; }
    if (!user.district) navigate({ to: "/register" });
  }, [loading, user, navigate]);

  return (
    <main className="min-h-screen bg-[#F0FFF4] md:max-w-[560px] md:mx-auto">
      {/* SECTION 1 — Top Bar */}
      <header className="px-5 pt-8 pb-12 rounded-b-3xl" style={{ background: "var(--gradient-brand)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-white/95">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium">{user?.district ?? "—"}</span>
          </div>
          <button
            onClick={() => navigate({ to: "/notifications" })}
            aria-label="বিজ্ঞপ্তি"
            className="relative h-10 w-10 rounded-full bg-white/15 flex items-center justify-center ring-2 ring-white/20"
          >
            <Bell className="h-5 w-5 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "৯+" : unreadCount}
              </span>
            )}
          </button>
        </div>
        <div className="mt-4">
          <p className="text-sm text-white/80">স্বাগতম,</p>
          <h1 className="text-2xl font-bold text-white truncate">{user?.name || "কৃষক"}</h1>
          <button
            onClick={() => setCollapsed(false)}
            aria-label="মেনু খুলুন"
            className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 ring-1 ring-white/30 text-white transition-colors"
          >
            <Menu className="h-5 w-5" strokeWidth={2.75} />
            <span className="text-sm font-bold">মেনু</span>
          </button>
        </div>
      </header>

      <WeatherAlertBanner district={user?.district} />

      {/* SECTION 2 — Weather */}
      <div className="-mt-8">
        <DashboardWeatherWidget district={user?.district} upazila={user?.upazila} />
      </div>

      {/* SECTION 3 — AI কৃষি সমাধান */}
      <AiSolutionsSection />

      {/* SECTION 4 — Quick Actions */}
      <QuickActionsSection />

      {/* SECTION 5 — Community Feed */}
      <CommunityFeedSection
        userName={user?.name ?? null}
        onCompose={() => setCreateOpen(true)}
      />

      <CreatePostSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => { /* refresh handled via query invalidation in sheet */ }}
      />
    </main>
  );
}

/* ──────────────────────────── SECTION 3 ──────────────────────────── */

const AI_CARDS = [
  {
    href: "/ai-bondhu/disease",
    Icon: Stethoscope,
    title: "গাছের ডাক্তার",
    desc: "ফসলের ছবি তুলে রোগ শনাক্ত করুন",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
  },
  {
    href: "/ai-bondhu/chat",
    Icon: MessageSquareText,
    title: "বলো বন্ধু",
    desc: "ভয়েস বা টেক্সটে পরামর্শ নিন",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-700",
  },
  {
    href: "/ai-bondhu/calendar",
    Icon: CalendarDays,
    title: "চাষের ক্যালেন্ডার",
    desc: "আপনার এলাকার সময়সূচি দেখুন",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-700",
  },
];

function AiSolutionsSection() {
  return (
    <section className="mt-5">
      <div
        className="px-5 py-4 rounded-3xl mx-3"
        style={{ background: "linear-gradient(135deg, #F4A261 0%, #E89B3D 100%)" }}
      >
        <a
          href="/ai-bondhu"
          className="flex items-center justify-between mb-3 text-white"
        >
          <h2 className="text-lg font-bold">AI কৃষি সমাধান</h2>
          <ChevronRight className="h-5 w-5" strokeWidth={2.6} />
        </a>
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1 snap-x snap-mandatory">
          {AI_CARDS.map((c) => (
            <a
              key={c.href}
              href={c.href}
              className="snap-start shrink-0 w-[42%] bg-white rounded-2xl p-4 shadow-sm active:scale-[0.97] transition-transform"
            >
              <div className={`h-12 w-12 rounded-2xl ${c.iconBg} flex items-center justify-center mb-3`}>
                <c.Icon className={`h-7 w-7 ${c.iconColor}`} strokeWidth={2.2} />
              </div>
              <h3 className="font-bold text-sm text-gray-900 leading-tight">{c.title}</h3>
              <p className="text-[11px] text-gray-500 mt-1 leading-snug">{c.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────── SECTION 4 ──────────────────────────── */

const QUICK_ACTIONS = [
  { href: "/vegetable-guide",          Icon: Leaf,           label: "সবজি গাইড",  bg: "bg-emerald-100", color: "text-emerald-700" },
  { href: "/organic-fertilizer",       Icon: FlaskConical,   label: "জৈব সার",     bg: "bg-blue-100",    color: "text-blue-700" },
  { href: "/prices",                   Icon: ShoppingBasket, label: "সবজি বাজার",  bg: "bg-orange-100",  color: "text-orange-700" },
  { href: "/feed?filter=success",      Icon: Award,          label: "সেরা চাষী",   bg: "bg-purple-100",  color: "text-purple-700" },
  { href: "/feed?filter=help",         Icon: HelpCircle,     label: "জিজ্ঞাসা",     bg: "bg-amber-100",   color: "text-amber-700" },
  { href: "/exchange",                 Icon: Repeat2,        label: "বিনিময়",      bg: "bg-teal-100",    color: "text-teal-700" },
  { href: "/weather",                  Icon: CloudSun,       label: "আবহাওয়া",     bg: "bg-sky-100",     color: "text-sky-700" },
  { href: "/ai-bondhu/disease",        Icon: Bug,            label: "রোগবালাই",     bg: "bg-amber-100",   color: "text-amber-700" },
  { href: "/ai-bondhu/calendar",       Icon: Sprout,         label: "ফসল পরিকল্প",  bg: "bg-lime-100",    color: "text-lime-700" },
];

function QuickActionsSection() {
  return (
    <section className="mt-5 px-2">
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-3 pb-2">
        {QUICK_ACTIONS.map((q) => (
          <a
            key={q.label}
            href={q.href}
            className="shrink-0 w-[78px] flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
          >
            <div className={`h-14 w-14 rounded-full ${q.bg} flex items-center justify-center shadow-sm`}>
              <q.Icon className={`h-6 w-6 ${q.color}`} strokeWidth={2.2} />
            </div>
            <span className="text-[11px] font-semibold text-gray-700 text-center leading-tight">
              {q.label}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────────── SECTION 5 ──────────────────────────── */

function CommunityFeedSection({
  userName,
  onCompose,
}: {
  userName: string | null;
  onCompose: () => void;
}) {
  const { data: mutedIds = [] } = useMutedIds();
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["dashboard-feed", mutedIds.join(",")],
    queryFn: async () => {
      let q = supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
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
              {post.upazila ? `${post.upazila}, ${post.district ?? "—"}` : post.district ?? "—"}
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-800 line-clamp-3 leading-relaxed">{post.content}</p>
      </div>
      {post.image_url && (
        <img
          src={post.image_url}
          alt=""
          loading="lazy"
          className="w-full aspect-[4/3] object-cover bg-gray-100"
        />
      )}
      <div className="px-4 py-2 flex items-center gap-4 border-t border-gray-100 text-xs text-gray-500">
        <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" /> {post.likes_count}</span>
        <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {post.comments_count}</span>
      </div>
    </Link>
  );
}
