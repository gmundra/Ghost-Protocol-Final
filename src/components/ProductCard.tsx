import { TiltCard } from "./motion";
import type { Product } from "@/data/content";

export function ProductCard({ product, onClick }: { product: Product; onClick?: () => void }) {
  const [c1, c2] = product.palette;
  return (
    <TiltCard className="group cursor-pointer" onClick={onClick}>
      <div
        className="relative aspect-[4/5] rounded-3xl overflow-hidden grain transition-shadow duration-500 group-hover:shadow-[0_30px_80px_-30px_rgba(60,40,20,0.35)]"
        style={{ background: `linear-gradient(150deg, ${c1}, ${c2})` }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="text-[10rem] leading-none font-display transition-transform duration-700 group-hover:scale-110"
            style={{ color: "rgba(255,255,255,0.55)", textShadow: "0 10px 30px rgba(0,0,0,0.15)" }}
          >
            {product.glyph}
          </div>
        </div>
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-[11px] uppercase tracking-widest text-ink/70">
          <span className="px-2.5 py-1 rounded-full bg-paper/70 backdrop-blur">Ages {product.age}</span>
          <span className="px-2.5 py-1 rounded-full bg-paper/70 backdrop-blur">{product.category.replace(/-/g, " ")}</span>
        </div>
      </div>
      <div className="pt-5">
        <h3 className="text-2xl font-display leading-tight">{product.name}</h3>
        <p className="text-muted-foreground text-[15px] mt-1">{product.tagline}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {product.skills.slice(0, 3).map((s) => (
            <span key={s} className="text-[11px] uppercase tracking-wider text-ink/60 border border-border rounded-full px-2 py-0.5">
              {s}
            </span>
          ))}
        </div>
      </div>
    </TiltCard>
  );
}
