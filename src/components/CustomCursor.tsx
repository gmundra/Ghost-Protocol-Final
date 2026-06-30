import { useEffect, useRef } from "react";
import { useIsMobile } from "@/lib/useMobile";

export function CustomCursor() {
  const isMobile = useIsMobile();
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMobile) return;
    document.body.classList.add("has-custom-cursor");
    let rx = 0, ry = 0, x = 0, y = 0;
    const move = (e: MouseEvent) => {
      x = e.clientX; y = e.clientY;
      if (dot.current) {
        dot.current.style.transform = `translate(${x}px,${y}px)`;
      }
    };
    const tick = () => {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      if (ring.current) ring.current.style.transform = `translate(${rx}px,${ry}px)`;
      raf = requestAnimationFrame(tick);
    };
    let raf = requestAnimationFrame(tick);
    window.addEventListener("mousemove", move);
    return () => {
      document.body.classList.remove("has-custom-cursor");
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, [isMobile]);

  if (isMobile) return null;
  return (
    <>
      <div
        ref={dot}
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-primary pointer-events-none z-[100] -ml-[3px] -mt-[3px]"
        aria-hidden
      />
      <div
        ref={ring}
        className="fixed top-0 left-0 w-8 h-8 border border-primary/60 pointer-events-none z-[100] -ml-4 -mt-4"
        aria-hidden
      />
    </>
  );
}
