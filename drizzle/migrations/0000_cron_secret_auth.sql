-- lovable-cron-fallback-reviewed: 288 runs/day; scheduled broadcasts must go out within 5 minutes of their send time, existing cadence preserved while only swapping the auth header
-- Private store for the pg_cron shared secret. No RLS policies and no
-- anon/authenticated grants = unreachable through the Data API; only
-- service_role and SECURITY DEFINER functions can read it.
CREATE TABLE IF NOT EXISTS public.internal_secrets (
  name text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON public.internal_secrets FROM PUBLIC;
REVOKE ALL ON public.internal_secrets FROM anon;
REVOKE ALL ON public.internal_secrets FROM authenticated;
GRANT ALL ON public.internal_secrets TO service_role;
ALTER TABLE public.internal_secrets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_cron_secret(_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _value IS NULL OR length(_value) < 16 THEN
    RAISE EXCEPTION 'CRON secret too short';
  END IF;
  INSERT INTO public.internal_secrets (name, value, updated_at)
  VALUES ('CRON_SECRET', _value, now())
  ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.set_cron_secret(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_cron_secret(text) FROM anon;
REVOKE ALL ON FUNCTION public.set_cron_secret(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.set_cron_secret(text) TO service_role;

CREATE OR REPLACE FUNCTION public.invoke_cron_hook(_path text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  secret text;
  request_id bigint;
BEGIN
  SELECT value INTO secret FROM public.internal_secrets WHERE name = 'CRON_SECRET';
  IF secret IS NULL OR secret = '' THEN
    RAISE EXCEPTION 'CRON_SECRET is not configured';
  END IF;

  SELECT net.http_post(
    url := 'https://project--8650a8d8-8f85-4dd3-b151-3b951324aae3.lovable.app/api/public/hooks/' || _path,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', secret),
    body := '{}'::jsonb
  ) INTO request_id;

  RETURN request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.invoke_cron_hook(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.invoke_cron_hook(text) FROM anon;
REVOKE ALL ON FUNCTION public.invoke_cron_hook(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.invoke_cron_hook(text) TO service_role;

-- Re-point every scheduled job at the helper (drops the embedded anon key).
SELECT cron.unschedule(jobname)
FROM cron.job
WHERE jobname IN (
  'weather-alerts-3h','send-scheduled-broadcasts','fetch-govt-prices-daily',
  'check-prediction-accuracy-daily','crop-reminders-daily','market-prices-daily'
);

SELECT cron.schedule('weather-alerts-3h', '0 */3 * * *', $$SELECT public.invoke_cron_hook('weather-alerts');$$);
SELECT cron.schedule('send-scheduled-broadcasts', '*/5 * * * *', $$SELECT public.invoke_cron_hook('send-scheduled-broadcasts');$$);
SELECT cron.schedule('fetch-govt-prices-daily', '0 2 * * *', $$SELECT public.invoke_cron_hook('fetch-govt-prices');$$);
SELECT cron.schedule('check-prediction-accuracy-daily', '0 9 * * *', $$SELECT public.invoke_cron_hook('check-prediction-accuracy');$$);
SELECT cron.schedule('crop-reminders-daily', '0 0 * * *', $$SELECT public.invoke_cron_hook('crop-reminders');$$);
SELECT cron.schedule('market-prices-daily', '15 2 * * *', $$SELECT public.invoke_cron_hook('fetch-govt-prices');$$);