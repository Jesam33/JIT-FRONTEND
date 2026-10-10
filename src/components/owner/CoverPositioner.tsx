"use client";

// A small modal that lets the owner choose which part of a picked image a
// frame keeps, before it's uploaded. The image is shown inside the frame at the
// smallest scale that fully covers it (exactly how it's rendered with
// `object-cover`), and the owner drags it to pan. The drag position maps 1:1
// onto a CropFocus (0..1 fractions, like CSS object-position), which is then
// handed to cropImageToAspect so the exported file matches the preview.
// Confirm → returns the processed File; cancel → discards.
//
// Used for course covers (16:9, the defaults) and the academy logo (square,
// round guide, PNG so transparency survives, and an optional "fit the whole
// image" mode for wide text logos that a square crop would cut off).

import { useCallback, useEffect, useRef, useState } from "react";
import { cropImageToAspect, fitImageInAspect, type CropFocus } from "@/lib/image";

type Props = {
  file: File;
  aspect: number; // width / height of the target frame (e.g. 16/9)
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (processed: File, focus: CropFocus) => void;
  /** Modal heading. */
  title?: string;
  /** Primary button label. */
  confirmLabel?: string;
  /** "circle" overlays a round guide (the image is shown as a circle). */
  shape?: "rect" | "circle";
  /** Longest side of the exported image. */
  maxWidth?: number;
  /** Output format; PNG keeps transparency. */
  format?: "image/jpeg" | "image/png";
  /** Offer "fit the whole image" (no cropping, transparent padding). */
  allowFit?: boolean;
};

export default function CoverPositioner({
  file,
  aspect,
  busy,
  onCancel,
  onConfirm,
  title = "Position your cover",
  confirmLabel = "Use cover",
  shape = "rect",
  maxWidth = 1600,
  format = "image/jpeg",
  allowFit = false,
}: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  // Focal point as 0..1 fractions of the source (CSS object-position semantics).
  const [focus, setFocus] = useState<CropFocus>({ x: 0.5, y: 0.5 });
  const [fit, setFit] = useState(false);
  const [working, setWorking] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  // Drag bookkeeping: pointer origin + focus at grab time.
  const drag = useRef<{ px: number; py: number; fx: number; fy: number } | null>(null);

  // Decode the picked file to a preview URL (revoked on change/unmount).
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    const img = new Image();
    img.onload = () => setNat({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = u;
    return () => URL.revokeObjectURL(u);
  }, [file]);

  // Which axis actually has slack to pan (the other is pinned by object-cover).
  const srcAspect = nat ? nat.w / nat.h : aspect;
  const panX = !fit && srcAspect > aspect + 0.001; // image wider than frame → pan left/right
  const panY = !fit && srcAspect < aspect - 0.001; // image taller than frame → pan up/down

  const onPointerDown = (e: React.PointerEvent) => {
    if (!panX && !panY) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, fx: focus.x, fy: focus.y };
  };

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current;
      const frame = frameRef.current;
      if (!d || !frame) return;
      const rect = frame.getBoundingClientRect();
      // Dragging the image right should reveal its left edge, so focus moves
      // opposite to the pointer. Scale the delta by the frame size so a full
      // drag across the frame sweeps the whole focal range.
      const nx = panX && rect.width ? d.fx - (e.clientX - d.px) / rect.width : d.fx;
      const ny = panY && rect.height ? d.fy - (e.clientY - d.py) / rect.height : d.fy;
      setFocus({ x: Math.min(1, Math.max(0, nx)), y: Math.min(1, Math.max(0, ny)) });
    },
    [panX, panY],
  );

  const endDrag = () => {
    drag.current = null;
  };

  const confirm = async () => {
    setWorking(true);
    try {
      const processed = fit
        ? await fitImageInAspect(file, aspect, maxWidth)
        : await cropImageToAspect(file, aspect, maxWidth, focus, format);
      onConfirm(processed, focus);
    } catch {
      setWorking(false);
    }
  };

  const objectPosition = `${focus.x * 100}% ${focus.y * 100}%`;
  const canPan = panX || panY;
  const round = shape === "circle";
  const frameName = round ? "circle" : aspect === 16 / 9 ? "wide 16:9 frame" : "frame";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} aria-label="Cancel" />
      <div className="relative max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 bg-[#0b0b0b] p-5 shadow-2xl">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-1 text-xs text-white/55">
          {fit
            ? "The whole image is shown, nothing cut off."
            : canPan
              ? `Drag the image to choose the part that shows in the ${frameName}.`
              : `This image already fits the ${frameName}. Tap ${confirmLabel} to continue.`}
        </p>

        <div
          ref={frameRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={`relative mx-auto mt-4 overflow-hidden rounded-xl bg-[repeating-conic-gradient(#ffffff14_0_25%,transparent_0_50%)] bg-[length:16px_16px] ring-1 ring-inset ring-white/20 ${
            round ? "w-full max-w-[280px]" : "w-full"
          } ${canPan ? "cursor-grab touch-none active:cursor-grabbing" : ""}`}
          style={{ aspectRatio: String(aspect) }}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt="Preview"
              draggable={false}
              className={`h-full w-full select-none ${fit ? "object-contain" : "object-cover"}`}
              style={fit ? undefined : { objectPosition }}
            />
          ) : (
            <div className="h-full w-full animate-pulse bg-white/10" />
          )}
          {/* Round guide: everything outside the circle is dimmed, as it won't show. */}
          {round ? (
            <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] ring-2 ring-white/70" />
          ) : null}
          {/* Rule-of-thirds guides to help framing. */}
          {canPan && !round ? (
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-40">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="border border-white/25" />
              ))}
            </div>
          ) : null}
        </div>

        {/* How it will look, small, where a logo actually appears. */}
        {round && url ? (
          <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-white/50">
            {[48, 32, 20].map((size) => (
              <div key={size} className="flex flex-col items-center gap-1">
                <div className="overflow-hidden rounded-full bg-white/5 ring-1 ring-white/20" style={{ width: size, height: size }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className={`h-full w-full ${fit ? "object-contain" : "object-cover"}`}
                    style={fit ? undefined : { objectPosition }}
                  />
                </div>
                {size}px
              </div>
            ))}
          </div>
        ) : null}

        {allowFit ? (
          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-white/80">
            <input type="checkbox" checked={fit} onChange={(e) => setFit(e.target.checked)} className="h-4 w-4 accent-[var(--site-primary,#ed180d)]" />
            Show the whole image (no cropping)
          </label>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={working || busy}
            className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={working || busy || !url}
            className="rounded-full bg-site-primary px-6 py-2 text-sm font-semibold text-[#fff] transition hover:brightness-110 disabled:opacity-60"
          >
            {working || busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
