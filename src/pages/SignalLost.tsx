import { Link } from "react-router-dom";
import { GlitchText } from "@/components/GlitchText";

export default function SignalLost() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 text-center">
      <div>
        <div className="text-xs tracking-[0.4em] text-primary mb-4 animate-flicker">// ERROR 404 // SIGNAL TRACE FAILED</div>
        <h1 className="font-display text-[18vw] md:text-[12vw] leading-none mb-6">
          <GlitchText>SIGNAL LOST</GlitchText>
        </h1>
        <p className="text-muted-foreground tracking-[0.2em] mb-10">
          THE PAGE YOU'RE LOOKING FOR HAS GONE DARK.
        </p>
        <Link to="/" className="inline-block border border-foreground px-8 py-4 font-display tracking-[0.25em] hover:bg-primary hover:border-primary hover:text-primary-foreground transition-colors">
          RETURN TO BASE
        </Link>
      </div>
    </div>
  );
}
