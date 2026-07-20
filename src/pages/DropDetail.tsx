// Product detail page — ported from one-shot-wonder-web/src/routes/products_.$slug.tsx
// Uses static data from content.ts instead of Supabase
import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { products } from "@/data/content";

export default function DropDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = products.find((p) => p.id === id);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <section className="min-h-screen pt-32 pb-24 bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="display-2 mb-4">Product not found.</h1>
          <Link to="/drops" className="ink-btn">Back to collection →</Link>
        </div>
      </section>
    );
  }

  function onAdd() {
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  const c1 = product.palette[0];
  const c2 = product.palette[1];

  return (
    <section className="min-h-screen pt-32 pb-24 bg-background">
      <div className="container-x">
        <nav className="text-xs uppercase tracking-widest text-muted-foreground mb-10">
          <Link to="/drops" className="hover:text-clay">Collection</Link>
          <span className="mx-2">·</span>
          <span>{product.category.replace(/-/g, " ")}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-14">
          <div
            className="relative aspect-square rounded-3xl overflow-hidden grain"
            style={{ background: `linear-gradient(150deg, ${c1}, ${c2})` }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-[16rem] leading-none font-display" style={{ color: "rgba(255,255,255,0.6)" }}>
                {product.glyph}
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap gap-2 mb-4 text-[11px] uppercase tracking-widest text-ink/60">
              <span className="px-2.5 py-1 rounded-full border border-border">Ages {product.age}</span>
              <span className="px-2.5 py-1 rounded-full border border-border">{product.category.replace(/-/g, " ")}</span>
            </div>
            <h1 className="display-2 mb-4">{product.name}</h1>
            <p className="text-xl text-muted-foreground">{product.tagline}</p>

            <button onClick={onAdd} className="ink-btn mt-8 w-full md:w-auto !py-3 !px-8">
              {added ? "Added ✓" : "Add to cart"}
            </button>

            <div className="mt-12">
              <div className="eyebrow mb-3">What it grows</div>
              <p className="text-lg leading-relaxed">{product.outcome}</p>
            </div>

            <div className="mt-10">
              <div className="eyebrow mb-3">Benefits</div>
              <ul className="grid grid-cols-2 gap-3">
                {product.benefits.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-ink/80">
                    <span className="text-clay">◆</span> {b}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10">
              <div className="eyebrow mb-3">Skills</div>
              <div className="flex flex-wrap gap-2">
                {product.skills.map((s) => (
                  <span key={s} className="text-[11px] uppercase tracking-wider text-ink/60 border border-border rounded-full px-3 py-1">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-10">
              <div className="eyebrow mb-3">Best for</div>
              <p className="text-muted-foreground leading-relaxed">{product.where}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
