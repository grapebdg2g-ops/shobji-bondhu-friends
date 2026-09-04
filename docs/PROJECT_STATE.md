# Krishok Bondhu — Project State

> Living document (project master prompt §38). Last updated 2026-09-04 — P0 audit + approved P0-1…P0-6
> implemented in code (4 DB migrations ready, UNAPPLIED; anon-key rotation + history purge still manual).
> Method: full-repo inspection + 4 parallel deep-dives (RLS, secrets, auth/IDOR, AI) + verified runs
> (`tsc`, `eslint`, `prettier --check`, `npm run build`, `npm ls`, `git` history). No invented status.
> No secret values are recorded here — key names, paths and line numbers only.
> Canonical location: `docs/PROJECT_STATE.md`. Architecture companion: `docs/ARCHITECTURE.md`.

## 1. Product vision

Farmer-focused, mobile-first, Bengali-first digital platform for real-world Bangladeshi farmers:
agricultural services, market prices, community, and AI assistance. Designed for low-end Android
phones, slow networks, limited data and limited digital literacy. Long-term: reliable, scalable,
API-driven, AI-ready, production-ready. (Source: project master prompts.)

## 2. Current architecture

File-based full-stack app, no separate backend. `USER → Bengali mobile UI (Tailwind+shadcn) →
routes (~60, TanStack Router) → krishi/ui components → hooks → React Query (stale 5m) →
createServerFn RPCs (src/lib/*.functions.ts, Bearer auto-attached) → Supabase
(Postgres/PostgREST/Auth/Storage/pg_cron/Realtime) → 32 tables + 3 public buckets`.
Server entry `src/server.ts` (branded error pages) on Nitro/Cloudflare Workers (`wrangler.jsonc`).
Single global context (`UserProvider`); all AI behind `src/lib/*.functions.ts`, never in components.
Details: `docs/ARCHITECTURE.md`.

## 3. Technology stack

React 19.2, TypeScript strict, Vite 7.3.6, TanStack Start 1.167 / Router / Query 5,
Supabase JS 2.106, Tailwind 4.2 + shadcn (49) + lucide, react-hook-form + zod, DOMPurify,
vite-plugin-pwa + workbox, web-push (VAPID), framer-motion, recharts 2.15, date-fns 4.1,
AI: Gemini 2.5 Flash + text-embedding-004, Moonshot kimi-latest (vision), Lovable Gateway
(gemini-3-flash-preview, gpt-4o-mini-transcribe). No test runner. `bun.lock` + `package-lock.json`
both present. Hosting: Cloudflare Workers + Lovable preview; Supabase project ref in
`supabase/config.toml` and `.env` (untracked since 2026-09-04 hotfix).

## 4. Existing features

Auth (email/pass, phone OTP, Google) + profile completion + district gate + roles.
Dashboard (weather/advisory widgets). Social feed (posts, threaded replies, reactions, comments,
saved posts). Prices (community + DAM import) + prediction/history/alerts/accuracy backtest.
Exchange marketplace + wizard. Disease detection + history. Directory/connections/friends/DMs
(gated, realtime, receipts). Notifications (realtime + push). Weather + alert fanout. Crop planner

- my-plans, crop guide, crop diary + reminders. Vegetable guide (27+ crops), organic fertilizer +
  pesticide guides, NPK calculator, calendar. AI Bondhu (chat RAG, soil analysis + SRDI extract,
  voice). Admin suite (11 sections) + moderation. PWA install/offline/push, Bengali mobile-first.

## 5. AI architecture

