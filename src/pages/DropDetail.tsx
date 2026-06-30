import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchDrop } from "@/lib/queries";
import { useEffect, useState } from "react";
import { useCart, formatINR } from "@/store/cart";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { SignedImage } from "@/components/SignedImage";
import { SizeChartButton } from "@/components/SizeChartButton";
import { signedUrl } from "@/lib/storage";

export default function DropDetail() {
  const { id } = useParams();
  const { data: drop, isLoading } = useQuery({
    queryKey: ["drop", id],
    queryFn: () => fetchDrop(id!),
    enabled: !!id,
  });
  const [size, setSize] = useState<string | null>(null);
  const [sizeChartUrl, setSizeChartUrl] = useState<string | null>(null);
  const add = useCart((s) => s.add);

  useEffect(() => {
    let live = true;
    if (!drop?.size_chart_url) { setSizeChartUrl(null); return; }
    signedUrl(drop.size_chart_url).then((u) => { if (live) setSizeChartUrl(u); });
    return () => { live = false; };
  }, [drop?.size_chart_url]);

  if (isLoading) return <div className="px-8 py-32 tracking-widest text-muted-foreground">// LOADING...</div>;
  if (!drop) return (
    <div className="px-8 py-32">
      <div className="text-xs tracking-[0.4em] text-primary mb-4">// 404</div>
      <h1 className="font-display text-7xl mb-6">SIGNAL LOST</h1>
      <Link to="/drops" className="border border-foreground px-6 py-3 font-display tracking-[0.25em] hover:bg-primary hover:border-primary hover:text-primary-foreground transition-colors">RETURN</Link>
    </div>
  );

  const soldOut = drop.status === "sold_out" || drop.stock <= 0;
  const isArchived = drop.status === "archived";

  function addToCart() {
    if (!size) return toast.error("SELECT A SIZE FIRST");
    add({ dropId: drop!.id, name: drop!.name, size, price: drop!.price, image: drop!.cover_image ?? undefined });
    toast.success("ADDED TO ARSENAL");
  }

  return (
    <div className="grid md:grid-cols-2 min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative bg-secondary aspect-square md:aspect-auto md:h-screen md:sticky md:top-14"
      >
        {drop.cover_image && (
          <SignedImage
            path={drop.cover_image}
            alt={drop.name}
            debugLabel={`DropDetail:${drop.slug}`}
            className="absolute inset-0 w-full h-full object-contain"
          />
        )}
        <div className="absolute top-6 left-6 text-xs tracking-[0.3em] text-primary border border-primary px-3 py-1">
          DROP/{String(drop.drop_number ?? 0).padStart(3, "0")}
        </div>
      </motion.div>

      <div className="px-6 md:px-12 py-12 md:py-24">
        <Link to="/drops" className="text-xs tracking-[0.3em] text-muted-foreground hover:text-primary mb-8 inline-block">← ALL DROPS</Link>
        <h1 className="font-display text-5xl md:text-7xl mb-3">{drop.name}</h1>
        {drop.tagline && <p className="text-muted-foreground tracking-wider mb-6">{drop.tagline}</p>}
        <div className="font-display text-4xl mb-10">{formatINR(drop.price)}</div>

        {drop.description && (
          <p className="text-sm tracking-wider leading-relaxed mb-10 text-muted-foreground">{drop.description}</p>
        )}

        {!isArchived && drop.sizes.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs tracking-[0.3em] text-muted-foreground">SIZE</div>
              <SizeChartButton url={sizeChartUrl} className="px-4 py-2 text-[10px]" />
            </div>
            <div className="flex flex-wrap gap-1">
              {drop.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`border px-5 py-3 font-display tracking-widest transition-colors ${
                    size === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={addToCart}
          disabled={soldOut || isArchived}
          className="w-full border border-foreground py-5 font-display tracking-[0.25em] text-lg hover:bg-primary hover:border-primary hover:text-primary-foreground transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-foreground"
        >
          {isArchived ? "ARCHIVED — UNAVAILABLE" : soldOut ? "SOLD OUT" : "ADD TO ARSENAL →"}
        </button>

        <div className="mt-12 pt-12 border-t border-border text-xs tracking-[0.3em] text-muted-foreground space-y-2">
          <div>// SHIPPING IN 5–7 DAYS ACROSS INDIA</div>
          <div>// DROPS ARE NEVER RESTOCKED</div>
          <div>// MOVE QUICKLY OR DON'T MOVE AT ALL</div>
        </div>
      </div>
    </div>
  );
}
