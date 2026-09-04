"use client";

// A small modal that lets the owner choose which part of a picked image the
// course-cover frame keeps. The image is shown inside a 16:9 window at the
// smallest scale that fully covers the frame (exactly how the storefront card
// renders it with `object-cover`), and the owner drags it to pan. The drag
// position maps 1:1 onto a CropFocus (0..1 fractions, like CSS object-position),
// which is then handed to cropImageToAspect so the exported 16:9 JPEG matches
// the preview precisely. Confirm → returns the cropped File; cancel → discards.

import { useCallback, useEffect, useRef, useState } from "react";
import { cropImageToAspect, type CropFocus } from "@/lib/image";

type Props = {
  file: File;
  aspect: number; // width / height of the target frame (e.g. 16/9)
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (cropped: File, focus: CropFocus) => void;
};

export default function CoverPositioner({ file, aspect, busy, onCancel, onConfirm }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  // Focal point as 0..1 fractions of the source (CSS object-position semantics).
  const [focus, setFocus] = useState<CropFocus>({ x: 0.5, y: 0.5 });
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
  const panX = srcAspect > aspect + 0.001; // image wider than frame → pan left/right
  const panY = srcAspect < aspect - 0.001; // image taller than frame → pan up/down

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
      const cropped = await cropImageToAspect(file, aspect, 1600, focus);
      onConfirm(cropped, focus);
    } catch {
      setWorking(false);
    }
  };

  const objectPosition = `${focus.x * 100}% ${focus.y * 100}%`;
  const canPan = panX || panY;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} aria-label="Cancel" />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-[#0b0b0b] p-5 shadow-2xl">
        <h3 className="text-base font-semibold text-white">Position your cover</h3>
        <p className="mt-1 text-xs text-white/55">
          {canPan
            ? "Drag the image to choose the part that shows. We crop to a wide 16:9 frame."
            : "This image already fits the 16:9 frame. Tap Use cover to continue."}
        </p>

        <div
          ref={frameRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={`relative mt-4 w-full overflow-hidden rounded-xl ring-1 ring-inset ring-white/20 ${
            canPan ? "cursor-grab touch-none active:cursor-grabbing" : ""
          }`}
          style={{ aspectRatio: String(aspect) }}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt="Cover preview"
              draggable={false}
              className="h-full w-full select-none object-cover"
              style={{ objectPosition }}
            />
          ) : (
            <div className="h-full w-full animate-pulse bg-white/10" />
          )}
          {/* Rule-of-thirds guides to help framing. */}
          {canPan ? (
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-40">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="border border-white/25" />
              ))}
            </div>
          ) : null}
        </div>

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
            className="rounded-full bg-site-primary px-6 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {working || busy ? "Working…" : "Use cover"}
          </button>
        </div>
      </div>
    </div>
  );
}
