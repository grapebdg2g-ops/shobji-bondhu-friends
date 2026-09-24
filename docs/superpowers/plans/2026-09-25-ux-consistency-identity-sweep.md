# UX Consistency & Identity Sweep — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every route renders deliberate Bengali loading/empty/error states; navigation chrome uses semantic design tokens; fonts are self-hosted with a UI/editorial split.

**Architecture:** Three independent workstreams executed in order B1 → A → B2: (1) convert 13 `src/components/krishi/` chrome components from hardcoded colors to the existing oklch semantic tokens; (2) wire the four existing state components into ~40 routes following three per-route patterns; (3) self-host fonts via @fontsource, set `lang="bn"`, Bengali 404 copy, and unify page headers. No test runner exists in this project — each task's test cycle is grep/typecheck/lint gates plus `npm run build` at workstream boundaries, and a final mobile-viewport screenshot sweep.

**Tech Stack:** React 19, TanStack Start/Router/Query 5, Tailwind v4 (`@theme inline` tokens in `src/styles.css`), shadcn/ui, Supabase, @fontsource.

**Spec:** `docs/superpowers/specs/2026-09-25-ux-consistency-identity-design.md`

## Global Constraints

- **All theme colors use oklch.** Never introduce hex colors, `bg-white`, `text-gray-*`, `bg-gray-*`, or `border-gray-*` in any file you touch. (Spec §5.1)
- **Do NOT modify the `.dark` block** in `src/styles.css`. Dark mode is out of scope. (Spec §3)
- **Route files' hardcoded hexes are out of scope** except the 12 header routes in Task 7 and the state JSX added in Tasks 8–13. Do not "fix" unrelated styling in route files. (Spec §3, §5.3)
- **All user-facing strings are Bengali.** Reuse existing Bengali copy where a route already has it; use the copy tables in this plan where copy is needed. Do not invent English UI text. (Spec §4.3)
- **UI states and styling only.** No changes to query logic, `queryFn`s, server functions, or data shapes. The only behavioral addition is `onRetry` wired to the existing React Query `refetch()`. (Spec §3)
- **Verification toolchain (per task):** `npx tsc --noEmit`, `npx eslint <changed files>`, `npx prettier --write <changed files>` then `--check`. Windows shell: use Git Bash. Package manager: **npm** (the repo has both lockfiles; npm is authoritative per `docs/PROJECT_STATE.md` verification runs).
- **Commit message style:** short imperative, e.g. `refactor: convert bottom nav to semantic tokens`.

---

### Task 1: Token pass — navigation chrome (bottom-nav, sidebar, layout)

**Files:**
- Modify: `src/components/krishi/bottom-nav.tsx` (6 hardcoded color occurrences)
- Modify: `src/components/krishi/app-sidebar.tsx` (12 occurrences)
- Modify: `src/components/krishi/app-layout.tsx` (audit; convert if present)

**Interfaces:**
- Consumes: semantic tokens already defined in `src/styles.css` (`--color-card`, `--color-primary`, `--color-muted-foreground`, `--color-border`, `--color-muted`, `--color-accent`).
- Produces: token-clean navigation chrome; zero visible change in light mode.

**Baseline check (before editing):**

```bash
cd "C:/Users/Rajibul Hasan/Documents/GitHub/shobji-bondhu-friends"
rg -n "#[0-9A-Fa-f]{3,8}\b|bg-white|text-gray|border-gray|bg-gray" src/components/krishi/bottom-nav.tsx src/components/krishi/app-sidebar.tsx src/components/krishi/app-layout.tsx
```

Expected: 18+ matches. Keep the count.

- [ ] **Step 1: Convert `bottom-nav.tsx`**

Exact replacements:

| Line (approx) | Before | After |
|---|---|---|
| nav className | `bg-white/95` … `border-gray-200` | `bg-card/95` … `border-border` |
| quick-actions panel | `border-white/70 bg-white/95` | `border-border/70 bg-card/95` |
| "দ্রুত কাজ" label | `text-gray-400` | `text-muted-foreground` |
| action rows | `text-gray-800` … `hover:bg-[#F0FFF4]` | `text-foreground` … `hover:bg-muted` |
| action icons | `bg-[#D8F3DC] text-[#2D6A4F]` | `bg-secondary text-primary` |
| TabBtn inactive | `text-gray-500` | `text-muted-foreground` |
| TabBtn active | `text-[#2D6A4F]` | `text-primary` |

Keep `style={{ background: "var(--gradient-brand)" }}` and the `env(safe-area-inset-bottom)` padding — those are intentional.

- [ ] **Step 2: Convert `app-sidebar.tsx` and `app-layout.tsx`**

Open each file. For every occurrence of `#[0-9A-Fa-f]{3,8}`, `bg-white`, `text-gray-*`, `bg-gray-*`, `border-gray-*`, apply the mapping table from the spec §5.1 (representative rows repeated here: `bg-white`→`bg-card`; `text-gray-400/500`→`text-muted-foreground`; `text-gray-800/900`→`text-foreground`; `[#2D6A4F]`→`text-primary`/`bg-primary` by context; `[#D8F3DC]`→`bg-secondary`; `[#F0FFF4]`→`bg-muted`; `border-gray-200`→`border-border`). Preserve all opacity suffixes (`/95`, `/25`) and all Bengali labels, badges, and `Link` targets untouched.

- [ ] **Step 3: Verify zero matches remain**

```bash
rg -n "#[0-9A-Fa-f]{3,8}\b|bg-white|text-gray|border-gray|bg-gray" src/components/krishi/bottom-nav.tsx src/components/krishi/app-sidebar.tsx src/components/krishi/app-layout.tsx
```

