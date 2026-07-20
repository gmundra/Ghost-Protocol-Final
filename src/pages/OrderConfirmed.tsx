// UNSCREEN — Order Confirmed page
import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function OrderConfirmed() {
  return (
    <main className="pt-16 min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center py-20">
        <CheckCircle className="mx-auto mb-6 text-primary" size={52} strokeWidth={1.5} />
        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4">
          Order Confirmed!
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          Thank you for your purchase. We'll send a confirmation to your email shortly.
          Your child is going to love this.
        </p>
        <Link
          to="/drops"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3 rounded text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Continue Shopping
        </Link>
      </div>
    </main>
  );
}
