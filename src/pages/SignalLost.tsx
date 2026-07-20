// UNSCREEN — 404 Not Found page
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="pt-16 min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center py-20">
        <p className="font-display text-8xl text-muted-foreground/30 mb-4">404</p>
        <h1 className="font-display text-3xl text-foreground mb-4">Page Not Found</h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          The page you're looking for doesn't exist. Let's get you back to something useful.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3 rounded text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
