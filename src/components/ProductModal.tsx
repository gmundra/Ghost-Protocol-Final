import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "@/data/content";

export function ProductModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const [tab, setTab] = useState<"outcome" | "where" | "benefits">("outcome");

  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [product, onClose]);

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-ink/60 backdrop-blur-xl"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative w-full max-w-5xl max-h-[90vh] overflow-auto bg-background rounded-3xl grid md:grid-cols-2"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="aspect-square md:aspect-auto grain relative"
              style={{ background: `linear-gradient(150deg, ${product.palette[0]}, ${product.palette[1]})` }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-[14rem] font-display" style={{ color: "rgba(255,255,255,0.6)" }}>
                {product.glyph}
              </div>
            </div>
            <div className="p-8 md:p-12 flex flex-col">
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
                <span>{product.category.replace(/-/g, " ")}</span>
                <button onClick={onClose} className="hover:text-clay">Close ✕</button>
              </div>
              <h2 className="mt-6 text-4xl md:text-5xl font-display leading-tight">{product.name}</h2>
              <p className="mt-3 text-lg text-muted-foreground">{product.tagline}</p>

              <div className="mt-8 flex gap-6 text-sm border-b border-border">
                {(["outcome", "where", "benefits"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`pb-3 capitalize relative transition-colors ${
                      tab === t ? "text-ink" : "text-muted-foreground"
                    }`}
                  >
                    {t}
                    {tab === t && (
                      <motion.span layoutId="tab-underline" className="absolute -bottom-px left-0 right-0 h-px bg-clay" />
                    )}
                  </button>
                ))}
              </div>
              <div className="py-6 text-[17px] leading-relaxed text-ink/85 min-h-[8rem]">
                {tab === "outcome" && <p>{product.outcome}</p>}
                {tab === "where" && <p>{product.where}</p>}
                {tab === "benefits" && (
                  <ul className="space-y-2">
                    {product.benefits.map((b) => (
                      <li key={b} className="flex items-center gap-3">
                        <span className="text-clay">◆</span> {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-auto pt-6 flex items-center justify-between border-t border-border">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Ages</div>
                  <div className="text-2xl font-display">{product.age}</div>
                </div>
                <Link to={`/drop/${product.id}`} className="ink-btn" onClick={onClose}>View & buy →</Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
