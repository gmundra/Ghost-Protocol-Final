// UNSCREEN — ProductModal quick-view
// Ported from one-shot-wonder-web/src/components/ProductModal.tsx
// Adapted: uses Supabase drop shape, links to /drop/:id.

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/store/cart";
import { ShoppingBag } from "lucide-react";
import { getPalette, getGlyph } from "./ProductCard";

interface DropProduct {
  id: string;
  name: string;
  price: number;
  category?: string;
  age_group?: string;
  tagline?: string;
  description?: string;
  tags?: string[];
  image_url?: string;
  cover_image?: string;
}

export function ProductModal({ product, onClose }: { product: DropProduct | null; onClose: () => void }) {
  const [tab, setTab] = useState<"about" | "skills" | "details">("about");
  const { add } = useCart();

  useEffect(() => {
    if (!product) return;
    setTab("about");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [product?.id]);

  const cat = product?.category ?? "";
  const [c1, c2] = getPalette(cat);
  const glyph = getGlyph(cat);
  const hasImage = !!(product?.image_url || product?.cover_image);
  const skills = (product?.tags ?? []).filter((t) => t.startsWith("skill:")).map((t) => t.replace("skill:", ""));
  const ageTags = (product?.tags ?? []).filter((t) => t.startsWith("age:")).map((t) => t.replace("age:", ""));

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-foreground/50 backdrop-blur-xl"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Panel */}
          <motion.div
            className="relative w-full max-w-5xl max-h-[90vh] overflow-auto bg-background rounded-2xl grid md:grid-cols-2 shadow-2xl"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Image / gradient side */}
            <div
              className="aspect-square md:aspect-auto relative overflow-hidden rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none"
              style={hasImage ? undefined : { background: `linear-gradient(150deg, ${c1}, ${c2})` }}
            >
              {hasImage ? (
                <img
                  src={product.image_url || product.cover_image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[10rem] leading-none">
                  {glyph}
                </div>
              )}
            </div>

            {/* Info side */}
            <div className="p-8 md:p-12 flex flex-col">
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
                <span>{cat.replace(/-/g, " ")}</span>
                <button onClick={onClose} className="hover:text-foreground transition-colors">Close ✕</button>
              </div>

              <h2 className="mt-5 font-display text-4xl md:text-5xl leading-tight">{product.name}</h2>
              <p className="mt-2 text-lg text-muted-foreground">{product.tagline}</p>

              {/* Tab bar */}
              <div className="mt-8 flex gap-6 text-sm border-b border-border">
                {(["about", "skills", "details"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`pb-3 capitalize relative transition-colors ${
                      tab === t ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {t}
                    {tab === t && (
                      <motion.span
                        layoutId="modal-tab-underline"
                        className="absolute -bottom-px left-0 right-0 h-px bg-primary"
                      />
                    )}
                  </button>
                ))}
              </div>

              <div className="py-6 text-base leading-relaxed text-foreground/85 min-h-[8rem]">
                {tab === "about" && (
                  <p>{product.description || product.tagline || "No description available."}</p>
                )}
                {tab === "skills" && (
                  skills.length > 0 ? (
                    <ul className="space-y-2">
                      {skills.map((s) => (
                        <li key={s} className="flex items-center gap-3">
                          <span className="text-primary">◆</span> {s}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No skills tagged yet.</p>
                  )
                )}
                {tab === "details" && (
                  <dl className="space-y-3 text-sm">
                    {product.age_group && (
                      <div><dt className="text-muted-foreground uppercase tracking-wider text-xs mb-0.5">Age group</dt><dd>{product.age_group}</dd></div>
                    )}
                    {ageTags.length > 0 && (
                      <div><dt className="text-muted-foreground uppercase tracking-wider text-xs mb-0.5">Ages</dt><dd>{ageTags.join(", ")}</dd></div>
                    )}
                    <div><dt className="text-muted-foreground uppercase tracking-wider text-xs mb-0.5">Category</dt><dd>{cat.replace(/-/g, " ")}</dd></div>
                  </dl>
                )}
              </div>

              {/* Footer */}
              <div className="mt-auto pt-6 flex items-center justify-between gap-4 border-t border-border">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Price</div>
                  <div className="font-display text-2xl">₹{Number(product.price).toLocaleString("en-IN")}</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { add({ id: product.id, name: product.name, price: product.price, image: product.image_url ?? product.cover_image }); onClose(); }}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <ShoppingBag size={14} /> Add to cart
                  </button>
                  <Link
                    to={`/drop/${product.id}`}
                    onClick={onClose}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                  >
                    Full details →
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
