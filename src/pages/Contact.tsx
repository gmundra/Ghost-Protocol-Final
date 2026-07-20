// Contact page — ported from one-shot-wonder-web/src/routes/contact.tsx
import { useState } from "react";
import { RevealText, FadeUp } from "@/components/motion";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [role, setRole] = useState("");

  return (
    <section className="pt-40 pb-24 bg-background min-h-screen">
      <div className="container-x grid md:grid-cols-12 gap-16">
        <div className="md:col-span-5">
          <div className="eyebrow mb-6">Contact</div>
          <RevealText as="h1" className="display-1 block">
            Let's talk.
          </RevealText>
          <FadeUp delay={0.2}>
            <p className="mt-8 text-lg text-muted-foreground max-w-md">
              For parents, educators, therapists, and schools. Bulk orders, custom kits, or just to say hello — we read every message.
            </p>
          </FadeUp>
          <FadeUp delay={0.3}>
            <div className="mt-12 space-y-4 text-sm">
              <div>
                <div className="eyebrow mb-1">Email</div>
                <a href="mailto:hello@unscreen.co" className="text-lg hover:text-clay">hello@unscreen.co</a>
              </div>
              <div>
                <div className="eyebrow mb-1">Studio</div>
                <div className="text-lg">Bengaluru · London</div>
              </div>
            </div>
          </FadeUp>
        </div>
        <FadeUp delay={0.15} className="md:col-span-7">
          <form
            onSubmit={(e) => { e.preventDefault(); setSent(true); }}
            className="rounded-3xl bg-bone grain p-8 md:p-12 space-y-6"
          >
            {(["Name", "Email", "Organization (optional)"] as const).map((label) => (
              <div key={label}>
                <label className="eyebrow block mb-2">{label}</label>
                <input
                  type={label === "Email" ? "email" : "text"}
                  required={label !== "Organization (optional)"}
                  className="w-full bg-transparent border-b border-ink/20 py-3 outline-none focus:border-clay transition-colors text-lg"
                />
              </div>
            ))}
            <div>
              <label className="eyebrow block mb-2">Message</label>
              <textarea
                required
                rows={5}
                className="w-full bg-transparent border-b border-ink/20 py-3 outline-none focus:border-clay transition-colors text-lg resize-none"
              />
            </div>
            <div>
              <label className="eyebrow block mb-3">I'm a</label>
              <div className="flex flex-wrap gap-2">
                {["Parent", "Educator", "Therapist", "School", "Curious"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`px-4 py-2 rounded-full text-sm border transition ${
                      role === r ? "bg-ink text-paper border-ink" : "border-ink/20 hover:bg-ink hover:text-paper"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" className="ink-btn w-full justify-center !py-4">
              {sent ? "Thank you — we'll be in touch ✓" : "Send message →"}
            </button>
          </form>
        </FadeUp>
      </div>
    </section>
  );
}
