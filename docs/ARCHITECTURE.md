# Krishok Bondhu — Architecture

> Living document (§37 of project master prompt). Update after major architectural changes.
> Based on repository inspection 2026-09-04. Stack: React 19 + TanStack Start/Router/Query + Supabase + Tailwind/shadcn.

## 1. Application architecture

File-based full-stack app. No separate backend; server logic lives in TanStack Start
`createServerFn` RPCs (`src/lib/*.functions.ts`) and 5 cron webhook routes
(`src/routes/api/public/hooks/*`), deployed on Nitro/Cloudflare Workers (`src/server.ts`, `wrangler.jsonc`).

```
USER
 ↓  (Bengali, mobile-first UI — Tailwind + shadcn + lucide, Tiro Bangla)
UI routes (src/routes/*, TanStack Router file-based, ~60 routes)
 ↓
Components (src/components/krishi/* domain, src/components/ui/* shadcn)
 ↓
Hooks (src/hooks/*: use-feed, use-exchanges, use-direct-messages, use-notifications, use-role, …)
 ↓
React Query (stale 5m, gc 10m, retry 2 exp; no refetchOnWindowFocus) — QueryClient in src/router.tsx
 ↓
Services/API: createServerFn RPCs (src/lib/*.functions.ts) with auth-attacher injecting the Supabase Bearer token
 ↓
Supabase (Postgres + PostgREST + Auth + Storage + pg_cron + Realtime)
 ↓
Database / Storage buckets (avatars, feed-images, exchange-images)
```

App shell (`src/routes/__root.tsx`): `QueryClientProvider > AppErrorBoundary >
UserProvider > SidebarProvider > AppLayout + PWAManager + Toaster`. Single global
`UserProvider` (`src/contexts/user-context.tsx`) is the only React context; everything
else is React Query. Rule: UI → hook → query/mutation → service → Supabase; no raw
Supabase calls mixed into presentation components for new code.

## 2. Data flow per domain

| Domain         | Route(s)                                                                                                | Hook / Service                                                                                 | Tables                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Auth/profile   | `/login`, `/register`, `/` gate                                                                         | `UserProvider`, `use-auth`, `use-role`                                                         | `profiles`, `user_roles`                                                                                |
| Social feed    | `/feed`                                                                                                 | `use-feed` (paginated, 10/page), `use-post-reactions`                                          | `posts`, `post_likes`, `post_reactions`, `post_comments`                                                |
| Prices         | `/prices`, `/price-prediction*`                                                                         | ServerFns `getPricePrediction/setPriceAlert`                                                   | `prices`, `govt_prices`, `price_predictions`, `price_alerts`                                            |
| Exchange       | `/exchange`                                                                                             | `use-exchanges`, `new-ad-wizard`                                                               | `exchanges`                                                                                             |
| Connections/DM | `/farmers`, `/friends`, `/connections`, `/messages*`                                                    | `use-connections`, `use-direct-messages`                                                       | `connections`, `direct_messages`                                                                        |
| Farming        | `/crop-planner*`, `/crop-guide*`, `/crop-diary`, `/vegetable-guide*`, `/organic-fertilizer`, `/weather` | Static guides in `src/data/` + ServerFns                                                       | `user_crop_plans`, `crop_diary_entries`, `crop_reminders`, `crop_task_completions`                      |
| Disease        | `/disease-detection`, `/profile/disease-history`                                                        | ServerFn `analyzeDisease` (Kimi vision)                                                        | `disease_history`                                                                                       |
| AI chat        | `/ai-bondhu/*` (hub, chat, disease, soil, pesticide, calendar, calculator)                              | ServerFns `chatWithAI`, `analyzeSoil`, `extractSoilReport`, `transcribeAudio`                  | `ai_chat_cache`, `chat_sessions`, `saved_calculations`                                                  |
| Admin          | `/admin/*` (11 subroutes), `/moderation`                                                                | Direct Supabase client + RLS; privileged ops via ServerFns (`hardDeleteUser`, `getCacheStats`) | `admin_actions`, `user_reports`, `notification_broadcasts`, `pro_subscriptions`, `revenue_transactions` |

## 3. Authentication & authorization

