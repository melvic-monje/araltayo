// Supabase Edge Function: send-push
// Sends web push notifications to subscribed users.
// Called by cron job or manually. Handles:
//   - Daily study streak reminder (7pm if not used today)
//   - Weekly summary (Sunday morning)
//
// Deploy: supabase functions deploy send-push
// Env vars needed: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_EMAIL = Deno.env.get("VAPID_EMAIL") ?? "noreply@araltayo.ph";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface PushSubscription {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

Deno.serve(async (req) => {
  try {
    const { type } = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (type === "daily_reminder") {
      // Find users who have push subs but no AI usage today
      const today = new Date().toISOString().slice(0, 10);
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("user_id, endpoint, p256dh, auth");

      if (!subs || subs.length === 0) {
        return new Response(JSON.stringify({ sent: 0 }), { headers: { "Content-Type": "application/json" } });
      }

      const { data: activeUsers } = await supabase
        .from("ai_usage")
        .select("user_id")
        .gte("created_at", `${today}T00:00:00Z`);

      const activeIds = new Set((activeUsers ?? []).map((u: { user_id: string }) => u.user_id));
      const inactive = (subs as PushSubscription[]).filter((s) => !activeIds.has(s.user_id));

      let sent = 0;
      for (const sub of inactive) {
        await sendPush(sub, {
          title: "Aral na! 📚",
          body: "Hindi ka pa nag-aaral ngayong araw. Gumawa ng isang quiz para ma-maintain ang streak mo!",
          url: "/dashboard",
        });
        sent++;
      }

      return new Response(JSON.stringify({ sent }), { headers: { "Content-Type": "application/json" } });
    }

    if (type === "weekly_summary") {
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("user_id, endpoint, p256dh, auth");

      let sent = 0;
      for (const sub of (subs ?? []) as PushSubscription[]) {
        await sendPush(sub, {
          title: "Weekly Study Summary 🎓",
          body: "Tingnan ang progress mo this week sa AralTayo!",
          url: "/dashboard",
        });
        sent++;
      }

      return new Response(JSON.stringify({ sent }), { headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown type" }), { status: 400 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

async function sendPush(
  sub: PushSubscription,
  payload: { title: string; body: string; url: string }
) {
  // Use web-push compatible manual VAPID signing
  // For production, use a Deno-compatible web-push library
  try {
    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-96x96.png",
      data: { url: payload.url },
    });

    // Import web push sending via fetch with VAPID
    const { default: webpush } = await import("https://esm.sh/web-push@3.6.7");
    webpush.setVapidDetails(`mailto:${VAPID_EMAIL}`, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      pushPayload
    );
  } catch {
    // Subscription may be expired — silently skip
  }
}
