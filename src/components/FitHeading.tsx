import { useLayoutEffect, useRef, useState } from "react";

/**
 * Wraps a single heading-like child, measures its natural (unscaled,
 * single-line) width, and applies a uniform CSS transform: scale just
 * large enough to fit the available container width — never more
 * shrinkage than that, and never any wrapping.
 *
 * Why this exists: a static vw-based font-size (e.g. text-[18vw]) can wrap
 * at some viewport width or some custom admin-set headline length. The
 * moment it wraps, any absolutely-positioned overlay (GlitchText's glitch
 * layers, in this case) misaligns with the now-multi-line bounding box.
 *
 * This sidesteps the problem at its root instead of guessing a "safe"
 * font-size: the child must set `whitespace-nowrap` itself (so it never
 * wraps in the first place, full stop) — this component only adds the
 * scale-down-to-fit on top, scaling the whole child element including
 * any absolutely-positioned descendants uniformly as one unit.
 *
 * The child's own classes (font, size, color, the GlitchText call itself)
 * are entirely up to the caller — nothing here changes them.
 */
export function FitHeading({ children }: { children: React.ReactElement }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    const fit = () => {
      inner.style.transform = "scale(1)";
      const containerWidth = container.clientWidth;
      const naturalWidth = inner.scrollWidth;
      if (!containerWidth || !naturalWidth) return;
      const next = naturalWidth > containerWidth ? containerWidth / naturalWidth : 1;
      setScale(Math.min(1, next));
    };

    fit();

    const ro = new ResizeObserver(fit);
    ro.observe(container);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [children]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden flex justify-center">
      <div
        ref={innerRef}
        style={{ transform: `scale(${scale})`, transformOrigin: "center top", display: "inline-block" }}
      >
        {children}
      </div>
    </div>
  );
}
