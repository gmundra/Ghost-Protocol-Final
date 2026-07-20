// Products / Collection page — ported from one-shot-wonder-web/src/routes/products.tsx
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ProductCard } from "@/components/ProductCard";
import { ProductModal } from "@/components/ProductModal";
import { products, allAges, allSkills, type Product, type AgeBand, type Skill } from "@/data/content";
import { RevealText } from "@/components/motion";

export default function Drops() {
  const [ages, setAges] = useState<AgeBand[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [active, setActive] = useState<Product | null>(null);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (ages.length === 0 || ages.includes(p.age)) &&
          (skills.length === 0 || skills.some((s) => p.skills.includes(s)))
      ),
    [ages, skills]
  );

  const toggle = <T,>(arr: T[], v: T, set: (a: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

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
          <div className="rounded-3xl border border-border p-6 md:p-8 bg-bone grain mb-16">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="eyebrow mb-4">Age</div>
                <div className="flex flex-wrap gap-2">
                  {allAges.map((a) => (
                    <button
                      key={a}
                      onClick={() => toggle(ages, a, setAges)}
                      className={`px-4 py-2 rounded-full text-sm border transition ${
                        ages.includes(a) ? "bg-ink text-paper border-ink" : "border-border hover:border-ink"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="eyebrow mb-4">Skill</div>
                <div className="flex flex-wrap gap-2">
                  {allSkills.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggle(skills, s, setSkills)}
                      className={`px-4 py-2 rounded-full text-sm border transition ${
                        skills.includes(s) ? "bg-clay text-paper border-clay" : "border-border hover:border-clay"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {(ages.length > 0 || skills.length > 0) && (
              <button
                onClick={() => { setAges([]); setSkills([]); }}
                className="mt-6 text-sm text-muted-foreground hover:text-clay"
              >
                Clear filters ✕
              </button>
            )}
          </div>

          <div className="text-sm text-muted-foreground mb-8">
            {filtered.length} {filtered.length === 1 ? "product" : "products"}
          </div>

          <motion.div layout className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ProductCard product={p} onClick={() => setActive(p)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filtered.length === 0 && (
            <div className="text-center py-24 text-muted-foreground">
              Nothing here yet. Try clearing a filter.
            </div>
          )}
        </div>
      </section>

      <ProductModal product={active} onClose={() => setActive(null)} />
    </>
  );
}
