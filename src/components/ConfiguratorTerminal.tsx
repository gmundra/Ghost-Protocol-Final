import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, RotateCw, Trash2, Plus, Minus } from "lucide-react";
import { useCart } from "@/store/cart";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { uploadToMedia, dataUrlToBlob, signedUrl } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { SizeChartButton } from "@/components/SizeChartButton";

type TeeColor = { id: string; name: string; hex: string; fabric: string };

const TEE_COLORS: TeeColor[] = [
  { id: "void", name: "VOID BLACK", hex: "#0a0a0a", fabric: "#161616" },
  { id: "ash", name: "ASH GREY", hex: "#3a3a3a", fabric: "#4a4a4a" },
  { id: "bone", name: "BONE WHITE", hex: "#ebe7df", fabric: "#d8d3c9" },
  { id: "blood", name: "BLOOD RED", hex: "#5a0d0d", fabric: "#7a1414" },
  { id: "olive", name: "TACTICAL OLIVE", hex: "#2e3322", fabric: "#3d4530" },
];

const SIZES = ["S", "M", "L", "XL", "XXL"];

type GarmentAsset = {
  id: string;
  garment_name: string;
  garment_color: string;
  color_hex: string | null;
  front_preview_url: string | null;
  back_preview_url: string | null;
  active_status: boolean;
  sort_order: number;
  print_area_x: number;
  print_area_y: number;
  print_area_width: number;
  print_area_height: number;
  base_price: number;
  artwork_fee: number;
  total_display_price: number;
};

// Matches the values that were previously hardcoded inline
// (top:26% left:30% right:30% bottom:32% → x:30 y:26 w:40 h:42).
// Used for the SVG-fallback case (no matching admin asset).
const DEFAULT_PRINT_AREA = { x: 30, y: 26, width: 40, height: 42 };

// Matches the prices that were previously hardcoded inline (₹2499 base,
// ₹600 artwork fee). Used only when no admin asset matches the selected
// color — same fallback pattern as DEFAULT_PRINT_AREA above.
const DEFAULT_PRICING = { basePaise: 249900, artworkFeePaise: 60000 };

type Artwork = {
  url: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  naturalW: number;
  naturalH: number;
};

// ── Print-area enforcement helpers ──────────────────────────────────────────
// The print zone is the dashed/solid red box in the canvas. Artwork's
// rendered bounding box (after the 70%-max-width CSS rule, the current
// scale, and the current rotation) must never exceed that box. All three
// gestures — drag, scale, rotate — funnel through the same clamp logic
// below so the invariant holds no matter which one changed.

const MAX_ART_SCALE = 2.5;
const MIN_ART_SCALE = 0.2;
const PRINT_ZONE_MAX_WIDTH_RATIO = 0.7; // mirrors the inline `maxWidth: "70%"` style on the art <img>

function getBaseArtSize(art: Artwork, printW: number) {
  if (!art.naturalW || !art.naturalH || !printW) return { baseW: 0, baseH: 0 };
  const baseW = Math.min(art.naturalW, printW * PRINT_ZONE_MAX_WIDTH_RATIO);
  const baseH = art.naturalH * (baseW / art.naturalW);
  return { baseW, baseH };
}

function getRotatedBBox(w: number, h: number, rotationDeg: number) {
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  return { w: w * cos + h * sin, h: w * sin + h * cos };
}

/** Largest scale at which the artwork's rotated bounding box still fits inside the print zone. */
function getMaxScaleForBounds(art: Artwork, printW: number, printH: number): number {
  if (!printW || !printH) return MAX_ART_SCALE;
  const { baseW, baseH } = getBaseArtSize(art, printW);
  if (!baseW || !baseH) return MAX_ART_SCALE;
  const bbox = getRotatedBBox(baseW, baseH, art.rotation);
  if (!bbox.w || !bbox.h) return MAX_ART_SCALE;
  const maxByWidth = printW / bbox.w;
  const maxByHeight = printH / bbox.h;
  return Math.max(MIN_ART_SCALE, Math.min(maxByWidth, maxByHeight, MAX_ART_SCALE));
}

