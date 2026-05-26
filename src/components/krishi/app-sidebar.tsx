import { useEffect, useState } from "react";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  Menu, Home, TrendingUp, Repeat2, Bug, Newspaper,
  CloudSun, Bell, User, Settings, LogOut, Phone, X,
} from "lucide-react";
import { useUser } from "@/contexts/user-context";
import { useNotifications } from "@/hooks/use-notifications";

const BRAND = "#2D6A4F";

type Item = {
  label: string;
  to: "/dashboard" | "/prices" | "/exchange" | "/disease-detection" | "/feed" | "/weather" | "/notifications" | "/profile";
  icon: typeof Home;
  badge?: number;
};

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    const update = () => setMatches(m.matches);
    update();
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, [query]);
  return matches;
}

const STORAGE_KEY = "sidebar_collapsed";

export function useSidebar() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored !== null) setCollapsed(stored === "true");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed, hydrated]);

  // On mobile, force collapsed initially
  useEffect(() => {
    if (isMobile) setCollapsed(true);
    // only run when device class flips
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  return { collapsed, setCollapsed, isMobile };
}

export function AppSidebar({
  collapsed,
  setCollapsed,
  isMobile,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  isMobile: boolean;
}) {
  const { user, signOut } = useUser();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { unreadCount } = useNotifications(user?.id ?? null);

  const primary: Item[] = [
    { label: "হোম", to: "/dashboard", icon: Home },
    { label: "বাজার দর", to: "/prices", icon: TrendingUp },
    { label: "বিনিময়", to: "/exchange", icon: Repeat2 },
    { label: "রোগ শনাক্ত", to: "/disease-detection", icon: Bug },
    { label: "সংবাদ ফিড", to: "/feed", icon: Newspaper },
  ];
  const secondary: Item[] = [
    { label: "আবহাওয়া", to: "/weather", icon: CloudSun },
    { label: "নোটিফিকেশন", to: "/notifications", icon: Bell, badge: unreadCount },
  ];
  const account: Item[] = [
    { label: "আমার প্রোফাইল", to: "/profile", icon: User },
  ];

  const closeOnNav = () => { if (isMobile) setCollapsed(true); };

  const handleLogout = async () => {
    await signOut();
    router.navigate({ to: "/login" });
  };

  const expanded = !collapsed;
  const showOverlay = isMobile && expanded;

  return (
    <>
      {/* Backdrop (mobile expanded) */}
      {showOverlay && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setCollapsed(true)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full z-40 bg-white border-r border-gray-100 shadow-lg flex flex-col transition-[width] duration-[250ms] ease-in-out ${
          expanded ? "w-64" : "w-16"
        }`}
        aria-label="মূল মেনু"
      >
        {/* Toggle + Profile header */}
        <div className="p-3 border-b border-gray-100">
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "মেনু খুলুন" : "মেনু বন্ধ করুন"}
            className="h-10 w-10 rounded-lg flex items-center justify-center hover:bg-[#F0FFF4] transition-colors"
          >
            {expanded && isMobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {expanded && user && (
            <div className="mt-3 px-1 animate-fade-in">
              <div className="flex items-center gap-3">
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
                  style={{ background: BRAND }}
                >
                  {user.name?.[0] ?? "ক"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{user.name || "কৃষক"}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.district ?? "—"}{user.upazila ? ` • ${user.upazila}` : ""}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-2">
          <MenuGroup items={primary} pathname={pathname} expanded={expanded} onNav={closeOnNav} />
          <Divider expanded={expanded} />
          <MenuGroup items={secondary} pathname={pathname} expanded={expanded} onNav={closeOnNav} />
          <Divider expanded={expanded} />
          <MenuGroup items={account} pathname={pathname} expanded={expanded} onNav={closeOnNav} />

          {expanded && (
            <a
              href="tel:16123"
              className="mx-2 mt-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-[#F0FFF4] transition-colors"
            >
              <Phone className="h-5 w-5 shrink-0" />
              <span>সাহায্য</span>
            </a>
          )}

          <Divider expanded={expanded} />

          <button
            onClick={handleLogout}
            className={`mx-2 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors w-[calc(100%-1rem)] ${
              expanded ? "" : "justify-center px-0"
            }`}
            title="লগআউট"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {expanded && <span className="font-medium">লগআউট</span>}
          </button>
        </nav>

        {/* Footer */}
        {expanded && (
          <div className="border-t border-gray-100 p-3 text-[11px] text-gray-400 leading-tight animate-fade-in">
            <p>v1.0.0</p>
            <p>কৃষিবন্ধু © ২০২৫</p>
          </div>
        )}
      </aside>
    </>
  );
}

function Divider({ expanded }: { expanded: boolean }) {
  return <div className={`my-2 border-t border-gray-100 ${expanded ? "mx-3" : "mx-2"}`} />;
}

function MenuGroup({
  items, pathname, expanded, onNav,
}: {
  items: Item[];
  pathname: string;
  expanded: boolean;
  onNav: () => void;
}) {
  return (
    <ul className="space-y-0.5 px-2">
      {items.map((it) => {
        const active = pathname === it.to || pathname.startsWith(it.to + "/");
        return (
          <li key={it.to + it.label}>
            <Link
              to={it.to}
              onClick={onNav}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-[#D8F3DC] text-[#2D6A4F] font-bold"
                  : "text-gray-700 hover:bg-[#F0FFF4]"
              } ${expanded ? "" : "justify-center px-0"}`}
              title={expanded ? undefined : it.label}
            >
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-[#2D6A4F]" />
              )}
              <span className="relative shrink-0">
                <it.icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                {!!it.badge && it.badge > 0 && (
                  <span className={`absolute ${expanded ? "-top-1.5 -right-2" : "-top-1 -right-1"} min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center`}>
                    {it.badge > 9 ? "৯+" : it.badge}
                  </span>
                )}
              </span>
              {expanded && <span className="truncate">{it.label}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
