import { supabase } from "@/integrations/supabase/client";
import type { Drop, SiteConfig } from "./types";

export async function fetchSiteConfig(): Promise<SiteConfig | null> {
  const { data } = await supabase.from("site_config").select("*").eq("id", 1).maybeSingle();
  return data as SiteConfig | null;
}

export async function fetchDrops(): Promise<Drop[]> {
  const { data } = await supabase
    .from("drops")
    .select("*")
    .order("drop_number", { ascending: false });
  return (data ?? []) as unknown as Drop[];
}

export async function fetchDrop(slug: string): Promise<Drop | null> {
  const { data } = await supabase.from("drops").select("*").eq("slug", slug).maybeSingle();
  return data as unknown as Drop | null;
}
