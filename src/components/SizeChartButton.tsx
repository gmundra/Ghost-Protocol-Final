import { useState } from "react";
import { Ruler } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Single reusable "VIEW SIZE CHART" control. Used by the configurator
 * (admin-managed master chart) and by individual product pages (per-drop
 * chart). Renders nothing if no chart URL is available — same as the
 * previous inline implementation this replaces.
 *
 * Sized for an easy tap target (full-height ~44px, generous horizontal
 * padding) rather than the old bare text link, while keeping the same
 * bordered-button language used elsewhere in the admin/configurator UI.
 */
export function SizeChartButton({
  url,
  className = "",
  fullWidth = false,
}: {
  url: string | null | undefined;
  className?: string;
  fullWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!url) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center justify-center gap-2 border border-border hover:border-primary hover:text-primary text-foreground px-6 py-3 text-xs font-display tracking-[0.3em] transition-colors min-h-[44px]",
          fullWidth && "w-full",
          className,
        )}
      >
        <Ruler size={16} />
        VIEW SIZE CHART
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 cursor-zoom-out"
        >
          <img src={url} alt="Size chart" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </>
  );
}
