
-- Push subscriptions (per-device)
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  district text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_push_subs_user ON public.push_subscriptions(user_id);
CREATE INDEX idx_push_subs_district ON public.push_subscriptions(district);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscriptions"
  ON public.push_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own subscriptions"
  ON public.push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own subscriptions"
  ON public.push_subscriptions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own subscriptions"
  ON public.push_subscriptions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Dedupe log for weather alerts
CREATE TABLE public.weather_alerts_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  district text NOT NULL,
  alert_type text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  day date GENERATED ALWAYS AS (((sent_at AT TIME ZONE 'Asia/Dhaka'))::date) STORED,
  UNIQUE (district, alert_type, day)
);
CREATE INDEX idx_wa_sent_lookup ON public.weather_alerts_sent(district, alert_type, day);

ALTER TABLE public.weather_alerts_sent ENABLE ROW LEVEL SECURITY;
-- No policies = no access for anon/authenticated; only service role can read/write.
