# UX Consistency & Identity Sweep — Design Spec

**Date:** 2026-09-25
**Status:** Approved (pending user review of this document)
**Project:** কৃষক বন্ধু (Krishok Bondhu) — `C:\Users\Rajibul Hasan\Documents\GitHub\shobji-bondhu-friends`

## 1. Context and decisions

Brainstorming session decisions that shape this spec:

| Question | Decision |
|---|---|
| App stage | Pre-launch — first impressions and launch-readiness over fixing live-user friction |
| Device priority | Mobile-only. Desktop must not break, but gets no investment |
| Audience digital literacy | Comfortable with smartphones (Facebook/WhatsApp-level). Standard mobile patterns are fine |
| Budget | A few days — highest-payoff changes only |

Chosen direction: **Approach A + B** — page-states sweep (A) combined with a chrome-only token pass and typography/i18n polish (B). The first-run funnel (Approach C: login overhaul, onboarding tour, drawer IA) is deferred.

## 2. Goals

1. No route ever shows a blank screen, a silent failure, or English copy — every route has deliberate loading, empty, and error states in Bengali.
2. The navigation chrome (bottom nav, sidebar, widgets, chat, popups) uses the existing oklch design tokens, giving one coherent visual system and unblocking future dark-mode work.
3. Typography is purpose-split: a legible Bengali UI font for chrome, the existing serif for editorial content — self-hosted so the PWA renders correctly offline.

## 3. Non-goals (explicitly out of scope)

- Dark mode implementation (the token pass unblocks it; the existing `.dark` palette is blue-tinted and needs its own rework later — do not touch the `.dark` block in this sweep)
- Token cleanup inside route files (259 hardcoded hexes across 32 routes) — chrome components only
- Login/register overhaul, onboarding tour, landing page (no public landing exists; `/` is a redirect router)
- Drawer information-architecture restructure; merging the duplicate `crop-guide.*` / `vegetable-guide.*` systems
- Voice input, trust badges, Bengali-numerals toggle, any new features
- Any change to data logic, queries, or server functions — **UI states and styling only**

## 4. Workstream A — Page-states sweep

### 4.1 Components (no changes needed — reuse as-is)

The existing components already have the right APIs and are token-based:

- `EmptyState` (`src/components/krishi/empty-state.tsx`) — `icon`, `title`, `description`, `action` (optional primary action slot)
- `ErrorMessage` (`src/components/krishi/error-message.tsx`) — `title`, `description`, `onRetry`; retry button with Bengali label "আবার চেষ্টা করুন" is built in
- `LoadingSpinner` (`src/components/krishi/loading-spinner.tsx`) — `label` (default "লোড হচ্ছে..."), `size`
- `PriceCardSkeleton` (`src/components/krishi/price-card-skeleton.tsx`) — card-grid skeletons

### 4.2 Per-route pattern assignment

Every route gets exactly one of three patterns, by route type:

**Pattern 1 — List/marketplace routes** (data lists that can be empty):
skeletons while loading → `EmptyState` (with optional `action`) when the list is empty → `ErrorMessage` with `onRetry` wired to the React Query `refetch` on failure.

Applies to: `connections`, `farmers`, `friends`, `messages`, `messages.$userId`, `crop-diary`, `crop-planner.my-plans`, `profile.disease-history`, `price-prediction.history`, `vegetable-guide.index`, `moderation`, and the admin list routes (`admin.users`, `admin.exchanges`, `admin.reports`, `admin.content`, `admin.diseases`, `admin.prices`, `admin.audit`). Six routes already have partial states and get audited for the missing third: `feed`, `exchange`, `notifications`, `prices`, `profile.index`, `u.$userId`.

**Pattern 2 — Tool/detail routes** (a single result, not a list):
`LoadingSpinner` in-page while loading → inline `ErrorMessage` with retry on failure → no skeletons (skeleton shimmer on slow networks feels broken on tool pages). Empty state only where "no data" genuinely exists (e.g., price history with no records).

Applies to: `dashboard`, `weather`, all `ai-bondhu.*` routes, `disease-detection`, `price-prediction`, `crop-planner`, `crop-guide.*`, `organic-fertilizer`, `vegetable-guide.$slug`, `admin.index`, `admin.analytics`, `admin.notify`, `admin.pro`.

**Pattern 3 — Form/auth routes**: minimal — existing react-hook-form field errors plus a loading/disabled state on submit. No skeletons, no `EmptyState`. Applies to `login`, `register`, and forms inside other routes (new-ad wizard, create-post sheet).

### 4.3 Bengali copy conventions

- Every `EmptyState` gets a per-page Bengali `title` + one-line `description`; where a next step exists, an `action` button (e.g., exchange empty → "প্রথম বিজ্ঞাপন দিন").
- Copy drafts are written during implementation; **the user reviews all Bengali strings before the work is considered done** (implementation checkpoint, not a spec blocker).
- Error copy stays generic and honest: default `ErrorMessage` title ("সংযোগ সমস্যা, আবার চেষ্টা করুন") unless the route has a specific, user-meaningful failure description.

## 5. Workstream B1 — Chrome token pass

### 5.1 Scope

