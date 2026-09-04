# Krishok Bondhu — Project State

> Living document (§38 of project master prompt). Last updated 2026-09-04, post security hotfix.
> Source: full-repo inspection + verification (`tsc`, `eslint`, `git`). No invented status.

## Completed

- Auth (email/pass, phone OTP, Google), profile completion, district gate, roles (farmer/expert/moderator/admin).
- Dashboard (weather + advisory widgets), social feed (posts, threaded replies, reactions, comments, saved posts).
- Prices (community + DAM govt import), price prediction + history + alerts + accuracy backtest.
- Exchange marketplace + ad wizard; disease detection (Kimi vision) + history.
- Farmer directory, connections, friends, DMs (gated, realtime, receipts); notifications (realtime + push).
- Weather (Open-Meteo + alert fanout); crop planner wizard + my-plans; crop guide + diary + reminders.
- Vegetable guide (27+ crops), organic fertilizer + pesticide guides, NPK calculator, calendar.
- AI Bondhu chat (RAG cache, feedback), soil analysis + SRDI report extraction, voice transcription.
- Admin suite (11 sections) + moderation queue; PWA (install, offline, push) in Bengali, mobile-first.
- **2026-09-04 hotfix:** `.env` untracked + `.gitignore` + `.env.example`; all 5 cron webhooks gated
  (`src/lib/cron-auth.server.ts`); additive `Mods delete any price` RLS policy.

## In Progress (manual follow-ups — agent cannot do these)

1. Rotate Supabase anon/publishable key (old key in git history + old migration JWTs) → update hosting env.
2. Set `CRON_SECRET` in hosting env + Supabase vault; update `cron.schedule()` headers to send
   `x-cron-secret`; then remove legacy `apikey` acceptance in `src/lib/cron-auth.server.ts`.
3. Review + commit the hotfix (`git status`: staged `.env` deletion, modified `.gitignore` + 5 hooks,
   untracked `.env.example`, `cron-auth.server.ts`, migration, `docs/`).

## Broken

- Admin price deletion fails until migration `20260904000000_price_moderation_policy.sql` is applied
  (no mods/admin DELETE policy on `prices` in production yet).
- `npx tsc --noEmit`: 19 pre-existing errors in untouched files (`src/lib/mcp/*` missing
  `@lovable.dev/mcp-js` types + implicit `any`; `date-fns` `subDays`/`startOfDay`/`locale` mismatches
  in `admin.analytics`, `admin.index`, `price-prediction.history`). Not caused by hotfix.

## Missing

- Tests: 0 in `src`, no runner, no `test`/`typecheck` scripts. No CI workflows, no README.
- Checked-in `pg_cron` schedules exist only for `market-prices-daily` + `crop-reminders-daily`;
  `weather-alerts` / `send-scheduled-broadcasts` / `check-prediction-accuracy` rely on external scheduling.
- Dual lockfiles (`bun.lock` + `package-lock.json`); `nitro@3.0.260603-beta` in prod.

## Technical Debt

- 10 routes 600–994 lines (crop-planner, profile, crop-diary, soil, prices, feed, …); no route splitting.
- 100+ `as any/never` casts; `no-unused-vars: off`, `noUnusedLocals/PARAMETERS: false`.
- Duplication: profile-fetch fallback (profile vs public profile), `getSession()` in 10+ places,
  `admin_actions` inserts in 8 files, near-duplicate connections migrations.
- 47 `console.*`, 4 blocking `confirm()` dialogs, single global error boundary.
- `select("*")` in 15+ places; admin analytics aggregates 2000–5000 rows client-side.

## Security Issues

- [x] FIXED (code): `.env` tracked → untracked + ignored + example (rotation still manual, see above).
- [x] FIXED (code): 3 fully-open webhooks → gated; `crop-reminders` fail-open → fail-closed.
- [x] FIXED (migration, unapplied): admin price moderation RLS gap.
- [ ] OPEN: anon key in git history + old migrations (needs rotation).
- [ ] OPEN: legacy `apikey` webhook acceptance until cron headers migrated (public key by design).
- [ ] VERIFY: `user_roles` SELECT widened over time — confirm least-privilege holds for anon.
- RLS otherwise sound (admin-only broadcasts/actions/roles; owner-only private data; service_role-only AI cache/weather dedupe).

## Performance Issues

- Server bundle dominated by `recharts` (559KB) + `react-dom` (499KB); `master-crop-data.ts` 159KB sync;
  heavy deps (framer-motion, day-picker, 25 Radix pkgs) loaded eagerly — needs lazy-loading + analyzer.
- PWA caches `*.supabase.co` NetworkFirst 24h — stale + privacy risk for user data; scope to public tables.
- Client-side analytics aggregation + `limit(300–1000)` queries; move to SQL/RPC aggregates.

## Recommended Next Tasks (priority order per §39)

1. Manual: key rotation + `CRON_SECRET` rollout + commit (In Progress above).
2. Test + typecheck scaffolding (vitest, scripts, smoke tests for cron-auth + ServerFns).
3. Fix 19 pre-existing `tsc` errors (mcp types, date-fns v4 API).
4. Move admin client-side writes to ServerFns; RLS policy tests.
5. Bundle diet: lazy `recharts`/heavy routes, SQL aggregates for admin analytics, scope PWA Supabase cache.
