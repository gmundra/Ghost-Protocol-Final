// UNSCREEN — Homepage
// Full UI copied from one-shot-wonder-web/src/routes/index.tsx
// Adapted: @tanstack/react-router → react-router-dom Link
//          static products data → src/data/content.ts
//          ProductModal uses local DropProduct shape for static data

import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { RevealText, FadeUp, CountUp, MagneticButton, Parallax } from "@/components/motion";
import { ProductModal } from "@/components/ProductModal";
import {
  products, stats, outcomes, audiences, testimonials, faqs,
  type Product,
} from "@/data/content";

export default function Index() {
  const [active, setActive] = useState<Product | null>(null);

  const modalProduct = active
    ? {
        id: active.id,
        name: active.name,
        price: 0,
        category: active.category,
        tagline: active.tagline,
        description: active.outcome,
        tags: [
          ...active.skills.map((s) => `skill:${s}`),
          `age:${active.age}`,
        ],
        image_url: undefined,
        cover_image: undefined,
      }
    : null;

  return (
    <>
      <Hero />
      <WhyScreens />
      <Mission />
      <Ecosystem />
      <FeaturedProducts onOpen={setActive} />
      <Outcomes />
      <WhoWeServe />
      <Testimonials />
      <FAQ />
      <Contact />
      <ProductModal product={modalProduct} onClose={() => setActive(null)} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* HERO                                                                  */
/* ------------------------------------------------------------------ */
function Hero() {
  return (
    <section className="relative min-h-screen bg-background text-foreground overflow-hidden grain flex items-center">
      {/* Ambient dust particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 24 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute w-1 h-1 rounded-full bg-accent/30"
            style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%` }}
            animate={{ y: [0, -30, 0], opacity: [0.15, 0.6, 0.15] }}
            transition={{ duration: 6 + (i % 5), repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>

      <Parallax offset={40} className="absolute -top-16 -right-10 text-[22rem] font-display text-accent/10 leading-none pointer-events-none select-none">
        ◐
      </Parallax>

      <div className="container-x relative pt-32 pb-24 md:pt-40 md:pb-32 text-center mx-auto">
        <div className="eyebrow mb-6">◐ Welcome to UNSCREEN</div>
        <h1 className="display-1 max-w-[14ch] mx-auto">
          Give Childhood <br /><em className="text-accent">Back.</em>
        </h1>
        <p className="mt-8 text-lg md:text-xl max-w-xl mx-auto opacity-80">
          Creating meaningful moments beyond screens — through objects children can hold, share, and remember.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link to="/drops" className="ink-btn">Explore Collection →</Link>
          <Link to="/" className="ghost-btn">Our Story</Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* WHY SCREENS                                                           */
/* ------------------------------------------------------------------ */
function WhyScreens() {
  return (
    <section className="section-y bg-background">
      <div className="container-x grid md:grid-cols-12 gap-10">
        <div className="md:col-span-5">
          <div className="eyebrow mb-6">01 · A quiet crisis</div>
          <RevealText as="h2" className="display-2 block max-w-md">
            Childhood is being redrawn — pixel by pixel.
          </RevealText>
        </div>
        <div className="md:col-span-7">
          <FadeUp delay={0.15}>
            <p className="text-xl leading-relaxed text-muted-foreground max-w-2xl">
              The average child under twelve now spends more time in front of a glowing rectangle than sleeping. We don't need alarm. We need alternatives — beautiful ones.
            </p>
          </FadeUp>
          <div className="mt-16 grid grid-cols-2 gap-y-14 gap-x-8">
            {stats.map((s, i) => (
              <FadeUp key={s.label} delay={0.15 + i * 0.08}>
                <div className="text-5xl md:text-6xl font-display text-foreground">
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

/* ------------------------------------------------------------------ */
/* MISSION                                                               */
/* ------------------------------------------------------------------ */
function Mission() {
  return (
    <section className="section-y bg-surface grain relative overflow-hidden">
      <Parallax offset={80} className="absolute -top-20 -left-10 text-[24rem] font-display text-accent/10 leading-none pointer-events-none select-none">
        ◐
      </Parallax>
      <div className="container-x relative">
        <div className="eyebrow mb-8">02 · Our Mission</div>
        <div className="max-w-4xl">
          <RevealText as="h2" className="display-1 block leading-[1.05]">
            We make objects that quietly refuse to blink at children.
          </RevealText>
          <FadeUp delay={0.4}>
            <p className="mt-10 text-xl leading-relaxed text-muted-foreground max-w-2xl">
              Every UNSCREEN piece is designed as a small argument — that a card, a wooden shape, a folded bird can still hold a child longer than any feed. That paying attention is a skill worth teaching by example.
            </p>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* ECOSYSTEM                                                             */
/* ------------------------------------------------------------------ */
function Ecosystem() {
  const skills = [
    { label: "Motor",            angle: 0 },
    { label: "Math",             angle: 51 },
    { label: "Creativity",       angle: 102 },
    { label: "Language",         angle: 154 },
    { label: "Emotion",          angle: 205 },
    { label: "Communication",    angle: 257 },
    { label: "Problem Solving",  angle: 308 },
  ];
  const [hover, setHover] = useState<number | null>(null);

  return (
    <section id="ecosystem" className="section-y bg-background">
      <div className="container-x">
        <div className="max-w-3xl">
          <div className="eyebrow mb-6">03 · The Growth Ecosystem</div>
          <RevealText as="h2" className="display-2 block">
            Seven skills. One quiet childhood.
          </RevealText>
        </div>
        <div className="mt-20 grid md:grid-cols-12 gap-16 items-center">
          <FadeUp className="md:col-span-6 flex justify-center">
            <div className="relative w-[min(90vw,520px)] aspect-square">
              <div className="absolute inset-0 rounded-full border border-border" />
              <div className="absolute inset-[15%] rounded-full border border-border" />
              <div className="absolute inset-[30%] rounded-full border border-border" />
              <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 -mt-12 -ml-12 rounded-full bg-foreground text-background flex items-center justify-center text-sm tracking-widest uppercase">
                Child
              </div>
              {skills.map((s, i) => {
                const rad = (s.angle * Math.PI) / 180;
                const x = 50 + 44 * Math.cos(rad);
                const y = 50 + 44 * Math.sin(rad);
                const isActive = hover === i;
                return (
                  <motion.div
                    key={s.label}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${x}%`, top: `${y}%` }}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                    animate={{ scale: isActive ? 1.25 : 1 }}
                  >
                    <div
                      className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                        isActive
                          ? "bg-accent text-accent-foreground border-accent"
                          : "bg-background border-border"
                      }`}
                    >
                      {s.label}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </FadeUp>
          <FadeUp delay={0.15} className="md:col-span-6">
            <p className="text-xl leading-relaxed text-muted-foreground max-w-lg">
              We map every product to a specific corner of childhood development — because "educational" is not a marketing word, it's a promise.
            </p>
            <ul className="mt-10 grid grid-cols-2 gap-4 text-sm">
              {skills.map((s) => (
                <li key={s.label} className="flex items-center gap-2 text-foreground/80">
                  <span className="text-accent">◆</span> {s.label}
                </li>
              ))}
            </ul>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FEATURED PRODUCTS                                                     */
/* ------------------------------------------------------------------ */
function FeaturedProducts({ onOpen }: { onOpen: (p: Product) => void }) {
  const featured = products.slice(0, 6);
  return (
    <section className="section-y bg-background">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <div className="eyebrow mb-6">04 · Featured</div>
            <RevealText as="h2" className="display-2 block">
              Held. Not scrolled.
            </RevealText>
          </div>
          <Link to="/drops" className="ghost-btn">See all products →</Link>
        </div>
        <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, i) => (
            <FadeUp key={p.id} delay={i * 0.05}>
              <div
                className="group cursor-pointer"
                onClick={() => onOpen(p)}
              >
                <div
                  className="relative aspect-[4/5] rounded-2xl overflow-hidden transition-shadow duration-500 group-hover:shadow-[0_30px_80px_-30px_rgba(60,40,20,0.35)]"
                  style={{ background: `linear-gradient(150deg, ${p.palette[0]}, ${p.palette[1]})` }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="text-[7rem] leading-none transition-transform duration-700 group-hover:scale-110"
                      style={{ filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.15))" }}
                    >
                      {p.glyph}
                    </div>
                  </div>
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-[11px] uppercase tracking-widest">
                    <span className="px-2.5 py-1 rounded-full bg-background/70 backdrop-blur">
                      Ages {p.age}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-background/70 backdrop-blur">
                      {p.category.replace(/-/g, " ")}
                    </span>
                  </div>
                </div>
                <div className="pt-4">
                  <h3 className="font-display text-xl leading-tight">{p.name}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{p.tagline}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.skills.slice(0, 3).map((s) => (
                      <span key={s} className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded-full px-2 py-0.5">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* OUTCOMES                                                              */
/* ------------------------------------------------------------------ */
function Outcomes() {
  return (
    <section id="outcomes" className="section-y bg-surface grain">
      <div className="container-x">
        <div className="max-w-3xl mb-16">
          <div className="eyebrow mb-6">05 · Outcomes</div>
          <RevealText as="h2" className="display-2 block">
            What grows when the screens go dark.
          </RevealText>
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-border rounded-3xl overflow-hidden border border-border">
          {outcomes.map((o, i) => (
            <FadeUp key={o.title} delay={i * 0.05} className="bg-background p-10">
              <div className="text-accent text-3xl mb-6">0{i + 1}</div>
              <h3 className="text-2xl font-display leading-tight">{o.title}</h3>
              <p className="mt-3 text-muted-foreground">{o.body}</p>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* WHO WE SERVE                                                          */
/* ------------------------------------------------------------------ */
function WhoWeServe() {
  const [tab, setTab] = useState(audiences[0].key);
  const current = audiences.find((a) => a.key === tab)!;
  return (
    <section id="who" className="section-y bg-background">
      <div className="container-x grid md:grid-cols-12 gap-12">
        <div className="md:col-span-4">
          <div className="eyebrow mb-6">06 · Who we serve</div>
          <RevealText as="h2" className="display-2 block">
            Made for the grown-ups children trust.
          </RevealText>
          <div className="mt-10 flex md:flex-col gap-2 flex-wrap">
            {audiences.map((a) => (
              <button
                key={a.key}
                onClick={() => setTab(a.key)}
                className={`text-left px-5 py-3 rounded-full border transition-colors ${
                  tab === a.key
                    ? "bg-foreground text-background border-foreground"
                    : "border-border hover:border-foreground"
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-3xl bg-surface grain p-12 md:p-16 min-h-[24rem] flex flex-col justify-between"
            >
              <div className="text-8xl font-display text-accent/40">{current.label[0]}</div>
              <p className="text-2xl md:text-3xl font-display leading-snug max-w-xl">{current.body}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* TESTIMONIALS                                                          */
/* ------------------------------------------------------------------ */
function Testimonials() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  return (
    <section ref={ref} className="section-y bg-foreground text-background grain overflow-hidden">
      <div className="container-x">
        <div className="max-w-3xl mb-16">
          <div className="eyebrow mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>07 · In their words</div>
          <RevealText as="h2" className="display-2 block">
            Small notes from big lives.
          </RevealText>
        </div>
      </div>
      <div className="relative">
        <div className="flex gap-8 px-8 md:px-16 overflow-x-auto pb-8 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} t={t} i={i} progress={scrollYProgress} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  t, i, progress,
}: {
  t: (typeof testimonials)[number];
  i: number;
  progress: any;
}) {
  const drift = useTransform(
    progress,
    [0, 1],
    [i % 2 === 0 ? 40 : -40, i % 2 === 0 ? -40 : 40],
  );
  return (
    <motion.figure
      style={{ y: drift, rotate: i % 2 === 0 ? -1.5 : 1.5 }}
      className="shrink-0 w-[85vw] md:w-[420px] snap-center rounded-3xl bg-background/5 border border-background/10 backdrop-blur p-10"
    >
      <div className="text-4xl text-accent font-display leading-none mb-6">"</div>
      <blockquote className="text-xl leading-relaxed text-background/90">{t.quote}</blockquote>
      <figcaption className="mt-8 text-sm text-background/60">
        <div className="text-background">{t.name}</div>
        <div>{t.role}</div>
      </figcaption>
    </motion.figure>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                   */
/* ------------------------------------------------------------------ */
function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="section-y bg-background">
      <div className="container-x grid md:grid-cols-12 gap-12">
        <div className="md:col-span-5">
          <div className="eyebrow mb-6">08 · FAQ</div>
          <RevealText as="h2" className="display-2 block max-w-sm">
            Things thoughtful parents ask.
          </RevealText>
        </div>
        <div className="md:col-span-7">
          {faqs.map((f, i) => (
            <div key={i} className="border-b border-border">
              <button
                className="w-full py-6 flex items-start justify-between gap-6 text-left group"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="text-xl md:text-2xl font-display leading-snug group-hover:text-accent transition-colors">
                  {f.q}
                </span>
                <span className={`text-2xl text-accent transition-transform duration-300 ${open === i ? "rotate-45" : ""}`}>
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
                    <p className="pb-6 text-muted-foreground text-[17px] max-w-2xl">{f.a}</p>
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

/* ------------------------------------------------------------------ */
/* CONTACT / CTA                                                         */
/* ------------------------------------------------------------------ */
function Contact() {
  return (
    <section id="contact" className="section-y bg-surface grain relative overflow-hidden">
      <div className="container-x text-center relative">
        <FadeUp>
          <h2 className="display-1 max-w-[16ch] mx-auto">
            Choose something they'll <em className="text-accent">remember</em>.
          </h2>
        </FadeUp>
        <FadeUp delay={0.3}>
          <p className="mt-8 text-xl text-muted-foreground max-w-xl mx-auto">
            Start with a single object. A card, a puzzle, a book. Watch what happens when a child reaches for something warm.
          </p>
        </FadeUp>
        <FadeUp delay={0.5}>
          <div className="mt-12 flex flex-wrap gap-4 justify-center">
            <Link to="/drops">
              <MagneticButton className="ink-btn">Explore the collection →</MagneticButton>
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
