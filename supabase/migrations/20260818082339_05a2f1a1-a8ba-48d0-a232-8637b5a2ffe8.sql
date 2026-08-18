select cron.unschedule('crop-reminders-daily') where exists (select 1 from cron.job where jobname = 'crop-reminders-daily');

select cron.schedule(
  'crop-reminders-daily',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--8650a8d8-8f85-4dd3-b151-3b951324aae3.lovable.app/api/public/hooks/crop-reminders',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5bXdpYmZsdGN4YXFqbHB3eW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTg5NjUsImV4cCI6MjA5NTI3NDk2NX0.10teMxa8N22OzCUewExju68fJZAZpt_lGgDeVhsHzQk"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);