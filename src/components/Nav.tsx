import { Link, NavLink, useLocation } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/utils";

export function Nav() {
  const { count, open } = useCart();
  const c = count();
  const loc = useLocation();
  const onAdmin = loc.pathname.startsWith("/admin");
  if (onAdmin) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 md:px-10 h-16">
        {/* Brand wordmark */}
        <Link
          to="/"
          className="font-display text-xl tracking-wide text-foreground hover:text-primary transition-colors"
        >
          UNSCREEN
        </Link>

        {/* Primary navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {[
            { to: "/",     label: "Home" },
            { to: "/drops", label: "Shop" },
          ].map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end
              className={({ isActive }) =>
                cn(
                  "text-muted-foreground hover:text-foreground transition-colors",
                  isActive && "text-foreground font-semibold",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Cart */}
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
      </div>
    </header>
  );
}
