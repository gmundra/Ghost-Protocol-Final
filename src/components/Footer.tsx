// UNSCREEN — Footer
// Warm ivory editorial footer. Earth tones, no neon.

const BRAND_EMAIL = "hello@unscreen.in";

export function Footer() {
  return (
    <footer className="border-t border-border mt-16 bg-surface">
      {/* Scrolling brand tagline */}
      <div className="overflow-hidden border-b border-border">
        <div className="flex animate-marquee whitespace-nowrap py-5 font-display text-2xl md:text-4xl tracking-wide text-muted-foreground">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="px-10">
              Learn Through Play{" "}
              <span className="text-primary">◆</span>{" "}
              UNSCREEN{" "}
              <span className="text-accent">◆</span>{" "}
            </span>
          ))}
        </div>
      </div>

      {/* Footer columns */}
      <div className="px-4 md:px-10 py-14 grid md:grid-cols-4 gap-10 text-sm">
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="font-display text-xl tracking-wide mb-3">UNSCREEN</div>
          <p className="text-muted-foreground leading-relaxed">
            Helping children spend less time on screens and more time learning
            through play, creativity, and imagination.
          </p>
        </div>

        {/* Shop */}
        <div>
          <div className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-4">Shop</div>
          <ul className="space-y-2 text-muted-foreground">
            {[
              ["Board Games", "/drops?cat=board-games"],
              ["Wooden Toys",  "/drops?cat=wooden-toys"],
              ["Flash Cards",  "/drops?cat=flash-cards"],
              ["DIY Kits",     "/drops?cat=diy-kits"],
              ["Books",        "/drops?cat=books"],
            ].map(([label, href]) => (
              <li key={label}>
                <a href={href} className="hover:text-foreground transition-colors">{label}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* For */}
        <div>
          <div className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-4">For</div>
          <ul className="space-y-2 text-muted-foreground">
            {[
              ["Parents",          "/drops?for=parents"],
              ["Teachers",         "/drops?for=teachers"],
              ["Schools",          "/drops?for=schools"],
              ["Therapists",       "/drops?for=therapists"],
              ["Gift Buyers",      "/drops?for=gifts"],
            ].map(([label, href]) => (
              <li key={label}>
                <a href={href} className="hover:text-foreground transition-colors">{label}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <div className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-4">Contact</div>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <a href={`mailto:${BRAND_EMAIL}`} className="hover:text-foreground transition-colors">
                {BRAND_EMAIL}
              </a>
            </li>
            <li>
              <a href="/admin" className="hover:text-foreground transition-colors">Admin</a>
            </li>
            <li className="pt-2">
              © {new Date().getFullYear()} UNSCREEN. All rights reserved.
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
