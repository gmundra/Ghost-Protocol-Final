// Products / Collection page — fetches live from Supabase `drops` table
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ProductModal } from "@/components/ProductModal";
import { RevealText, FadeUp } from "@/components/motion";
import { supabase } from "@/integrations/supabase/client";

type LiveProduct = {
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
};

function getAge(p: LiveProduct): string {
  const tag = (p.tags ?? []).find((t) => t.startsWith("age:"));
  return tag ? tag.replace("age:", "") : "All ages";
}

function getSkills(p: LiveProduct): string[] {
  return (p.tags ?? [])
    .filter((t) => t.startsWith("skill:"))
    .map((t) => t.replace("skill:", ""));
}

function getPalette(idx: number): [string, string] {
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

export default function Drops() {
  const [products, setProducts] = useState<LiveProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [ageFilter, setAgeFilter] = useState<string[]>([]);
  const [skillFilter, setSkillFilter] = useState<string[]>([]);
  const [active, setActive] = useState<LiveProduct | null>(null);

  useEffect(() => {
    supabase
      .from("drops")
      .select("id,name,slug,tagline,description,price,category,tags,cover_image,image_url,status,is_featured")
      .eq("status", "live")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProducts((data as LiveProduct[]) ?? []);
        setLoading(false);
      });
  }, []);

  const allAges = useMemo(() => {
    const s = new Set(products.map(getAge));
    return Array.from(s).sort();
  }, [products]);

  const allSkills = useMemo(() => {
    const s = new Set(products.flatMap(getSkills));
    return Array.from(s).sort();
  }, [products]);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (ageFilter.length === 0 || ageFilter.includes(getAge(p))) &&
          (skillFilter.length === 0 || skillFilter.some((s) => getSkills(p).includes(s)))
      ),
    [products, ageFilter, skillFilter]
  );

  const toggle = <T,>(arr: T[], v: T, set: (a: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const modalProduct = active
    ? {
        id: active.id,
        name: active.name,
        price: active.price,
        category: active.category ?? "",
        tagline: active.tagline ?? "",
        description: active.description ?? "",
        tags: active.tags ?? [],
        image_url: active.image_url ?? undefined,
        cover_image: active.cover_image ?? undefined,
      }
    : null;

  return (
    <>
      <section className="pt-40 pb-16 bg-background">
        <div className="container-x">
          <div className="eyebrow mb-6">The Collection</div>
          <RevealText as="h1" className="display-1 block max-w-[16ch]">
            Objects that hold a childhood.
          </RevealText>
          <p className="mt-8 text-xl text-muted-foreground max-w-2xl">
            Filter by the age of your child, or the skill you'd like to nurture. Every product is handcrafted, screen-free, and built to last.
          </p>
        </div>
      </section>

      <section className="pb-24 bg-background">
        <div className="container-x">

          {/* Filters — only show if there's something to filter */}
          {(allAges.length > 0 || allSkills.length > 0) && (
            <div className="rounded-3xl border border-border p-6 md:p-8 bg-surface grain mb-16">
              <div className="grid md:grid-cols-2 gap-8">
                {allAges.length > 0 && (
                  <div>
                    <div className="eyebrow mb-4">Age</div>
                    <div className="flex flex-wrap gap-2">
                      {allAges.map((a) => (
                        <button
                          key={a}
                          onClick={() => toggle(ageFilter, a, setAgeFilter)}
                          className={`px-4 py-2 rounded-full text-sm border transition ${
                            ageFilter.includes(a)
                              ? "bg-foreground text-background border-foreground"
                              : "border-border hover:border-foreground"
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {allSkills.length > 0 && (
                  <div>
                    <div className="eyebrow mb-4">Skill</div>
                    <div className="flex flex-wrap gap-2">
                      {allSkills.map((s) => (
                        <button
                          key={s}
                          onClick={() => toggle(skillFilter, s, setSkillFilter)}
                          className={`px-4 py-2 rounded-full text-sm border transition ${
                            skillFilter.includes(s)
                              ? "bg-accent text-accent-foreground border-accent"
                              : "border-border hover:border-accent"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {(ageFilter.length > 0 || skillFilter.length > 0) && (
                <button
                  onClick={() => { setAgeFilter([]); setSkillFilter([]); }}
                  className="mt-6 text-sm text-muted-foreground hover:text-foreground"
                >
                  Clear filters ✕
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="text-center py-24 text-muted-foreground text-sm">Loading products…</div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-8">
                {filtered.length} {filtered.length === 1 ? "product" : "products"}
              </div>

              <motion.div layout className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {filtered.map((p, i) => {
                    const [c1, c2] = getPalette(i);
                    const skills = getSkills(p);
                    return (
                      <motion.div
                        key={p.id}
                        layout
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <div className="group cursor-pointer" onClick={() => setActive(p)}>
                          <div
                            className="relative aspect-[4/5] rounded-2xl overflow-hidden transition-shadow duration-500 group-hover:shadow-[0_30px_80px_-30px_rgba(60,40,20,0.35)]"
                            style={{
                              background: p.cover_image
                                ? undefined
                                : `linear-gradient(150deg, ${c1}, ${c2})`,
                            }}
                          >
                            {p.cover_image ? (
                              <img
                                src={p.cover_image}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-[6rem] leading-none transition-transform duration-700 group-hover:scale-110">
                                📦
                              </div>
                            )}
                            <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-[11px] uppercase tracking-widest">
                              {getAge(p) !== "All ages" && (
                                <span className="px-2.5 py-1 rounded-full bg-background/70 backdrop-blur">
                                  Ages {getAge(p)}
                                </span>
                              )}
                              {p.category && (
                                <span className="px-2.5 py-1 rounded-full bg-background/70 backdrop-blur ml-auto">
                                  {p.category.replace(/-/g, " ")}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="pt-4">
                            <h3 className="font-display text-xl leading-tight">{p.name}</h3>
                            {p.tagline && (
                              <p className="text-muted-foreground text-sm mt-1">{p.tagline}</p>
                            )}
                            {skills.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {skills.slice(0, 3).map((s) => (
                                  <span
                                    key={s}
                                    className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded-full px-2 py-0.5"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>

              {filtered.length === 0 && !loading && (
                <div className="text-center py-24 text-muted-foreground">
                  {products.length === 0
                    ? "No products are live yet. Check back soon."
                    : "Nothing matches your filters. Try clearing them."}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <ProductModal product={modalProduct} onClose={() => setActive(null)} />
    </>
  );
}