Expected: no output. If a match remains, convert it — do not suppress the rule.

- [ ] **Step 4: Toolchain gate**

```bash
npx tsc --noEmit
npx eslint src/components/krishi/bottom-nav.tsx src/components/krishi/app-sidebar.tsx src/components/krishi/app-layout.tsx
npx prettier --write src/components/krishi/bottom-nav.tsx src/components/krishi/app-sidebar.tsx src/components/krishi/app-layout.tsx
```

Expected: all pass clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/krishi/bottom-nav.tsx src/components/krishi/app-sidebar.tsx src/components/krishi/app-layout.tsx
git commit -m "refactor: convert navigation chrome to semantic tokens"
```

---

### Task 2: Token pass — widget and card chrome

**Files:**
- Modify: `src/components/krishi/weather-alert-banner.tsx` (4), `pwa-manager.tsx` (1), `dashboard-weather-widget.tsx` (3), `crop-advisory-widget.tsx` (4), `bengali-button.tsx` (1), `exchange-card.tsx` (2), `new-ad-wizard.tsx` (3), `notification-toggle.tsx` (2), `friends-preview.tsx` (8)

**Interfaces:**
- Consumes: same token set as Task 1.
- Produces: token-clean widget chrome.

- [ ] **Step 1: Baseline count**

```bash
rg -c "#[0-9A-Fa-f]{3,8}\b|bg-white|text-gray|border-gray|bg-gray" src/components/krishi/weather-alert-banner.tsx src/components/krishi/pwa-manager.tsx src/components/krishi/dashboard-weather-widget.tsx src/components/krishi/crop-advisory-widget.tsx src/components/krishi/bengali-button.tsx src/components/krishi/exchange-card.tsx src/components/krishi/new-ad-wizard.tsx src/components/krishi/notification-toggle.tsx src/components/krishi/friends-preview.tsx
```

Expected: 28 total. Record per-file counts.

- [ ] **Step 2: Convert all nine files**

Apply the spec §5.1 mapping (same table as Task 1 Step 2). Notes for judgment calls:
- Warning/alert surfaces that use amber/orange hexes: map to the closest semantic token — amber-tinted warnings use `bg-accent/15 text-accent-foreground` if a warm tone is needed, otherwise `bg-secondary`. Choose one per surface and use it consistently within that file.
- `bengali-button.tsx` is a shared primitive — be conservative; only convert literal color classes, never its variant logic.
- Do not change any props, Bengali strings, or event handlers.

- [ ] **Step 3: Verify zero matches**

Same `rg` command as Step 1. Expected: no output.

- [ ] **Step 4: Toolchain gate**

```bash
npx tsc --noEmit
npx eslint src/components/krishi/weather-alert-banner.tsx src/components/krishi/pwa-manager.tsx src/components/krishi/dashboard-weather-widget.tsx src/components/krishi/crop-advisory-widget.tsx src/components/krishi/bengali-button.tsx src/components/krishi/exchange-card.tsx src/components/krishi/new-ad-wizard.tsx src/components/krishi/notification-toggle.tsx src/components/krishi/friends-preview.tsx
npx prettier --write src/components/krishi/weather-alert-banner.tsx src/components/krishi/pwa-manager.tsx src/components/krishi/dashboard-weather-widget.tsx src/components/krishi/crop-advisory-widget.tsx src/components/krishi/bengali-button.tsx src/components/krishi/exchange-card.tsx src/components/krishi/new-ad-wizard.tsx src/components/krishi/notification-toggle.tsx src/components/krishi/friends-preview.tsx
```

Expected: all pass clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/krishi/weather-alert-banner.tsx src/components/krishi/pwa-manager.tsx src/components/krishi/dashboard-weather-widget.tsx src/components/krishi/crop-advisory-widget.tsx src/components/krishi/bengali-button.tsx src/components/krishi/exchange-card.tsx src/components/krishi/new-ad-wizard.tsx src/components/krishi/notification-toggle.tsx src/components/krishi/friends-preview.tsx
git commit -m "refactor: convert widget chrome to semantic tokens"
```

---

### Task 3: Token pass — chat and messaging surfaces

**Files:**
- Modify: `src/components/krishi/ai-chat-view.tsx` (39 occurrences)
- Modify: `src/components/krishi/direct-message-popup.tsx` (17 occurrences)

**Interfaces:**
- Consumes: same token set as Task 1.
- Produces: token-clean chat surfaces. These are the two worst files — they establish the pattern for message bubbles (user vs. AI/interlocutor).

- [ ] **Step 1: Baseline count**

```bash
rg -c "#[0-9A-Fa-f]{3,8}\b|bg-white|text-gray|border-gray|bg-gray" src/components/krishi/ai-chat-view.tsx src/components/krishi/direct-message-popup.tsx
```

Expected: 56 total.

- [ ] **Step 2: Convert `direct-message-popup.tsx`**

Apply the §5.1 mapping. Message bubbles: the current "own message" surface (`bg-[#2D6A4F]` or similar hex) becomes `bg-primary text-primary-foreground`; the "other message" surface (`bg-white`/`[#F0FFF4]`) becomes `bg-muted text-foreground`; timestamps/read receipts (`text-gray-400`) become `text-muted-foreground`. Keep all framer-motion animation props and Bengali strings untouched.

- [ ] **Step 3: Convert `ai-chat-view.tsx`**

Apply the §5.1 mapping. AI message surface → `bg-card`; user message surface → `bg-primary text-primary-foreground`; code/table blocks inside AI answers keep their structure, only color classes change. Do not touch the DOMPurify sanitization, markdown rendering, or feedback-vote handlers.

- [ ] **Step 4: Verify zero matches**

