import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Newspaper, MessageCircle, User, Sparkles } from "lucide-react";

type Tab = {
  to: "/dashboard" | "/feed" | "/notifications" | "/profile";
  label: string;
  Icon: typeof Home;
};

const LEFT: Tab[] = [
  { to: "/dashboard", label: "হোম", Icon: Home },
  { to: "/feed", label: "ফিড", Icon: Newspaper },
];

const RIGHT: Tab[] = [
  { to: "/notifications", label: "ম্যাসেজ", Icon: MessageCircle },
  { to: "/profile", label: "প্রোফাইল", Icon: User },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  return (
    <nav
      aria-label="মূল মেনু"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="relative grid grid-cols-5 items-end h-16">
        {LEFT.map((t) => <TabBtn key={t.to} tab={t} active={isActive(t.to)} />)}

        <div className="flex justify-center">
          <Link
            to="/dashboard"
            aria-label="কৃষি বন্ধু"
            className="absolute -top-6 h-16 w-16 rounded-full flex flex-col items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
            style={{ background: "var(--gradient-brand)" }}
          >
            <Sparkles className="h-6 w-6" strokeWidth={2.4} />
            <span className="text-[10px] font-bold mt-0.5 leading-none">বন্ধু</span>
          </Link>
        </div>

        {RIGHT.map((t) => <TabBtn key={t.to} tab={t} active={isActive(t.to)} />)}
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
