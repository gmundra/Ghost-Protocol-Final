// Shared by supabase/functions/cleanup-fulfilled-order-assets (scheduled,
// called by pg_cron) and supabase/functions/admin-api (manual "Run Cleanup
// Now" button) so the actual deletion logic exists in exactly one place.

export interface CleanupResult {
  skipped?: boolean;
  reason?: string;
  processed: number;
}

/**
 * Deletes storage assets (artwork, mockups) for orders whose
 * order_cleanup_queue entry is due, recording every attempt in
 * order_asset_deletions and marking the order's assets_deleted fields.
 *
 * Preserves: the order row itself, customer info, items/config_json,
 * admin_notes, status/production_status history — only the storage
 * objects (and their queue/audit bookkeeping) are touched.
 */
export async function runCleanup(supabase: any, opts: { force?: boolean } = {}): Promise<CleanupResult> {
  if (!opts.force) {
    const { data: siteConfig } = await supabase
      .from("site_config")
      .select("auto_cleanup_enabled")
      .eq("id", 1)
      .maybeSingle();

    if (siteConfig?.auto_cleanup_enabled === false) {
      return { skipped: true, reason: "auto_cleanup_disabled", processed: 0 };
    }
  }

  const { data: due, error } = await supabase
    .from("order_cleanup_queue")
    .select("id, order_id, scheduled_for")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString());

  if (error) throw error;

  let processed = 0;

  for (const row of due ?? []) {
    const { data: order } = await supabase
      .from("orders")
      .select("id, artwork_url, mockup_url, items, assets_deleted")
      .eq("id", row.order_id)
      .maybeSingle();

    if (!order) {
      await supabase.from("order_cleanup_queue").update({ status: "skipped" }).eq("id", row.id);
      continue;
    }

    if (order.assets_deleted) {
      // Already cleaned (e.g. manual run beat the scheduled one to it).
      await supabase.from("order_cleanup_queue").update({ status: "completed" }).eq("id", row.id);
      continue;
    }

    const isStoragePath = (p: unknown): p is string => typeof p === "string" && p.length > 0 && !/^https?:\/\//.test(p);

    const assets: { name: string; path: string }[] = [];
    if (isStoragePath(order.artwork_url)) assets.push({ name: "artwork", path: order.artwork_url });
    if (isStoragePath(order.mockup_url)) assets.push({ name: "mockup", path: order.mockup_url });

    // Multi-item orders: per-item artwork/mockup paths inside items jsonb
    // that aren't already covered by the order-level pointers above.
    for (const item of Array.isArray(order.items) ? order.items : []) {
      const ap = item?.config?.artwork_path;
      const mp = item?.config?.mockup_path;
      if (isStoragePath(ap) && ap !== order.artwork_url) assets.push({ name: `item_artwork:${item.id ?? "?"}`, path: ap });
      if (isStoragePath(mp) && mp !== order.mockup_url) assets.push({ name: `item_mockup:${item.id ?? "?"}`, path: mp });
    }

    let deletedCount = 0;
    for (const asset of assets) {
      let result: "success" | "failed" = "success";
      try {
        const { error: rmErr } = await supabase.storage.from("ghost-media").remove([asset.path]);
        if (rmErr) result = "failed";
        else deletedCount++;
      } catch {
        result = "failed";
      }
      await supabase.from("order_asset_deletions").insert({
        order_id: order.id,
        asset_name: asset.name,
        storage_path: asset.path,
        deletion_result: result,
      });
    }

    await supabase
      .from("orders")
      .update({
        assets_deleted: true,
        assets_deleted_at: new Date().toISOString(),
        deleted_file_count: deletedCount,
      })
      .eq("id", order.id);

    await supabase.from("order_cleanup_queue").update({ status: "completed" }).eq("id", row.id);
    processed++;
  }

  return { processed };
}