```bash
rg -n "#[0-9A-Fa-f]{3,8}\b|bg-white|text-gray|border-gray|bg-gray" src/components/krishi/ai-chat-view.tsx src/components/krishi/direct-message-popup.tsx
```

Expected: no output.

- [ ] **Step 5: Toolchain gate**

```bash
npx tsc --noEmit
npx eslint src/components/krishi/ai-chat-view.tsx src/components/krishi/direct-message-popup.tsx
npx prettier --write src/components/krishi/ai-chat-view.tsx src/components/krishi/direct-message-popup.tsx
```

Expected: all pass clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/krishi/ai-chat-view.tsx src/components/krishi/direct-message-popup.tsx
git commit -m "refactor: convert chat surfaces to semantic tokens"
```

---

### Task 4: Brand variable unification in styles.css

**Files:**
- Modify: `src/styles.css:102-110` (the hex-based brand block in `:root`)

**Interfaces:**
- Consumes: existing oklch token values in `:root` (e.g. `--primary: oklch(0.435 0.09 152)`, `--accent: oklch(0.72 0.13 150)`).
- Produces: single source of truth. `--brand-primary`, `--brand-accent`, `--brand-surface`, `--brand-warm`, `--gradient-brand`, `--gradient-soft`, `--shadow-card`, `--shadow-lift` remain as variable names (consumers reference them) but their values switch from hex to oklch.

- [ ] **Step 1: Replace the brand block**

In `src/styles.css`, replace lines 102–110 (the block starting `--brand-primary: #2D6A4F;`) with:

```css
  --brand-primary: var(--primary);
  --brand-accent: var(--accent);
  --brand-surface: var(--background);
  --brand-warm: oklch(0.75 0.13 55);
  --gradient-brand: linear-gradient(160deg, oklch(0.32 0.07 165) 0%, var(--primary) 50%, var(--accent) 100%);
  --gradient-soft: linear-gradient(135deg, var(--background) 0%, var(--muted) 100%);
  --shadow-card: 0 4px 14px -4px color-mix(in oklch, var(--primary) 18%, transparent);
  --shadow-lift: 0 14px 32px -20px color-mix(in oklch, var(--primary) 48%, transparent);
  --ease-spring: cubic-bezier(.2, .8, .2, 1);
```

Rationale: `--brand-primary`/`--brand-accent`/`--brand-surface` now alias the tokens (visually identical: `#2D6A4F`≈`oklch(0.435 0.09 152)`, `#52B788`≈`oklch(0.72 0.13 150)`, `#F6FBF7`≈`oklch(0.99 0.01 130)`). `#1B4332`≈`oklch(0.32 0.07 165)` anchors the gradient. Warm `#F4A261`≈`oklch(0.75 0.13 55)` has no token equivalent, so it stays as a one-off oklch value.

- [ ] **Step 2: Verify no hex remains in styles.css**

```bash
rg -n "#[0-9A-Fa-f]{6}\b" src/styles.css
```

Expected: no output (6-digit hex; 3-digit none exist). The `.dark` block is untouched — do not "fix" it.

- [ ] **Step 3: Build gate (visual parity depends on this compiling)**

```bash
npx tsc --noEmit
npm run build
```

Expected: build succeeds. Then spot-check parity in Task 13's screenshot sweep — light mode must look unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/styles.css
git commit -m "refactor: unify brand variables with oklch token scale"
```

---

### Task 5: Self-hosted fonts (B2)

**Files:**
- Modify: `package.json` (two new dependencies)
- Modify: `src/styles.css` (font imports + token changes)
- Modify: `src/routes/__root.tsx` (remove Google Fonts CDN links)

**Interfaces:**
- Consumes: `@fontsource/hind-siliguri` and `@fontsource/tiro-bangla` (not yet installed).
- Produces: `--font-sans`/`--font-display` = Hind Siliguri; new `--font-editorial` = Tiro Bangla; zero external font requests. Later tasks use `font-editorial` on guide prose.

- [ ] **Step 1: Install packages**

```bash
npm install @fontsource/hind-siliguri @fontsource/tiro-bangla
```

Expected: both added to `dependencies` in package.json; package-lock.json updated. (`bun.lock` is stale by pre-existing condition — do not touch it; note it in the commit body if desired.)

- [ ] **Step 2: Add font imports at the top of styles.css**

`src/styles.css` must start with (insert ABOVE the existing `@import "tailwindcss" source(none);` line):

```css
@import "@fontsource/hind-siliguri/400.css";
@import "@fontsource/hind-siliguri/500.css";
@import "@fontsource/hind-siliguri/600.css";
@import "@fontsource/hind-siliguri/700.css";
@import "@fontsource/tiro-bangla/400.css";
@import "tailwindcss" source(none);
```

- [ ] **Step 3: Update font tokens**

In the `@theme inline` block of `src/styles.css`, replace the three font lines with:

```css
  --font-sans: "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Tiro Bangla", ui-serif, Georgia, serif;
  --font-display: "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, sans-serif;
  --font-editorial: "Tiro Bangla", ui-serif, Georgia, serif;
```

- [ ] **Step 4: Remove the CDN links from __root.tsx**

In `src/routes/__root.tsx` find the `links` export (around lines 95–103) and delete exactly these three entries: the `preconnect` to `fonts.googleapis.com`, the `preconnect` to `fonts.gstatic.com`, and the stylesheet link to `fonts.googleapis.com/css2?family=Tiro+Bangla...`. Keep every other link entry unchanged.

- [ ] **Step 5: Verify**

```bash
rg -n "fonts.googleapis|fonts.gstatic" src/
```

Expected: no output. Then:

```bash
npx tsc --noEmit && npm run build
```

Expected: clean. Check the built output references woff2 files: `rg -l "hind-siliguri" dist/` — expected: at least one CSS asset.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/styles.css src/routes/__root.tsx
git commit -m "feat: self-host Bengali fonts, split UI and editorial type"
```

