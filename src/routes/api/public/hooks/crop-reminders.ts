import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { configureVapid, sendWebPush } from "@/lib/push.server";

type Reminder = {
  id: string;
  user_id: string;
  crop_type: string;
  title: string;
  note: string | null;
  reminder_date: string;
};

type Subscription = {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

function isAuthorized(request: Request) {
  const expected = process.env.PUSH_CRON_SECRET;
  if (!expected) return true;
  return request.headers.get("x-push-cron-secret") === expected;
}

export const Route = createFileRoute("/api/public/hooks/crop-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isAuthorized(request)) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        if (!configureVapid()) return Response.json({ ok: false, error: "VAPID keys not configured" }, { status: 500 });

        const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
        const { data: reminders, error } = await supabaseAdmin
          .from("crop_reminders")
          .select("id, user_id, crop_type, title, note, reminder_date")
          .eq("is_active", true)
          .eq("is_done", false)
          .lte("reminder_date", today)
          .or(`last_notified_date.is.null,last_notified_date.lt.${today}`)
          .limit(500);
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
        if (!reminders || reminders.length === 0) return Response.json({ ok: true, due: 0, delivered: 0 });

        const rows = reminders as Reminder[];
        const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
        const { data: subscriptions, error: subscriptionError } = await supabaseAdmin
          .from("push_subscriptions")
          .select("user_id, endpoint, p256dh, auth")
          .in("user_id", userIds);
        if (subscriptionError) return Response.json({ ok: false, error: subscriptionError.message }, { status: 500 });

        const subsByUser = new Map<string, Subscription[]>();
        for (const sub of (subscriptions ?? []) as Subscription[]) {
          const list = subsByUser.get(sub.user_id) ?? [];
          list.push(sub);
          subsByUser.set(sub.user_id, list);
        }

        let delivered = 0;
        let notifications = 0;
        for (const reminder of rows) {
          const body = reminder.note ? `${reminder.crop_type} · ${reminder.note}` : `${reminder.crop_type} · আজকের কাজটি মনে রাখুন`;
          const { error: notificationError } = await supabaseAdmin.from("notifications").insert({
            user_id: reminder.user_id,
            type: "crop_reminder",
            title: reminder.title,
            body,
            ref_id: reminder.id,
            ref_type: "crop_reminder",
          });
          if (!notificationError) notifications += 1;

          const payload = {
            title: `🌱 ${reminder.title}`,
            body,
            type: "crop_reminder",
            tag: `crop-reminder-${reminder.id}`,
            severity: "normal",
            url: "/crop-diary",
          };
          const results = await Promise.all((subsByUser.get(reminder.user_id) ?? []).map((sub) => sendWebPush(sub, payload)));
          delivered += results.filter((result) => result.ok).length;

          await supabaseAdmin.from("crop_reminders").update({ last_notified_date: today }).eq("id", reminder.id);
        }

        return Response.json({ ok: true, due: rows.length, notifications, delivered, ran_at: new Date().toISOString() });
      },
      GET: async () => Response.json({ ok: true, hint: "POST to deliver due crop reminders" }),
    },
  },
});
