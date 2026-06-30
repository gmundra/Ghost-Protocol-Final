import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchSiteConfig, fetchDrops } from "@/lib/queries";
import { GlitchText } from "@/components/GlitchText";
import { Countdown } from "@/components/Countdown";
import { ParticleField } from "@/components/ParticleField";
import { NotifyForm } from "@/components/NotifyForm";
import { ConfiguratorTerminal } from "@/components/ConfiguratorTerminal";
import { formatINR } from "@/store/cart";
import type { Drop } from "@/lib/types";
import { SignedImage } from "@/components/SignedImage";
import { signedUrl, HERO_BUCKET } from "@/lib/storage";
import { FitHeading } from "@/components/FitHeading";

/* ============================================================
 * THE GHOST PROTOCOL — Homepage
 * Seven-act cinematic sequence. Commerce is secondary.
 * 1. Transmission detected   2. Brand reveal       3. Manifesto
 * 4. Configurator (centerpiece)  5. Featured artifact
 * 6. Archive                 7. Signal signup
 * ============================================================ */

export default function Home() {
  const { data: config } = useQuery({ queryKey: ["site_config"], queryFn: fetchSiteConfig });
  const { data: drops = [] } = useQuery({ queryKey: ["drops"], queryFn: fetchDrops });

  const featured =
    drops.find((d) => d.is_featured && d.status === "live") ??
    drops.find((d) => d.status === "live");
  const archive = drops.filter((d) => d.status === "archived" || d.status === "sold_out");

  return (
    <>
      <BootSequence />
      <ActOne config={config} />
      <ActTwoManifesto manifesto={config?.manifesto ?? ""} />
      <ActThreeConfigurator />
      {featured && <ActFourArtifact drop={featured} />}
      <ActFiveArchive archive={archive} />
      <ActSixSignal />
    </>
  );
}

/* ──────────────────────────── 00. BOOT ──────────────────────────── */

