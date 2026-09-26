import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { UserProvider } from "@/contexts/user-context";

import { AppErrorBoundary } from "@/components/krishi/app-error-boundary";
import { PWAManager } from "@/components/krishi/pwa-manager";
import { AppLayout } from "@/components/krishi/app-layout";
import { SidebarProvider } from "@/components/krishi/app-sidebar";

function NotFoundComponent() {
  const navigate = useNavigate();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="text-5xl font-black text-primary">৪০৪</p>
      <h1 className="mt-3 text-xl font-bold text-foreground">পৃষ্ঠাটি পাওয়া যায়নি</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        আপনি যে পৃষ্ঠাটি খুঁজছেন সেটি হয় সরানো হয়েছে বা ঠিকানা ভুল।
      </p>
      <button
        type="button"
        onClick={() => navigate({ to: "/dashboard" })}
        className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
      >
        হোমে ফিরে যান
      </button>
    </main>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { name: "theme-color", content: "#2D6A4F" },
      { title: "কৃষক বন্ধু — কৃষকের বিশ্বস্ত সঙ্গী" },
      {
        name: "description",
        content:
          "বাংলাদেশের কৃষকদের জন্য সামাজিক প্ল্যাটফর্ম — বাজার দর, বিনিময়, রোগ শনাক্ত ও সংবাদ।",
      },
      { name: "author", content: "KrishokBondhu" },
      { property: "og:title", content: "কৃষক বন্ধু — কৃষকের বিশ্বস্ত সঙ্গী" },
      {
        property: "og:description",
        content:
          "বাংলাদেশের কৃষকদের জন্য সামাজিক প্ল্যাটফর্ম — বাজার দর, বিনিময়, রোগ শনাক্ত ও সংবাদ।",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "কৃষক বন্ধু — কৃষকের বিশ্বস্ত সঙ্গী" },
      {
        name: "twitter:description",
        content:
          "বাংলাদেশের কৃষকদের জন্য সামাজিক প্ল্যাটফর্ম — বাজার দর, বিনিময়, রোগ শনাক্ত ও সংবাদ।",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9edbdc7f-1f8e-4740-9934-df7391e67e49/id-preview-3c5cd3a0--8650a8d8-8f85-4dd3-b151-3b951324aae3.lovable.app-1779703405092.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9edbdc7f-1f8e-4740-9934-df7391e67e49/id-preview-3c5cd3a0--8650a8d8-8f85-4dd3-b151-3b951324aae3.lovable.app-1779703405092.png",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AppErrorBoundary>
        <UserProvider>
          <SidebarProvider>
            <AppLayout>
              <Outlet />
            </AppLayout>
          </SidebarProvider>
          <PWAManager />
          <Toaster richColors position="top-center" />
        </UserProvider>
      </AppErrorBoundary>
    </QueryClientProvider>
  );
}
