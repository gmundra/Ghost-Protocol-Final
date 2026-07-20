// UNSCREEN — Homepage
// Animation system ported from one-shot-wonder-web (framer-motion + lenis)

import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { RevealText, FadeUp, CountUp, MagneticButton, Parallax } from "../components/motion";

// ─── Data ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { label: "Board Games",         slug: "board-games",        glyph: "♟" },
  { label: "Wooden Toys",         slug: "wooden-toys",        glyph: "🪵" },
  { label: "Flash Cards",         slug: "flash-cards",        glyph: "🃏" },
  { label: "DIY Kits",            slug: "diy-kits",           glyph: "🎨" },
  { label: "Books",               slug: "books",              glyph: "📚" },
  { label: "Conversation Cards",  slug: "conversation-cards", glyph: "💬" },
  { label: "Puzzles",             slug: "puzzles",            glyph: "🧩" },
  { label: "Science Kits",        slug: "science-kits",       glyph: "🔭" },
  { label: "Art Supplies",        slug: "art-supplies",       glyph: "🖌" },
];

const OUTCOMES = [
  { label: "Critical Thinking",     body: "Puzzles and games that build problem-solving skills." },
  { label: "Creativity",             body: "Open-ended kits that let imagination lead." },
  { label: "Communication",          body: "Conversation cards that spark meaningful dialogue." },
  { label: "Emotional Intelligence", body: "Stories and play that build empathy and self-awareness." },
  { label: "Cognitive Growth",       body: "Age-matched challenges for developing minds." },
  { label: "Language Development",   body: "Reading, phonics, and storytelling tools." },
];

const AUDIENCES = [
  { label: "Parents",             body: "Screen-free activities that children actually ask to do again.",            key: "parents" },
  { label: "Teachers",            body: "Classroom-ready educational kits aligned to learning outcomes.",           key: "teachers" },
  { label: "Schools",             body: "Bulk institutional resources with teacher guides included.",               key: "schools" },
  { label: "Therapists",          body: "Developmentally calibrated tools for supporting all kinds of minds.",      key: "therapists" },
  { label: "Gift Buyers",         body: "Gifts that keep teaching long after the wrapping paper is gone.",         key: "gifts" },
  { label: "Homeschool Families", body: "Complete curriculum companions built around curiosity, not compliance.",   key: "homeschool" },
];

const STATS = [
  { value: 8,   suffix: "+ hrs", label: "average daily screen time in children under 12" },
  { value: 3,   suffix: "×",     label: "better retention through hands-on play vs passive screen time" },
  { value: 94,  suffix: "%",     label: "of parents want more screen-free learning options" },
  { value: 100, suffix: "+",     label: "curated educational products across all age groups" },
];

const TESTIMONIALS = [
  {
    quote: "My daughter spent an entire afternoon with the DIY kit — no phone, no tablet. Pure joy.",
    name: "Priya S.",
    role: "Parent, Bengaluru",
  },
  {
    quote: "We use the conversation cards every Friday in class. The discussions are incredible.",
    name: "Ananya R.",
    role: "Primary School Teacher, Delhi",
  },
  {
    quote: "Finally, a brand that understands what intentional play actually means.",
    name: "Dr. Meera V.",
    role: "Child Development Therapist",
  },
  {
    quote: "The wooden toys have become our go-to screen-free Sunday ritual.",
    name: "Kabir M.",
    role: "Parent, Mumbai",
  },
];

const FAQS = [
  { q: "What age groups do your products cover?",        a: "We curate products for ages 0–2, 3–5, 6–8, 9–12, and all ages. Every product listing clearly states its age range and skill focus." },
  { q: "Do you ship across India?",                      a: "Yes — free shipping on all orders nationwide. Most metros receive delivery within 2–4 business days." },
  { q: "Are the materials safe and non-toxic?",          a: "All physical products are tested to EN71 / IS 9873 toy safety standards. Material specs are listed on every product page." },
  { q: "Can schools order in bulk?",                     a: "Absolutely. Email us at schools@unscreen.in with your requirements and we'll put together a custom quote with bulk pricing and teacher guides." },
];

// ─── Page Component ─────────────────────────────────────────────────────────

