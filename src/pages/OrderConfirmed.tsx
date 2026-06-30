import { useParams, Link } from "react-router-dom";
import { GlitchText } from "@/components/GlitchText";

export default function OrderConfirmed() {
  const { order } = useParams();
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 text-center">
      <div>
        <div className="text-xs tracking-[0.4em] text-primary mb-4 animate-flicker">// TRANSMISSION COMPLETE</div>
        <h1 className="font-display text-7xl md:text-9xl mb-6"><GlitchText>ORDER CONFIRMED.</GlitchText></h1>
        <p className="text-muted-foreground tracking-[0.3em] mb-2">REFERENCE</p>
        <p className="font-display text-2xl mb-10">{order}</p>
        <p className="text-muted-foreground tracking-widest max-w-md mx-auto mb-10">
          Check your inbox for tracking. The signal will reach you in 5–7 days.
        </p>
        <Link to="/drops" className="inline-block border border-foreground px-8 py-4 font-display tracking-[0.25em] hover:bg-primary hover:border-primary hover:text-primary-foreground transition-colors">
          CONTINUE BROWSING
        </Link>
      </div>
    </div>
  );
}