---

### Task 6: Language declaration + Bengali error surfaces (B2)

**Files:**
- Modify: `src/routes/__root.tsx` (lang attribute, notFoundComponent)
- Modify: `src/server.ts` (English strings in branded error pages)

**Interfaces:**
- Consumes: none.
- Produces: `lang="bn"` document; Bengali not-found UI; Bengali server error page copy.

- [ ] **Step 1: Set lang="bn"**

In `src/routes/__root.tsx`, find the `<html>` element rendered by the root route (search for `lang=`) and change `lang="en"` to `lang="bn"`. If `lang` is not set anywhere, add `lang="bn"` to the `<html>` tag.

- [ ] **Step 2: Add a Bengali notFoundComponent**

If `createRootRoute` in `__root.tsx` has no `notFoundComponent`, add this component and pass it:

```tsx
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
```

Ensure `useNavigate` is imported from `@tanstack/react-router`. If a `notFoundComponent` already exists, translate its English strings to the copy above instead of adding a second component.

- [ ] **Step 3: Translate server.ts error pages**

Open `src/server.ts`, locate the branded error-page HTML template(s), and translate user-facing English strings. At minimum, ensure these mappings wherever they appear as visible text: `"Internal Server Error"` → `"সার্ভারে সমস্যা হয়েছে"`, `"Not Found"` → `"পৃষ্ঠাটি পাওয়া যায়নি"`, `"Something went wrong"` → `"কিছু ভুল হয়েছে"`, `"Try again"` → `"আবার চেষ্টা করুন"`. Do not change HTTP status codes, header names, or log output.

- [ ] **Step 4: Verify**

```bash
rg -n 'lang="en"' src/routes/__root.tsx
```

Expected: no output. Then:

```bash
npx tsc --noEmit
npx eslint src/routes/__root.tsx src/server.ts
npm run build
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/routes/__root.tsx src/server.ts
git commit -m "feat: Bengali lang attribute and Bengali error surfaces"
```

---

### Task 7: Header unification on 12 browsing pages (B2)

**Files:**
- Modify: `src/routes/exchange.tsx`, `feed.tsx`, `prices.tsx`, `friends.tsx`, `farmers.tsx`, `notifications.tsx`, `weather.tsx`, `messages.tsx`, `u.$userId.tsx`, `profile.index.tsx`, `crop-diary.tsx`, `vegetable-guide.index.tsx`

**Interfaces:**
- Consumes: semantic tokens; the known-broken header in `farmers.tsx` (white text on no background — see Step 1).
- Produces: token-based `bg-card`/`text-foreground` page headers on exactly these 12 routes; gradients remain only on `index.tsx`, `login.tsx`, `register.tsx`, `offline.tsx`, `dashboard.tsx` hero.

- [ ] **Step 1: Fix the broken farmers.tsx header first (reference implementation)**

`src/routes/farmers.tsx:107-124` currently renders header children in `text-white*` but the `<header>` has no background — white text on a near-white page. Replace the header block with this token-based version (decorative blobs keep opacity but use tokens):

```tsx
      <header className="relative overflow-hidden rounded-b-[30px] bg-card border-b border-border px-4 pb-7 pt-8 sm:px-6">
        <div className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-14 h-44 w-44 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
              কৃষক নেটওয়ার্ক
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">সকল কৃষক</h1>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              বাংলাদেশের কৃষকদের খুঁজুন, সংযোগ তৈরি করুন এবং একসঙ্গে চাষাবাদ শিখুন।
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <Users className="h-6 w-6" />
          </div>
        </div>
      </header>
```

Bengali copy is preserved verbatim. Delete the old header JSX it replaces.

- [ ] **Step 2: Convert the remaining 11 routes**

For each of the other 11 files: locate the page `<header>`; remove gradient backgrounds (`style={{ background: "var(--gradient-brand)" }}` or `bg-gradient-*` classes) and convert header text from `text-white*` to `text-foreground` (titles) / `text-muted-foreground` (subtitles); give the header `bg-card` and `border-b border-border` (or keep an existing rounded/shape treatment while swapping only colors). Keep header action buttons (back arrows, toggles) working — convert their `text-white` to `text-foreground` and any `bg-white/15` chips to `bg-muted`. Do not restructure header content or change copy. Where a header is already token-based (grep shows no `gradient`/`text-white` in the header region), skip that file and note it in the commit body.

- [ ] **Step 3: Verify header rule globally**

```bash
rg -l "text-white" src/routes/exchange.tsx src/routes/feed.tsx src/routes/prices.tsx src/routes/friends.tsx src/routes/farmers.tsx src/routes/notifications.tsx src/routes/weather.tsx src/routes/messages.tsx src/routes/u.\$userId.tsx src/routes/profile.index.tsx src/routes/crop-diary.tsx src/routes/vegetable-guide.index.tsx
```

Expected: no output (or only matches clearly outside the header — if so, eyeball them).

```bash
rg -n "gradient" src/routes/exchange.tsx src/routes/feed.tsx src/routes/prices.tsx src/routes/friends.tsx src/routes/notifications.tsx src/routes/messages.tsx src/routes/u.\$userId.tsx src/routes/profile.index.tsx src/routes/crop-diary.tsx src/routes/vegetable-guide.index.tsx
```

Expected: no output. (`farmers.tsx`, `weather.tsx` may keep gradient references elsewhere in the page — only headers convert; check contexts individually.)

- [ ] **Step 4: Toolchain + build gate**

