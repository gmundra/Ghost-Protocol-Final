import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { order_id } = await req.json();
    if (!order_id) throw new Error("order_id required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error: oErr } = await supabase.from("orders").select("*").eq("id", order_id).single();
    if (oErr || !order) throw new Error(oErr?.message || "Order not found");

    const { data: cfg } = await supabase.from("site_config").select("production_email").eq("id", 1).single();
    const to = cfg?.production_email || "fits.ghost.protocol@gmail.com";

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.warn("RESEND_API_KEY missing — skipping email");
      return new Response(JSON.stringify({ skipped: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const sign = async (path: string | null) => {
      if (!path) return null;
      // path stored as bucket-relative key
      const { data } = await supabase.storage.from("ghost-media").createSignedUrl(path, 60 * 60 * 24 * 365);
      return data?.signedUrl ?? null;
    };

    const artworkLink = await sign(order.artwork_url);
    const mockupLink = await sign(order.mockup_url);
    const cfgJson = order.config_json ?? {};
    const addr = order.shipping_address ?? {};

    const subject = `NEW GHOST PROTOCOL CONFIGURED ORDER — ${order.order_number}`;
    const html = `
<div style="font-family:monospace;background:#000;color:#fff;padding:24px;">
  <h1 style="color:#e31313;letter-spacing:.3em;margin:0 0 8px;">GHOST/PROTOCOL</h1>
  <p style="letter-spacing:.3em;color:#888;margin:0 0 24px;">// NEW CONFIGURED ORDER ${order.order_number}</p>

  <h2 style="color:#e31313;letter-spacing:.25em;font-size:14px;border-bottom:1px solid #333;padding-bottom:6px;">CUSTOMER</h2>
  <p>Name: ${order.customer_name}<br/>Email: ${order.customer_email}<br/>Phone: ${order.customer_phone ?? "—"}<br/>
  Address: ${addr.line1 ?? ""}, ${addr.city ?? ""}, ${addr.state ?? ""} — ${addr.pincode ?? ""}</p>

  <h2 style="color:#e31313;letter-spacing:.25em;font-size:14px;border-bottom:1px solid #333;padding-bottom:6px;">ORDER</h2>
  <p>Order ID: ${order.order_number}<br/>Product: ${cfgJson.product ?? "Custom Protocol Tee"}<br/>
  Color: ${cfgJson.colorName ?? cfgJson.color ?? "—"}<br/>Size: ${cfgJson.size ?? "—"}</p>

  <h2 style="color:#e31313;letter-spacing:.25em;font-size:14px;border-bottom:1px solid #333;padding-bottom:6px;">CONFIGURATION</h2>
  <p>Scale: ${cfgJson.scale ?? "—"}<br/>Rotation: ${cfgJson.rotation ?? "—"}°<br/>
  Position: X ${cfgJson.x ?? "—"} / Y ${cfgJson.y ?? "—"}</p>

  <h2 style="color:#e31313;letter-spacing:.25em;font-size:14px;border-bottom:1px solid #333;padding-bottom:6px;">ASSETS</h2>
  <p>
    Artwork: ${artworkLink ? `<a style="color:#e31313" href="${artworkLink}">${artworkLink}</a>` : "<em>MISSING</em>"}<br/>
    Mockup: ${mockupLink ? `<a style="color:#e31313" href="${mockupLink}">${mockupLink}</a>` : "<em>MISSING</em>"}<br/>
    Config JSON: <pre style="background:#111;padding:8px;color:#ccc;">${JSON.stringify(cfgJson, null, 2)}</pre>
  </p>

  <p style="color:#666;letter-spacing:.3em;font-size:11px;margin-top:32px;">// END TRANSMISSION</p>
</div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Ghost Protocol <orders@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Resend ${res.status}: ${text}`);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