function BootSequence() {
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);
  const lines = [
    "› INITIATING HANDSHAKE",
    "› DECRYPTING SIGNAL",
    "› AUTHORIZING OBSERVER",
    "› TRANSMISSION DETECTED",
  ];
  useEffect(() => {
    if (sessionStorage.getItem("gp_boot")) {
      setDone(true);
      return;
    }
    const id = setInterval(() => {
      setStage((s) => {
        if (s >= lines.length) {
          clearInterval(id);
          setTimeout(() => {
            sessionStorage.setItem("gp_boot", "1");
            setDone(true);
          }, 600);
          return s;
        }
        return s + 1;
      });
    }, 380);
    return () => clearInterval(id);
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[70] bg-background flex flex-col items-center justify-center"
        >
          <div className="absolute top-6 left-6 text-[10px] tracking-[0.5em] text-muted-foreground">
            GP.OS · v07.00
          </div>
          <div className="absolute top-6 right-6 text-[10px] tracking-[0.5em] text-primary animate-flicker">
            ● LIVE
          </div>
          <div className="w-full max-w-md px-6 font-mono text-xs tracking-[0.2em] space-y-2">
            {lines.slice(0, stage).map((l, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className={i === stage - 1 ? "text-primary" : "text-muted-foreground"}
              >
                {l}
                {i === stage - 1 && <span className="animate-flicker">_</span>}
              </motion.div>
            ))}
          </div>
          <div className="absolute bottom-6 left-6 right-6 flex justify-between text-[10px] tracking-[0.4em] text-muted-foreground">
            <span>JAIPUR · IN</span>
            <span>CHANNEL.07</span>
            <span className="tabular-nums">{new Date().toISOString().slice(0, 10)}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ──────────────────────────── 01. BRAND REVEAL ──────────────────────────── */
/*
 * TYPOGRAPHY FIX (v2): the headline is one cohesive GlitchText again — no
 * splitting "THE" from "GHOST PROTOCOL" into separate styling. The earlier
 * fix solved the misalignment bug but did so by giving "THE" its own
 * isolated size/treatment, which read as two disjointed pieces instead of
 * one heading. That isolation is removed here.
 *
 * The underlying wrap bug (GlitchText's absolute glitch layers misaligning
 * when the inline-block wraps at narrow viewports or with a longer custom
 * admin-set headline) is fixed at its root instead: FitHeading measures the
 * heading's natural single-line width and uniformly scales the whole
 * element down — text and both glitch layers together — just enough that
 * it never wraps, at any viewport width or headline length. Nothing about
 * the heading's content, color, or hierarchy changes; it's always rendered
 * as a single line.
 */

function ActOne({ config }: { config: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const headline: string = config?.hero_headline ?? "THE GHOST PROTOCOL";

  const [heroVideoSrc, setHeroVideoSrc] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    const path = config?.hero_video_url;
    if (!path) { setHeroVideoSrc(null); return; }
    signedUrl(path, 60 * 60 * 24, HERO_BUCKET).then((u) => { if (live) setHeroVideoSrc(u); });
    return () => { live = false; };
  }, [config?.hero_video_url]);

  return (
    <section ref={ref} className="relative h-screen min-h-[680px] overflow-hidden">
      <motion.div style={{ y, opacity }} className="absolute inset-0">
        {heroVideoSrc ? (
          <video
            src={heroVideoSrc}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <ParticleField />
        )}
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background pointer-events-none" />

      {/* Crosshairs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-foreground/[0.04]" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-foreground/[0.04]" />
      </div>

      {/* HUD chrome */}
      <div className="absolute top-20 left-6 md:left-12 text-[10px] tracking-[0.5em] text-muted-foreground space-y-1">
        <div className="text-primary animate-flicker">● SIGNAL.ACQUIRED</div>
        <div>LAT 26.9124° N</div>
        <div>LNG 75.7873° E</div>
      </div>
      <div className="absolute top-20 right-6 md:right-12 text-right text-[10px] tracking-[0.5em] text-muted-foreground space-y-1">
        <div>CHANNEL/07</div>
        <div>OBSERVER/UNNAMED</div>
      </div>

      {/* Centerpiece */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, letterSpacing: "0.8em" }}
          animate={{ opacity: 1, letterSpacing: "0.5em" }}
          transition={{ duration: 1.6, delay: 0.3 }}
          className="font-display text-[10px] md:text-xs tracking-[0.5em] text-muted-foreground mb-8"
        >
          ESTABLISHED — JAIPUR — 2024
        </motion.div>

        {/*
         * One cohesive heading — single GlitchText, single FitHeading
         * wrapper. No per-word splitting, no isolated styling.
         */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.6 }}
          className="w-full"
        >
          <FitHeading>
            <h1 className="font-display text-[19vw] md:text-[12.5vw] leading-[0.88] whitespace-nowrap">
              <GlitchText>{headline}</GlitchText>
            </h1>
          </FitHeading>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.4 }}
          className="mt-10 max-w-md text-center"
        >
          <div className="text-[11px] tracking-[0.5em] text-muted-foreground mb-2">
            // {config?.hero_subtext ?? "MOVE IN SILENCE."}
          </div>
        </motion.div>

        {config?.next_drop_date && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.8 }}
            className="mt-12"
          >
            <div className="text-[10px] tracking-[0.5em] text-primary text-center mb-3 animate-flicker">
              NEXT TRANSMISSION
            </div>
            <Countdown target={config.next_drop_date} />
          </motion.div>
        )}
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.5em] text-muted-foreground flex flex-col items-center gap-2">
        <span className="animate-flicker">DESCEND</span>
        <span className="block w-px h-10 bg-muted-foreground/40" />
      </div>
    </section>
  );
}

/* ──────────────────────────── 02. MANIFESTO ──────────────────────────── */
/* SPACING FIX: py-40 md:py-56 → py-20 md:py-28; mt-16 md:mt-24 → mt-12 md:mt-16 */