```bash
npx tsc --noEmit
npx eslint src/routes/exchange.tsx src/routes/feed.tsx src/routes/prices.tsx src/routes/friends.tsx src/routes/farmers.tsx src/routes/notifications.tsx src/routes/weather.tsx src/routes/messages.tsx "src/routes/u.\$userId.tsx" src/routes/profile.index.tsx src/routes/crop-diary.tsx src/routes/vegetable-guide.index.tsx
npx prettier --write src/routes/exchange.tsx src/routes/feed.tsx src/routes/prices.tsx src/routes/friends.tsx src/routes/farmers.tsx src/routes/notifications.tsx src/routes/weather.tsx src/routes/messages.tsx "src/routes/u.\$userId.tsx" src/routes/profile.index.tsx src/routes/crop-diary.tsx src/routes/vegetable-guide.index.tsx
npm run build
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/routes/exchange.tsx src/routes/feed.tsx src/routes/prices.tsx src/routes/friends.tsx src/routes/farmers.tsx src/routes/notifications.tsx src/routes/weather.tsx src/routes/messages.tsx "src/routes/u.\$userId.tsx" src/routes/profile.index.tsx src/routes/crop-diary.tsx src/routes/vegetable-guide.index.tsx
git commit -m "refactor: unify page headers to token style on browsing pages"
```

---

### Task 8: Page states — core social list routes (A, Pattern 1)

**Files:**
- Modify: `src/routes/connections.tsx`, `farmers.tsx`, `friends.tsx`, `messages.tsx`

**Interfaces:**
- Consumes: `EmptyState` (`src/components/krishi/empty-state.tsx` — props `icon?`, `title`, `description?`, `action?`), `ErrorMessage` (`title?`, `description?`, `onRetry?` — retry label "আবার চেষ্টা করুন" built in), the active tab route's `useQuery` result.
- Produces: standardized state blocks. Later state tasks replicate this exact block shape.

**Canonical Pattern 1 block** (reference from `farmers.tsx:102-103`, which already computes `loading`/`error` from the active query — reuse that existing pattern in each file; do not create new query logic):

```tsx
{loading ? (
  <FarmerSkeletons />
) : error ? (
  <ErrorMessage
    title="<route-specific Bengali error title>"
    onRetry={() => activeQuery.refetch()}
  />
) : items.length === 0 ? (
  <EmptyState
    icon={<Users className="h-8 w-8" />}
    title="<copy table>"
    description="<copy table>"
    action={<Link to="/farmers"><BengaliButton variant="outline" size="md">কৃষক খুঁজুন</BengaliButton></Link>}
  />
) : (
  <existing list JSX unchanged />
)}
```

Skeletons: keep existing skeleton components where present (`FarmerSkeletons`); if a route has none, use the existing shared `PriceCardSkeleton` for card grids or `Skeleton` rows matching one list item's layout. Ad-hoc inline error/empty divs (like `farmers.tsx`'s current `EmptyFarmers` and the dashed-border error box) are **replaced** by the shared components; their existing Bengali copy moves into the `title`/`description` props. Delete the now-unused local components. `BengaliButton` comes from `@/components/krishi/bengali-button`; `Link` from `@tanstack/react-router`; pick the `icon` from the lucide icons already imported in that file (no new icon imports unless none exist).

- [ ] **Step 1: Wire `farmers.tsx`**

Replace the error branch at `farmers.tsx:155-158` and empty branch at `:159-160` per the canonical block. Copy: keep existing ("কৃষকদের তালিকা লোড করা যায়নি" as error title; empty copy from `EmptyFarmers`, both variants). Add retry: `onRetry={() => (tab === "all" ? allFarmersQuery.refetch() : connectedQuery.refetch())}`.

- [ ] **Step 2: Wire `connections.tsx`, `friends.tsx`, `messages.tsx`**

For each: find the list's `useQuery` result and existing loading/error/empty rendering (audit — some may be missing entirely; add all three states per the canonical block). Copy table:

