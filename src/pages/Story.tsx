// Story page — ported from one-shot-wonder-web/src/routes/story.tsx
import { Link } from "react-router-dom";
import { RevealText, FadeUp, Parallax } from "@/components/motion";

export default function Story() {
  return (
    <>
      <section className="pt-40 pb-16 bg-background">
        <div className="container-x max-w-4xl">
          <div className="eyebrow mb-6">Our Story</div>
          <RevealText as="h1" className="display-1 block">
            We started with a question.
          </RevealText>
          <FadeUp delay={0.3}>
            <p className="mt-10 text-2xl leading-relaxed text-muted-foreground">
              What if a child's first thousand hours of attention were spent on something they could hold — instead of something that held them?
            </p>
          </FadeUp>
        </div>
      </section>

      <section className="py-20 bg-bone grain">
        <div className="container-x max-w-3xl space-y-10 text-[19px] leading-relaxed">
          <FadeUp>
            <p>UNSCREEN began in a small studio, with a single wooden puzzle and a stubborn belief: that childhood deserves objects, not interfaces.</p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p>We work with educators, therapists, and — most importantly — children. Every product is tested in the wild: on real dining tables, in real classrooms, at real bedtimes. If it doesn't survive a Tuesday, it doesn't ship.</p>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className="font-display text-3xl md:text-4xl leading-snug text-ink pt-8 border-l-2 border-clay pl-8">
              "The most educational object is often the quietest one in the room."
            </p>
          </FadeUp>
          <FadeUp delay={0.3}>
            <p>We're not anti-screen. We're pro-childhood. There's a difference, and it matters. Screens are extraordinary tools for adults. Children deserve the slower, richer, more tactile version of learning that shaped every generation before ours.</p>
          </FadeUp>
          <FadeUp delay={0.4}>
            <p>Every UNSCREEN piece is designed to be handed down. Not upgraded. Not replaced. Simply loved, worn, and remembered.</p>
          </FadeUp>
        </div>
      </section>

      <section className="section-y bg-background relative overflow-hidden">
        <Parallax offset={60} className="absolute right-0 top-10 text-[20rem] font-display text-clay/10 pointer-events-none select-none">
          ❦
        </Parallax>
        <div className="container-x text-center relative">
          <RevealText as="h2" className="display-2 block max-w-[18ch] mx-auto">
            Come see what we've made.
          </RevealText>
          <div className="mt-10">
            <Link to="/drops" className="ink-btn">Explore the collection →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
