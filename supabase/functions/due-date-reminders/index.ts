import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // Calculate dates for 1 day and 7 days from now
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const in7Days = new Date(now);
    in7Days.setDate(in7Days.getDate() + 7);
    const in7DaysStr = in7Days.toISOString().split("T")[0];

    // Find pending todos due tomorrow
    const { data: dueTomorrow } = await supabase
      .from("todos")
      .select("id, title, group_id, due_date")
      .eq("status", "pending")
      .eq("due_date", tomorrowStr);

    // Find pending todos due in 7 days
    const { data: dueIn7Days } = await supabase
      .from("todos")
      .select("id, title, group_id, due_date")
      .eq("status", "pending")
      .eq("due_date", in7DaysStr);

    const allReminders = [
      ...(dueTomorrow || []).map((t) => ({ ...t, reminder_type: "1d" as const })),
      ...(dueIn7Days || []).map((t) => ({ ...t, reminder_type: "7d" as const })),
    ];

    if (allReminders.length === 0) {
      return new Response(JSON.stringify({ message: "No reminders to send" }), { status: 200 });
    }

    // Group by group_id to find recipients
    const groupIds = [...new Set(allReminders.map((r) => r.group_id))];

    // Get all members of affected groups
    const { data: members } = await supabase
      .from("group_members")
      .select("user_id, group_id")
      .in("group_id", groupIds);

    // Get subscriptions for these members
    const memberIds = [...new Set((members || []).map((m) => m.user_id))];
    if (memberIds.length === 0) {
      return new Response(JSON.stringify({ message: "No members found" }), { status: 200 });
    }

    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", memberIds);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: "No push subscriptions found" }), { status: 200 });
    }

    // Call the push-notifications function for each reminder
    const pushUrl = `${SUPABASE_URL}/functions/v1/push-notifications`;
    const results: { status: string }[] = [];

    for (const reminder of allReminders) {
      // Get group members for this specific group
      const groupMembers = (members || []).filter((m) => m.group_id === reminder.group_id);
      const groupMemberIds = groupMembers.map((m) => m.user_id);
      const groupSubs = subscriptions.filter((s) => groupMemberIds.includes(s.user_id));

      if (groupSubs.length === 0) continue;

      // Send to push-notifications function
      const body = {
        type: "REMINDER",
        reminder_type: reminder.reminder_type,
        record: {
          title: reminder.title,
          group_id: reminder.group_id,
          due_date: reminder.due_date,
        },
      };

      // Override: send directly via the push-notifications edge function
      const res = await fetch(pushUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify(body),
      });

      results.push({ status: res.ok ? "sent" : "failed" });
    }

    return new Response(
      JSON.stringify({ success: true, reminders: allReminders.length, results }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Reminder error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
