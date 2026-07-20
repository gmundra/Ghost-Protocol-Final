// UNSCREEN — Shop / Drops page

import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/store/cart";
import { ShoppingBag } from "lucide-react";

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
  const { add } = useCart();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", cat, forAudience],
    queryFn: async () => {
      let q = supabase
        .from("drops")
        .select("*")
        // Filter by status='live' — this is what the admin panel writes.
        // (The legacy `published` boolean was never set by the admin and has
        // been removed from this query to prevent products from disappearing.)
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
    <main className="pt-16 min-h-screen">
      <div className="px-6 md:px-16 py-14">
        <h1 className="font-display text-3xl md:text-5xl text-foreground mb-2">{pageTitle}</h1>
        <p className="text-muted-foreground text-sm mb-10">
          {products.length > 0 ? `${products.length} products` : ""}
        </p>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-surface border border-border rounded animate-pulse h-64" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <p className="font-display text-2xl mb-2">Nothing here yet.</p>
            <p className="text-sm">Check back soon — new products are added regularly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p: any) => (
              <div key={p.id} className="group border border-border rounded overflow-hidden hover:border-primary transition-colors bg-background">
                {/* Image */}
                <div className="aspect-square bg-surface overflow-hidden">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      📦
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  {p.category && (
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      {CATEGORY_LABELS[p.category] ?? p.category}
                    </p>
                  )}
                  <h3 className="font-display text-base text-foreground mb-1 leading-snug">{p.name}</h3>
                  {p.age_group && (
                    <p className="text-xs text-muted-foreground mb-2">Ages {p.age_group}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-semibold text-foreground text-sm">
                      ₹{Number(p.price).toLocaleString("en-IN")}
                    </span>
                    <button
                      onClick={() => add({ id: p.id, name: p.name, price: p.price, image: p.image_url })}
                      className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded text-xs font-medium hover:opacity-90 transition-opacity"
                    >
                      <ShoppingBag size={12} /> Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
