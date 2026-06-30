import { useEffect, useRef } from "react";

export function GrainOverlay() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let last = 0;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (t: number) => {
      if (t - last > 70) {
        const { width, height } = canvas;
        const image = ctx.createImageData(width, height);
        const buf = image.data;
        for (let i = 0; i < buf.length; i += 4) {
          const v = (Math.random() * 255) | 0;
          buf[i] = buf[i + 1] = buf[i + 2] = v;
          buf[i + 3] = 18;
        }
        ctx.putImageData(image, 0, 0);
        last = t;
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="fixed inset-0 z-[60] pointer-events-none mix-blend-overlay opacity-40"
      aria-hidden
    />
  );
}
