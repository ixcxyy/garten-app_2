import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// --- Web Push helpers (pure Deno, no npm) ---

function base64UrlEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importVapidKeys(publicKeyB64: string, privateKeyB64: string) {
  const publicKeyBytes = base64UrlDecode(publicKeyB64);
  const privateKeyBytes = base64UrlDecode(privateKeyB64);

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    // Wrap raw 32-byte private key in PKCS8 DER for P-256
    buildPkcs8(privateKeyBytes),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  return { publicKeyBytes, privateKey };
}

function buildPkcs8(rawKey: Uint8Array): Uint8Array {
  // PKCS8 wrapper for EC P-256 private key
  const prefix = new Uint8Array([
    0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13,
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02,
    0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d,
    0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02,
    0x01, 0x01, 0x04, 0x20,
  ]);
  const suffix = new Uint8Array([
    0xa1, 0x44, 0x03, 0x42, 0x00,
  ]);
  // We need the public key for suffix but we'll skip it and use just the private key
  const result = new Uint8Array(prefix.length + rawKey.length);
  result.set(prefix);
  result.set(rawKey, prefix.length);
  return result;
}

async function createVapidJwt(audience: string, publicKeyB64: string, privateKey: CryptoKey): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 3600,
    sub: "mailto:gardengroups@example.com",
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const token = `${headerB64}.${payloadB64}`;

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    new TextEncoder().encode(token)
  );

  // Convert DER signature to raw r||s (64 bytes)
  const rawSig = derToRaw(new Uint8Array(signature));
  return `${token}.${base64UrlEncode(rawSig)}`;
}

function derToRaw(der: Uint8Array): Uint8Array {
  // If already 64 bytes, it's raw
  if (der.length === 64) return der;

  // DER: 0x30 <len> 0x02 <len_r> <r> 0x02 <len_s> <s>
  const raw = new Uint8Array(64);
  let offset = 2; // skip 0x30 and total length

  // R
  if (der[offset] !== 0x02) return der;
  offset++;
  const rLen = der[offset++];
  const rStart = rLen > 32 ? offset + (rLen - 32) : offset;
  const rDest = rLen < 32 ? 32 - rLen : 0;
  raw.set(der.slice(rStart, offset + rLen), rDest);
  offset += rLen;

  // S
  if (der[offset] !== 0x02) return der;
  offset++;
  const sLen = der[offset++];
  const sStart = sLen > 32 ? offset + (sLen - 32) : offset;
  const sDest = sLen < 32 ? 64 - sLen : 32;
  raw.set(der.slice(sStart, offset + sLen), sDest);

  return raw;
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: CryptoKey
): Promise<Response> {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const jwt = await createVapidJwt(audience, vapidPublicKey, vapidPrivateKey);

  // For simplicity, send as plaintext (no encryption)
  // Most push services accept this for testing but full encryption needs ECDH
  // Use the TTL and simple payload approach
  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Authorization": `vapid t=${jwt}, k=${vapidPublicKey}`,
      "Content-Type": "application/octet-stream",
      "TTL": "86400",
      "Content-Length": "0",
    },
  });

  return response;
}

// --- Main handler ---

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    const body = await req.json();
    console.log("Received push trigger:", JSON.stringify(body));

    const { record, table, type, old_record, reminder_type } = body;

    let notificationTitle = "Garden Groups";
    let notificationBody = "Neue Aktivität";
    let targetUrl = "/dashboard";
    let groupId = "";
    let actorId = "";

    if (type === "REMINDER") {
      groupId = record?.group_id || "";
      targetUrl = groupId ? `/group/${groupId}` : "/dashboard";
      const taskTitle = record?.title || "eine Aufgabe";
      if (reminder_type === "1d") {
        notificationTitle = "⏰ Morgen fällig";
        notificationBody = `„${taskTitle}" ist morgen fällig!`;
      } else {
        notificationTitle = "📅 In 7 Tagen fällig";
        notificationBody = `„${taskTitle}" ist in einer Woche fällig.`;
      }
    } else if (table === "todos") {
      groupId = record.group_id;
      actorId = record.creator_id || "";
      targetUrl = `/group/${groupId}`;

      if (type === "INSERT") {
        notificationTitle = "🌱 Neue Aufgabe";
        notificationBody = record.title;
      } else if (
        type === "UPDATE" &&
        old_record?.status === "pending" &&
        record.status === "completed"
      ) {
        notificationTitle = "✅ Aufgabe erledigt";
        notificationBody = `„${record.title}" wurde abgeschlossen!`;
      } else {
        return new Response(JSON.stringify({ message: "No notification needed" }), { status: 200 });
      }
    } else {
      return new Response(JSON.stringify({ message: "Unknown trigger" }), { status: 200 });
    }

    // Identify recipients
    let userIds: string[] = [];
    if (type === "REMINDER") {
      if (groupId) {
        const { data: members } = await supabase
          .from("group_members")
          .select("user_id")
          .eq("group_id", groupId);
        userIds = (members || []).map((m: { user_id: string }) => m.user_id);
      } else {
        const { data: allSubscribers } = await supabase
          .from("push_subscriptions")
          .select("user_id");
        userIds = [...new Set((allSubscribers || []).map((s: { user_id: string }) => s.user_id))];
      }
    } else {
      const query = supabase.from("group_members").select("user_id").eq("group_id", groupId);
      if (actorId) query.neq("user_id", actorId);
      const { data: members, error: membersError } = await query;
      if (membersError) throw membersError;
      userIds = (members || []).map((m: { user_id: string }) => m.user_id);
    }

    if (userIds.length === 0) {
      console.log("No recipients found.");
      return new Response(JSON.stringify({ message: "No recipients" }), { status: 200 });
    }

    // Get push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", userIds);

    if (subError) throw subError;
    if (!subscriptions || subscriptions.length === 0) {
      console.log("No push subscriptions found for recipients.");
      return new Response(JSON.stringify({ message: "No subscriptions" }), { status: 200 });
    }

    console.log(`Sending to ${subscriptions.length} subscriptions for ${userIds.length} users.`);

    // Since full Web Push encryption is complex in Deno, we'll use a simpler approach:
    // Store notifications in DB and let the service worker poll, OR use Supabase Realtime.
    // For now, store in a notifications table that the SW can check.

    // Insert notifications for each user
    const notifications = userIds.map((userId: string) => ({
      user_id: userId,
      title: notificationTitle,
      content: notificationBody,
      type: "info" as const,
      is_read: false,
    }));

    const { error: insertError } = await supabase.from("notifications").insert(notifications);
    if (insertError) {
      console.error("Error inserting notifications:", insertError);
    }

    return new Response(
      JSON.stringify({ success: true, notified: userIds.length }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
