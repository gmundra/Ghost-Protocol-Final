// UNSCREEN — ProductCard
// Ported from one-shot-wonder-web/src/components/ProductCard.tsx
// Adapted: uses Supabase drop shape instead of static Product type.

import { TiltCard } from "./motion";

const CATEGORY_PALETTES: Record<string, [string, string]> = {
  "board-games":        ["#c8b89a", "#8c7560"],
  "wooden-toys":        ["#d4a574", "#a0724a"],
  "flash-cards":        ["#a8c4a0", "#6b8f65"],
  "diy-kits":           ["#c4a8c0", "#8f6b8a"],
  "books":              ["#a8b8c4", "#6b7f8f"],
  "conversation-cards": ["#c4c0a8", "#8f8b6b"],
  "bundles":            ["#c4b0a0", "#8f7060"],
  "wooden-puzzles":     ["#b8c4a8", "#7f8f6b"],
  "educational-kits":   ["#a8c4c0", "#6b8f8a"],
  "teacher-resources":  ["#c0a8b8", "#8a6b80"],
};

const CATEGORY_GLYPHS: Record<string, string> = {
  "board-games":        "♟",
  "wooden-toys":        "🪵",
  "flash-cards":        "🃏",
  "diy-kits":           "🎨",
  "books":              "📚",
  "conversation-cards": "💬",
  "bundles":            "🎁",
  "wooden-puzzles":     "🧩",
  "educational-kits":   "🧪",
  "teacher-resources":  "🏫",
};

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

export function getPalette(category: string): [string, string] {
  return CATEGORY_PALETTES[category] ?? ["#c8b89a", "#8c7560"];
}

export function getGlyph(category: string): string {
  return CATEGORY_GLYPHS[category] ?? "📦";
}

interface DropProduct {
  id: string;
  name: string;
  price: number;
  category?: string;
  age_group?: string;
  tagline?: string;
  tags?: string[];
  image_url?: string;
  cover_image?: string;
  status?: string;
}

export function ProductCard({ product, onClick }: { product: DropProduct; onClick?: () => void }) {
  const cat = product.category ?? "";
  const [c1, c2] = getPalette(cat);
  const glyph = getGlyph(cat);
  const skills = (product.tags ?? []).filter((t) => t.startsWith("skill:")).map((t) => t.replace("skill:", "")).slice(0, 3);
  const hasImage = !!(product.image_url || product.cover_image);

  return (
    <TiltCard className="group cursor-pointer" onClick={onClick}>
      <div
        className="relative aspect-[4/5] rounded-2xl overflow-hidden transition-shadow duration-500 group-hover:shadow-[0_30px_80px_-30px_rgba(60,40,20,0.35)]"
        style={hasImage ? undefined : { background: `linear-gradient(150deg, ${c1}, ${c2})` }}
      >
        {hasImage ? (
          <img
            src={product.image_url || product.cover_image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="text-[7rem] leading-none transition-transform duration-700 group-hover:scale-110"
                style={{ filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.15))" }}
              >
                {glyph}
              </div>
            </div>
            {/* Age + category pills */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-[11px] uppercase tracking-widest">
              {product.age_group && (
                <span className="px-2.5 py-1 rounded-full bg-background/70 backdrop-blur text-foreground">
                  Ages {product.age_group}
                </span>
              )}
              {cat && (
                <span className="px-2.5 py-1 rounded-full bg-background/70 backdrop-blur text-foreground ml-auto">
                  {CATEGORY_LABELS[cat] ?? cat}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <div className="pt-4">
        <h3 className="font-display text-xl leading-tight text-foreground">{product.name}</h3>
        {product.tagline && (
          <p className="text-muted-foreground text-sm mt-1">{product.tagline}</p>
        )}
        <div className="mt-2 flex items-center justify-between">
          <span className="font-semibold text-sm text-foreground">
            ₹{Number(product.price).toLocaleString("en-IN")}
          </span>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {skills.map((s) => (
                <span key={s} className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded-full px-2 py-0.5">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </TiltCard>
  );
}
