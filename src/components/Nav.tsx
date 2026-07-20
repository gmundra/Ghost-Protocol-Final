import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "backdrop-blur-md bg-background/70 border-b border-border/60" : "bg-transparent"
      }`}
    >
      <div className="container-x flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-lg font-display tracking-tight">
            <span className="text-clay">◐</span> UNSCREEN
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-10 text-sm">
          <Link to="/drops" className="hover:text-clay transition-colors">Collection</Link>
          <Link to="/story" className="hover:text-clay transition-colors">Our Story</Link>
          <a href="/#outcomes" className="hover:text-clay transition-colors">Outcomes</a>
          <Link to="/contact" className="hover:text-clay transition-colors">Contact</Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link to="/cart" className="relative inline-flex items-center text-sm hover:text-clay transition-colors" aria-label="Cart">
            <span className="text-lg">◫</span>
          </Link>
        </div>

        <button
          className="md:hidden p-2 -mr-2"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="block w-6 h-px bg-current mb-1.5" />
          <span className="block w-6 h-px bg-current mb-1.5" />
          <span className="block w-4 h-px bg-current ml-auto" />
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur">
          <div className="container-x py-6 flex flex-col gap-5 text-lg">
            <Link to="/drops">Collection</Link>
            <Link to="/story">Our Story</Link>
            <a href="/#outcomes">Outcomes</a>
            <Link to="/contact">Contact</Link>
            <div className="border-t border-border pt-5">
              <Link to="/cart">Cart</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
