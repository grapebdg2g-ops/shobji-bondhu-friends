import { useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { AppSidebar, useSidebar } from "./app-sidebar";
import { useUser } from "@/contexts/user-context";

// Routes that should NOT render the sidebar (auth / onboarding / landing)
const HIDDEN_ON = new Set<string>(["/", "/login", "/register", "/offline"]);

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useUser();
  const { collapsed, setCollapsed, isMobile } = useSidebar();

  const hide = HIDDEN_ON.has(pathname) || !user;

  if (hide) return <>{children}</>;

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar collapsed={collapsed} setCollapsed={setCollapsed} isMobile={isMobile} />
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          aria-label="মেনু খুলুন"
          className="fixed top-3 left-3 z-30 h-10 w-10 rounded-lg bg-white shadow-md border border-gray-100 flex items-center justify-center hover:bg-[#F0FFF4] transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