| Route | Error title | Empty title | Empty description | Action label → `to` |
|---|---|---|---|---|
| connections | "সংযোগ তালিকা লোড করা যায়নি" | "কোনো সংযোগ অনুরোধ নেই" | "অন্য কৃষকদের খুঁজে সংযোগের অনুরোধ পাঠান।" | "কৃষক খুঁজুন" → `/farmers` |
| friends | "বন্ধু তালিকা লোড করা যায়নি" | "এখনো কোনো বন্ধু নেই" | "সংযোগ অনুরোধ গৃহীত হলে বন্ধুরা এখানে দেখা যাবে।" | "কৃষক খুঁজুন" → `/farmers` |
| messages | "কথোপকথান লোড করা যায়নি" | "কোনো কথোপকথন নেই" | "সংযুক্ত কৃষকদের সাথে মেসেজে কথা বলুন।" | "কৃষক খুঁজুন" → `/farmers` |

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
npx eslint src/routes/connections.tsx src/routes/farmers.tsx src/routes/friends.tsx src/routes/messages.tsx
npx prettier --write src/routes/connections.tsx src/routes/farmers.tsx src/routes/friends.tsx src/routes/messages.tsx
npm run build
```

Expected: all pass. Also grep that the shared components are imported: `rg -l "EmptyState|ErrorMessage" src/routes/farmers.tsx src/routes/connections.tsx src/routes/friends.tsx src/routes/messages.tsx` — all four listed.

- [ ] **Step 4: Commit**

```bash
git add src/routes/connections.tsx src/routes/farmers.tsx src/routes/friends.tsx src/routes/messages.tsx
git commit -m "feat: standardize loading empty error states on social list routes"
```

---

### Task 9: Page states — farming list routes (A, Pattern 1)

**Files:**
- Modify: `src/routes/crop-diary.tsx`, `crop-planner.my-plans.tsx`, `profile.disease-history.tsx`, `price-prediction.history.tsx`, `vegetable-guide.index.tsx`

**Interfaces:**
- Consumes: same as Task 8.
- Produces: standardized states on five farming-tool list routes.

- [ ] **Step 1: Wire all five routes**

Apply the canonical Pattern 1 block from Task 8 to each route's primary list query. Where an ad-hoc empty/error block already exists, preserve its copy into the shared components and delete the local one. Copy table (action buttons use `BengaliButton variant="outline" size="md"` inside a `Link`; omit `action` where the table says "—"):

| Route | Error title | Empty title | Empty description | Action |
|---|---|---|---|---|
| crop-diary | "ডায়েরি লোড করা যায়নি" | "ডায়েরিতে এন্ট্রি নেই" | "আপনার ফসলের অগ্রগতি লিখে রাখুন।" | "নতুন এন্ট্রি লিখুন" → the route's existing new-entry target |
| crop-planner.my-plans | "পরিকল্পনা লোড করা যায়নি" | "কোনো ফসল পরিকল্পনা নেই" | "পরিকল্পনা তৈরি করে ধাপে ধাপে চাষাবাদ করুন।" | "নতুন পরিকল্পনা" → `/crop-planner` |
| profile.disease-history | "ইতিহাস লোড করা যায়নি" | "রোগের ইতিহাস খালি" | "রোগ শনাক্ত করলে ইতিহাস এখানে জমা হবে।" | — |
| price-prediction.history | "ইতিহাস লোড করা যায়নি" | "পূর্বাভাসের ইতিহাস নেই" | "মূল্য পূর্বাভাস দেখলে ইতিহাস এখানে জমা হবে।" | — |
| vegetable-guide.index | "তালিকা লোড করা যায়নি" | "তালিকা খালি" | "শীঘ্রই আরও সবজির তথ্য যুক্ত হবে।" | — |

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
npx eslint src/routes/crop-diary.tsx src/routes/crop-planner.my-plans.tsx src/routes/profile.disease-history.tsx src/routes/price-prediction.history.tsx src/routes/vegetable-guide.index.tsx
npx prettier --write src/routes/crop-diary.tsx src/routes/crop-planner.my-plans.tsx src/routes/profile.disease-history.tsx src/routes/price-prediction.history.tsx src/routes/vegetable-guide.index.tsx
npm run build
```

Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add src/routes/crop-diary.tsx src/routes/crop-planner.my-plans.tsx src/routes/profile.disease-history.tsx src/routes/price-prediction.history.tsx src/routes/vegetable-guide.index.tsx
git commit -m "feat: standardize states on farming list routes"
```

---

### Task 10: Page states — moderation + admin list routes (A, Pattern 1)

**Files:**
- Modify: `src/routes/moderation.tsx`, `admin.users.tsx`, `admin.exchanges.tsx`, `admin.reports.tsx`, `admin.content.tsx`, `admin.diseases.tsx`, `admin.prices.tsx`, `admin.audit.tsx`

**Interfaces:**
- Consumes: same as Task 8.
- Produces: standardized states on staff-facing list routes.

- [ ] **Step 1: Wire all eight routes**

Apply the canonical Pattern 1 block. Admin routes: no `action` buttons on empties (staff know their tools); skeletons may be 3-row `Skeleton` approximations of each table/list row. Copy table:

| Route | Error title | Empty title |
|---|---|---|
| moderation | "প্রতিবেদন লোড করা যায়নি" | "কোনো প্রতিবেদন নেই" |
| admin.users | "ব্যবহারকারী তালিকা লোড করা যায়নি" | "কোনো ব্যবহারকারী পাওয়া যায়নি" |
| admin.exchanges | "বিজ্ঞাপন লোড করা যায়নি" | "কোনো বিজ্ঞাপন নেই" |
| admin.reports | "প্রতিবেদন লোড করা যায়নি" | "কোনো প্রতিবেদন নেই" |
| admin.content | "কনটেন্ট লোড করা যায়নি" | "কোনো কনটেন্ট পাওয়া যায়নি" |
| admin.diseases | "রোগের তথ্য লোড করা যায়নি" | "কোনো রোগের তথ্য নেই" |
| admin.prices | "দামের তথ্য লোড করা যায়নি" | "কোনো দামের তথ্য নেই" |
| admin.audit | "অডিট লগ লোড করা যায়নি" | "কোনো অডিট লগ নেই" |

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
npx eslint src/routes/moderation.tsx src/routes/admin.users.tsx src/routes/admin.exchanges.tsx src/routes/admin.reports.tsx src/routes/admin.content.tsx src/routes/admin.diseases.tsx src/routes/admin.prices.tsx src/routes/admin.audit.tsx
npx prettier --write src/routes/moderation.tsx src/routes/admin.users.tsx src/routes/admin.exchanges.tsx src/routes/admin.reports.tsx src/routes/admin.content.tsx src/routes/admin.diseases.tsx src/routes/admin.prices.tsx src/routes/admin.audit.tsx
npm run build
```

Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add src/routes/moderation.tsx src/routes/admin.users.tsx src/routes/admin.exchanges.tsx src/routes/admin.reports.tsx src/routes/admin.content.tsx src/routes/admin.diseases.tsx src/routes/admin.prices.tsx src/routes/admin.audit.tsx
git commit -m "feat: standardize states on moderation and admin list routes"
```

---

### Task 11: Audit the six partially-covered routes (A)

**Files:**
- Modify: `src/routes/feed.tsx`, `exchange.tsx`, `notifications.tsx`, `prices.tsx`, `profile.index.tsx`, `u.$userId.tsx`

**Interfaces:**
- Consumes: same as Task 8. These six already import some state components (verified: 25 occurrences total) — this task fills the missing third state per route and adds retry where error branches lack it.
- Produces: complete loading+error+empty coverage on the app's highest-traffic routes.

- [ ] **Step 1: Inventory current states per file**

For each file, list which of the three states exist and which are missing or ad-hoc:

```bash
rg -n "isLoading|isError|isPending|error|EmptyState|ErrorMessage|Skeleton|LoadingSpinner|return null" src/routes/feed.tsx src/routes/exchange.tsx src/routes/notifications.tsx src/routes/prices.tsx src/routes/profile.index.tsx "src/routes/u.\$userId.tsx"
```

- [ ] **Step 2: Fill the gaps**

Using the canonical blocks from Tasks 8 (list) — and where `u.$userId` behaves as a detail page, Pattern 2 from Task 13's block — add exactly the missing states. Rules: keep all existing Bengali copy; convert ad-hoc error divs to `ErrorMessage` adding `onRetry={() => <thatQuery>.refetch()}`; empty states that exist ad-hoc convert to `EmptyState` preserving copy; do not duplicate states that already render correctly via the shared components.

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
npx eslint src/routes/feed.tsx src/routes/exchange.tsx src/routes/notifications.tsx src/routes/prices.tsx src/routes/profile.index.tsx "src/routes/u.\$userId.tsx"
npx prettier --write src/routes/feed.tsx src/routes/exchange.tsx src/routes/notifications.tsx src/routes/prices.tsx src/routes/profile.index.tsx "src/routes/u.\$userId.tsx"
npm run build
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/routes/feed.tsx src/routes/exchange.tsx src/routes/notifications.tsx src/routes/prices.tsx src/routes/profile.index.tsx "src/routes/u.\$userId.tsx"
git commit -m "feat: complete state coverage on high-traffic routes"
```

