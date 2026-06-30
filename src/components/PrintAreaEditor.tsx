import { useEffect, useRef, useState } from "react";
import { signedUrl } from "@/lib/storage";

export interface PrintArea {
  print_area_x: number;
  print_area_y: number;
  print_area_width: number;
  print_area_height: number;
}

const MIN_SIZE = 8; // smallest allowed width/height, in % of the image

/**
 * Visual editor for a garment's print-area rectangle. Renders the actual
 * garment image (signed, same as the customer-facing configurator uses)
 * with a red overlay box positioned/sized from the four print_area_*
 * values. Drag the box to move it; drag the bottom-right handle to
 * resize it. Numeric fields stay in sync for precise entry.
 */
export function PrintAreaEditor({
  imagePath,
  value,
  onChange,
}: {
  imagePath: string | null;
  value: PrintArea;
  onChange: (next: PrintArea) => void;
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    mode: "move" | "resize";
    startX: number;
    startY: number;
    orig: PrintArea;
  } | null>(null);

  useEffect(() => {
    let live = true;
    if (!imagePath) { setImgUrl(null); return; }
    signedUrl(imagePath).then((u) => { if (live) setImgUrl(u); });
    return () => { live = false; };
  }, [imagePath]);

  function clamp(next: PrintArea): PrintArea {
    let { print_area_x: x, print_area_y: y, print_area_width: w, print_area_height: h } = next;
    // Round first — drag deltas are fractional (derived from pixel
    // positions), but the database column is `integer`. Rounding here,
    // before clamping, keeps every consumer (drag, resize, and the
    // number inputs) consistently whole-number, matching what's actually
    // persisted and what the inputs display.
    w = Math.round(Math.max(MIN_SIZE, Math.min(100, w)));
    h = Math.round(Math.max(MIN_SIZE, Math.min(100, h)));
    x = Math.round(Math.max(0, Math.min(100 - w, x)));
    y = Math.round(Math.max(0, Math.min(100 - h, y)));
    return { print_area_x: x, print_area_y: y, print_area_width: w, print_area_height: h };
  }

  function onMoveDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragState.current = { mode: "move", startX: e.clientX, startY: e.clientY, orig: value };
  }

  function onResizeDown(e: React.PointerEvent) {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    dragState.current = { mode: "resize", startX: e.clientX, startY: e.clientY, orig: value };
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragState.current;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!drag || !rect) return;
    const dxPct = ((e.clientX - drag.startX) / rect.width) * 100;
    const dyPct = ((e.clientY - drag.startY) / rect.height) * 100;

    if (drag.mode === "move") {
      onChange(
        clamp({
          ...drag.orig,
          print_area_x: drag.orig.print_area_x + dxPct,
          print_area_y: drag.orig.print_area_y + dyPct,
        }),
      );
    } else {
      onChange(
        clamp({
          ...drag.orig,
          print_area_width: drag.orig.print_area_width + dxPct,
          print_area_height: drag.orig.print_area_height + dyPct,
        }),
      );
    }
  }

  function onPointerUp() {
    dragState.current = null;
  }

  function numberField(key: keyof PrintArea, label: string) {
    return (
      <div>
        <label className="text-[10px] tracking-[0.3em] text-muted-foreground">{label}</label>
        <input
          type="number"
          min={key === "print_area_width" || key === "print_area_height" ? MIN_SIZE : 0}
          max={100}
          value={Math.round(value[key])}
          onChange={(e) => onChange(clamp({ ...value, [key]: Number(e.target.value) }))}
          className="w-full bg-transparent border border-border px-2 py-1.5 text-sm tracking-widest focus:outline-none focus:border-primary"
        />
      </div>
    );
  }

  return (
    <div className="col-span-2">
      <label className="text-xs tracking-[0.3em] text-muted-foreground">PRINT AREA</label>
      <div
        ref={stageRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative w-full aspect-[4/5] max-w-[320px] bg-secondary border border-border mt-1 overflow-hidden select-none"
      >
        {imgUrl ? (
          <img src={imgUrl} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] tracking-[0.3em] text-muted-foreground">
            UPLOAD A FRONT PREVIEW TO POSITION THE PRINT AREA
          </div>
        )}
        <div
          onPointerDown={onMoveDown}
          className="absolute border-2 border-primary bg-primary/10 cursor-move"
          style={{
            left: `${value.print_area_x}%`,
            top: `${value.print_area_y}%`,
            width: `${value.print_area_width}%`,
            height: `${value.print_area_height}%`,
          }}
        >
          <div className="absolute -top-4 left-0 text-[8px] tracking-[0.3em] text-primary whitespace-nowrap">
            PRINT ZONE
          </div>
          <div
            onPointerDown={onResizeDown}
            className="absolute bottom-0 right-0 w-3 h-3 bg-primary cursor-nwse-resize translate-x-1/2 translate-y-1/2"
          />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-2">
        {numberField("print_area_x", "X %")}
        {numberField("print_area_y", "Y %")}
        {numberField("print_area_width", "W %")}
        {numberField("print_area_height", "H %")}
      </div>
      <p className="text-[9px] tracking-[0.3em] text-muted-foreground/60 mt-2">
        // DRAG BOX TO MOVE · DRAG CORNER TO RESIZE · OR TYPE EXACT VALUES
      </p>
    </div>
  );
}
