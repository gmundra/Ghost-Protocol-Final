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
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 md:px-8 h-14">
        <Link to="/" className="font-display text-xl tracking-[0.25em] hover:text-primary transition-colors">
          THE GHOST PROTOCOL
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm tracking-[0.25em] font-display">
          {[
            { to: "/", label: "HOME" },
            { to: "/drops", label: "DROPS" },
            { to: "/configurator", label: "FABRICATE" },
          ].map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end
              className={({ isActive }) =>
                cn(
                  "hover:text-primary transition-colors",
                  isActive && "text-primary",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={open}
          className="flex items-center gap-2 font-display tracking-widest text-sm hover:text-primary transition-colors"
        >
          <ShoppingBag size={18} />
          <span className="tabular-nums">[{String(c).padStart(2, "0")}]</span>
        </button>
      </div>
    </header>
  );
}
