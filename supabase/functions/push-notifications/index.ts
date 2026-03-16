import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ========== Base64URL helpers ==========

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const len = arrays.reduce((a, b) => a + b.length, 0);
  const result = new Uint8Array(len);
  let offset = 0;
  for (const arr of arrays) { result.set(arr, offset); offset += arr.length; }
  return result;
}

// ========== VAPID JWT signing ==========

function derToRaw(der: Uint8Array): Uint8Array {
  if (der.length === 64) return der;
  const raw = new Uint8Array(64);
  let off = 2;
  if (der[off] !== 0x02) return der;
  off++;
  const rLen = der[off++];
  const rStart = rLen > 32 ? off + (rLen - 32) : off;
  raw.set(der.slice(rStart, off + rLen), rLen < 32 ? 32 - rLen : 0);
  off += rLen;
  if (der[off] !== 0x02) return der;
  off++;
  const sLen = der[off++];
  const sStart = sLen > 32 ? off + (sLen - 32) : off;
  raw.set(der.slice(sStart, off + sLen), sLen < 32 ? 64 - sLen : 32);
  return raw;
}

async function createVapidJwt(audience: string, vapidPrivateKeyRaw: Uint8Array, vapidPublicKeyRaw: Uint8Array): Promise<string> {
  // Build PKCS8 from raw 32-byte private key
  const pkcs8Prefix = new Uint8Array([
    0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13,
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02,
    0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d,
    0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02,
    0x01, 0x01, 0x04, 0x20,
  ]);
  const pkcs8Suffix = new Uint8Array([0xa1, 0x44, 0x03, 0x42, 0x00]);
  const pkcs8 = concat(pkcs8Prefix, vapidPrivateKeyRaw, pkcs8Suffix, vapidPublicKeyRaw);

  const privateKey = await crypto.subtle.importKey(
    "pkcs8", pkcs8, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]
  );

  const header = b64url(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(new TextEncoder().encode(JSON.stringify({
    aud: audience, exp: now + 12 * 3600, sub: "mailto:gardengroups@example.com",
  })));
  const token = `${header}.${payload}`;

  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" }, privateKey, new TextEncoder().encode(token)
  );
  return `${token}.${b64url(derToRaw(new Uint8Array(sig)))}`;
}

// ========== RFC 8291 Web Push Encryption ==========

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const prk = new Uint8Array(await crypto.subtle.sign("HMAC", key, salt.length > 0 ? salt : new Uint8Array(32)));

  // Actually HKDF: extract then expand
  const prkKey = await crypto.subtle.importKey("raw", salt, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const extract = new Uint8Array(await crypto.subtle.sign("HMAC", prkKey, ikm));

  const expandKey = await crypto.subtle.importKey("raw", extract, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const infoWithCounter = concat(info, new Uint8Array([1]));
  const okm = new Uint8Array(await crypto.subtle.sign("HMAC", expandKey, infoWithCounter));
  return okm.slice(0, length);
}

function createInfo(type: string, clientPublicKey: Uint8Array, serverPublicKey: Uint8Array): Uint8Array {
  const encoder = new TextEncoder();
  const typeBytes = encoder.encode(type);
  // "Content-Encoding: <type>\0" + "P-256\0" + len(clientPub) + clientPub + len(serverPub) + serverPub
  const header = encoder.encode("Content-Encoding: ");
  const nul = new Uint8Array([0]);
  const p256 = encoder.encode("P-256");
  const clientLen = new Uint8Array(2);
  new DataView(clientLen.buffer).setUint16(0, clientPublicKey.length);
  const serverLen = new Uint8Array(2);
  new DataView(serverLen.buffer).setUint16(0, serverPublicKey.length);

  return concat(header, typeBytes, nul, p256, nul, clientLen, clientPublicKey, serverLen, serverPublicKey);
}

async function encryptPayload(
  clientPublicKeyBytes: Uint8Array,
  authSecret: Uint8Array,
  payloadText: string,
): Promise<{ encrypted: Uint8Array; serverPublicKeyBytes: Uint8Array; salt: Uint8Array }> {
  // Generate ephemeral ECDH key pair
  const serverKeys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const serverPublicKeyBytes = new Uint8Array(await crypto.subtle.exportKey("raw", serverKeys.publicKey));

  // Import client public key
  const clientPublicKey = await crypto.subtle.importKey(
    "raw", clientPublicKeyBytes, { name: "ECDH", namedCurve: "P-256" }, false, []
  );

  // ECDH shared secret
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits(
    { name: "ECDH", public: clientPublicKey }, serverKeys.privateKey, 256
  ));

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // RFC 8291: IKM = HKDF(auth_secret, ecdh_secret, "WebPush: info\0" || client_pub || server_pub, 32)
  const authInfo = concat(
    new TextEncoder().encode("WebPush: info\0"),
    clientPublicKeyBytes,
    serverPublicKeyBytes,
  );
  const ikm = await hkdf(authSecret, sharedSecret, authInfo, 32);

  // Derive content encryption key and nonce
  const cekInfo = concat(new TextEncoder().encode("Content-Encoding: aes128gcm\0"));
  const nonceInfo = concat(new TextEncoder().encode("Content-Encoding: nonce\0"));

  const cek = await hkdf(salt, ikm, cekInfo, 16);
  const nonce = await hkdf(salt, ikm, nonceInfo, 12);

  // Pad payload: add delimiter byte 0x02 then padding zeros
  const payloadBytes = new TextEncoder().encode(payloadText);
  const paddedPayload = concat(payloadBytes, new Uint8Array([2]));

  // AES-128-GCM encrypt
  const aesKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce }, aesKey, paddedPayload
  ));

  // Build aes128gcm content coding header: salt(16) + rs(4) + idlen(1) + keyid(65) + ciphertext
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096);
  const idlen = new Uint8Array([65]); // length of serverPublicKey (uncompressed P-256 = 65 bytes)

  const encrypted = concat(salt, rs, idlen, serverPublicKeyBytes, ciphertext);
  return { encrypted, serverPublicKeyBytes, salt };
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payloadText: string,
  vapidPublicKeyB64: string,
  vapidPrivateKeyRaw: Uint8Array,
  vapidPublicKeyRaw: Uint8Array,
): Promise<{ ok: boolean; status: number; statusText: string }> {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const jwt = await createVapidJwt(audience, vapidPrivateKeyRaw, vapidPublicKeyRaw);

  const clientPublicKey = b64urlDecode(subscription.p256dh);
  const authSecret = b64urlDecode(subscription.auth);

  const { encrypted } = await encryptPayload(clientPublicKey, authSecret, payloadText);

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Authorization": `vapid t=${jwt}, k=${vapidPublicKeyB64}`,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      "TTL": "86400",
    },
    body: encrypted,
  });

  return { ok: response.ok, status: response.status, statusText: response.statusText };
}

