// Shared hook — fetches live products from Supabase for homepage + shop page
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type LiveProduct = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  price: number;
  category: string | null;
  tags: string[];
  cover_image: string | null;
  image_url: string | null;
  status: string;
  is_featured: boolean;
  sort_order: number;
};

export function useLiveProducts(featuredOnly = false) {
  const [products, setProducts] = useState<LiveProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let query = supabase
      .from("drops")
      .select("id,name,slug,tagline,description,price,category,tags,cover_image,image_url,status,is_featured,sort_order")
      .eq("status", "live")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (featuredOnly) {
      query = query.eq("is_featured", true);
    }

    query.then(({ data }) => {
      setProducts((data as LiveProduct[]) ?? []);
      setLoading(false);
    });
  }, [featuredOnly]);

  return { products, loading };
}

export function getAgeTag(p: LiveProduct): string {
  const tag = (p.tags ?? []).find((t) => t.startsWith("age:"));
  return tag ? tag.replace("age:", "") : "All ages";
}

export function getSkillTags(p: LiveProduct): string[] {
  return (p.tags ?? [])
    .filter((t) => t.startsWith("skill:"))
    .map((t) => t.replace("skill:", ""));
}

export function getPalette(idx: number): [string, string] {
  const palettes: [string, string][] = [
    ["#e8ddd0", "#c9b99a"],
    ["#d4e8d0", "#9abca8"],
    ["#d0dce8", "#9aaec9"],
    ["#e8d0d8", "#c99aaa"],
    ["#e8e4d0", "#c9c09a"],
    ["#d8d0e8", "#aa9ac9"],
  ];
  return palettes[idx % palettes.length];
}