Convert hardcoded colors to semantic tokens in the 13 `src/components/krishi/` files — 102 occurrences total. Worst offenders: `ai-chat-view.tsx` (39), `direct-message-popup.tsx` (17), `app-sidebar.tsx` (12), `friends-preview.tsx` (8), `bottom-nav.tsx` (6).

Representative mapping (full mapping applied file-by-file during implementation):

| Current | Token |
|---|---|
| `bg-white`, `bg-white/95` | `bg-card` / `bg-card/95` |
| `text-gray-500` / `text-gray-400` | `text-muted-foreground` |
| `text-gray-800`, `text-gray-900` | `text-foreground` |
| `[#2D6A4F]` | `text-primary` / `bg-primary` (by context) |
| `[#D8F3DC]` | `bg-secondary` |
| `[#F0FFF4]` | `bg-muted` |
| `border-gray-200` | `border-border` |

Opacity variants map to token/opacity equivalents. Where no exact token exists, prefer the closest semantic token over keeping a hex.

### 5.2 Brand variable unification

`--brand-primary` (`#2D6A4F`), `--brand-accent` (`#52B788`), `--brand-surface` (`#F6FBF7`) and the hex-based gradient/shadow vars in `src/styles.css` are replaced by oklch values aligned with the existing token scale, leaving one source of truth. Gradients (`--gradient-brand`, `--gradient-soft`) and shadows remain as CSS vars but with oklch-aligned colors.

### 5.3 Explicit boundaries

- Route files are untouched (their 259 hexes are a separate later pass).
- The `.dark` block in `styles.css` is untouched.
- Expected visible change in light mode: none. This is coherence + groundwork.

## 6. Workstream B2 — Typography and i18n polish

### 6.1 Fonts

- Add `@fontsource/hind-siliguri` (weights 400/500/600/700) and `@fontsource/tiro-bangla` (400) as dependencies; import them in `src/styles.css`.
- `--font-sans` and `--font-display` → Hind Siliguri. New `--font-editorial` → Tiro Bangla, applied to long-form guide/article content (`vegetable-guide`, `crop-guide` body text, organic-fertilizer/pesticide guide prose).
- Remove the Google Fonts CDN `<link>` tags from `src/routes/__root.tsx` (lines ~97–101). Rationale: the PWA promises offline use; CDN fonts fail offline and add a blocking third-party request on slow rural networks.
- Font-display and fallbacks handled by @fontsource (`font-display: swap` equivalents, system-ui fallback stack unchanged).

### 6.2 Language and error surfaces

- `lang="bn"` on the `<html>` element in `src/routes/__root.tsx`.
- Bengali copy on TanStack Router's not-found surface (`notFoundComponent` in `__root.tsx`) — currently English 404 text.
- Audit server-branded error pages in `src/server.ts` for English copy; convert user-facing strings to Bengali.

### 6.3 Header unification

One rule, replacing today's mix of gradient `text-white` headers and token headers:

- **Keep gradients** (intentional brand surfaces): `index.tsx` splash, `login.tsx`, `register.tsx`, `offline.tsx`, dashboard hero in `dashboard.tsx`.
- **Convert to token headers** (`bg-card` / `text-foreground`): the 12 core browsing pages — `exchange`, `feed`, `prices`, `friends`, `farmers`, `notifications`, `weather`, `messages`, `u.$userId`, `profile.index`, `crop-diary`, `vegetable-guide.index`.
- Everything else (deep tool pages, admin) keeps its current header — no churn beyond the listed pages.

## 7. Verification

No test runner exists in the project; verification is:

1. `tsc` (strict) — clean
2. `eslint` — clean
3. `prettier --check` — clean
4. `npm run build` — succeeds
5. **Mobile-viewport screenshot sweep** (the real safety net, especially for the font swap): ~10 highest-traffic routes (`/dashboard`, `/prices`, `/exchange`, `/feed`, `/weather`, `/messages`, `/friends`, `/ai-bondhu/chat`, `/profile`, `/notifications`) checked for before/after visual parity in light mode, plus one verified render of each new loading/empty/error state.
6. User review of all drafted Bengali strings (workstream A checkpoint).

## 8. Risks

| Risk | Mitigation |
|---|---|
| Global font swap changes rendering app-wide (highest blast radius) | Screenshot sweep of top-10 routes before/after; user eyeballs the sweep |
| Skeletons misused on tool pages feel broken on slow networks | Pattern 2 mandates spinners, not skeletons, on tool/detail routes |
| Bengali copy tone misses the mark for the audience | User reviews all strings at the A-workstream checkpoint before sign-off |
| Token pass accidentally alters light-mode appearance | Token mapping is 1:1 with the existing oklch values; parity checked in the screenshot sweep |

## 9. Effort estimate

| Workstream | Estimate |
|---|---|
| A — states sweep (~34 routes) | ~2 days |
| B1 — chrome token pass (13 components) | ~1 day |
| B2 — fonts, lang, 404, headers | ~1 day |
| **Total** | **~4 days** |

Sequencing: B1 first (smallest, independent), then A, then B2 — B2 last so the font swap lands when the app is otherwise stable, minimizing screenshot-diff noise.