`User → ai-chat-view.tsx → ServerFn (requireSupabaseAuth) → user context (profile crops/district,
season) → crop/disease detect (regex) → embedding (single-turn only) → search_cache (0.82) →
hit? serve+count : callGemini (system prompt with chemical-safety rules + master-data context) →
insert ai_chat_cache with crop+district scope (30d TTL) → suggestFollowUps (2nd LLM call) →
render with সংরক্ষিত/AI source badge → feedback (one vote per user, counters recomputed)`.
Endpoints: `chatWithAI`, `recordCacheFeedback`, `suggestFollowUps` (`chat.functions.ts`);
`analyzeDisease` 10/hr (`disease.functions.ts`, Kimi); `analyzeSoil` (+deterministic fallback) and
`extractSoilReport` (`soil.functions.ts`, Gemini); `getPricePrediction` 6h cache + `setPriceAlert`
(`price-prediction.functions.ts`, Lovable); `transcribeAudio` (`transcribe.functions.ts`, Lovable).
Cache helpers service_role-only (`20260704160855`) — exemplary at DB layer. Static pesticide guide
is DAE-grounded with PHI/PPE + disclaimers; soil doses computed deterministically from BARI tables
and Gemini is pinned to them. Full safety evaluation: §13.

## 6. Database architecture

32 tables, RLS ON everywhere, 45 migrations (`supabase/migrations/`), canonical types in
`src/integrations/supabase/types.ts`. Groups: identity (`profiles`, `user_roles`), social
(`posts`, `post_likes`, `post_reactions`, `post_comments`, `muted_users`, `user_reports`),
market (`prices`, `govt_prices`, `price_predictions`, `price_alerts`, `exchanges`),
graph/DM (`connections`, `direct_messages`), farming (`user_crop_plans`, `crop_diary_entries`,
`crop_reminders`, `crop_task_completions`, `disease_history`), AI (`ai_chat_cache`,
`chat_sessions`, `saved_calculations`), platform (`notifications`, `notification_broadcasts`,
`push_subscriptions`, `weather_alerts_sent`, `pro_subscriptions`, `revenue_transactions`,
`admin_actions`, `app_installs`, `feature_waitlist`). Triggers fan out `notifications`;
Realtime on prices/exchanges/posts/notifications/DMs. `pg_cron` schedules `market-prices-daily`

- `crop-reminders-daily` (apikey header); 3 other hooks have no checked-in schedule.
  `SECURITY DEFINER` RPCs gate phones (`get_connected_farmer_phone` exemplary), connections, DMs,
  price history, cache search. Storage buckets (public): `avatars`, `feed-images`,
  `exchange-images`; writes scoped to `auth.uid()` folder; public SELECT policies were dropped in
  `20260701080543` (CDN reads unaffected, API list/download denied — confirm intentional).

### RLS / GRANT matrix (effective state per migrations; verify live DB — see P0-2)