export default function Home() {
  return (
    <main className="pt-16">
      <Hero />
      <WhyScreens />
      <Mission />
      <CategoriesRail />
      <Outcomes />
      <WhoWeServe />
      <Testimonials />
      <FAQ />
      <CTABand />
    </main>
  );
}

// ─── 1. Hero ────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-[92vh] flex flex-col justify-center px-6 md:px-16 bg-background overflow-hidden">
      {/* Ambient dust particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              background: "#6B7A4F",
              opacity: 0.2,
            }}
            animate={{ y: [0, -28, 0], opacity: [0.12, 0.45, 0.12] }}
            transition={{ duration: 6 + (i % 5), repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </div>

      {/* Parallax large glyph */}
      <Parallax
        offset={40}
        className="absolute -top-16 -right-10 text-[18rem] md:text-[26rem] font-display leading-none pointer-events-none select-none"
        style={{ color: "rgba(107,122,79,0.08)" } as any}
      >
        ◐
      </Parallax>

      <div className="relative max-w-3xl">
        <FadeUp>
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-primary mb-6">
            Premium Educational Play
          </p>
        </FadeUp>
        <RevealText as="h1" className="font-display text-5xl md:text-7xl text-foreground leading-[1.02] block mb-8" delay={0.05}>
          Less Screen. More World.
        </RevealText>
        <FadeUp delay={0.3}>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-xl">
            UNSCREEN curates thoughtfully designed toys, games, and learning kits that help children
            grow — through play, creativity, conversation, and imagination.
          </p>
        </FadeUp>
        <FadeUp delay={0.45}>
          <div className="flex gap-4 flex-wrap">
            <Link to="/drops">
              <MagneticButton className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3 rounded text-sm font-medium hover:opacity-90 transition-opacity">
                Shop All Products →
              </MagneticButton>
            </Link>
            <Link
              to="/drops?cat=bundles"
              className="inline-flex items-center gap-2 border border-border text-foreground px-7 py-3 rounded text-sm font-medium hover:bg-muted transition-colors"
            >
              View Bundles
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ─── 2. Why Screens ─────────────────────────────────────────────────────────

