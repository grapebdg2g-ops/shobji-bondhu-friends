import { createFileRoute } from "@tanstack/react-router";
import webpush from "web-push";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getDistrictLatLng } from "@/lib/bd-data";
import { fetchForecast, evaluateAlert, type WeatherAlert } from "@/lib/weather.server";

const MAX_PER_USER_PER_DAY = 3;

async function sendPush(subscription: { endpoint: string; p256dh: string; auth: string }, payload: object) {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
    );
    return { ok: true };
  } catch (err: any) {
    // 404/410 = gone — delete the subscription
    if (err?.statusCode === 404 || err?.statusCode === 410) {
      await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
    }
    return { ok: false, error: String(err?.message ?? err) };
  }
}

async function processDistrict(district: string) {
  const [lat, lng] = getDistrictLatLng(district);
  let forecast;
  try {
    forecast = await fetchForecast(lat, lng);
  } catch (err) {
    console.error(`[weather-alerts] forecast failed for ${district}`, err);
    return { district, skipped: true, reason: "forecast_error" };
  }
  const alert = evaluateAlert(district, forecast);
  if (!alert) return { district, skipped: true, reason: "no_alert" };

  // Dedupe per (district, alert_type, day) — unique constraint enforces this atomically
  const { error: dedupeErr } = await supabaseAdmin
    .from("weather_alerts_sent")
    .insert({ district, alert_type: alert.type });
  if (dedupeErr) {
    // Duplicate → already sent today
    if (dedupeErr.code === "23505") return { district, skipped: true, reason: "already_sent" };
    console.error("[weather-alerts] dedupe insert error", dedupeErr);
    return { district, skipped: true, reason: "db_error" };
  }

  // Fetch subscriptions for this district
  const { data: subs } = await supabaseAdmin
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth")
    .eq("district", district);

  if (!subs || subs.length === 0) return { district, alert: alert.type, recipients: 0 };

  // Group by user_id for per-user cap check
  const userIds = Array.from(new Set(subs.map((s) => s.user_id)));
  const todayStartUtc = new Date();
  todayStartUtc.setUTCHours(0, 0, 0, 0); // approx; cap is fuzzy by design
  const { data: recentCounts } = await supabaseAdmin
    .from("notifications")
    .select("user_id")
    .in("user_id", userIds)
    .like("type", "weather_%")
    .gte("created_at", todayStartUtc.toISOString());
  const countByUser = new Map<string, number>();
  (recentCounts ?? []).forEach((r: any) => {
    countByUser.set(r.user_id, (countByUser.get(r.user_id) ?? 0) + 1);
  });

  const allowedUserIds = userIds.filter((uid) => (countByUser.get(uid) ?? 0) < MAX_PER_USER_PER_DAY);

  // Insert in-app notifications (one per user)
  if (allowedUserIds.length > 0) {
    await supabaseAdmin.from("notifications").insert(
      allowedUserIds.map((uid) => ({
        user_id: uid,
        type: `weather_${alert.type.toLowerCase()}`,
        title: alert.title,
        body: alert.body,
        ref_type: "weather",
      })),
    );
  }

  // Send push to each subscription belonging to an allowed user
  const pushPayload = {
    title: alert.title,
    body: alert.body,
    type: alert.type,
    severity: alert.severity,
    url: "/weather",
  };
  const sends = subs
    .filter((s) => allowedUserIds.includes(s.user_id))
    .map((s) => sendPush(s, pushPayload));
  const results = await Promise.all(sends);
  const delivered = results.filter((r) => r.ok).length;

  return { district, alert: alert.type, recipients: allowedUserIds.length, delivered };
}

export const Route = createFileRoute("/api/public/hooks/weather-alerts")({
  server: {
    handlers: {
      POST: async () => {
        const vapidPub = process.env.VAPID_PUBLIC_KEY;
        const vapidPriv = process.env.VAPID_PRIVATE_KEY;
        const vapidSub = process.env.VAPID_SUBJECT;
        if (!vapidPub || !vapidPriv || !vapidSub) {
          return Response.json(
            { ok: false, error: "VAPID keys not configured" },
            { status: 500 },
          );
        }
        webpush.setVapidDetails(vapidSub, vapidPub, vapidPriv);

        // Get distinct districts that have subscribers
        const { data: rows, error } = await supabaseAdmin
          .from("push_subscriptions")
          .select("district")
          .not("district", "is", null);
        if (error) {
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }
        const districts = Array.from(
          new Set((rows ?? []).map((r: any) => r.district as string).filter(Boolean)),
        );

        const results: any[] = [];
        for (const d of districts) {
          // Sequential to avoid hammering Open-Meteo
          results.push(await processDistrict(d));
        }

        return Response.json({
          ok: true,
          ran_at: new Date().toISOString(),
          districts_processed: districts.length,
          results,
        });
      },
      GET: async () => Response.json({ ok: true, hint: "POST to run; scheduled via pg_cron" }),
    },
  },
});
