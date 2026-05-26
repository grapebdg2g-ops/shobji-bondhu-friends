-- Add upazila columns first
ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS upazila text;
ALTER TABLE public.weather_alerts_sent ADD COLUMN IF NOT EXISTS upazila text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS upazila text;

-- Drop old district-level unique constraint if any
DO $$
DECLARE c text;
BEGIN
  SELECT conname INTO c
  FROM pg_constraint
  WHERE conrelid = 'public.weather_alerts_sent'::regclass
    AND contype = 'u'
    AND conname LIKE '%district%alert_type%day%';
  IF c IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.weather_alerts_sent DROP CONSTRAINT %I', c);
  END IF;
END $$;

-- Upazila-aware dedupe (NULL upazila collapses to district-level)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_weather_alerts_sent_dua_day
  ON public.weather_alerts_sent (district, COALESCE(upazila, ''), alert_type, day);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prices_upazila
  ON public.prices (district, upazila, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_upazila
  ON public.posts (district, upazila, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exchanges_upazila
  ON public.exchanges (district, upazila, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_upazila
  ON public.push_subscriptions (district, upazila);