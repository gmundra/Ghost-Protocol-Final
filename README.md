# THE GHOST PROTOCOL — Local Test Build (Round 2: Final Pre-Launch Fixes)

This build is your previously-delivered `final-site/` codebase with the five
issues from real testing fixed. The live Lovable project itself is still
unaffected (credits are exhausted until July, so nothing has been pushed
back there) — this zip is the thing to keep testing locally.

## Running it

```bash
npm install
npm run dev
```

`.env` still points at the real, live Supabase project — same note as last
time applies: there's no separate test backend.

---

## Files Modified

| File | What changed |
|---|---|
| `src/components/ConfiguratorTerminal.tsx` | Priority 1 (print-area clamping) + Priority 2 (mockup reliability) |
| `src/components/FitHeading.tsx` | **New file** — Priority 5 |
| `src/pages/Home.tsx` | Priority 5 (headline), Priority 3 + 4 (featured product + archive thumbnail) |
| `src/pages/Drops.tsx` | Priority 3 + 4 (product cards) |
| `src/pages/DropDetail.tsx` | Priority 3 + 4 (product hero image) |
| `src/components/CartDrawer.tsx` | Priority 3 + 4 (cart line-item thumbnails) |

## Migrations Added

None. All five fixes are frontend-only — nothing required a schema change.

---

## Priority 1 — Print Area Enforcement

**Root cause:** the old clamp was `x: Math.max(0, Math.min(100, x))` — it
clamped the artwork's *center point* to 0–100%, not its *edges*. At low x/y
or high scale, the artwork's actual rendered corners could sit well outside
the print zone despite the center being "in bounds."

**Fix:** artwork now carries its real `naturalW`/`naturalH` (captured on
upload). Every interaction — drag, scroll-to-scale, the Scale/Rotate/Recenter
buttons — routes through one `clampArtwork()` function that:
1. Computes the artwork's actual rendered bounding box (accounting for the
   70%-max-width display rule, current scale, **and current rotation** — a
   rotated rectangle's bounding box is wider/taller than the rectangle
   itself, computed via `|w·cosθ| + |h·sinθ|`).
2. Clamps scale down first if the bounding box at that rotation would
   exceed the print zone.
3. Clamps position second, using the now-valid scale, so the bounding box's
   edges — not its center — stay inside the print zone.

Changing rotation, scale, or position now always re-validates all three
together, so there's no gesture that can push artwork out of bounds.

The print zone itself changed from a soft dashed/60%-opacity border to a
solid 2px red border with `overflow-hidden`, so it visually reads as a hard
boundary and acts as a final pixel-level guarantee even in any unforeseen
edge case in the math above.

## Priority 2 — Order Mockup Visibility

**Root cause:** the garment preview `<img>` (the real photo asset uploaded
by admin for each color) was missing `crossOrigin="anonymous"`. When
`html2canvas` tried to rasterize the configurator stage for the mockup, that
cross-origin image tainted the canvas — `canvas.toBlob()` then either threw
or resolved with an unusable image. Because artwork upload and mockup
generation shared one try/catch, *any* failure (including this one) aborted
the whole flow before `add()` was ever called for some failure modes, or
silently produced a broken/empty mockup file for others — both of which
surface exactly as "artwork is there, mockup is missing."

**Fix:**
- Added `crossOrigin="anonymous"` to the garment preview `<img>`.
- Split artwork upload and mockup generation into **independent**
  try/catch blocks. Artwork upload failing still stops the flow (it's the
  critical asset). Mockup generation failing now just logs a warning and
  proceeds with `mockup_path: null` — the order still gets created with the
  artwork, exactly matching the "still create order, still save available
  assets" principle from the original production-pipeline spec.
- Added `imageTimeout: 8000` and explicit `allowTaint: false` to make the
  html2canvas failure mode predictable rather than relying on defaults.

Admin's side-by-side artwork/mockup display in Order Review was already
correct — that part of Priority 2 needed no change; the bug was entirely in
why `mockup_url` ended up null in the first place.

## Priority 3 — Product Image Cropping

**Root cause:** `object-cover` on every product/garment image. `object-cover`
fills its container by cropping whatever doesn't fit the container's aspect
ratio — exactly "head cropping" / "torso cropping" on any photo whose aspect
ratio doesn't exactly match the fixed `aspect-[3/4]` or `aspect-square`
container it's placed in.

**Fix:** every customer-facing product/garment image switched to
`object-contain`, which always shows the entire image, letterboxing
(adding padding, never cropping) when the photo's aspect ratio differs from
its container. Touched: Drops grid cards, DropDetail hero image, Home's
featured-product image, Home's archive hover-thumbnail, and cart drawer
line-item thumbnails.

The configurator's own garment preview (`ConfiguratorTerminal.tsx`) was
already `object-contain` — not part of this round's changes.

