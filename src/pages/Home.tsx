// UNSCREEN — Homepage
// Migrated from Ghost Protocol. Architecture preserved (React, Supabase hooks, TanStack).
// Brand, copy, and layout sections fully adapted to UNSCREEN editorial style.

import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Puzzle, Palette, Brain, Heart, MessageCircle } from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { label: "Board Games",        slug: "board-games",        emoji: "♟️" },
  { label: "Wooden Toys",        slug: "wooden-toys",        emoji: "🪵" },
  { label: "Flash Cards",        slug: "flash-cards",        emoji: "🃏" },
  { label: "DIY Kits",           slug: "diy-kits",           emoji: "🎨" },
  { label: "Books",              slug: "books",              emoji: "📚" },
  { label: "Conversation Cards", slug: "conversation-cards", emoji: "💬" },
];

const OUTCOMES = [
  { icon: Brain,         label: "Critical Thinking",     desc: "Puzzles and games that build problem-solving skills." },
  { icon: Palette,       label: "Creativity",             desc: "Open-ended kits that let imagination lead." },
  { icon: MessageCircle, label: "Communication",          desc: "Conversation cards that spark meaningful dialogue." },
  { icon: Heart,         label: "Emotional Intelligence", desc: "Stories and play that build empathy and self-awareness." },
  { icon: Puzzle,        label: "Cognitive Growth",       desc: "Age-matched challenges for developing minds." },
  { icon: BookOpen,      label: "Language Development",   desc: "Reading, phonics, and storytelling tools." },
];

const AUDIENCES = [
  { label: "Parents",            desc: "Screen-free activities for home.",      slug: "parents" },
  { label: "Teachers",           desc: "Classroom-ready educational kits.",     slug: "teachers" },
  { label: "Schools",            desc: "Bulk resources for institutions.",      slug: "schools" },
  { label: "Therapists",         desc: "Tools for developmental support.",      slug: "therapists" },
  { label: "Gift Buyers",        desc: "Gifts that actually teach something.",  slug: "gifts" },
  { label: "Homeschool Families",desc: "Complete curriculum companions.",       slug: "homeschool" },
];

const STATS = [
  { value: "8+ hrs", label: "average daily screen time in children under 12" },
  { value: "3×",     label: "better retention through hands-on play vs passive screen time" },
  { value: "94%",    label: "of parents want more screen-free learning options" },
  { value: "100+",   label: "curated educational products across all age groups" },
];

const TESTIMONIALS = [
  {
    quote: "My daughter spent an entire afternoon with the DIY kit — no phone, no tablet. Pure joy.",
    author: "Priya S.",
    role: "Parent, Bengaluru",
  },
  {
    quote: "We use the conversation cards every Friday in class. The discussions are incredible.",
    author: "Ananya R.",
    role: "Primary School Teacher, Delhi",
  },
  {
    quote: "Finally, a brand that understands what intentional play actually means.",
    author: "Dr. Meera V.",
    role: "Child Development Therapist",
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <main className="pt-16">

      {/* ── 1. Editorial Hero ───────────────────────────────────────────── */}
      <section className="min-h-[88vh] flex flex-col justify-center px-6 md:px-16 bg-background">
        <div className="max-w-3xl animate-fade-up">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-primary mb-6">
            Premium Educational Play
          </p>
          <h1 className="font-display text-5xl md:text-7xl text-foreground leading-tight mb-8">
            Less Screen.<br />More World.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-xl">
            UNSCREEN curates thoughtfully designed toys, games, and learning kits
            that help children grow — through play, creativity, conversation, and
            imagination.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link
              to="/drops"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3 rounded text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Shop All Products <ArrowRight size={16} />
            </Link>
            <Link
              to="/drops?cat=bundles"
              className="inline-flex items-center gap-2 border border-border text-foreground px-7 py-3 rounded text-sm font-medium hover:bg-surface transition-colors"
            >
              View Bundles
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. Brand Mission ────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-16 bg-surface border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-primary mb-5">Our Mission</p>
          <h2 className="font-display text-3xl md:text-5xl text-foreground mb-6">
            Intentional childhood, beautifully designed.
          </h2>
          <p className="text-muted-foreground leading-relaxed text-lg">
            We are not anti-technology. We believe children deserve both — the best
            of digital, and the irreplaceable richness of physical play. UNSCREEN
            creates the alternatives that make choosing easier.
          </p>
        </div>
      </section>

      {/* ── 3. Featured Categories ──────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-16 border-t border-border">
        <h2 className="font-display text-2xl md:text-4xl text-foreground mb-10">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              to={`/drops?cat=${cat.slug}`}
              className="group bg-surface border border-border rounded p-6 hover:border-primary transition-colors flex flex-col gap-3"
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="font-display text-lg text-foreground group-hover:text-primary transition-colors">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 4. Learning Outcomes ────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-16 bg-surface border-t border-border">
        <h2 className="font-display text-2xl md:text-4xl text-foreground mb-3">What Children Learn</h2>
        <p className="text-muted-foreground mb-10 text-sm">
          Every UNSCREEN product is mapped to measurable learning outcomes.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {OUTCOMES.map((o) => (
            <div key={o.label} className="bg-background border border-border rounded p-6">
              <o.icon className="text-primary mb-4" size={22} />
              <h3 className="font-display text-xl text-foreground mb-2">{o.label}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{o.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. Shop by Audience ─────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-16 border-t border-border">
        <h2 className="font-display text-2xl md:text-4xl text-foreground mb-10">Shop by Who You Are</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {AUDIENCES.map((a) => (
            <Link
              key={a.slug}
              to={`/drops?for=${a.slug}`}
              className="group border border-border rounded p-6 hover:bg-surface hover:border-primary transition-all"
            >
              <div className="font-display text-lg text-foreground group-hover:text-primary mb-1 transition-colors">
                {a.label}
              </div>
              <div className="text-muted-foreground text-sm">{a.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 6. Educational Statistics ───────────────────────────────────── */}
      <section className="py-20 px-6 md:px-16 border-t border-border"
        style={{ backgroundColor: "#6B7A4F", color: "#F7F4ED" }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="font-display text-4xl md:text-6xl mb-2" style={{ color: "#F7F4ED" }}>
                {s.value}
              </div>
              <div className="text-sm leading-snug" style={{ color: "rgba(247,244,237,0.75)" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. Testimonials ─────────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-16 border-t border-border">
        <h2 className="font-display text-2xl md:text-4xl text-foreground mb-10">What People Say</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.author} className="bg-surface border border-border rounded p-7">
              <p className="text-foreground leading-relaxed mb-5 italic">"{t.quote}"</p>
              <div className="text-sm font-semibold text-foreground">{t.author}</div>
              <div className="text-xs text-muted-foreground">{t.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 8. Newsletter ───────────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-16 bg-surface border-t border-border">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="font-display text-2xl md:text-4xl text-foreground mb-4">Stay in the Loop</h2>
          <p className="text-muted-foreground mb-8 text-sm">
            New arrivals, learning guides, and educator resources — delivered to your inbox.
          </p>
          <form className="flex gap-3" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 rounded border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="bg-primary text-primary-foreground px-6 py-3 rounded text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

    </main>
  );
}
