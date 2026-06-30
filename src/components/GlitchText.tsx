import { cn } from "@/lib/utils";

interface Props {
  children: string;
  className?: string;
}

export function GlitchText({ children, className }: Props) {
  return (
    <span
      className={cn("relative inline-block font-display", className)}
      data-text={children}
    >
      <span className="relative z-10">{children}</span>
      <span
        aria-hidden
        className="glitch-layer-1 absolute inset-0 pointer-events-none"
      >
        {children}
      </span>
      <span
        aria-hidden
        className="glitch-layer-2 absolute inset-0 pointer-events-none"
      >
        {children}
      </span>
    </span>
  );
}
