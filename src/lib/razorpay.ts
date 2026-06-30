/** Lazy-load the Razorpay Checkout SDK once. */
let loader: Promise<void> | null = null;

export function loadRazorpay(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).Razorpay) return Promise.resolve();
  if (loader) return loader;

  loader = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loader = null;
      reject(new Error("razorpay_sdk_load_failed"));
    };
    document.body.appendChild(s);
  });

  return loader;
}

export interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayOpenOptions {
  key_id: string;
  amount: number; // in paise
  currency: string;
  razorpay_order_id: string;
  order_number: string;
  customer: { name: string; email: string; phone: string };
  onSuccess: (r: RazorpaySuccess) => void;
  onDismiss?: () => void;
}

export function openRazorpayCheckout(opts: RazorpayOpenOptions) {
  const Razorpay = (window as any).Razorpay;
  if (!Razorpay) throw new Error("razorpay_sdk_not_loaded");

  const rzp = new Razorpay({
    key: opts.key_id,
    amount: opts.amount,
    currency: opts.currency,
    name: "THE GHOST PROTOCOL",
    description: `Order ${opts.order_number}`,
    order_id: opts.razorpay_order_id,
    prefill: {
      name: opts.customer.name,
      email: opts.customer.email,
      contact: opts.customer.phone,
    },
    theme: { color: "#000000" },
    handler: (response: RazorpaySuccess) => opts.onSuccess(response),
    modal: {
      ondismiss: () => opts.onDismiss?.(),
    },
  });

  rzp.on("payment.failed", (resp: any) => {
    console.error("razorpay payment failed", resp?.error);
  });

  rzp.open();
}