| TABLE                   | RLS | SELECT                                                              | INSERT                                 | UPDATE                                        | DELETE                                             | RISK                                                                                             | RECOMMENDATION                                            |
| ----------------------- | --- | ------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| profiles                | ON  | authed `USING(true)`; anon denied (no policy); phone column revoked | own (`auth.uid()=id`)                  | own, no WITH CHECK; admin any                 | NONE                                               | P0: owner can write `is_verified/is_suspended/expert_*/*_count/phone` (P0-1). Missing DML GRANTs | Column REVOKE + WITH CHECK; add GRANTs                    |
| user_roles              | ON  | own row or staff (fixed from `USING(true)`)                         | admin only                             | admin only                                    | admin only                                         | LOW; `has_role` callable by anon (oracle)                                                        | Keep; consider REVOKE anon EXECUTE                        |
| prices                  | ON  | public `USING(true)`; SELECT grant ok                               | own                                    | own                                           | own + mods/admin (20260904, unapplied)             | P0-verify: NO DML GRANTs (P0-2); no admin UPDATE; no `is_active_user`                            | Add GRANTs; admin UPDATE; suspension check                |
| exchanges               | ON  | authed active-or-own; SELECT grant ok                               | own + active-user                      | own                                           | own + mods/admin                                   | P0-verify: NO DML GRANTs; `get_exchange_phone` open to any authed (P0-3)                         | Add GRANTs; gate phone RPC                                |
| posts                   | ON  | public `USING(true)`                                                | own + active-user                      | own                                           | own + mods/admin                                   | P0-verify: NO GRANTs at all; counters callable by any authed                                     | Add GRANTs; lock counter RPCs                             |
| post_likes              | ON  | public                                                              | own (no suspension check)              | — (immutable, good)                           | own (no mod delete)                                | P0-verify: NO GRANTs; suspended can like                                                         | Add GRANTs; suspension check                              |
| post_comments           | ON  | public                                                              | own + active-user                      | NONE (no edit)                                | own + mods/admin                                   | P0-verify: NO GRANTs; no own-UPDATE                                                              | Add GRANTs; add own-UPDATE or document                    |
| post_reactions          | ON  | public + anon SELECT grant (only table, good)                       | own + active-user                      | own + active-user                             | own (no mod delete)                                | LOW                                                                                              | Add mods delete                                           |
| disease_history         | ON  | own + staff view-all                                                | own                                    | NONE                                          | own                                                | P0-verify: NO GRANTs; no own-UPDATE                                                              | Add GRANTs + own-UPDATE                                   |
| notifications           | ON  | own                                                                 | admin broadcast only (triggers bypass) | own (no WITH CHECK)                           | own                                                | P0-verify: NO GRANTs                                                                             | Add GRANTs; WITH CHECK on UPDATE                          |
| notification_broadcasts | ON  | admin                                                               | admin + own admin_id                   | admin                                         | admin                                              | LOW (sound)                                                                                      | Optional admin_id check on UPDATE                         |
| admin_actions           | ON  | admin                                                               | admin + own admin_id                   | — (append-only, good)                         | — (good)                                           | NONE                                                                                             | No change                                                 |
| user_reports            | ON  | own + mods view-all                                                 | own + active-user                      | mods                                          | admin                                              | LOW; missing reporter_id index                                                                   | Add index                                                 |
| muted_users             | ON  | own                                                                 | own (+self-check)                      | — (UPDATE granted, no policy → always denies) | own                                                | LOW (grant/policy mismatch)                                                                      | REVOKE UPDATE or add policy                               |
| pro_subscriptions       | ON  | own + admin view-all                                                | admin only                             | admin only                                    | admin only                                         | P1 if self-checkout expected; grants ok                                                          | Confirm writer is service_role/admin                      |
| revenue_transactions    | ON  | own + admin view-all                                                | admin only                             | admin only                                    | admin only                                         | Same as above                                                                                    | Same confirmation                                         |
| feature_waitlist        | ON  | own                                                                 | own                                    | — (granted, no policy)                        | own                                                | LOW (mismatch)                                                                                   | REVOKE UPDATE or add policy                               |
| saved_calculations      | ON  | FOR ALL own (exemplary)                                             | —                                      | —                                             | —                                                  | NONE                                                                                             | No change                                                 |
| price_alerts            | ON  | FOR ALL own                                                         | —                                      | —                                             | —                                                  | NONE                                                                                             | Optional user index                                       |
| price_predictions       | ON  | authed `USING(true)`                                                | service_role only                      | —                                             | —                                                  | MEDIUM: `user_id` col unscoped if personalized                                                   | Scope or keep public-only                                 |
| govt_prices             | ON  | authed `USING(true)`                                                | service_role only                      | —                                             | —                                                  | LOW; anon revoked from `get_price_history`                                                       | Decide anon chart path                                    |
| user_crop_plans         | ON  | FOR ALL own                                                         | —                                      | —                                             | —                                                  | NONE                                                                                             | No change                                                 |
| crop_task_completions   | ON  | FOR ALL own                                                         | —                                      | —                                             | —                                                  | P3: `plan_id` not ownership-checked; UNIQUE excludes user_id (DoS)                               | Ownership check + UNIQUE(user_id,plan_id,task_id) + index |
| crop_diary_entries      | ON  | FOR ALL own                                                         | —                                      | —                                             | —                                                  | P3: same plan_id link gap                                                                        | Same ownership check                                      |
| crop_reminders          | ON  | FOR ALL own                                                         | —                                      | —                                             | —                                                  | P3: same plan_id link gap                                                                        | Same ownership check                                      |
| chat_sessions           | ON  | own (4 policies)                                                    | own                                    | own                                           | own                                                | NONE                                                                                             | No change                                                 |
| ai_chat_cache           | ON  | NONE (service_role only, exemplary)                                 | NONE                                   | NONE                                          | NONE                                               | P0 via ServerFn: global write + unscoped serve + feedback replay (P0-4/5/6)                      | Scope cache; vote dedupe                                  |
| connections             | ON  | participant-only                                                    | RPC only (no INSERT grant, good)       | RPC only                                      | participant direct DELETE bypasses cancel workflow | MEDIUM                                                                                           | Tighten/revoke direct DELETE                              |
| direct_messages         | ON  | connected + participant                                             | connected + sender=auth                | RPC only (good)                               | — (immutable, good)                                | LOW                                                                                              | No change                                                 |
| app_installs            | ON  | own (anon-safe pattern)                                             | anyone own-or-null (good)              | —                                             | —                                                  | P0-verify: NO GRANTs                                                                             | Add anon+authed grants                                    |
| push_subscriptions      | ON  | own (4 policies)                                                    | own                                    | own                                           | own                                                | P0-verify: NO GRANTs                                                                             | Add grants                                                |
| weather_alerts_sent     | ON  | admin view                                                          | — (cron/service_role)                  | —                                             | —                                                  | NONE (secure)                                                                                    | Add SELECT grant for admin reads                          |

