
# Role-Based Access Control (RBAC)

## Important security correction

Your spec stores `role` directly on the `users`/`profiles` table. This is a **known privilege-escalation pattern** — any user who can update their own profile row can promote themselves to admin. I'll instead follow the Lovable-standard pattern:

- A separate `user_roles` table + `app_role` enum
- A `SECURITY DEFINER` function `has_role(user_id, role)` used by every RLS policy
- Only admins can write to `user_roles`

All other fields you listed (verification, suspension, expert info) will go on `profiles` since they're not the auth gate.

---

## 1. Database migration

**New enum + table**
- `app_role` enum: `farmer | expert | moderator | admin`
- `user_roles(id, user_id, role, granted_by, granted_at)` with unique `(user_id, role)`
- RLS: users can read their own roles; only admins can insert/update/delete

**`profiles` additions**
- `is_verified bool`, `is_suspended bool`, `suspension_reason text`, `suspension_until timestamptz`
- `verified_at timestamptz`, `verified_by uuid`
- `expert_specialty text`, `expert_institution text`
- `last_active timestamptz`, `total_reports int default 0`

**Security definer helpers**
- `public.has_role(_user_id uuid, _role app_role) returns boolean`
- `public.is_suspended(_user_id uuid) returns boolean` (checks flag + `suspension_until`)

**Updated RLS policies**
- `posts`: moderators/admins can DELETE any; suspended users cannot INSERT
- `exchanges`: same delete-any policy for moderators/admins
- `post_comments`: same delete-any
- `profiles`: admins can UPDATE any row (for verification/suspension); users still update own
- `user_roles`: only admins manage

**Trigger**: auto-assign `farmer` role on signup (extends existing `handle_new_user`).

**Bootstrap admin**: I'll need your phone number to seed the first admin. (See question below.)

---

## 2. App code

**`src/hooks/use-role.ts`** — `useRole()` returns `{ role, isExpert, isModerator, isAdmin, isSuspended, loading }`, fetched once per session and cached via React Query. Extend `UserProfile` type to expose new fields.

**`src/components/krishi/role-badge.tsx`** — Pure presentational badge:
- expert → green `✅ বিশেষজ্ঞ`
- moderator → blue `🛡️ মডারেটর`
- admin → purple `⚙️ প্রশাসক`
- farmer → nothing

**UI integration (badges only — minimal touch):**
- Feed post card: badge next to user name; if expert, add 4px green left border + "বিশেষজ্ঞ পরামর্শ" label + specialty line
- Exchange card: badge next to user name
- Profile page: badge next to name + verification info

**Moderator actions:**
- "Delete" button on any post/exchange/comment when `isModerator || isAdmin` (existing delete already exists for own items — just widen the visibility check)
- Simple `/moderation` route listing recent posts with delete + "suspend user" action (modal: reason + duration)

**Admin panel** (`/admin`, gated by `isAdmin`):
- Users tab: search by name/phone, change role (dropdown), verify expert, set specialty/institution
- Suspensions tab: list suspended users, unsuspend
- Basic stats: total users by role, posts today, etc.

**Suspended user UX**: if `isSuspended` and not expired, post/comment/exchange create buttons disabled with toast "আপনার অ্যাকাউন্ট সাময়িকভাবে স্থগিত".

---

## 3. What I will NOT do (to keep scope tight)

- No financial overview (no payments in app yet)
- No system settings page (nothing to configure yet)
- No analytics charts beyond simple counts
- No "warning" system separate from suspension (suspension covers it)

---

## Question before I start

**What phone number should be seeded as the first admin?** Format: `+8801XXXXXXXXX` or whatever you used to sign up. Without this, the admin panel won't be reachable for anyone.