function ActTwoManifesto({ manifesto }: { manifesto: string }) {
  const words = manifesto.split(/\s+/).filter(Boolean);
  return (
    <section className="relative py-20 md:py-28 px-6 md:px-16 border-t border-border/40">
      <div className="grid md:grid-cols-12 gap-8">
        <div className="md:col-span-2 text-[10px] tracking-[0.5em] text-primary md:sticky md:top-32 self-start">
          02 /<br />MANIFESTO
        </div>
        <p className="md:col-span-10 font-display text-4xl md:text-7xl leading-[1.05] tracking-wide">
          {words.map((w, i) => (
            <Word key={i} index={i}>{w}</Word>
          ))}
        </p>
      </div>
      <div className="mt-12 md:mt-16 md:ml-[16.66%] grid grid-cols-2 md:grid-cols-4 gap-px bg-border/40">
        {[
          ["01", "RESTRAINT"],
          ["02", "DISCIPLINE"],
          ["03", "PRECISION"],
          ["04", "SILENCE"],
        ].map(([n, t]) => (
          <div key={n} className="bg-background px-4 py-6">
            <div className="text-[10px] tracking-[0.4em] text-muted-foreground mb-2">{n}</div>
            <div className="font-display text-xl tracking-[0.2em]">{t}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Word({ children, index }: { children: string; index: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  return (
    <span
      ref={ref}
      className="inline-block mr-3 transition-all duration-1000"
      style={{
        opacity: inView ? 1 : 0.08,
        transform: inView ? "translateY(0)" : "translateY(8px)",
        transitionDelay: `${index * 35}ms`,
        color: inView && children.match(/SIGNAL|GHOST|SILENCE|PROTOCOL/i) ? "hsl(var(--primary))" : undefined,
      }}
    >
      {children}
    </span>
  );
}

/* ──────────────────────────── 03. CONFIGURATOR ─────────────────────────── */
/* SPACING FIX: pt-24 md:pt-32 pb-12 → pt-14 md:pt-20 pb-8 */

function ActThreeConfigurator() {
  return (
    <section className="relative border-t border-border/40">
      <div className="px-6 md:px-16 pt-14 md:pt-20 pb-8">
        <div className="grid md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-2 text-[10px] tracking-[0.5em] text-primary">
            03 /<br />TERMINAL
          </div>
          <div className="md:col-span-10">
            <div className="text-[11px] tracking-[0.5em] text-muted-foreground mb-4 animate-flicker">
              // CUSTOM FABRICATION UNIT — REV.07
            </div>
            <h2 className="font-display text-6xl md:text-[9vw] leading-[0.9]">
              FABRICATE
              <br />
              <span className="text-stroke-red">YOUR SIGNAL.</span>
            </h2>
            <p className="mt-6 max-w-xl text-sm tracking-[0.15em] text-muted-foreground leading-relaxed">
              The protocol does not issue uniforms. It issues instruments. Compose the garment.
              Place the mark. The artifact is yours alone — no second unit will exist.
            </p>
          </div>
        </div>
      </div>
      <ConfiguratorTerminal compact />
    </section>
  );
}

/* ──────────────────────────── 04. FEATURED ARTIFACT ──────────────────── */

function ActFourArtifact({ drop }: { drop: Drop }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  const numY = useTransform(scrollYProgress, [0, 1], ["20%", "-20%"]);

  return (
    <section ref={ref} className="relative min-h-screen border-t border-border/40 overflow-hidden">
      <motion.div
        style={{ y: numY }}
        className="absolute -top-10 left-0 right-0 text-center font-display text-[28vw] leading-none text-stroke pointer-events-none select-none opacity-[0.06]"
      >
        {String(drop.drop_number ?? 0).padStart(3, "0")}
      </motion.div>

      <div className="relative grid md:grid-cols-12 min-h-screen">
        <div className="md:col-span-7 relative overflow-hidden border-r border-border/40">
          {drop.cover_image && (
            <motion.div style={{ y: imgY }} className="absolute inset-0 w-full h-[120%]">
              <SignedImage
                path={drop.cover_image}
                alt={drop.name}
                debugLabel={`Home:Featured:${drop.slug}`}
                className="w-full h-full object-contain"
              />
            </motion.div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute top-6 left-6 flex items-center gap-3 text-[10px] tracking-[0.4em] text-primary">
            <span className="w-1.5 h-1.5 bg-primary animate-flicker" />
            DROP IS LIVE
          </div>
          <div className="absolute bottom-6 left-6 text-[10px] tracking-[0.4em] text-muted-foreground">
            ARTIFACT /{String(drop.drop_number ?? 0).padStart(3, "0")}
          </div>
        </div>

        <div className="md:col-span-5 flex items-center px-6 md:px-12 py-20">
          <div>
            <div className="text-[10px] tracking-[0.5em] text-primary mb-4">
              04 / FEATURED ARTIFACT
            </div>
            <h2 className="font-display text-6xl md:text-7xl leading-none mb-6">{drop.name}</h2>
            {drop.tagline && (
              <p className="text-sm tracking-[0.25em] text-muted-foreground mb-8">{drop.tagline}</p>
            )}
            {drop.description && (
              <p className="text-sm tracking-wide leading-relaxed mb-10 max-w-md text-foreground/80">
                {drop.description}
              </p>
            )}
            <div className="flex items-center justify-between border-t border-border pt-5 mb-8">
              <div>
                <div className="text-[10px] tracking-[0.4em] text-muted-foreground mb-1">UNIT COST</div>
                <div className="font-display text-3xl tabular-nums">{formatINR(drop.price)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] tracking-[0.4em] text-muted-foreground mb-1">STATUS</div>
                <div className="font-display tracking-widest text-sm">
                  {drop.stock > 0 ? `${drop.stock} REMAINING` : "DEPLETED"}
                </div>
              </div>
            </div>
            <Link
              to={`/drop/${drop.slug}`}
              className="block w-full text-center border border-foreground px-8 py-4 font-display tracking-[0.3em] hover:bg-primary hover:border-primary hover:text-primary-foreground transition-colors"
            >
              ACQUIRE →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────── 05. ARCHIVE ──────────────────────────── */
/* SPACING FIX: py-32 → py-18 md:py-24; mb-16 → mb-12 */

function ActFiveArchive({ archive }: { archive: Drop[] }) {
  return (
    <section className="relative border-t border-border/40 py-18 md:py-24 px-6 md:px-16">
      <div className="grid md:grid-cols-12 gap-8 mb-12">
        <div className="md:col-span-2 text-[10px] tracking-[0.5em] text-primary">
          05 /<br />ARCHIVE
        </div>
        <div className="md:col-span-10 flex items-end justify-between flex-wrap gap-4">
          <h2 className="font-display text-5xl md:text-7xl leading-none">
            PAST <span className="text-stroke">/ SIGNALS</span>
          </h2>
          <Link to="/drops" className="text-[10px] tracking-[0.5em] text-muted-foreground hover:text-primary">
            INDEX ALL →
          </Link>
        </div>
      </div>

      {archive.length === 0 ? (
        <div className="md:ml-[16.66%] border border-dashed border-border p-12 text-center text-xs tracking-[0.4em] text-muted-foreground">
          NO ARCHIVED TRANSMISSIONS
        </div>
      ) : (
        <div className="md:ml-[16.66%] space-y-0 border-t border-border/60">
          {archive.map((d, i) => (
            <ArchiveRow key={d.id} drop={d} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}

function ArchiveRow({ drop, index }: { drop: Drop; index: number }) {
  const [hover, setHover] = useState(false);
  const [thumb, setThumb] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    if (!hover || !drop.cover_image) return;
    signedUrl(drop.cover_image).then((u) => {
      if (!live) return;
      if (!u) console.error("[Home:Archive] sign failed", { slug: drop.slug, path: drop.cover_image });
      setThumb(u);
    });
    return () => { live = false; };
  }, [hover, drop.cover_image, drop.slug]);
  return (
    <Link
      to={`/drop/${drop.slug}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative group grid grid-cols-12 items-center gap-4 py-6 border-b border-border/60 hover:border-primary transition-colors"
    >
      <div className="col-span-2 text-[10px] tracking-[0.4em] text-muted-foreground tabular-nums">
        /{String(index + 1).padStart(3, "0")}
      </div>
      <div className="col-span-6 md:col-span-5 font-display text-2xl md:text-4xl tracking-wide group-hover:text-primary transition-colors">
        {drop.name}
      </div>
      <div className="hidden md:block col-span-3 text-xs tracking-[0.3em] text-muted-foreground">
        {drop.status === "sold_out" ? "SOLD OUT" : "ARCHIVED"}
      </div>
      <div className="col-span-4 md:col-span-2 text-right text-xs tracking-[0.3em] text-muted-foreground group-hover:text-foreground">
        VIEW →
      </div>
      {/* hover thumbnail */}
      <AnimatePresence>
        {hover && thumb && (
          <motion.img
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            src={thumb}
            alt=""
            className="hidden md:block absolute right-32 top-1/2 -translate-y-1/2 w-40 h-52 object-contain pointer-events-none z-10 border border-primary bg-background"
          />
        )}
      </AnimatePresence>
    </Link>
  );
}

/* ──────────────────────────── 06. SIGNAL SIGNUP ──────────────────────── */
/* SPACING FIX: py-40 → py-20 md:py-28 */

function ActSixSignal() {
  return (
    <section className="relative border-t border-border/40 py-20 md:py-28 px-6 md:px-16 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div className="relative grid md:grid-cols-12 gap-8">
        <div className="md:col-span-2 text-[10px] tracking-[0.5em] text-primary">
          06 /<br />ENLIST
        </div>
        <div className="md:col-span-10 max-w-3xl">
          <div className="text-[11px] tracking-[0.5em] text-muted-foreground mb-6 animate-flicker">
            // ENCRYPTED CHANNEL · OUTBOUND ONLY
          </div>
          <h2 className="font-display text-6xl md:text-8xl leading-[0.9] mb-8">
            JOIN <span className="text-stroke-red">THE SIGNAL.</span>
          </h2>
          <p className="text-sm tracking-[0.2em] text-muted-foreground mb-10 max-w-xl leading-relaxed">
            Drops are unannounced. Inventory is finite. Observers receive coordinates before the public ever sees them.
          </p>
          <NotifyForm />
          <div className="mt-6 text-[10px] tracking-[0.4em] text-muted-foreground">
            NO NEWSLETTERS · NO NOISE · ONE MESSAGE PER DROP
          </div>
        </div>
      </div>
    </section>
  );
}
