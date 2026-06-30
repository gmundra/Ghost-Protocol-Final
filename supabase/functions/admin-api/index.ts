import { createClient } from "npm:@supabase/supabase-js@2";
import { runCleanup } from "../_shared/cleanup.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let payload: any;
  try { payload = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  const { code, op, data } = payload ?? {};
  if (typeof code !== "string" || typeof op !== "string") {
    return json({ error: "missing_code_or_op" }, 400);
  }

  // ---- verify admin code against admin_secrets (server-only table)
  const { data: secret, error: sErr } = await supabase
    .from("admin_secrets").select("password_hash").eq("id", 1).maybeSingle();
  if (sErr) return json({ error: "secret_lookup_failed" }, 500);
  if (!secret) return json({ error: "no_secret_configured" }, 500);
  const hash = await sha256(code);
  if (hash !== secret.password_hash) return json({ error: "unauthorized" }, 401);

  try {
    switch (op) {
      case "verify":
        return json({ ok: true });

      case "rotate_code": {
        const next = String(data?.new_code ?? "");
        if (next.length < 6) return json({ error: "code_too_short" }, 400);
        const newHash = await sha256(next);
        const { error } = await supabase.from("admin_secrets")
          .update({ password_hash: newHash, updated_at: new Date().toISOString() })
          .eq("id", 1);
        if (error) throw error;
        return json({ ok: true });
      }

      case "list_orders": {
        const { data: rows, error } = await supabase.from("orders")
          .select("*").order("created_at", { ascending: false });
        if (error) throw error;
        return json({ data: rows });
      }

      case "update_order": {
        const { id, patch } = data ?? {};
        if (!id) return json({ error: "missing_id" }, 400);
        const allowed: Record<string, unknown> = {};
        for (const k of ["production_status", "admin_notes", "status"]) {
          if (k in (patch ?? {})) allowed[k] = patch[k];
        }
        allowed.updated_at = new Date().toISOString();
        const { data: row, error } = await supabase.from("orders")
          .update(allowed).eq("id", id).select("*").single();
        if (error) throw error;
        return json({ data: row });
      }

      case "run_cleanup_now": {
        const result = await runCleanup(supabase, { force: true });
        return json({ data: result });
      }

      case "list_signups": {
        const { data: rows, error } = await supabase.from("notify_signups")
          .select("*").order("created_at", { ascending: false });
        if (error) throw error;
        return json({ data: rows });
      }

      case "upsert_drop": {
        const drop = data?.drop;
        if (!drop) return json({ error: "missing_drop" }, 400);
        const { id, ...rest } = drop;
        rest.updated_at = new Date().toISOString();
        const result = id
          ? await supabase.from("drops").update(rest).eq("id", id).select("*").single()
          : await supabase.from("drops").insert(rest).select("*").single();
        if (result.error) {
          if ((result.error as any).code === "23505") {
            return json({ error: `A drop with slug "${rest.slug}" already exists. Choose a unique slug.` }, 409);
          }
          throw result.error;
        }
        return json({ data: result.data });
      }

      case "delete_drop": {
        const id = data?.id;
        if (!id) return json({ error: "missing_id" }, 400);
        const { error } = await supabase.from("drops").delete().eq("id", id);
        if (error) throw error;
        return json({ ok: true });
      }

      case "update_site_config": {
        const patch = { ...(data?.patch ?? {}) };
        // never allow writing the (now removed) password column or unknown sensitive fields
        delete patch.admin_password;
        patch.updated_at = new Date().toISOString();
        const { data: row, error } = await supabase.from("site_config")
          .update(patch).eq("id", 1).select("*").single();
        if (error) throw error;
        return json({ data: row });
      }

      case "delete_media": {
        const path = String(data?.path ?? "");
        if (!path) return json({ error: "missing_path" }, 400);
        const { error } = await supabase.storage.from("ghost-media").remove([path]);
        if (error) throw error;
        return json({ ok: true });
      }

      case "list_configurator_assets": {
        const { data: rows, error } = await supabase
          .from("configurator_assets")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false });
        if (error) throw error;
        return json({ data: rows });
      }

      case "upsert_configurator_asset": {
        const asset = data?.asset;
        if (!asset) return json({ error: "missing_asset" }, 400);
        const { id, ...rest } = asset;
        rest.updated_at = new Date().toISOString();
        const result = id
          ? await supabase.from("configurator_assets").update(rest).eq("id", id).select("*").single()
          : await supabase.from("configurator_assets").insert(rest).select("*").single();
        if (result.error) throw result.error;
        return json({ data: result.data });
      }

      case "delete_configurator_asset": {
        const id = data?.id;
        if (!id) return json({ error: "missing_id" }, 400);
        const { error } = await supabase.from("configurator_assets").delete().eq("id", id);
        if (error) throw error;
        return json({ ok: true });
      }

      default:
        return json({ error: "unknown_op" }, 400);
    }
  } catch (e) {
    console.error("admin-api error", op, e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
