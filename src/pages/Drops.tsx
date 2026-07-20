// UNSCREEN — Shop / Drops page
// ProductCard + ProductModal quick-view wired in.

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FadeUp } from "@/components/motion";
import { ProductCard } from "@/components/ProductCard";
import { ProductModal } from "@/components/ProductModal";

const CATEGORY_LABELS: Record<string, string> = {
  "board-games":        "Board Games",
  "wooden-toys":        "Wooden Toys",
  "flash-cards":        "Flash Cards",
  "diy-kits":           "DIY Kits",
  "books":              "Books",
  "conversation-cards": "Conversation Cards",
  "bundles":            "Bundles",
  "wooden-puzzles":     "Wooden Puzzles",
  "educational-kits":   "Educational Kits",
  "teacher-resources":  "Teacher Resources",
};

export default function Drops() {
  const [params] = useSearchParams();
  const cat = params.get("cat") ?? "";
  const forAudience = params.get("for") ?? "";
  const [selected, setSelected] = useState<any | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", cat, forAudience],
    queryFn: async () => {
      let q = supabase
        .from("drops")
        .select("*")
        .eq("status", "live")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (cat) q = q.eq("category", cat);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const pageTitle = cat
    ? CATEGORY_LABELS[cat] ?? cat
    : forAudience
    ? `For ${forAudience.charAt(0).toUpperCase() + forAudience.slice(1)}`
    : "All Products";

  return (
    <main className="pt-16 md:pt-20 min-h-screen">
      <div className="container-x py-14">
        <FadeUp>
          <h1 className="font-display text-3xl md:text-5xl text-foreground mb-2">{pageTitle}</h1>
          <p className="text-muted-foreground text-sm mb-10">
            {products.length > 0 ? `${products.length} products` : ""}
          </p>
        </FadeUp>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-surface border border-border rounded-2xl animate-pulse h-80" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <FadeUp>
            <div className="text-center py-24 text-muted-foreground">
              <p className="font-display text-2xl mb-2">Nothing here yet.</p>
              <p className="text-sm">Check back soon — new products are added regularly.</p>
            </div>
          </FadeUp>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {products.map((p: any, i: number) => (
              <FadeUp key={p.id} delay={i * 0.04}>
                <ProductCard product={p} onClick={() => setSelected(p)} />
              </FadeUp>
            ))}
          </div>
        )}
      </div>

      <ProductModal product={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
