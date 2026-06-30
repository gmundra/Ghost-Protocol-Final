import { useQuery } from "@tanstack/react-query";
import { fetchDrops } from "@/lib/queries";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { formatINR } from "@/store/cart";
import { GlitchText } from "@/components/GlitchText";
import { SignedImage } from "@/components/SignedImage";

export default function Drops() {
  const { data: drops = [], isLoading } = useQuery({ queryKey: ["drops"], queryFn: fetchDrops });
  return (
    <div className="px-4 md:px-8 py-16 md:py-24">
      <div className="mb-12 md:mb-20">
        <div className="text-xs tracking-[0.4em] text-primary mb-3">// CATALOG</div>
        <h1 className="font-display text-6xl md:text-9xl"><GlitchText>ALL DROPS</GlitchText></h1>
      </div>
      {isLoading ? (
        <div className="text-muted-foreground tracking-widest">// LOADING SIGNAL...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
          {drops.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
            >
              <Link to={`/drop/${d.slug}`} className="group block relative aspect-[3/4] bg-secondary overflow-hidden">
                {d.cover_image && (
                  <SignedImage
                    path={d.cover_image}
                    alt={d.name}
                    debugLabel={`Drops:${d.slug}`}
                    className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-all duration-700"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent" />
                <div className="absolute top-4 left-4 text-xs tracking-[0.3em] text-primary border border-primary px-2 py-0.5">
                  DROP/{String(d.drop_number ?? 0).padStart(3, "0")}
                </div>
                {d.status !== "live" && (
                  <div className="absolute top-4 right-4 text-xs tracking-[0.3em] border border-foreground px-2 py-0.5">
                    {d.status === "sold_out" ? "SOLD OUT" : "ARCHIVED"}
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="font-display text-2xl mb-1">{d.name}</div>
                  <div className="flex justify-between text-sm tracking-widest text-muted-foreground">
                    <span>{formatINR(d.price)}</span>
                    <span className="group-hover:text-primary">VIEW →</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