/** Clamp a candidate x/y (0-100, center-based) so the artwork's bounding box never exits the print zone. */
function clampArtPosition(art: Artwork, printW: number, printH: number, x: number, y: number) {
  if (!printW || !printH) {
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  }
  const { baseW, baseH } = getBaseArtSize(art, printW);
  const bbox = getRotatedBBox(baseW * art.scale, baseH * art.scale, art.rotation);
  const halfWPct = Math.min(50, (bbox.w / printW) * 50);
  const halfHPct = Math.min(50, (bbox.h / printH) * 50);
  return {
    x: Math.max(halfWPct, Math.min(100 - halfWPct, x)),
    y: Math.max(halfHPct, Math.min(100 - halfHPct, y)),
  };
}

/**
 * Apply a patch (from drag, scale buttons, rotate buttons, or wheel) and
 * re-clamp scale THEN position together, so the artwork can never end up
 * outside the print zone regardless of which property just changed.
 */
function clampArtwork(art: Artwork, patch: Partial<Artwork>, printW: number, printH: number): Artwork {
  const next: Artwork = { ...art, ...patch };
  const maxScale = getMaxScaleForBounds(next, printW, printH);
  next.scale = Math.max(MIN_ART_SCALE, Math.min(maxScale, next.scale));
  const pos = clampArtPosition(next, printW, printH, next.x, next.y);
  next.x = pos.x;
  next.y = pos.y;
  return next;
}