function WhyScreens() {
  return (
    <section className="py-24 px-6 md:px-16 bg-background border-t border-border">
      <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-10">
        <div className="md:col-span-5">
          <FadeUp>
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-primary mb-6">01 · A quiet crisis</p>
          </FadeUp>
          <RevealText as="h2" className="font-display text-3xl md:text-5xl text-foreground block max-w-md" delay={0.05}>
            Childhood is being redrawn — pixel by pixel.
          </RevealText>
        </div>
        <div className="md:col-span-7">
          <FadeUp delay={0.15}>
            <p className="text-xl leading-relaxed text-muted-foreground max-w-2xl">
              The average child under twelve now spends more time in front of a glowing rectangle
              than sleeping. We don't need alarm. We need alternatives — beautiful ones.
            </p>
          </FadeUp>
          <div className="mt-16 grid grid-cols-2 gap-y-12 gap-x-8">
            {STATS.map((s, i) => (
              <FadeUp key={s.label} delay={0.15 + i * 0.08}>
                <div className="font-display text-5xl md:text-6xl text-foreground">
                  <CountUp to={s.value} suffix={s.suffix} />
                </div>
                <div className="mt-3 text-sm text-muted-foreground max-w-[22ch]">{s.label}</div>
              </FadeUp>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── 3. Mission ─────────────────────────────────────────────────────────────

function Mission() {
  return (
    <section className="py-24 px-6 md:px-16 border-t border-border bg-muted/40 relative overflow-hidden">
      <Parallax
        offset={80}
        className="absolute -top-20 -left-10 text-[20rem] font-display leading-none pointer-events-none select-none"
        style={{ color: "rgba(107,122,79,0.07)" } as any}
      >
        ◐
      </Parallax>
      <div className="max-w-6xl mx-auto relative">
        <FadeUp>
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-primary mb-8">02 · Our Mission</p>
        </FadeUp>
        <div className="max-w-4xl">
          <RevealText as="h2" className="font-display text-4xl md:text-6xl text-foreground block leading-[1.05]" delay={0.04}>
            We make objects that quietly refuse to blink at children.
          </RevealText>
          <FadeUp delay={0.4}>
            <p className="mt-10 text-xl leading-relaxed text-muted-foreground max-w-2xl">
              Every UNSCREEN piece is designed as a small argument — that a card, a wooden shape, a
              folded bird can still hold a child longer than any feed. That paying attention is a
              skill worth teaching by example.
            </p>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

// ─── 4. Scroll-driven Categories Rail ───────────────────────────────────────

function CategoriesRail() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-65%"]);

  return (
    <section
      id="categories"
      ref={ref}
      className="relative border-t border-border"
      style={{ height: "280vh", background: "#1a1a18", color: "#F7F4ED" }}
    >
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
        <div className="px-6 md:px-16 mb-10">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase mb-6" style={{ color: "rgba(247,244,237,0.5)" }}>
            03 · Product Categories
          </p>
          <RevealText as="h2" className="font-display text-3xl md:text-5xl block max-w-2xl" delay={0.04}>
            Nine ways to hold a childhood.
          </RevealText>
        </div>
        <motion.div style={{ x }} className="flex gap-6 pl-6 md:pl-16 will-change-transform">
          {CATEGORIES.map((c, idx) => (
            <Link
              key={c.slug}
              to={`/drops?cat=${c.slug}`}
              className="shrink-0 w-[75vw] md:w-[36vw] aspect-[4/5] rounded-2xl relative overflow-hidden group"
              style={{ background: "linear-gradient(160deg, #2a1e14 0%, #1a1210 100%)" }}
            >
              <div
                className="absolute inset-0 flex items-center justify-center text-[10rem] md:text-[14rem] font-display group-hover:scale-110 transition-transform duration-700"
                style={{ color: "rgba(107,122,79,0.35)" }}
              >
                {c.glyph}
              </div>
              <div className="absolute bottom-0 inset-x-0 p-8">
                <div className="text-2xl md:text-3xl font-display" style={{ color: "#F7F4ED" }}>{c.label}</div>
              </div>
              <div
                className="absolute top-5 right-5 text-xs uppercase tracking-widest"
                style={{ color: "rgba(247,244,237,0.35)" }}
              >
                {String(idx + 1).padStart(2, "0")}
              </div>
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── 5. Outcomes ────────────────────────────────────────────────────────────

function Outcomes() {
  return (
    <section className="py-24 px-6 md:px-16 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mb-14">
          <FadeUp>
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-primary mb-6">04 · Outcomes</p>
          </FadeUp>
          <RevealText as="h2" className="font-display text-3xl md:text-5xl text-foreground block" delay={0.04}>
            What grows when the screens go dark.
          </RevealText>
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden border border-border">
          {OUTCOMES.map((o, i) => (
            <FadeUp key={o.label} delay={i * 0.06} className="bg-background p-10">
              <div className="text-primary font-display text-3xl mb-5">0{i + 1}</div>
              <h3 className="font-display text-2xl text-foreground leading-tight mb-2">{o.label}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{o.body}</p>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 6. Who We Serve ────────────────────────────────────────────────────────

function WhoWeServe() {
  const [tab, setTab] = useState(AUDIENCES[0].key);
  const current = AUDIENCES.find((a) => a.key === tab)!;
  return (
    <section className="py-24 px-6 md:px-16 border-t border-border bg-muted/30">
      <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-12">
        <div className="md:col-span-4">
          <FadeUp>
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-primary mb-6">05 · Who we serve</p>
          </FadeUp>
          <RevealText as="h2" className="font-display text-3xl md:text-4xl text-foreground block" delay={0.04}>
            Made for the grown-ups children trust.
          </RevealText>
          <div className="mt-10 flex md:flex-col gap-2 flex-wrap">
            {AUDIENCES.map((a) => (
              <button
                key={a.key}
                onClick={() => setTab(a.key)}
                className={`text-left px-5 py-3 rounded-full border text-sm transition-colors ${
                  tab === a.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-foreground hover:border-primary"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
        <div className="md:col-span-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.key}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl bg-background border border-border p-12 md:p-16 min-h-[22rem] flex flex-col justify-between"
            >
              <div className="font-display text-7xl text-primary/30">{current.label[0]}</div>
              <p className="font-display text-2xl md:text-3xl text-foreground leading-snug max-w-xl">{current.body}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

// ─── 7. Testimonials ────────────────────────────────────────────────────────

function Testimonials() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  return (
    <section ref={ref} className="py-24 border-t border-border bg-foreground text-background overflow-hidden">
      <div className="px-6 md:px-16 max-w-6xl mx-auto mb-14">
        <p className="text-xs font-semibold tracking-[0.3em] uppercase mb-6" style={{ color: "rgba(247,244,237,0.5)" }}>
          06 · In their words
        </p>
        <RevealText as="h2" className="font-display text-3xl md:text-5xl block" delay={0.04}>
          Small notes from big lives.
        </RevealText>
      </div>
      <div className="flex gap-8 px-6 md:px-16 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide">
        {TESTIMONIALS.map((t, i) => {
          const drift = useTransform(scrollYProgress, [0, 1], [i % 2 === 0 ? 32 : -32, i % 2 === 0 ? -32 : 32]);
          return (
            <motion.figure
              key={i}
              style={{ y: drift, rotate: i % 2 === 0 ? -1.5 : 1.5 }}
              className="shrink-0 w-[85vw] md:w-[400px] snap-center rounded-2xl border p-10"
              style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
            >
              <div className="font-display text-4xl mb-5" style={{ color: "#6B7A4F" }}>"</div>
              <blockquote className="text-xl leading-relaxed" style={{ color: "rgba(247,244,237,0.9)" }}>{t.quote}</blockquote>
              <figcaption className="mt-8 text-sm" style={{ color: "rgba(247,244,237,0.55)" }}>
                <div style={{ color: "#F7F4ED" }}>{t.name}</div>
                <div>{t.role}</div>
              </figcaption>
            </motion.figure>
          );
        })}
      </div>
    </section>
  );
}

// ─── 8. FAQ ──────────────────────────────────────────────────────────────────

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="py-24 px-6 md:px-16 border-t border-border">
      <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-12">
        <div className="md:col-span-5">
          <FadeUp>
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-primary mb-6">07 · FAQ</p>
          </FadeUp>
          <RevealText as="h2" className="font-display text-3xl md:text-4xl text-foreground block max-w-sm" delay={0.04}>
            Things thoughtful parents ask.
          </RevealText>
        </div>
        <div className="md:col-span-7">
          {FAQS.map((f, i) => (
            <div key={i} className="border-b border-border">
              <button
                className="w-full py-6 flex items-start justify-between gap-6 text-left group"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-display text-xl md:text-2xl text-foreground leading-snug group-hover:text-primary transition-colors">
                  {f.q}
                </span>
                <span className={`text-2xl text-primary transition-transform duration-300 ${open === i ? "rotate-45" : ""}`}>
                  +
                </span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 text-muted-foreground text-base max-w-2xl">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 9. CTA Band ─────────────────────────────────────────────────────────────

function CTABand() {
  return (
    <section className="py-24 px-6 md:px-16 border-t border-border bg-muted/30 relative overflow-hidden">
      <div className="max-w-6xl mx-auto text-center relative">
        <FadeUp>
          <h2 className="font-display text-4xl md:text-6xl text-foreground max-w-[16ch] mx-auto">
            Choose something they'll{" "}
            <em className="text-primary not-italic">remember</em>.
          </h2>
        </FadeUp>
        <FadeUp delay={0.25}>
          <p className="mt-8 text-xl text-muted-foreground max-w-xl mx-auto">
            Start with a single object. A card, a puzzle, a book. Watch what happens when a child
            reaches for something warm.
          </p>
        </FadeUp>
        <FadeUp delay={0.45}>
          <div className="mt-12 flex flex-wrap gap-4 justify-center">
            <Link to="/drops">
              <MagneticButton className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded text-sm font-medium hover:opacity-90 transition-opacity">
                Explore the collection →
              </MagneticButton>
            </Link>
            <Link
              to="/drops?cat=bundles"
              className="inline-flex items-center gap-2 border border-border text-foreground px-8 py-4 rounded text-sm font-medium hover:bg-muted transition-colors"
            >
              Gift a Bundle
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
