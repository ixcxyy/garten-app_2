import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import * as webpush from "https://esm.sh/web-push@3.6.4";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

webpush.setVapidDetails(
  "mailto:your-email@example.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const payload = await req.json();
    console.log('Received push trigger:', payload);

    const { record, table, type, old_record, reminder_type } = payload;

    let notificationTitle = "Garden Groups";
    let notificationBody = "Neue Aktivität";
    let targetUrl = "/dashboard";
    let groupId = "";
    let actorId = "";

    if (type === 'REMINDER') {
      groupId = record?.group_id || "";
      targetUrl = groupId ? `/group/${groupId}` : "/dashboard";
      const taskTitle = record?.title || "eine Aufgabe";
      if (reminder_type === '1d') {
        notificationTitle = "⏰ Morgen fällig";
        notificationBody = `„${taskTitle}" ist morgen fällig!`;
      } else {
        notificationTitle = "📅 In 7 Tagen fällig";
        notificationBody = `„${taskTitle}" ist in einer Woche fällig.`;
      }
    } else if (table === "todos") {
      groupId = record.group_id;
      actorId = record.creator_id;
      targetUrl = `/group/${groupId}`;

      if (type === "INSERT") {
        notificationTitle = "🌱 Neue Aufgabe";
        notificationBody = record.title;
      } else if (type === "UPDATE" && old_record?.status === "pending" && record.status === "completed") {
        notificationTitle = "✅ Aufgabe erledigt";
        notificationBody = `"${record.title}" wurde abgeschlossen!`;
      } else {
        return new Response(JSON.stringify({ message: "No notification needed" }), { status: 200 });
      }
    }

    // Identify recipients
    let userIds: string[] = [];
    if (type === 'REMINDER') {
      if (groupId) {
        // Get group members for the specific group
        const { data: members } = await supabase
          .from("group_members")
          .select("user_id")
          .eq("group_id", groupId);
        userIds = (members || []).map(m => m.user_id);
      } else {
        const { data: allSubscribers } = await supabase
          .from("push_subscriptions")
          .select("user_id");
        userIds = [...new Set((allSubscribers || []).map(s => s.user_id))];
      }
    } else {
      // Get group members except the actor
      const { data: members, error: membersError } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId)
        .neq("user_id", actorId);
      if (membersError) throw membersError;
      userIds = members.map((m) => m.user_id);
    }

    if (userIds.length === 0) {
      console.log('No recipients found.');
      return new Response(JSON.stringify({ message: "No recipients to notify" }), { status: 200 });
    }

    // Get push subscriptions for these users
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", userIds);

    if (subError) throw subError;
    console.log(`Sending to ${subscriptions.length} subscriptions for ${userIds.length} users.`);

    const results = await Promise.allSettled(
      subscriptions.map((sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        const pushPayload = JSON.stringify({
          title: notificationTitle,
          body: notificationBody,
          url: targetUrl,
          tag: groupId ? `todo-${groupId}` : 'reminder',
        });

        return webpush.sendNotification(pushSubscription, pushPayload);
      })
    );

    // Filter out expired subscriptions
    const expiredSubIds = results
      .map((res, i) => {
        if (res.status === "rejected") {
          console.error('Push failed for subscription:', subscriptions[i].user_id, res.reason);
          if (res.reason.statusCode === 410 || res.reason.statusCode === 404) {
            return subscriptions[i].id;
          }
        }
        return null;
      })
      .filter(Boolean);

    if (expiredSubIds.length > 0) {
      console.log(`Removing ${expiredSubIds.length} expired subscriptions.`);
      await supabase.from("push_subscriptions").delete().in("id", expiredSubIds);
    }

    return new Response(JSON.stringify({ success: true, count: results.length }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