---

### Task 12: Page states — user-facing tool routes (A, Pattern 2)

**Files:**
- Modify: `src/routes/dashboard.tsx`, `weather.tsx`, `disease-detection.tsx`, `price-prediction.tsx`, `crop-planner.tsx`, `crop-guide.index.tsx`, `crop-guide.new.$crop.tsx`, `crop-guide.plan.$planId.tsx`, `organic-fertilizer.tsx`, `vegetable-guide.$slug.tsx`, `ai-bondhu.index.tsx`, `ai-bondhu.chat.index.tsx`, `ai-bondhu.chat.$sessionId.tsx`, `ai-bondhu.disease.tsx`, `ai-bondhu.soil.tsx`, `ai-bondhu.calculator.tsx`, `ai-bondhu.pesticide.tsx`, `ai-bondhu.calendar.tsx`

**Interfaces:**
- Consumes: `LoadingSpinner` (`label?`, `size?`), `ErrorMessage`, each route's existing `useQuery`/`useServerFn` result.
- Produces: spinner-while-loading and retryable errors on tool routes. **No skeletons** (spec §4.2 Pattern 2).

**Canonical Pattern 2 block** (reference implementation — `weather.tsx:92-99` currently uses ad-hoc divs; replace with):

```tsx
{isLoading ? (
  <div className="px-5 mt-6">
    <LoadingSpinner label="আবহাওয়া লোড হচ্ছে..." />
  </div>
) : error ? (
  <div className="px-5 mt-6">
    <ErrorMessage
      title="আবহাওয়া তথ্য আনা যায়নি"
      description="ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।"
      onRetry={() => refetch()}
    />
  </div>
) : data?.forecast ? (
  <WeatherContent forecast={data.forecast} />
) : null}
```

- [ ] **Step 1: Wire weather.tsx as the reference**

Apply the block above verbatim (it replaces both ad-hoc divs at `weather.tsx:92-97`). Add the imports: `import { LoadingSpinner } from "@/components/krishi/loading-spinner";` and `import { ErrorMessage } from "@/components/krishi/error-message";`.

- [ ] **Step 2: Wire the remaining 17 routes**

For each route: find its primary data query (server-fn-backed `useQuery` or Supabase `useQuery`). Loading: render `<LoadingSpinner label="< Bengali route-specific label >" />` in the content area where results appear (keep page chrome/header visible). Error: render `<ErrorMessage title="< Bengali >" onRetry={() => <query>.refetch()} />` replacing ad-hoc error divs. Labels/titles:

| Route(s) | Spinner label | Error title |
|---|---|---|
| dashboard | "ড্যাশবোর্ড লোড হচ্ছে..." | "তথ্য আনা যায়নি" |
| price-prediction | "পূর্বাভাস তৈরি হচ্ছে..." | "পূর্বাভাস আনা যায়নি" |
| crop-planner, crop-guide.* | "তথ্য লোড হচ্ছে..." | "তথ্য আনা যায়নি" |
| disease-detection | "ছবি বিশ্লেষণ হচ্ছে..." | "বিশ্লেষণ করা যায়নি" |
| organic-fertilizer, vegetable-guide.$slug | "তথ্য লোড হচ্ছে..." | "তথ্য আনা যায়নি" |
| ai-bondhu.index, ai-bondhu.calendar | "তথ্য লোড হচ্ছে..." | "তথ্য আনা যায়নি" |
| ai-bondhu.chat.* | "বন্ধু লিখছে..." (send flow unchanged) | "উত্তর আনা যায়নি" |
| ai-bondhu.disease, ai-bondhu.soil, ai-bondhu.calculator, ai-bondhu.pesticide | "বিশ্লেষণ হচ্ছে..." | "বিশ্লেষণ করা যায়নি" |

