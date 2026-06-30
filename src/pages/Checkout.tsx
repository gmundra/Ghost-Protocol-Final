import { useCart, formatINR } from "@/store/cart";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { loadRazorpay, openRazorpayCheckout } from "@/lib/razorpay";
import { fetchSiteConfig } from "@/lib/queries";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(20),
  line1: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(80),
  pincode: z.string().trim().min(4).max(10),
});

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { data: config } = useQuery({ queryKey: ["site_config"], queryFn: fetchSiteConfig });
  const [form, setForm] = useState({ name: "", email: "", phone: "", line1: "", city: "", state: "", pincode: "" });
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const sub = subtotal();
  const freeShippingEnabled = (config as any)?.free_shipping_enabled ?? true;
  const shippingMessage = (config as any)?.shipping_message ?? "FREE SHIPPING PAN-INDIA";
  const shipping = freeShippingEnabled ? 0 : 15000;
  const total = sub + shipping;

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return toast.error("YOUR ARSENAL IS EMPTY.");
    const r = schema.safeParse(form);
    if (!r.success) return toast.error("CHECK YOUR DETAILS.");
    setLoading(true);

    try {
      // 1. Create internal order + Razorpay order on the server.
      //    (The server recomputes subtotal/shipping/total from authoritative
      //    drop prices / configurator pricing — these client-side values are
      //    sent for reference/logging only and are never trusted for charging.)
      const { data: created, error: createErr } = await supabase.functions.invoke("razorpay-create-order", {
        body: {
          customer: { name: r.data.name, email: r.data.email, phone: r.data.phone },
          shipping_address: { line1: r.data.line1, city: r.data.city, state: r.data.state, pincode: r.data.pincode },
          items: items as any,
          subtotal: sub,
          shipping,
          total,
        },
      });
      if (createErr || !created || created.error) {
        console.error("create-order failed", createErr ?? created?.error);
        setLoading(false);
        return toast.error("ORDER FAILED. TRY AGAIN.");
      }

      // 2. Load Razorpay SDK on demand.
      await loadRazorpay();

      // 3. Open the Razorpay Checkout modal.
      openRazorpayCheckout({
        key_id: created.key_id,
        amount: created.amount,
        currency: created.currency,
        razorpay_order_id: created.razorpay_order_id,
        order_number: created.order_number,
        customer: { name: r.data.name, email: r.data.email, phone: r.data.phone },
        onDismiss: () => {
          setLoading(false);
          toast.error("PAYMENT CANCELLED.");
        },
        onSuccess: async (resp) => {
          // 4. Verify signature + finalize the order server-side.
          const { data: verified, error: verErr } = await supabase.functions.invoke("razorpay-verify-payment", {
            body: {
              order_id: created.order_id,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            },
          });
          setLoading(false);
          if (verErr || !verified || verified.error) {
            console.error("verify failed", verErr ?? verified?.error);
            return toast.error("PAYMENT VERIFICATION FAILED. CONTACT SUPPORT.");
          }
          clear();
          toast.success("ORDER CONFIRMED.");
          nav(`/order-confirmed/${verified.order_number}`);
        },
      });
    } catch (err) {
      console.error("checkout error", err);
      setLoading(false);
      toast.error("ORDER FAILED. TRY AGAIN.");
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-center px-4">
        <div>
          <h1 className="font-display text-6xl mb-4">YOUR ARSENAL IS EMPTY.</h1>
          <a href="/drops" className="inline-block border border-foreground px-6 py-3 font-display tracking-[0.25em] hover:bg-primary hover:border-primary hover:text-primary-foreground transition-colors">BROWSE DROPS</a>
        </div>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 min-h-screen">
      <div className="px-6 md:px-12 py-12">
        <h1 className="font-display text-5xl md:text-6xl mb-2">CHECKOUT</h1>
        <p className="text-xs tracking-[0.3em] text-muted-foreground mb-10">// FINALIZE TRANSMISSION</p>
        <form onSubmit={submit} className="space-y-4">
          {([
            ["name", "FULL NAME"],
            ["email", "EMAIL"],
            ["phone", "PHONE"],
            ["line1", "ADDRESS LINE"],
            ["city", "CITY"],
            ["state", "STATE"],
            ["pincode", "PINCODE"],
          ] as const).map(([k, label]) => (
            <div key={k}>
              <label className="text-xs tracking-[0.3em] text-muted-foreground">{label}</label>
              <input
                value={(form as any)[k]}
                onChange={(e) => update(k, e.target.value)}
                required
                className="w-full bg-transparent border border-border px-4 py-3 tracking-widest focus:outline-none focus:border-primary"
              />
            </div>
          ))}
          <button
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-5 font-display tracking-[0.25em] text-lg hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
          >
            {loading ? "TRANSMITTING..." : `PLACE ORDER · ${formatINR(total)}`}
          </button>
        </form>
      </div>
      <div className="bg-secondary px-6 md:px-12 py-12">
        <h2 className="font-display text-2xl tracking-widest mb-6">YOUR ARSENAL</h2>
        <div className="space-y-3 divide-y divide-border">
          {items.map((it) => (
            <div key={it.id} className="flex gap-3 pt-3 first:pt-0">
              {it.image && <img src={it.image} className="w-16 h-20 object-cover grayscale" />}
              <div className="flex-1">
                <div className="font-display tracking-widest text-sm">{it.name}</div>
                <div className="text-xs text-muted-foreground tracking-widest">SIZE {it.size} × {it.qty}</div>
              </div>
              <div className="font-display">{formatINR(it.price * it.qty)}</div>
            </div>
          ))}
        </div>
        <div className="mt-8 pt-6 border-t border-border space-y-2 text-sm tracking-widest">
          <div className="flex justify-between"><span>SUBTOTAL</span><span>{formatINR(sub)}</span></div>
          <div className="flex justify-between"><span>SHIPPING</span><span>{shipping === 0 ? shippingMessage : formatINR(shipping)}</span></div>
          <div className="flex justify-between font-display text-xl pt-3 border-t border-border"><span>TOTAL</span><span>{formatINR(total)}</span></div>
        </div>
      </div>
    </div>
  );
}
