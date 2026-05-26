# Plan: Full Upazila Support

## 1. Data layer
- Create `src/data/bd-locations.ts` with `BD_LOCATIONS` (all 64 districts → upazilas, Bengali), `UPAZILA_COORDS` (key upazilas with lat/lon), and helpers `getDistricts()`, `getUpazilas(district)`, `getUpazilaCoords(district, upazila)`.
- Update `src/lib/bd-data.ts`:
  - Re-export `DISTRICTS` from `BD_LOCATIONS` keys (keep backward compat).
  - Add `getDistrictUpazilaLatLng(district, upazila)` that prefers upazila coords, falls back to district centroid.

## 2. Database migration
- `ALTER TABLE push_subscriptions ADD COLUMN upazila text;`
- Indexes: `idx_prices_upazila` on `prices(district, upazila, created_at DESC)`, `idx_posts_upazila` on `posts(district, upazila, created_at DESC)`, `idx_exchanges_upazila` on `exchanges(district, upazila, created_at DESC)`.
- Add `upazila` to `weather_alerts_sent` and update unique constraint to `(district, upazila, alert_type, day)` so storm in Savar doesn't dedupe Dhamrai.

## 3. Registration
- `src/routes/register.tsx`: replace upazila free-text input with a cascading `<Select>` populated from `getUpazilas(district)`. Reset upazila when district changes. Disabled state: "আগে জেলা বেছে নিন".

## 4. Profile edit (`src/routes/profile.tsx`)
- Same cascading district→upazila Select so user can switch upazila.

## 5. Prices page (`src/routes/prices.tsx`)
- Add horizontal upazila chip row below district selector ("সব উপজেলা" + dynamic list).
- Pass `upazila` filter to query when not "all".
- Show `market_name • upazila, district` on each card.

## 6. Exchange page (`src/routes/exchange.tsx`)
- Same cascading filter.
- Distance badge per card: same upazila (green ✅ "একই উপজেলা"), same district (blue "একই জেলা"), else gray "অন্য জেলা" — compared to current user.

## 7. Feed (`src/routes/feed.tsx`)
- Filter radio: "আমার উপজেলা" (default) | "আমার জেলা" | "সব বাংলাদেশ".
- Post meta shows `name • upazila, district • time`.
- When user creates a post, attach their `upazila` (already in profile).

## 8. Weather (`src/routes/weather.tsx`, `src/lib/weather.functions.ts`, `src/lib/weather.server.ts`)
- `getWeatherForecast` accepts optional `upazila`; resolve coords via `getDistrictUpazilaLatLng`.
- Header reads "📍 upazila, district" when upazila known.
- `NotificationToggle` / `usePushNotifications` saves user's upazila with subscription.

## 9. Sidebar (dashboard header / sidebar)
- Show `upazila, district` under user name when expanded; just avatar when collapsed.

## 10. Notifications / weather alerts (`src/routes/api/public/hooks/weather-alerts.ts`)
- Group subscriptions by `(district, upazila)`; fetch forecast per (district, upazila) using upazila coords when present; dedupe via the upazila-aware unique constraint.
- Notification title/body uses upazila name when available.

## 11. Sample data
- Insert/update a few sample prices with `upazila='সাভার'` for `district='ঢাকা'` + `market_name='কারওয়ান বাজার'` (only existing rows, no destructive change).

## Technical notes
- DB changes go through `supabase--migration` first, await approval, then code edits.
- `BD_LOCATIONS` lists all 64 districts with the most common upazilas (Bengali). `UPAZILA_COORDS` only includes upazilas we have coordinates for; everything else falls back to district centroid.
- Keep `DISTRICTS` export shape unchanged in `bd-data.ts` so existing imports keep working.
- All UI uses existing semantic tokens / shadcn `Select`, `Badge` — no new colors.