// ========== Main handler ==========

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
          .from("group_members").select("user_id").eq("group_id", groupId);
        userIds = (members || []).map((m: { user_id: string }) => m.user_id);
      } else {
        const { data: allSubs } = await supabase
          .from("push_subscriptions").select("user_id");
        userIds = [...new Set((allSubs || []).map((s: { user_id: string }) => s.user_id))];
      }
    } else {
      const query = supabase.from("group_members").select("user_id").eq("group_id", groupId);
      if (actorId) query.neq("user_id", actorId);
      const { data: members, error: membersError } = await query;
      if (membersError) throw membersError;
      userIds = (members || []).map((m: { user_id: string }) => m.user_id);
    }

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ message: "No recipients" }), { status: 200 });
    }

    // Get push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions").select("*").in("user_id", userIds);

    if (subError) throw subError;

    const vapidPublicKeyRaw = b64urlDecode(VAPID_PUBLIC_KEY);
    const vapidPrivateKeyRaw = b64urlDecode(VAPID_PRIVATE_KEY);

    const pushPayload = JSON.stringify({
      title: notificationTitle,
      body: notificationBody,
      url: targetUrl,
      tag: groupId ? `todo-${groupId}` : "reminder",
    });

    // Send real Web Push to all subscriptions
    const expiredIds: string[] = [];
    let successCount = 0;

    if (subscriptions && subscriptions.length > 0) {
      const results = await Promise.allSettled(
        subscriptions.map((sub) =>
          sendWebPush(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            pushPayload,
            VAPID_PUBLIC_KEY,
            vapidPrivateKeyRaw,
            vapidPublicKeyRaw,
          )
        )
      );

      for (let i = 0; i < results.length; i++) {
        const res = results[i];
        if (res.status === "fulfilled") {
          if (res.value.ok) {
            successCount++;
          } else {
            console.error(`Push failed for sub ${subscriptions[i].id}: ${res.value.status} ${res.value.statusText}`);
            if (res.value.status === 410 || res.value.status === 404) {
              expiredIds.push(subscriptions[i].id);
            }
          }
        } else {
          console.error(`Push error for sub ${subscriptions[i].id}:`, res.reason);
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredIds.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", expiredIds);
    }

    // Also store in notifications table as fallback for in-app display
    const notifications = userIds.map((userId: string) => ({
      user_id: userId,
      title: notificationTitle,
      content: notificationBody,
      type: "info",
      is_read: false,
    }));
    await supabase.from("notifications").insert(notifications).catch(() => {});

    console.log(`Push sent: ${successCount}/${subscriptions?.length || 0} successful, ${expiredIds.length} expired removed`);

    return new Response(
      JSON.stringify({ success: true, sent: successCount, total: subscriptions?.length || 0 }),
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
