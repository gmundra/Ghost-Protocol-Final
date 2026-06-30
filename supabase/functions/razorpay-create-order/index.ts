import { createClient } from "npm:@supabase/supabase-js@2";

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

// ── Fallback-only defaults ──────────────────────────────────────────────
// Used ONLY if a configurator item's color can't be matched to a row in
// configurator_assets (e.g. it was deleted after the order was placed) or
// if site_config can't be read. The live admin-managed values from the
// database are the real source of truth — these are just a safety net so
// checkout never hard-fails if a lookup comes back empty.
const FALLBACK_BASE_PAISE = 249900; // ₹2499
const FALLBACK_ARTWORK_FEE_PAISE = 60000; // ₹600
const FALLBACK_SHIPPING_PAISE = 15000; // ₹150 — used only if free_shipping_enabled can't be read

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!keyId || !keySecret) return json({ error: "razorpay_not_configured" }, 500);

  let payload: any;
  try { payload = await req.json(); } catch { return json({ error: "bad_json" }, 400); }

  const { customer, shipping_address, items } = payload ?? {};
  if (
    !customer?.name || !customer?.email || !customer?.phone ||
    !shipping_address?.line1 || !shipping_address?.city || !shipping_address?.state || !shipping_address?.pincode ||
    !Array.isArray(items) || items.length === 0
  ) {
    return json({ error: "invalid_payload" }, 400);
  }
  // NOTE: client-submitted subtotal/shipping/total are intentionally ignored
  // for all monetary purposes below. They are never read from `payload` here.
  // The server recomputes every rupee from authoritative sources.

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // ── Recompute every item's price server-side. Never trust item.price. ──
  const dropIds = items.filter((i: any) => !i.config).map((i: any) => i.dropId);
  let dropsById: Record<string, { price: number; status: string }> = {};
  if (dropIds.length > 0) {
    const { data: dropsRows, error: dropsErr } = await supabase
      .from("drops")
      .select("id, price, status")
      .in("id", dropIds);
    if (dropsErr) {
      console.error("drops lookup failed", dropsErr);
      return json({ error: "price_lookup_failed" }, 500);
    }
    for (const d of dropsRows ?? []) dropsById[d.id] = { price: d.price, status: d.status };
  }

  // Live configurator pricing, looked up by garment_color (stored in
  // config_json.color when the item was added) — never the client's price.
  const configuratorColors = items
    .filter((i: any) => i.config?.config_json?.color)
    .map((i: any) => i.config.config_json.color as string);
  let pricingByColor: Record<string, { base_price: number; artwork_fee: number }> = {};
  if (configuratorColors.length > 0) {
    const { data: assetRows, error: assetErr } = await supabase
      .from("configurator_assets")
      .select("garment_color, base_price, artwork_fee")
      .in("garment_color", configuratorColors);
    if (assetErr) {
      console.error("configurator_assets pricing lookup failed", assetErr);
      // Not fatal — fall back to FALLBACK_* constants per item below.
    }
    for (const row of assetRows ?? []) {
      pricingByColor[row.garment_color] = { base_price: row.base_price, artwork_fee: row.artwork_fee };
    }
  }

  // Live shipping settings.
  const { data: siteConfig } = await supabase
    .from("site_config")
    .select("free_shipping_enabled")
    .eq("id", 1)
    .maybeSingle();
  const freeShippingEnabled = (siteConfig as any)?.free_shipping_enabled ?? true;

  let recomputedSubtotal = 0;
  for (const item of items) {
    const qty = Number(item.qty) > 0 ? Number(item.qty) : 1;

    if (item.config) {
      // Configurator item — price comes from the live configurator_assets
      // row for this color (admin-managed), falling back to the constants
      // above only if that row can't be found.
      const hasArtwork = Boolean(
        item.config.artwork_path ||
        item.config.mockup_path ||
        item.config.config_json?.scale != null
      );
      const colorId = item.config.config_json?.color as string | undefined;
      const livePricing = colorId ? pricingByColor[colorId] : undefined;
      const base = livePricing?.base_price ?? FALLBACK_BASE_PAISE;
      const artworkFee = livePricing?.artwork_fee ?? FALLBACK_ARTWORK_FEE_PAISE;
      recomputedSubtotal += (base + (hasArtwork ? artworkFee : 0)) * qty;
      continue;
    }

    const drop = dropsById[item.dropId];
    if (!drop) {
      return json({ error: "invalid_item", detail: `Unknown drop: ${item.dropId}` }, 400);
    }
    if (drop.status !== "live") {
      return json({ error: "item_unavailable", detail: `Drop ${item.dropId} is not live (status: ${drop.status})` }, 400);
    }
    recomputedSubtotal += drop.price * qty;
  }

  const recomputedShipping = freeShippingEnabled ? 0 : FALLBACK_SHIPPING_PAISE;
  const recomputedTotal = recomputedSubtotal + recomputedShipping;

  // Log any mismatch for visibility — doesn't block the order, since the
  // recomputed total (not the client's) is what actually gets charged and stored.
  if (typeof payload.total === "number" && payload.total !== recomputedTotal) {
    console.warn("client_server_total_mismatch", {
      clientTotal: payload.total,
      recomputedTotal,
      customerEmail: customer.email,
    });
  }

  const cfgItem = items.find((i: any) => i.config);
  const isConfigurator = !!cfgItem;

  // 1. Insert internal order row with pending_payment status, using the
  //    SERVER-RECOMPUTED total — never the client-submitted one.
  const { data: order, error: insErr } = await supabase.from("orders").insert({
    customer_name: customer.name,
    customer_email: customer.email,
    customer_phone: customer.phone,
    shipping_address,
    items,
    subtotal: recomputedSubtotal,
    shipping: recomputedShipping,
    total: recomputedTotal,
    currency: "INR",
    status: "pending_payment",
    kind: isConfigurator ? "configurator" : "standard",
    production_status: "pending_review",
    artwork_url: cfgItem?.config?.artwork_path ?? null,
    mockup_url: cfgItem?.config?.mockup_path ?? null,
    config_json: cfgItem?.config?.config_json ?? null,
  }).select("id, order_number, total").single();

  if (insErr || !order) {
    console.error("order insert failed", insErr);
    return json({ error: "order_insert_failed" }, 500);
  }

  // 2. Create Razorpay order (amount in paise; our totals are already in paise).
  const auth = btoa(`${keyId}:${keySecret}`);
  const rpRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: order.total,
      currency: "INR",
      receipt: order.order_number,
      notes: { internal_order_id: order.id, order_number: order.order_number },
    }),
  });

  if (!rpRes.ok) {
    const txt = await rpRes.text();
    console.error("razorpay create failed", rpRes.status, txt);
    await supabase.from("orders").update({ status: "payment_failed" }).eq("id", order.id);
    return json({ error: "razorpay_create_failed", detail: txt }, 502);
  }

  const rpOrder = await rpRes.json();

  // 3. Persist the razorpay order id on our row.
  await supabase.from("orders")
    .update({ razorpay_order_id: rpOrder.id })
    .eq("id", order.id);

  return json({
    order_id: order.id,
    order_number: order.order_number,
    razorpay_order_id: rpOrder.id,
    key_id: keyId,
    amount: order.total,
    currency: "INR",
  });
});