RLS-supporting indexes are good (user_id composites, connection pairs, unread partial).
Missing: `(user_id)` on posts/prices/exchanges/post_comments/post_likes/user_reports/crop_task_completions.

## 7. Authentication

Supabase Auth (email/pass, phone OTP, Google via `@lovable.dev/cloud-auth-js`).
`client.ts` persists + auto-refreshes; `UserProvider` loads profile + `get_my_phone`, caches 5m.
Server RPCs use `requireSupabaseAuth` (`getClaims` signature/expiry check, user-scoped client —
sound). Gaps: no email-verification enforcement, no suspension/role check in middleware
(revocation lags 60s–5m), district gate + all route guards are client `useEffect` (flash + bypass
by direct navigation), Google OAuth/session mixing can stall login (`login.tsx:51-58`), session in
localStorage (+brokered postMessage on preview zones).

## 8. Authorization

Roles via `user_roles` + `has_role()`; UI guards (`admin.tsx`, `moderation.tsx`) are client-only.
Only `hardDeleteUser`/`getCacheStats` re-check admin server-side. All other admin/moderation
writes rely solely on RLS — verified SAFE today except P0-1 (self-verify/unsuspend defeats all
suspension logic) and P0-3 (phone RPC). IDOR: DMs/notifications/plans/alerts/history/sessions
all owner-or-connection enforced (verified safe); `u/$userId` exposes safe columns only;
`profile.update` blocks cross-user but not self-privilege writes (P0-1). `has_role` granted to
anon (user-enumeration oracle, P2). Suspension (`is_active_user`) enforced on only 4 INSERT paths
(posts/comments/exchanges/reactions/reports) — prices, DMs, connections, updates/deletes uncovered.

## 9. PWA