- Supabase Auth: email/password + phone OTP + Google OAuth (`@lovable.dev/cloud-auth-js`).
- Session → `UserProvider` loads `profiles` + phone via `get_my_phone` RPC.
- Roles (`user_roles`, enum `farmer|expert|moderator|admin`) read via `use-role`; auto-assigned `farmer` on signup trigger.
- Server RPCs use `requireSupabaseAuth` (`src/integrations/supabase/auth-middleware.ts`,
  user-scoped client, RLS enforced). Privileged ops use `supabaseAdmin` (service_role,
  server-only — never imported by client code).
- Admin pages redirect non-admins client-side, but enforcement is RLS: admin-only
  policies on broadcasts/actions/roles; mods/admin delete-any on posts/comments/exchanges/prices.
- Cron webhooks: `src/lib/cron-auth.server.ts` — preferred `x-cron-secret: CRON_SECRET`,
  legacy `apikey` accepted transitionally (see docs/PROJECT_STATE.md follow-ups).

## 4. Supabase

- 32 tables (canonical types: `src/integrations/supabase/types.ts`), 44 migrations in
  `supabase/migrations/`. RLS enabled everywhere; `SECURITY DEFINER` RPCs for
  connections, phones (`get_my_phone`, `get_connected_farmer_phone`, …), price history,
  AI cache search.
- `pg_cron` schedules `market-prices-daily` and `crop-reminders-daily` (POST with apikey
  header). `weather-alerts`, `send-scheduled-broadcasts`, `check-prediction-accuracy`
  are documented as cron-driven but have no checked-in schedule — external/manual.
- DB triggers fan out `notifications` (likes, reactions, comments, price drops,
  connections, DMs). Realtime enabled for prices/exchanges/posts/notifications/DMs.
- Storage: `avatars`, `feed-images`, `exchange-images` (public; folder = `auth.uid()`).

## 5. PWA

`VitePWA` (`autoUpdate`, manual registration in `pwa-manager.tsx` with preview/iframe
guards) + `public/manifest.json` (standalone, `#2D6A4F`). Workbox: NetworkFirst for
pages + Supabase (24h), CacheFirst images (7d), SWR same-origin JS/CSS. `/offline`
fallback + `offline-banner`. Do not add a second service-worker system.

## 6. AI layer

All AI behind `src/lib/*.functions.ts` (chat, disease, soil, price-prediction,
transcribe) — never directly in components. Providers: Gemini 2.5 Flash (chat/soil +
`text-embedding-004` for RAG cache, cosine threshold 0.82, 30d TTL), Moonshot
`kimi-latest` (disease vision), Lovable Gateway (price reasoning, speech-to-text).
Trusted static knowledge lives in `src/data/` (master-crop-data, vegetable/fertilizer/
pesticide/farming guides) and is injected as context — AI output is never presented
as verified agricultural fact. Rate limit: disease analysis 10/hr; cost caps otherwise open.

## 7. Notification system

In-app `notifications` table + Web Push (`push_subscriptions` segmented by
district/upazila, VAPID via `web-push`, `src/lib/push.server.ts`). Client:
`use-notifications` (realtime) + `use-push-notifications` + `notification-toggle`.
Server fan-out: triggers + cron hooks (weather alerts deduped per district/day,
crop reminders 1/day, scheduled broadcasts in 500-row chunks, 3/user/day weather cap).

## 8. Admin architecture

`/admin` layout shell + sidebar, 11 subroutes (overview, users, prices, exchanges,
diseases, content, reports, notify, pro, analytics, audit) + `/moderation` for staff.
Writes go through RLS-gated client mutations where policies allow, ServerFns where
privilege is required. Audit trail: `admin_actions` rows on privileged operations.

## 9. Conventions

- UI Bengali-first; code/identifiers English. Forms: react-hook-form + zod (client) with
  server/DB validation authoritative. User content sanitized via `src/lib/sanitize.ts`
  (DOMPurify, no tags). User-facing errors in Bengali; no raw technical errors to farmers.
- Env: `VITE_*` public only; secrets server-only (`SUPABASE_SERVICE_ROLE_KEY`,
  `GEMINI_API_KEY`, `LOVABLE_API_KEY`, `KIMI_API_KEY`, `VAPID_*`, `CRON_SECRET`).
  `.env` is untracked — see `.env.example`. Never commit secrets; rotate if leaked.
- Minimal dependencies; no giant components for new code (separate presentation/data/logic).
- Checks: `npx tsc --noEmit`, `npx eslint <touched files>`, `vite build`. No test runner yet.
