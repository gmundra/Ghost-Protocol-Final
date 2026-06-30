// Ghost Protocol — Footer
// Merged from the live Lovable file with three pending fixes applied:
//   1. Divider: ✕ → ◈ (geometric signal marker — fits the tactical brand language)
//   2. Email: contact@theghostprotocol.in → fits.ghost.protocol@gmail.com, with mailto:
//   3. mt-32 → mt-16 (excessive top margin reduced)
//   4. Added a Configurator nav link (was missing — Drops and Admin were the only links)

const PRODUCTION_EMAIL = "fits.ghost.protocol@gmail.com";

export function Footer() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="overflow-hidden border-b border-border">
        <div className="flex animate-marquee whitespace-nowrap py-6 font-display text-3xl md:text-5xl tracking-[0.2em]">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="px-8">
              MOVE IN SILENCE <span className="text-primary">◈</span> THE GHOST PROTOCOL <span className="text-primary">◈</span>
            </span>
          ))}
        </div>
      </div>
      <div className="px-4 md:px-8 py-12 grid md:grid-cols-3 gap-8 text-sm tracking-wider">
        <div>
          <div className="font-display text-2xl tracking-[0.25em] mb-3">THE GHOST PROTOCOL</div>
          <p className="text-muted-foreground">Jaipur, India. Drops from the underground.</p>
        </div>
        <div>
          <div className="font-display text-xs tracking-[0.3em] text-muted-foreground mb-3">NAVIGATE</div>
          <ul className="space-y-1">
            <li><a href="/drops" className="hover:text-primary">All Drops</a></li>
            <li><a href="/configurator" className="hover:text-primary">Configurator</a></li>
            <li><a href="/admin" className="hover:text-primary">Admin</a></li>
          </ul>
        </div>
        <div>
          <div className="font-display text-xs tracking-[0.3em] text-muted-foreground mb-3">SIGNAL</div>
          <ul className="space-y-1 text-muted-foreground">
            <li>
              <a href={`mailto:${PRODUCTION_EMAIL}`} className="hover:text-primary">{PRODUCTION_EMAIL}</a>
            </li>
            <li>© {new Date().getFullYear()} — ALL RIGHTS WITHHELD.</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
