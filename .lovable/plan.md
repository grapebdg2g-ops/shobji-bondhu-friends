## Weather-Based Alerts for Farmers

Big feature with 3 parts. Before I start, a few notes + 2 small decisions I need from you.

---

### Stack notes (heads-up, not blockers)

1. **Edge Function vs TanStack server route** — তুমি `supabase/functions/weather-alerts` চেয়েছ, but এই প্রজেক্ট TanStack Start-এ চলে; এখানে scheduled job-এর canonical জায়গা হল `src/routes/api/public/hooks/weather-alerts.ts` (pg_cron → pg_net → এই route)। কাজ, schedule (`0 */3 * * *`), security — সব একই, শুধু runtime আলাদা। আমি এটাই use করব unless তুমি বল.

2. **Push delivery requires VAPID keys** — Web Push চালাতে `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` + `VAPID_SUBJECT` (mailto:...) লাগবে। তোমাকে generate করে দিতে হবে (`npx web-push generate-vapid-keys`) এবং আমাকে secrets হিসেবে দিতে হবে। এর আগ পর্যন্ত notification "send" হবে না — but DB rows, banner, /weather page সবই কাজ করবে।

3. **`push_subscriptions` table নেই** — তৈরি করতে হবে (নিচে migration plan-এ আছে)।

4. **Weather data source** — Open-Meteo free API (no key needed) — `api.open-meteo.com/v1/forecast?...` দিয়ে district lat/lng থেকে current + hourly + 7-day আনব। `src/lib/bd-data.ts`-এ already district list আছে; lat/lng map যোগ করব।

---

### What I'll build

#### 1. Database (migration)

```sql
-- push subscriptions (per-device)
CREATE TABLE push_subscriptions (
  id uuid PK, user_id uuid NOT NULL,
  endpoint text UNIQUE NOT NULL,
  p256dh text NOT NULL, auth text NOT NULL,
  district text, created_at timestamptz
);
-- RLS: users CRUD own rows; service role reads all

-- dedupe table
CREATE TABLE weather_alerts_sent (
  id uuid PK, district text, alert_type text,
  sent_at timestamptz default now(),
  day date GENERATED ALWAYS AS ((sent_at AT TIME ZONE 'Asia/Dhaka')::date) STORED,
  UNIQUE(district, alert_type, day)
);
-- RLS: no public access (service role only)
```

#### 2. Server route — `src/routes/api/public/hooks/weather-alerts.ts`

- Triggered by pg_cron every 3 hours (`0 */3 * * *` Asia/Dhaka).
- For each distinct district in `push_subscriptions`:
  - Fetch Open-Meteo forecast (current + next 6h hourly).
  - Evaluate rules:
    - **STORM** (`weather_code >= 95`) → HIGH, anytime
    - **HEAVY_RAIN** (`precipitation_probability > 80 && weather_code >= 61`) → HIGH, anytime
    - **HEAT_WAVE** (`temperature_2m > 38`) → MEDIUM, 8 AM only
    - **GOOD** (`weather_code <= 2 && temp 22–30`) → LOW, 7 AM only
  - Dedupe via `weather_alerts_sent` unique constraint (`ON CONFLICT DO NOTHING`).
  - Per-user cap: max 3/day (count notifications of type `weather_*` for today; skip if ≥3).
  - Insert into `notifications` table (already exists) + send Web Push via `web-push` npm package using VAPID keys.

Bengali bodies match your spec exactly, with `[জেলা]` / `[X]` interpolation.

#### 3. pg_cron schedule (via insert tool)

```sql
SELECT cron.schedule('weather-alerts-3h', '0 */3 * * *', $$
  SELECT net.http_post(
    url := 'https://project--8650a8d8-...lovable.app/api/public/hooks/weather-alerts',
    headers := '{"Content-Type":"application/json","apikey":"<anon>"}'::jsonb,
    body := '{}'::jsonb
  );
$$);
```

#### 4. In-app banner — `src/components/krishi/weather-alert-banner.tsx`

- Mounted on `/dashboard` above the cards section.
- Uses TanStack Query (`["weather-current", district]`, staleTime 30min) hitting a tiny `getCurrentWeather` serverFn.
- Renders only if STORM / HEAVY_RAIN / HEAT detected.
- Slide-down animation (framer-motion), 10s auto-dismiss with countdown bar, ✕ button, "বিস্তারিত জানুন →" → `/weather`.
- Color variants per spec (amber/blue/red).

#### 5. `/weather` page — `src/routes/weather.tsx`

- Current conditions (large temp + icon + condition Bengali).
- Hourly forecast — horizontal scroll, next 24h.
- 7-day forecast — full-width rows.
- Farming calendar — generates Bengali recommendations from forecast (rain → no pesticide, sunny → fertilizer, cloudy → planting).
- Past-7-day rainfall bar chart (recharts).

#### 6. PWA service worker push handler

- Add `public/sw.js` (or extend existing) with `push` + `notificationclick` handlers.
- Subscribe-to-push helper called from `pwa-manager.tsx` after user opts in; saves subscription to `push_subscriptions`.

---

### Files touched

- migration (push_subscriptions + weather_alerts_sent)
- `src/routes/api/public/hooks/weather-alerts.ts` (new)
- `src/lib/weather.functions.ts` (new — getCurrentWeather, getForecast serverFns)
- `src/lib/weather.server.ts` (new — Open-Meteo client + alert evaluator)
- `src/lib/bd-data.ts` (add district→latlng map)
- `src/components/krishi/weather-alert-banner.tsx` (new)
- `src/routes/dashboard.tsx` (mount banner)
- `src/routes/weather.tsx` (new)
- `src/components/krishi/pwa-manager.tsx` (push subscribe)
- `public/sw.js` (push handler — extend if exists)
- `bun add web-push @types/web-push`
- pg_cron insert (after route deployed)

---

### Two quick questions before I start

1. **VAPID keys** — তুমি কি এখন generate করে দিতে পারবে, নাকি প্রথমে DB + banner + /weather page বানিয়ে রাখি এবং push delivery পরে wire করি?
2. **Edge Function নাকি TanStack route** — আমি TanStack route recommend করছি (stack-native, cheaper, same behavior)। OK?