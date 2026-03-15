// Supabase Edge Function: push-notifications
// Deploy with: supabase functions deploy push-notifications

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { record, table, type } = await req.json();

    // Only handle new todos or completed todos
    if (table === "todos") {
      const todo = record;
      const groupId = todo.group_id;
      
      // 1. Get all members of the group except the creator
      const { data: members } = await supabaseClient
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId)
        .neq("user_id", todo.creator_id);

      if (!members || members.length === 0) return new Response("No members to notify");

      const userIds = members.map(m => m.user_id);

      // 2. Get push subscriptions for these users
      const { data: subscriptions } = await supabaseClient
        .from("push_subscriptions")
        .select("*")
        .in("user_id", userIds);

      if (!subscriptions || subscriptions.length === 0) return new Response("No subscriptions found");

      // 3. Configure web-push
      webpush.setVapidDetails(
        "mailto:example@yourdomain.com",
        Deno.env.get("VAPID_PUBLIC_KEY") ?? "",
        Deno.env.get("VAPID_PRIVATE_KEY") ?? ""
      );

      const notificationPayload = JSON.stringify({
        title: type === "INSERT" ? "🌱 Neue Aufgabe" : "✅ Aufgabe erledigt",
        body: todo.title,
        url: `/group/${todo.group_id}`,
        tag: `todo-${todo.id}`,
      });

      // 4. Send notifications
      const pushPromises = subscriptions.map(sub => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };
        return webpush.sendNotification(pushSubscription, notificationPayload).catch(err => {
          console.error("Error sending push:", err);
          // Optional: delete expired subscription
          if (err.statusCode === 410 || err.statusCode === 404) {
             return supabaseClient.from("push_subscriptions").delete().eq("id", sub.id);
          }
        });
      });

      await Promise.all(pushPromises);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