## Priority 4 — Remove Grayscale Filters

Removed `grayscale` / `group-hover:grayscale-0` from the same set of files
touched in Priority 3 — Drops cards, DropDetail, Home's featured product and
archive thumbnail, and cart drawer thumbnails. All product imagery now
renders in full color, always.

## Priority 5 — Homepage Typography

**What was wrong with the *previous* fix:** splitting "THE" into its own
smaller, muted, separately-tracked element technically resolved the glitch
misalignment, but did so by giving it isolated styling — which is exactly
what broke the "one cohesive heading" feel.

**The actual fix:** "THE GHOST PROTOCOL" is back to being one single
`GlitchText` call, same size, same color, same treatment throughout — no
splitting, no isolated styling. A new `FitHeading` wrapper component solves
the wrap-causing-misalignment bug at its root instead: it measures the
heading's natural single-line width on render and on resize, and applies a
uniform `transform: scale()` to the *whole* heading (the text and both of
GlitchText's glitch layers together, as one unit) — shrinking it only as
much as needed to keep it on one line. The heading's own
`whitespace-nowrap` means it structurally cannot wrap in the first place;
`FitHeading` just guarantees it also never overflows the viewport. Because
the scale is applied to the heading as a single unit, the glitch layers
(which are positioned `inset-0` relative to that same unit) stay perfectly
aligned at any scale factor, on any viewport width, and even if an admin
sets a much longer custom `hero_headline` in Site Config.

---

## Verification Steps

I don't have a working `npm install` in the sandbox this was built in (npm
registry access was blocked there, same as last round), so I verified the
same way: ran TypeScript directly against the project's real
`tsconfig.app.json` (which resolves the `@/...` path alias and the project's
actual compiler settings). Result: zero syntax errors, zero unresolved
imports, in every file — including all six files touched this round. The
single pre-existing `vitest/globals` type-definition warning is unrelated
to any of these changes (it's a missing devDependency type stub, not a code
issue) and was present before this round too.

This confirms the code is structurally sound; it does not confirm runtime
behavior (animation timing, actual font-metric measurements, real upload
network calls) — for that, the manual checklist below is what actually
matters.

## Manual Test Checklist

**Priority 1 — Print Area**
- [ ] Upload a tall, narrow image. Confirm it doesn't overflow the print
      zone vertically even at scale 100%.
- [ ] Drag artwork toward each of the four corners. Confirm it stops at the
      print zone edge — not when its *center* reaches the edge, when its
      *visible corner* does.
- [ ] Scale up via the `+` button repeatedly. Confirm it stops growing once
      any edge would exceed the print zone, even before hitting the 250%
      hard cap.
- [ ] Rotate to 45° with the artwork scaled near its max. Confirm the scale
      automatically reduces if needed so the rotated bounding box still
      fits — it shouldn't visually poke outside the red border.
- [ ] Scroll-to-zoom (mouse wheel over the print zone) respects the same
      bounds as the +/- buttons.

**Priority 2 — Mockup Visibility**
- [ ] In Admin → Configurator, confirm at least one color has a real
      uploaded front preview photo (not the SVG placeholder).
- [ ] As a customer, select that color, upload artwork, click "Deploy to
      Arsenal," and complete checkout.
- [ ] In Admin → Orders, open that order. Confirm **both** the original
      artwork and the generated mockup render side by side — not just one
      of them.
- [ ] Repeat with a color that has *no* uploaded preview photo (SVG
      fallback). Confirm the mockup still generates correctly in this case
      too (it should — SVG/DOM content was never affected by the CORS bug).

**Priority 3 — Image Cropping**
- [ ] On `/drops`, confirm product photos show in full — no heads or feet
      cut off, even for photos with a different aspect ratio than the card.
- [ ] On a product detail page, confirm the same for the large hero image.
- [ ] On the homepage's featured-product section, confirm the same.
- [ ] Hover an archived product on the homepage; confirm the floating
      preview thumbnail shows the full image.

**Priority 4 — Grayscale**
- [ ] Confirm all of the above images are in full color *immediately* —
      not gray-until-hover anywhere on `/drops`, the homepage, or product
      pages.

**Priority 5 — Typography**
- [ ] On desktop, confirm "THE GHOST PROTOCOL" renders as one line, one
      consistent size/color throughout, with the glitch effect aligned
      correctly across the whole phrase.
- [ ] Resize the browser down to a narrow mobile width (try 320px and
      375px explicitly). Confirm it still renders as one line, scaling
      down smoothly, never wrapping.
- [ ] In Admin → Site Config, temporarily set a much longer custom Hero
      Headline (e.g. "THE GHOST PROTOCOL FOUNDRY TACTICAL APPAREL DIVISION")
      and confirm it still renders as one shrunk-to-fit line rather than
      wrapping or breaking alignment. Revert it afterward.
