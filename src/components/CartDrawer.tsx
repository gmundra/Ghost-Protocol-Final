import { useCart, formatINR } from "@/store/cart";
import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SignedImage } from "@/components/SignedImage";
import { useQuery } from "@tanstack/react-query";
import { fetchSiteConfig } from "@/lib/queries";

export function CartDrawer() {
  const { isOpen, close, items, remove, setQty, subtotal, clear } = useCart();
  const nav = useNavigate();
  const sub = subtotal();
  const { data: config } = useQuery({ queryKey: ["site_config"], queryFn: fetchSiteConfig });
  const freeShippingEnabled = (config as any)?.free_shipping_enabled ?? true;
  const shippingMessage = (config as any)?.shipping_message ?? "FREE SHIPPING PAN-INDIA";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/70 z-[70]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.aside
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-background border-l border-border z-[71] flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35 }}
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-display text-xl tracking-[0.25em]">YOUR ARSENAL</h2>
              <button onClick={close} aria-label="Close"><X /></button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex items-center justify-center px-8 text-center">
                <div>
                  <div className="font-display text-3xl mb-2">YOUR ARSENAL IS EMPTY.</div>
                  <p className="text-muted-foreground mb-6 tracking-widest text-sm">NOTHING HERE. YET.</p>
                  <button
                    onClick={() => { close(); nav("/drops"); }}
                    className="border border-foreground px-6 py-3 font-display tracking-[0.25em] hover:bg-primary hover:border-primary hover:text-primary-foreground transition-colors"
                  >
                    BROWSE DROPS
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto divide-y divide-border">
                  {items.map((it) => (
                    <div key={it.id} className="flex gap-3 p-4">
                      {it.image && (
                        /^(https?:|data:|blob:)/.test(it.image)
                          ? <img src={it.image} alt={it.name} className="w-20 h-24 object-contain bg-secondary" />
                          : <SignedImage path={it.image} alt={it.name} debugLabel="Cart" className="w-20 h-24 object-contain bg-secondary" />
                      )}
                      <div className="flex-1">
                        <div className="font-display tracking-widest text-sm">{it.name}</div>
                        <div className="text-xs text-muted-foreground tracking-widest mb-2">SIZE: {it.size}</div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setQty(it.id, it.qty - 1)} className="border border-border p-1"><Minus size={12} /></button>
                          <span className="w-6 text-center tabular-nums">{it.qty}</span>
                          <button onClick={() => setQty(it.id, it.qty + 1)} className="border border-border p-1"><Plus size={12} /></button>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display">{formatINR(it.price * it.qty)}</div>
                        <button onClick={() => remove(it.id)} className="text-xs text-muted-foreground hover:text-primary mt-2 tracking-widest">REMOVE</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border p-5 space-y-4">
                  <div className="flex justify-between font-display tracking-widest">
                    <span>SUBTOTAL</span>
                    <span>{formatINR(sub)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground tracking-widest">
                    {freeShippingEnabled ? shippingMessage : "Shipping calculated at checkout."}
                  </p>
                  <button
                    onClick={() => { close(); nav("/checkout"); }}
                    className="w-full bg-primary text-primary-foreground py-4 font-display tracking-[0.25em] hover:bg-foreground hover:text-background transition-colors"
                  >
                    CHECKOUT →
                  </button>
                  <button onClick={clear} className="w-full text-xs text-muted-foreground tracking-widest hover:text-primary">
                    CLEAR ARSENAL
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