export function ConfiguratorTerminal({ compact = false }: { compact?: boolean }) {
  const [colors, setColors] = useState<TeeColor[]>(TEE_COLORS);
  const [sizes, setSizes] = useState<string[]>(SIZES);
  const [color, setColor] = useState<TeeColor>(TEE_COLORS[0]);
  const [size, setSize] = useState("M");
  const [sizeChart, setSizeChart] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [art, setArt] = useState<Artwork | null>(null);
  const [assets, setAssets] = useState<GarmentAsset[]>([]);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const add = useCart((s) => s.add);
  const [coord, setCoord] = useState({ x: 50, y: 50 });

  // Load admin-managed configurator settings
  useEffect(() => {
    supabase
      .from("site_config")
      .select("configurator_colors, configurator_sizes, configurator_size_chart_url")
      .eq("id", 1)
      .maybeSingle()
      .then(async ({ data }) => {
        const cc = (data as any)?.configurator_colors;
        if (Array.isArray(cc) && cc.length > 0) {
          setColors(cc as TeeColor[]);
          setColor(cc[0] as TeeColor);
        }
        const cs = (data as any)?.configurator_sizes;
        if (Array.isArray(cs) && cs.length > 0) setSizes(cs as string[]);
        const chart = (data as any)?.configurator_size_chart_url;
        if (chart) setSizeChart(await signedUrl(chart));
      });
  }, []);

  // Load admin-managed garment preview assets
  useEffect(() => {
    supabase
      .from("configurator_assets")
      .select("*")
      .eq("active_status", true)
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (error) { console.error("[Configurator] assets load failed", error); return; }
        setAssets((data ?? []) as GarmentAsset[]);
      });
  }, []);

  // Single source of truth for "which admin asset applies to the current
  // color" — used both to resolve the preview image and to derive the
  // print area below, so the two are always in sync.
  const matchedAsset = assets.find((a) => a.garment_color === color.id) ?? assets[0];

  const printArea = matchedAsset
    ? {
        x: matchedAsset.print_area_x,
        y: matchedAsset.print_area_y,
        width: matchedAsset.print_area_width,
        height: matchedAsset.print_area_height,
      }
    : DEFAULT_PRINT_AREA;

  const pricing = matchedAsset
    ? { basePaise: matchedAsset.base_price, artworkFeePaise: matchedAsset.artwork_fee }
    : DEFAULT_PRICING;

  // Resolve front preview URL whenever color or assets change
  useEffect(() => {
    let live = true;
    setPreviewFailed(false);
    const match = matchedAsset;
    if (!match?.front_preview_url) { setFrontPreview(null); return; }
    signedUrl(match.front_preview_url).then((u) => {
      if (!live) return;
      if (!u) {
        console.error("[Configurator] sign failed", {
          assetId: match.id,
          storagePath: match.front_preview_url,
          databaseRecord: match,
        });
        setPreviewFailed(true);
      }
      setFrontPreview(u);
    });
    return () => { live = false; };
  }, [color.id, assets]);

  const onUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("INVALID SIGNAL — IMAGE FILES ONLY");
      return;
    }
    setOriginalFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      const img = new Image();
      img.onload = () => {
        const printEl = printRef.current;
        const printW = printEl?.clientWidth ?? 0;
        const printH = printEl?.clientHeight ?? 0;
        const initial: Artwork = {
          url,
          x: 50,
          y: 50,
          scale: 1,
          rotation: 0,
          naturalW: img.naturalWidth,
          naturalH: img.naturalHeight,
        };
        // Clamp immediately — a very tall/narrow image could exceed the
        // print zone vertically even at scale 1 with width capped at 70%.
        setArt(clampArtwork(initial, {}, printW, printH));
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  const dragState = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (!art || !printRef.current) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, ox: art.x, oy: art.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!printRef.current) return;
    const rect = printRef.current.getBoundingClientRect();
    setCoord({
      x: Math.round(((e.clientX - rect.left) / rect.width) * 100),
      y: Math.round(((e.clientY - rect.top) / rect.height) * 100),
    });
    if (!dragState.current || !art) return;
    const dx = ((e.clientX - dragState.current.startX) / rect.width) * 100;
    const dy = ((e.clientY - dragState.current.startY) / rect.height) * 100;
    setArt(
      clampArtwork(
        art,
        { x: dragState.current.ox + dx, y: dragState.current.oy + dy },
        rect.width,
        rect.height,
      ),
    );
  };
  const onPointerUp = () => {
    dragState.current = null;
  };

  useEffect(() => {
    const el = printRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!art) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      setArt((a) =>
        a ? clampArtwork(a, { scale: a.scale - e.deltaY * 0.001 }, rect.width, rect.height) : a,
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [art]);

  // Single entry point for the Scale/Rotate/Recenter buttons. Routes every
  // change through the same clamp used by drag and wheel-scale, so changing
  // rotation (for example) automatically pulls scale/position back in bounds
  // if the new angle's bounding box would otherwise exceed the print zone.
  const adjust = (patch: Partial<Artwork>) =>
    setArt((a) => {
      if (!a) return a;
      const rect = printRef.current?.getBoundingClientRect();
      return clampArtwork(a, patch, rect?.width ?? 0, rect?.height ?? 0);
    });

  const pricePaise = pricing.basePaise + (art ? pricing.artworkFeePaise : 0);
  const priceRupees = pricePaise / 100;

  const addToArsenal = async () => {
    if (submitting) return;
    let artwork_path: string | null = null;
    let mockup_path: string | null = null;

    if (art && originalFile) {
      setSubmitting(true);

      // Artwork upload is the critical path — if this fails, stop and let
      // the customer retry. Mockup generation below is treated as
      // best-effort and must never block the order or lose the artwork.
      try {
        toast.message("UPLOADING TRANSMISSION...");
        artwork_path = await uploadToMedia(originalFile, "configurator/artwork", originalFile.name);
      } catch (e) {
        console.error("[Configurator] artwork upload failed", e);
        toast.error("UPLINK FAILED — RETRY");
        setSubmitting(false);
        return;
      }

      // Mockup generation is isolated in its own try/catch. A failure here
      // (e.g. a CORS-tainted canvas from a cross-origin garment photo)
      // must not prevent the order — it just means production reviews the
      // artwork alone, same as before garment photos existed.
      try {
        if (stageRef.current) {
          const canvas = await html2canvas(stageRef.current, {
            backgroundColor: null,
            useCORS: true,
            allowTaint: false,
            imageTimeout: 8000,
            scale: 2,
          });
          const blob: Blob = await new Promise((res) =>
            canvas.toBlob((b) => res(b ?? new Blob()), "image/png"),
          );
          if (blob.size > 0) {
            mockup_path = await uploadToMedia(blob, "configurator/mockup", "mockup.png");
          } else {
            console.warn("[Configurator] mockup canvas produced an empty blob — skipping upload");
          }
        }
      } catch (e) {
        console.error("[Configurator] mockup generation failed — proceeding without it", e);
      }
    }

    setSubmitting(false);
    add({
      dropId: `custom-${color.id}-${Date.now()}`,
      name: `CUSTOM PROTOCOL TEE — ${color.name}`,
      price: pricePaise,
      size,
      qty: 1,
      image: art?.url,
      config: {
        artwork_path,
        mockup_path,
        config_json: {
          product: "Custom Protocol Tee",
          color: color.id,
          colorName: color.name,
          size,
          scale: art ? Number(art.scale.toFixed(2)) : null,
          rotation: art ? art.rotation : null,
          x: art ? Math.round(art.x) : null,
          y: art ? Math.round(art.y) : null,
        },
      },
    });
    toast.success("DEPLOYED TO ARSENAL");
  };

  const isLight = color.id === "bone";

  return (
    <div className="relative w-full">
      {/* HUD top bar */}
      <div className="grid grid-cols-3 items-center border-y border-border/60 px-4 md:px-8 py-3 text-[10px] tracking-[0.4em] text-muted-foreground">
        <div className="text-primary animate-flicker">● TERMINAL.ACTIVE</div>
        <div className="text-center">UNIT.{color.id.toUpperCase()} · SIZE.{size} · REV.07</div>
        <div className="text-right tabular-nums">X:{String(coord.x).padStart(3, "0")} Y:{String(coord.y).padStart(3, "0")}</div>
      </div>

      <div className={`grid lg:grid-cols-[1fr_400px] ${compact ? "min-h-[680px]" : "min-h-[calc(100vh-120px)]"}`}>
        {/* CANVAS */}
        <div className="relative flex items-center justify-center p-6 md:p-12 border-r border-border/60 overflow-hidden">
          {/* grid bg */}
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          {["top-4 left-4 border-t border-l", "top-4 right-4 border-t border-r", "bottom-4 left-4 border-b border-l", "bottom-4 right-4 border-b border-r"].map((c) => (
            <div key={c} className={`absolute ${c} border-primary w-8 h-8 pointer-events-none`} />
          ))}

          {/* GARMENT */}
          <div ref={stageRef} className="relative h-full max-h-[700px] w-auto max-w-[560px] aspect-[4/5]">
            {frontPreview && !previewFailed ? (
              <img
                src={frontPreview}
                alt={`${color.name} garment preview`}
                crossOrigin="anonymous"
                className="absolute inset-0 w-full h-full object-contain"
                onError={() => {
                  console.error("[Configurator] preview render failed", {
                    colorId: color.id,
                    urlUsed: frontPreview,
                  });
                  setPreviewFailed(true);
                }}
              />
            ) : (
              <TeeSVG color={color} />
            )}
            <div
              ref={printRef}
              className="absolute border-2 border-primary overflow-hidden"
              style={{
                top: `${printArea.y}%`,
                left: `${printArea.x}%`,
                width: `${printArea.width}%`,
                height: `${printArea.height}%`,
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <div className="absolute -top-5 left-0 text-[9px] tracking-[0.3em] text-primary">
                PRINT.ZONE · 30×40CM
              </div>
              {art && (
                <img
                  src={art.url}
                  alt=""
                  draggable={false}
                  className="absolute select-none pointer-events-none"
                  style={{
                    left: `${art.x}%`,
                    top: `${art.y}%`,
                    transform: `translate(-50%, -50%) rotate(${art.rotation}deg) scale(${art.scale})`,
                    maxWidth: "70%",
                    filter: isLight ? "none" : "drop-shadow(0 2px 4px rgba(0,0,0,0.6))",
                    mixBlendMode: isLight ? "multiply" : "normal",
                  }}
                />
              )}
            </div>
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.4em] text-muted-foreground">
            DRAG · SCROLL TO SCALE
          </div>
        </div>

        {/* PANEL */}
        <aside className="bg-card/30 p-6 md:p-8 space-y-8 overflow-y-auto">
          <Section label="01 / FABRIC CHASSIS">
            <div className="grid grid-cols-5 gap-2">
              {colors.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setColor(c)}
                  className={`aspect-square border-2 transition-all ${color.id === c.id ? "border-primary" : "border-border hover:border-foreground"}`}
                  style={{ background: c.hex }}
                  aria-label={c.name}
                />
              ))}
            </div>
            <div className="mt-2 text-[10px] tracking-[0.3em] text-muted-foreground">› {color.name}</div>
          </Section>

          <Section label="02 / DIMENSION">
            <div className="grid grid-cols-5 gap-1">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`py-3 font-display tracking-widest border ${size === s ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground"}`}
                >
                  {s}
                </button>
              ))}
            </div>
            {sizeChart && (
              <div className="mt-3">
                <SizeChartButton url={sizeChart} fullWidth />
              </div>
            )}
          </Section>

          <Section label="03 / ARTWORK PAYLOAD">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border border-dashed border-border hover:border-primary hover:text-primary p-6 flex flex-col items-center gap-2 transition-colors"
            >
              <Upload size={20} />
              <span className="font-display tracking-[0.3em] text-sm">
                {art ? "REPLACE TRANSMISSION" : "UPLOAD ARTWORK"}
              </span>
              <span className="text-[10px] tracking-widest text-muted-foreground">PNG · JPG · SVG · MAX 8MB</span>
            </button>

            {art && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3 border border-border p-4">
                <Row label="SCALE">
                  <IconBtn onClick={() => adjust({ scale: Math.max(0.2, art.scale - 0.1) })}><Minus size={12} /></IconBtn>
                  <span className="flex-1 text-center font-display tracking-widest tabular-nums">{(art.scale * 100).toFixed(0)}%</span>
                  <IconBtn onClick={() => adjust({ scale: Math.min(2.5, art.scale + 0.1) })}><Plus size={12} /></IconBtn>
                </Row>
                <Row label="ROTATE">
                  <IconBtn onClick={() => adjust({ rotation: art.rotation - 15 })}><RotateCw size={12} className="-scale-x-100" /></IconBtn>
                  <span className="flex-1 text-center font-display tracking-widest tabular-nums">{art.rotation}°</span>
                  <IconBtn onClick={() => adjust({ rotation: art.rotation + 15 })}><RotateCw size={12} /></IconBtn>
                </Row>
                <Row label="POSITION">
                  <button onClick={() => adjust({ x: 50, y: 50 })} className="flex-1 text-xs tracking-widest hover:text-primary">RECENTER</button>
                </Row>
                <button
                  onClick={() => setArt(null)}
                  className="w-full flex items-center justify-center gap-2 text-xs tracking-[0.3em] text-muted-foreground hover:text-primary pt-2 border-t border-border"
                >
                  <Trash2 size={12} /> PURGE ARTWORK
                </button>
              </motion.div>
            )}
          </Section>

          <Section label="04 / DEPLOYMENT">
            <div className="flex items-baseline justify-between mb-4">
              <span className="text-xs tracking-[0.3em] text-muted-foreground">UNIT COST</span>
              <span className="font-display text-3xl tabular-nums">₹{priceRupees.toLocaleString("en-IN")}</span>
            </div>
            <button
              onClick={addToArsenal}
              disabled={submitting}
              className="w-full bg-primary text-primary-foreground font-display tracking-[0.3em] py-4 hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
            >
              {submitting ? "TRANSMITTING..." : "DEPLOY TO ARSENAL →"}
            </button>
            <div className="mt-3 text-[10px] tracking-[0.3em] text-muted-foreground text-center">
              FABRICATED IN JAIPUR · 14 DAY PROTOCOL
            </div>
          </Section>
        </aside>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.5em] text-primary mb-3 border-b border-border pb-2">{label}</div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] tracking-[0.3em] text-muted-foreground w-16">{label}</span>
      {children}
    </div>
  );
}

function IconBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-8 h-8 border border-border hover:border-primary hover:text-primary flex items-center justify-center transition-colors">
      {children}
    </button>
  );
}

function TeeSVG({ color }: { color: TeeColor }) {
  return (
    <svg viewBox="0 0 400 500" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id="weave" width="3" height="3" patternUnits="userSpaceOnUse">
          <rect width="3" height="3" fill={color.fabric} />
          <rect width="1" height="1" fill={color.hex} opacity="0.5" />
        </pattern>
        <filter id="shadow">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <path d="M70 90 L150 50 L200 70 L250 50 L330 90 L370 170 L310 200 L310 470 L90 470 L90 200 L30 170 Z" fill="#000" opacity="0.6" transform="translate(6 8)" filter="url(#shadow)" />
      <path d="M70 90 L150 50 L200 70 L250 50 L330 90 L370 170 L310 200 L310 470 L90 470 L90 200 L30 170 Z" fill="url(#weave)" stroke="#000" strokeWidth="1" />
      <path d="M150 50 Q200 110 250 50" fill="none" stroke="#000" strokeWidth="2" opacity="0.6" />
      <path d="M90 200 L90 470 L130 470 L130 210 Z" fill="#000" opacity="0.18" />
      <path d="M310 200 L310 470 L270 470 L270 210 Z" fill="#000" opacity="0.18" />
      <line x1="200" y1="80" x2="200" y2="470" stroke="#000" strokeWidth="0.5" opacity="0.15" />
    </svg>
  );
}
