import { useRouterState } from "@tanstack/react-router";
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
      <div
        className={`flex-1 min-w-0 transition-[margin] duration-[250ms] ease-in-out ${
          isMobile ? "ml-16" : collapsed ? "ml-16" : "ml-64"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
