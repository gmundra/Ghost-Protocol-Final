import { createClient } from "npm:@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!keySecret) return json({ error: "razorpay_not_configured" }, 500);

  let payload: any;
  try { payload = await req.json(); } catch { return json({ error: "bad_json" }, 400); }

  const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload ?? {};
  if (!order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return json({ error: "missing_fields" }, 400);
  }

  // Verify HMAC SHA-256 signature per Razorpay docs.
  const expected = createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expected !== razorpay_signature) {
    return json({ error: "signature_mismatch" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Look up the order and confirm the razorpay_order_id matches what we stored.
  const { data: existing, error: fetchErr } = await supabase.from("orders")
    .select("id, order_number, razorpay_order_id, kind, status")
    .eq("id", order_id)
    .maybeSingle();

  if (fetchErr || !existing) return json({ error: "order_not_found" }, 404);
  if (existing.razorpay_order_id !== razorpay_order_id) {
    return json({ error: "order_mismatch" }, 400);
  }

  const nowIso = new Date().toISOString();
  const { data: updated, error: updErr } = await supabase.from("orders").update({
    razorpay_payment_id,
    status: "paid",
    paid_at: nowIso,
    updated_at: nowIso,
  }).eq("id", order_id).select("id, order_number, kind").single();

  if (updErr) {
    console.error("order update failed", updErr);
    return json({ error: "order_update_failed" }, 500);
  }

  // Fire production email for configurator orders (best-effort).
  if (updated.kind === "configurator") {
    supabase.functions.invoke("send-order-email", { body: { order_id: updated.id } })
      .catch((e) => console.warn("email invoke failed", e));
  }

  return json({ ok: true, order_number: updated.order_number });
});
