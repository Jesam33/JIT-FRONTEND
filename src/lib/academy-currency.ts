"use client";

// The currency the signed-in owner's academy sells in (Tenant::currency on the
// backend: set from the academy's country on the Course payments page). The
// owner layout learns it from /owner/overview and stores it here; every owner
// page reads it with useAcademyCurrency() to label prices ("Price (GH₵)").
// Defaults to NGN, which is every academy that hasn't chosen a country.

import { useSyncExternalStore } from "react";

const KEY = "lms_academy_currency";
const EVENT = "lms-academy-currency";

function read(): string {
  try {
    return (localStorage.getItem(KEY) || "NGN").toUpperCase();
  } catch {
    return "NGN";
  }
}

export function setAcademyCurrency(code: string | null | undefined): void {
  const next = (code || "NGN").toUpperCase();
  try {
    if (localStorage.getItem(KEY) === next) return;
    localStorage.setItem(KEY, next);
  } catch {
    /* storage blocked: the default still renders */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The academy's currency code, e.g. "NGN", "GHS", "GBP". */
export function useAcademyCurrency(): string {
  return useSyncExternalStore(subscribe, read, () => "NGN");
}
