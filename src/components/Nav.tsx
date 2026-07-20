import { Link, NavLink, useLocation } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/utils";

export function Nav() {
  const { count, open } = useCart();
  const c = count();
  const loc = useLocation();
  const onAdmin = loc.pathname.startsWith("/admin");

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (onAdmin) return null;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "backdrop-blur-md bg-background/80 border-b border-border/60"
          : "bg-transparent",
      )}
    >
      <div className="container-x flex items-center justify-between h-16 md:h-20">
        {/* Brand wordmark */}
        <Link
          to="/"
          className="font-display text-xl tracking-wide text-foreground hover:text-primary transition-colors"
        >
          <span className="text-accent">◐</span> UNSCREEN
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {[
            { to: "/",      label: "Home" },
            { to: "/drops", label: "Shop" },
          ].map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end
              className={({ isActive }) =>
                cn(
                  "text-muted-foreground hover:text-foreground transition-colors relative pb-0.5",
                  isActive && "text-foreground font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-primary",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Cart + mobile toggle */}
        <div className="flex items-center gap-4">
          <button
            onClick={open}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ShoppingBag size={18} />
            {c > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs">
                {c}
              </span>
            )}
          </button>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 -mr-2"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className="block w-6 h-px bg-foreground mb-1.5" />
            <span className="block w-6 h-px bg-foreground mb-1.5" />
            <span className="block w-4 h-px bg-foreground ml-auto" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur">
          <div className="container-x py-6 flex flex-col gap-5 text-lg">
            <Link to="/" onClick={() => setMobileOpen(false)}>Home</Link>
            <Link to="/drops" onClick={() => setMobileOpen(false)}>Shop</Link>
            <div className="border-t border-border pt-5">
              <button onClick={() => { open(); setMobileOpen(false); }} className="flex items-center gap-2">
                Cart {c > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">{c}</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
