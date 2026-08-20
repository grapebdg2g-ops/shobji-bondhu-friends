import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Newspaper,
  User,
  Plus,
  ScanSearch,
  MessageSquareText,
  TrendingUp,
  UserRoundPlus,
  Users,
} from "lucide-react";

type Tab = {
  to: "/dashboard" | "/prices" | "/feed" | "/profile";
  label: string;
  Icon: typeof Home;
};

const LEFT: Tab[] = [
  { to: "/dashboard", label: "হোম", Icon: Home },
  { to: "/prices", label: "বাজার", Icon: TrendingUp },
];

const RIGHT: Tab[] = [
  { to: "/feed", label: "কমিউনিটি", Icon: Newspaper },
  { to: "/profile", label: "প্রোফাইল", Icon: User },
];

const QUICK_ACTIONS = [
  { to: "/disease-detection", label: "রোগ শনাক্ত", Icon: ScanSearch },
  { to: "/ai-bondhu/chat", label: "AI বন্ধুকে জিজ্ঞেস করুন", Icon: MessageSquareText },
  { to: "/feed", label: "কমিউনিটিতে যান", Icon: Newspaper },
  { to: "/farmers", label: "সকল কৃষক", Icon: Users },
  { to: "/messages", label: "মেসেজ", Icon: MessageSquareText },
  { to: "/connections", label: "সংযোগ অনুরোধ", Icon: UserRoundPlus },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  return (
    <nav
      aria-label="মূল মেনু"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="relative grid grid-cols-5 items-end h-16">
        {LEFT.map((t) => (
          <TabBtn key={t.to} tab={t} active={isActive(t.to)} />
        ))}

        <div className="flex justify-center">
          {open && (
            <div className="absolute bottom-[4.5rem] left-1/2 -translate-x-1/2 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-white/70 bg-white/95 p-2 shadow-2xl backdrop-blur-xl animate-fade-in">
              <p className="px-3 pt-1 pb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                দ্রুত কাজ
              </p>
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-[#F0FFF4] active:scale-[0.98]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D8F3DC] text-[#2D6A4F]">
                    <action.Icon className="h-4.5 w-4.5" />
                  </span>
                  {action.label}
                </Link>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label="দ্রুত কাজের মেনু"
            aria-expanded={open}
            className={`absolute -top-6 h-16 w-16 rounded-full flex flex-col items-center justify-center text-white shadow-lg transition duration-200 active:scale-95 ${open ? "rotate-45" : ""}`}
            style={{ background: "var(--gradient-brand)" }}
          >
            <Plus className="h-7 w-7" strokeWidth={2.5} />
            <span className="text-[10px] font-bold mt-0.5 leading-none">নতুন কাজ</span>
          </button>
        </div>

        {RIGHT.map((t) => (
          <TabBtn key={t.to} tab={t} active={isActive(t.to)} />
        ))}
      </div>
    </nav>
  );
}

function TabBtn({ tab, active }: { tab: Tab; active: boolean }) {
  return (
    <Link
      to={tab.to}
      className={`h-16 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
        active ? "text-[#2D6A4F]" : "text-gray-500"
      }`}
    >
      <tab.Icon className="h-5 w-5" strokeWidth={active ? 2.6 : 2} />
      <span>{tab.label}</span>
    </Link>
  );
}