`VitePWA` autoUpdate + manual `pwa-manager.tsx` (preview/iframe guards, visit-count install
prompt, permission + `app_installs` logging), `manifest.json` (standalone, #2D6A4F), `/offline`
fallback + banner, VAPID push with district/upazila segmentation. Workbox: pages + Supabase
NetworkFirst 24h, images CacheFirst 7d, JS/CSS SWR. Risks: Supabase 24h cache spans private data
(scope to public), single global error boundary, no per-route boundaries.

## 10. Community system

Feed (`use-feed`, 10/page, district/crop/type filters), threaded replies, reactions with picker,
comments, sanitized rendering (DOMPurify strict — good), reporting + mute/block + moderation queue.
Gaps: unbounded counter RPCs (`increment_likes/comments` — any authed, P2), reactions lack mod
delete, comments lack edit, `get_public_connected_farmers` leaks friend lists to any authed (P2),
DM presence room leaks online/typing (P3). Never load huge feeds — pagination already in place.

## 11. Admin system

`/admin` shell + sidebar, 11 subroutes + `/moderation`, client-gated, RLS-enforced (P0-1/P0-3 fixed
in `20260904010100`/`20260904010200`, unapplied), audit trail via `admin_actions`, server-checked
deletes only for hard user delete. Fragile-by-construction (single policy regression = takeover) +
pre-fetch before redirect. Prices mod-delete + full GRANT repair in `20260904000000`/`20260904010000`
(unapplied). Analytics aggregates 2–5k rows client-side.

## 12. Agricultural knowledge system

Trusted static data in `src/data/` (master-crop 159KB, vegetable/fertilizer/pesticide/farming
guides, bd-locations) versioned with code and injected as AI context — correctly separated from AI
output. Soil doses deterministic from BARI tables; static pesticide guide is DAE-grounded with
PHI/PPE + officer referral. P0-4 implemented: chat/disease prompts now bound to DAE-label doses with
mandatory PHI/PPE + severity referral + agri-only scope + instruction-hierarchy rule; chat renders
সংরক্ষিত/AI source badge; disease result shows confidence + AI disclaimer. Remaining gaps:
no versioning/update channel for static guides independent of deploys.

## 13. Security findings

SECURITY INCIDENT (committed secrets — values never printed here):

- Supabase publishable/anon JWT + URL committed in `.env` blobs (`8249a3e,5e207a3,7a0b5a7`;
  deleted from HEAD in hotfix commit but retained in history). Same key live today. ROTATION REQUIRED.
- Same anon JWT hardcoded in 3 live migrations (`20260818082339:9`, `20260827160000:144`,
  `20260827163322:135`) as pg_cron `apikey` headers. ROTATION REQUIRED (then vault + `x-cron-secret`).
- No evidence service_role/Gemini/Lovable/Kimi/VAPID-private/cron-secret VALUES were ever committed
  (only code refs + empty `.env.example`). No rotation needed for those; keep out of git.
- `VITE_*` surface is public-only (`VITE_SUPABASE_URL/PUBLISHABLE_KEY`); no secret uses `VITE_`.
- No server-only import leaks into browser bundles (all `.server` imports are in server handlers;
  two top-level static imports in `admin.functions.ts:4`, `weather.functions.ts:5` reachable via
  ServerFn stubs — refactor to dynamic import, P1).
- [x] P0-1 self-verify/self-unsuspend/fake-expert — fixed by trigger `trg_protect_profile_privileged_columns`
  - WITH CHECK (`20260904010100`, unapplied). Admin client updates still pass via `has_role` bypass.
- [x] P0-2 GRANT repair migration ready (`20260904010000`, unapplied). Live-DB verification
      (`role_table_grants`) still recommended before/after apply.
- [x] P0-3 `get_exchange_phone` gated on ownership/accepted-connection (`20260904010200`, unapplied).
- [x] P0-5/P0-6 cache crop+district scoping + one-vote-per-user with recomputed counters
      (`20260904010300`, unapplied; `chat.functions.ts` updated to pass crop/district/voter).
- [x] P0-4 prompt bounds + severity default `low` + KIMI env fallback + provenance/confidence UI.
- [ ] P0-7 rotation/purge/vault (manual — code removal of legacy `apikey` path deliberately deferred
      until cron headers send `x-cron-secret`, otherwise live jobs break).
- Cron webhooks gated (hotfix) but legacy public `apikey` still accepted until vault migration.
- XSS posture good (DOMPurify strict; single safe `dangerouslySetInnerHTML` in `chart.tsx:73`).

## 14. Performance findings

Server bundle: recharts 559KB + react-dom 499KB dominate; `master-crop-data.ts` 159KB sync;
framer-motion/day-picker/25 Radix eager — needs lazy + analyzer. `select("*")` 15+ places;
admin analytics client-aggregates thousands of rows (move to SQL/RPC). Missing `(user_id)`
indexes on 6 hot tables (RLS seq-scan risk at scale). PWA Supabase cache over-broad (see §9).
Chat steady-state = 1 embedding + 4096-token chat + 200-token suggest call per turn, no timeouts
(Workers isolate risk). Otherwise sound: pagination, image compression (0.5–1MB caps client-side),
5m query cache, 6h price cache, realtime instead of polling.

## 15. Testing status

Zero tests in `src`; no runner (vitest/jest/playwright), no `test`/`typecheck` scripts.
`npx tsc --noEmit`: 19 pre-existing errors (`@lovable.dev/mcp-js` not installed; date-fns v4 API
breaks in 3 admin/price files). `npx eslint .`: 37,297 problems = 37,252 repo-wide CRLF prettier
errors + 31 `no-explicit-any` + 8 react-refresh warnings + 4 prefer-const + 2 exhaustive-deps +
1 no-empty. `prettier --check .`: 211 files fail (CRLF). `npm run build`: SUCCESS (30s, PWA 154
entries/4.4MB). `npm ls`: 3 dep problems — `@lovable.dev/mcp-js` MISSING, `zod` 3.25.76 installed
vs `^4.4.3` required, `@lovable.dev/vite-tanstack-config` 2.7.0 vs 2.13.1 required (stale
node_modules; build still passes).

## 16. Known bugs

- Admin price delete + broader core-table access fail until `20260904000000` + `20260904010000`
  applied (verify live GRANTs first).
- tsc 19 errors + zod/vite-tanstack-config version drift + missing mcp-js (§15).
- Price errors surface in English to Bengali UI; raw Zod throws (`price-prediction.functions.ts`).
- Disease unknown-severity now defaults `low`; confidence + AI disclaimer shown in main flow.
- Soil 10MB-vs-12MB message mismatch; `upazila` validated but unused in price flow; chat/disease
  timezone uses server-local month vs Asia/Dhaka in price.
- DM presence leaks typing/online; `crop_task_completions` UNIQUE allows cross-user task DoS (P3).
- Google OAuth/session mixing can stall on login page.

## 17. Technical debt

10 routes 600–994 lines; 100+ `as any/never`; `no-unused-vars:off`, `noUnusedLocals:false`;
duplicated profile-fetch fallback, 10+ `getSession()` call sites, `admin_actions` inserts ×8,
duplicate connections migrations; 47 `console.*`, 4 blocking `confirm()`; single error boundary;
git history has 12+ vague `Changes` commits; dual lockfiles; nitro beta in prod.

## 18. Production readiness

Build: PASS (post-P0, 30s). Deploys: Cloudflare + PWA pipeline working. Code: all P0-1…P0-6 fixed;
4 DB migrations await review + apply; SQL paths follow existing patterns but were NOT executed
against a live DB here. Remaining gates: apply migrations, verify live GRANTs, rotate anon key +
purge history (P0-7 manual), set `CRON_SECRET` + vault headers. Observability: none (console-only).
After those gates, solid release candidate; P1/P2 are hardening, not blockers.

## 19. Recommended priorities

P0-1…P0-6 implemented (code + 4 migrations, unapplied). Immediate next, in order:

1. Manual P0-7: rotate anon key, purge history, set `CRON_SECRET` + vault cron headers (then remove
   legacy `apikey` path in `cron-auth.server.ts`).
2. Review + apply the 4 migrations to staging first (`...010000` → `...010300` in order), verify live
   GRANTs/policies, smoke-test (register, post, price, exchange, chat, disease, admin delete).
3. Commit (P0 code + migrations + docs).
   Then P1: per-user AI rate limits + max_tokens + timeouts, `.server` dynamic imports, suspension
   coverage, admin ServerFn migration, tsc/dep repair, missing `(user_id)` indexes. Then P2/P3:
   English→Bengali error mapping, friend-list scoping, counter-RPC lockdown, CRLF normalization,
   tests + CI, bundle diet, SQL aggregates.
