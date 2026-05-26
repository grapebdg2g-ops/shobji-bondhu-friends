# Admin Dashboard Build Plan

A complete admin-only area at `/admin/*`, protected (role === 'admin', else redirect to `/dashboard`), with its own sidebar layout. Built with TanStack Router file-based routing, TanStack Query, Recharts, and Supabase.

## 1. Database migration

New tables (all with GRANTs + RLS, admin-only via `has_role(auth.uid(),'admin')`):

- **`user_reports`** — `id, reporter_id, reported_user_id, content_type (post|exchange|price|comment), content_id, reason (spam|inappropriate|fake|other), description, status (pending|reviewed|actioned), reviewed_by, created_at`. Insert allowed for authenticated users (reporter_id = auth.uid()); select/update/delete admin+moderator only.
- **`admin_actions`** — `id, admin_id, action_type (suspend|unsuspend|warn|verify|delete|role_change|broadcast), target_id, details jsonb, created_at`. Admin-only.
- **`notification_broadcasts`** — `id, admin_id, title, body, link, icon, target_type (all|district|upazila|crop|pro), target_value, sent_count, opened_count, scheduled_at, sent_at, created_at`. Admin-only.

Existing `notifications`, `profiles`, `user_roles`, `posts`, `exchanges`, `prices`, `disease_history`, `push_subscriptions` are reused.

## 2. Routes (file-based)

```
src/routes/
  admin.tsx                  -> /admin layout (guard + AdminSidebar + <Outlet/>)
  admin.index.tsx            -> /admin       overview dashboard
  admin.users.tsx            -> /admin/users
  admin.content.tsx          -> /admin/content
  admin.notify.tsx           -> /admin/notify
  admin.analytics.tsx        -> /admin/analytics
```

The existing `src/routes/admin.tsx` (single-page user manager) will be repurposed as the **layout** route. Its user-management UI moves to `admin.users.tsx`.

## 3. Layout & guard

`admin.tsx`:
- Reads user + role; if not admin → `navigate({to:'/dashboard'})`.
- Renders `<SidebarProvider>` + new `<AdminSidebar/>` (separate from main `AppSidebar`) with the 9 menu items in Bengali + a "মূল অ্যাপে যান" link back to `/dashboard`.
- Mobile-first: collapsible icon sidebar, sticky header with `SidebarTrigger`.

## 4. Page 1 — Overview (`/admin`)

- 2×2 + 4-col stat cards: total farmers, today's new users, total posts (+today), AI detections (+today), exchanges, price updates, pro users (placeholder 0), revenue (placeholder ৳0).
- Recharts:
  - **LineChart**: user growth last 30 days (group `profiles.created_at` by day).
  - **BarChart**: daily active users last 7 days (use `profiles.last_active` if present, else fallback to distinct post authors per day).
  - **PieChart**: feature usage counts (prices/exchanges/disease/posts totals).
- District table (top 15 by farmer count + today's active).
- Recent activity feed: latest 20 of (profile creations, posts, reports, disease scans) merged & sorted. Auto-refetch every 30s via TanStack Query `refetchInterval`.

## 5. Page 2 — Users (`/admin/users`)

Reuses existing admin user logic but expanded:
- Search (name/phone), filter dropdowns (role, district, verified, suspended), sort selector (newest/active/posts).
- Table with avatar, name, phone, district, role badge, joined, last active, actions menu (DropdownMenu).
- Actions: view profile (opens Dialog with profile data, last 10 posts, exchanges, disease history, reports received), verify expert (Dialog form: specialty select + institution + note → updates profile + sends notification + writes admin_actions row), change role (1 of 4), warn (notification), suspend (1/7/30 days or permanent + reason), delete (soft via suspension=permanent, since auth.users deletion needs admin API).
- Every action writes an `admin_actions` row.

## 6. Page 3 — Content Moderation (`/admin/content`)

- Tabs: posts | exchanges | prices.
- For each tab: items where `user_reports.content_type` matches are sorted to top with red badge + reporter count + reason list. Below: recent items.
- Per-item actions: dismiss reports (status='reviewed'), edit (Dialog), delete (uses existing mod RLS), warn user (notification).
- Bulk select with checkboxes → bulk delete / bulk mark reviewed.

## 7. Page 4 — Broadcast Notification (`/admin/notify`)

- Target selector (radio): all / district / upazila / crop / pro. Conditional second input.
- Composer: title (50), body (150), link select, emoji icon picker (simple grid).
- Live preview card.
- Estimated reach: live count from matching `profiles` (or `push_subscriptions` if more accurate).
- Schedule: now / scheduled (date+time).
- Confirm dialog → server function `broadcastNotification`:
  - Resolves target user IDs.
  - Inserts `notifications` rows in batches (1000/insert).
  - Inserts `notification_broadcasts` audit row with `sent_count`.
  - Writes `admin_actions` row.
- History table at bottom: date, title, sent, opened, CTR.

## 8. Page 5 — Analytics (`/admin/analytics`)

- Date range picker (today/7d/30d/custom).
- Retention: % of users created in window who have any activity (post/price/exchange/disease) in week 1 / month 1.
- Top 10 districts by activity (BarChart).
- Top products updated (BarChart of `prices.product_name` counts).
- Disease stats: top 5 diseases, affected crops, affected districts (from `disease_history`).
- Feature funnel: simple counts login→dashboard→feature (approximated from profile + activity).
- Revenue (placeholder — no pro table yet, shows ৳0 + "Pro shortly").
- CSV export per table (client-side blob download).

## 9. Server functions

`src/lib/admin.functions.ts` (with `requireSupabaseAuth` + admin role check via `has_role`):
- `getOverviewStats`, `getRecentActivity`
- `getAdminUsers(filters)`, `getUserDetail(id)`, `setUserRole`, `verifyExpert`, `warnUser`, `suspendUser`, `unsuspendUser`
- `getReportsAndContent(tab)`, `dismissReport`, `bulkDelete`
- `estimateBroadcastReach(target)`, `broadcastNotification(input)`, `getBroadcastHistory`
- `getAnalytics(range)`

All also log to `admin_actions`.

## 10. Sidebar update

`AppSidebar`: existing Admin Panel link still points to `/admin` (now layout). No conflict.

## 11. Components

- `src/components/admin/admin-sidebar.tsx`
- `src/components/admin/stat-card.tsx`
- `src/components/admin/activity-feed.tsx`
- `src/components/admin/user-detail-dialog.tsx`
- `src/components/admin/verify-expert-dialog.tsx`
- `src/components/admin/suspend-dialog.tsx`
- `src/components/admin/broadcast-composer.tsx`
- Reuse existing `RoleBadge`, shadcn `Dialog`, `Tabs`, `DropdownMenu`, `Select`, `Checkbox`.

## Technical notes

- Recharts already installed (used elsewhere? — will add via `bun add recharts` if missing).
- `date-fns` for date math (installed).
- Bengali numbers formatted via small helper `toBn(n)`.
- All mutations invalidate the relevant query keys + push success toasts.
- Scheduled broadcasts: store row with `scheduled_at`, `sent_at = null`; actual cron not wired (mention in UI "নির্ধারিত সময়ে স্বয়ংক্রিয়ভাবে পাঠানো হবে" — requires pg_cron, out of scope unless requested).

## Out of scope (called out)

- Real Pro/Revenue (no subscription table yet).
- Real cron for scheduled broadcasts (would need pg_cron + public webhook).
- Hard-delete of `auth.users` (requires admin API call from server fn with service-role key — can add if you want).

Approve to proceed.
