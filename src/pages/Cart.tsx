// Cart page — ported from one-shot-wonder-web/src/routes/cart.tsx
// Using simple local state cart (no CartContext dependency)
import { Link, useNavigate } from "react-router-dom";

export default function Cart() {
  // Placeholder empty state — real cart integration can be wired later
  const items: any[] = [];
  const subtotalInr = 0;
  const navigate = useNavigate();
  const shipping = subtotalInr === 0 ? 0 : subtotalInr >= 2000 ? 0 : 99;
  const total = subtotalInr + shipping;

  if (items.length === 0) {
    return (
      <section className="min-h-screen pt-32 pb-24 bg-background">
        <div className="container-x max-w-2xl text-center">
          <div className="eyebrow mb-4">Cart</div>
          <h1 className="display-2 mb-6">Nothing chosen yet.</h1>
          <p className="text-muted-foreground">Every object here is made to hold a childhood. Start with one.</p>
          <Link to="/drops" className="ink-btn mt-10 inline-flex">Browse the collection →</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-32 pb-24 bg-background">
      <div className="container-x max-w-5xl">
        <div className="eyebrow mb-4">Cart</div>
        <h1 className="display-2 mb-12">Ready when you are.</h1>

        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 divide-y divide-border border border-border rounded-3xl overflow-hidden">
            {items.map((i) => (
              <div key={i.product_id} className="p-6 flex items-center gap-6 bg-background">
                <div
                  className="w-20 h-20 rounded-2xl grain flex items-center justify-center text-4xl font-display shrink-0"
                  style={{
                    background: `linear-gradient(150deg, ${i.palette_from ?? "#e6d5b8"}, ${i.palette_to ?? "#b45a3c"})`,
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  {i.glyph ?? "◐"}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/drop/${i.slug}`} className="font-display text-xl hover:text-clay">
                    {i.title}
                  </Link>
                  <div className="text-sm text-muted-foreground mt-1">
                    ₹{i.unit_price_inr?.toLocaleString("en-IN")} each
                  </div>
                </div>
                <div className="text-right font-display text-lg shrink-0">
                  ₹{(i.unit_price_inr * i.qty)?.toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>

          <aside className="rounded-3xl border border-border p-6 h-fit bg-bone grain">
            <h2 className="text-lg font-display mb-4">Order summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>₹{subtotalInr.toLocaleString("en-IN")}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd>{shipping === 0 ? "Free" : `₹${shipping}`}</dd>
              </div>
              <div className="border-t border-border pt-3 mt-3 flex justify-between text-base font-display">
                <dt>Total</dt>
                <dd>₹{total.toLocaleString("en-IN")}</dd>
              </div>
            </dl>
            <button
              onClick={() => navigate("/checkout")}
              className="ink-btn w-full mt-6 !py-3"
            >
              Checkout →
            </button>
            <div className="text-xs text-muted-foreground mt-4 text-center">
              Free shipping on orders over ₹2,000.
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
