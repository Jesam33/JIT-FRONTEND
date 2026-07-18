"use client";

import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", variant = "danger", onConfirm, onCancel }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <div ref={dialogRef} className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#0b0b0b] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm text-white/70">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-full border border-white/20 px-4 py-2 text-sm text-white transition hover:bg-white/10">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${variant === "danger" ? "bg-red-500 text-white hover:bg-red-600" : "bg-white text-black hover:bg-white/90"}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