Special cases: `ai-bondhu.chat.$sessionId` must keep its existing streaming/optimistic message rendering — only the initial session-load gets the spinner, and only the send-failure path gets `ErrorMessage` (inline near the input, preserving existing copy if present). `disease-detection` analysis-in-progress UI: if a camera/preview state already shows progress, keep it and only convert failures.

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
npx eslint src/routes/dashboard.tsx src/routes/weather.tsx src/routes/disease-detection.tsx src/routes/price-prediction.tsx src/routes/crop-planner.tsx src/routes/crop-guide.index.tsx "src/routes/crop-guide.new.\$crop.tsx" "src/routes/crop-guide.plan.\$planId.tsx" src/routes/organic-fertilizer.tsx "src/routes/vegetable-guide.\$slug.tsx" src/routes/ai-bondhu.index.tsx src/routes/ai-bondhu.chat.index.tsx "src/routes/ai-bondhu.chat.\$sessionId.tsx" src/routes/ai-bondhu.disease.tsx src/routes/ai-bondhu.soil.tsx src/routes/ai-bondhu.calculator.tsx src/routes/ai-bondhu.pesticide.tsx src/routes/ai-bondhu.calendar.tsx
npx prettier --write src/routes/dashboard.tsx src/routes/weather.tsx src/routes/disease-detection.tsx src/routes/price-prediction.tsx src/routes/crop-planner.tsx src/routes/crop-guide.index.tsx "src/routes/crop-guide.new.\$crop.tsx" "src/routes/crop-guide.plan.\$planId.tsx" src/routes/organic-fertilizer.tsx "src/routes/vegetable-guide.\$slug.tsx" src/routes/ai-bondhu.index.tsx src/routes/ai-bondhu.chat.index.tsx "src/routes/ai-bondhu.chat.\$sessionId.tsx" src/routes/ai-bondhu.disease.tsx src/routes/ai-bondhu.soil.tsx src/routes/ai-bondhu.calculator.tsx src/routes/ai-bondhu.pesticide.tsx src/routes/ai-bondhu.calendar.tsx
npm run build
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/routes/dashboard.tsx src/routes/weather.tsx src/routes/disease-detection.tsx src/routes/price-prediction.tsx src/routes/crop-planner.tsx src/routes/crop-guide.index.tsx "src/routes/crop-guide.new.\$crop.tsx" "src/routes/crop-guide.plan.\$planId.tsx" src/routes/organic-fertilizer.tsx "src/routes/vegetable-guide.\$slug.tsx" src/routes/ai-bondhu.index.tsx src/routes/ai-bondhu.chat.index.tsx "src/routes/ai-bondhu.chat.\$sessionId.tsx" src/routes/ai-bondhu.disease.tsx src/routes/ai-bondhu.soil.tsx src/routes/ai-bondhu.calculator.tsx src/routes/ai-bondhu.pesticide.tsx src/routes/ai-bondhu.calendar.tsx
git commit -m "feat: spinner and retryable error states on tool routes"
```

---

### Task 13: Final verification sweep + copy review checkpoint

**Files:**
- Read-only: top-10 routes; `docs/PROJECT_STATE.md` (update entry — optional, only if the maintainer wants it)

**Interfaces:**
- Consumes: all prior tasks.
- Produces: verification evidence; list of all new Bengali strings for user review (spec §7 item 6).

- [ ] **Step 1: Full toolchain**

```bash
npx tsc --noEmit
npm run lint
npx prettier --check .
npm run build
```

Expected: all pass clean.

- [ ] **Step 2: Mobile-viewport screenshot sweep**

Start `npm run dev`. Using a browser automation tool (Chrome DevTools MCP or the built-in browser), capture each route at 390×844 (mobile) in light mode: `/dashboard`, `/prices`, `/exchange`, `/feed`, `/weather`, `/messages`, `/friends`, `/ai-bondhu/chat`, `/profile`, `/notifications`. Compare against `git stash`-free baseline captured from `main` (capture baseline first with `git worktree add ../baseline main` if the working tree has drifted). Parity check: chrome and light-mode appearance match baseline except the 12 converted headers and new state blocks. Then force one error state (offline devtools) and one empty state (fresh account or empty filter) and confirm `ErrorMessage`+retry and `EmptyState` render as designed.

- [ ] **Step 3: Assemble the Bengali copy review list**

Collect every new Bengali string introduced in Tasks 6–12 into a single markdown list (route → string) and present it to the user for tone review before declaring the work done. Fix any the user flags, then re-run Step 1.

- [ ] **Step 4: Final commit (if Step 3 produced fixes)**

```bash
git add -A
git commit -m "fix: copy review adjustments from UX sweep"
```

---

## Self-Review Notes (plan author)

- **Spec coverage:** §4.2 → Tasks 8–12 (all three patterns + six-route audit); §5.1–5.2 → Tasks 1–4; §5.3 boundaries → Global Constraints; §6.1 → Task 5; §6.2 → Task 6; §6.3 → Task 7 (12 routes listed, gradients preserved on the 5 brand surfaces); §7 → Task 13; §8 risks → Task 13 Step 2 sweep + Step 3 copy review.
- **Placeholder scan:** all copy tables are fully populated; all code blocks are complete; the only read-then-edit instruction (Task 6 Step 3, `server.ts`) names the exact strings to translate because the file's template shape was not inlined — every named string is concrete.
- **Type/signature consistency:** `EmptyState(icon?, title, description?, action?)`, `ErrorMessage(title?, description?, onRetry?)`, `LoadingSpinner(label?, size?)` verified against source. React Query retry uses `.refetch()` on the existing query result in every block. `--font-editorial` is defined in Task 5 and consumed by no other task (guide-prose application is deliberately left to the later editorial pass — spec §6.1 defines the token only).
