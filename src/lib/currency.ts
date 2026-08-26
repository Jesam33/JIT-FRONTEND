// Shared money formatting for the buyer-facing storefront surfaces.
//
// This is a RENDERER, not a converter: the backend (CurrencyService) does all
// FX conversion and rounding server-side and hands each course a
// `price_display` already expressed in `display_currency`. This module only
// turns (amount, currency) into a string, so the symbol/rounding rules stay in
// lockstep with the backend `SYMBOLS` map + `roundDisplay`.

// Currency → display symbol. Mirrors CurrencyService::SYMBOLS. A code we don't
// map falls back to the ISO code + a space (e.g. "KES 1,200").
const SYMBOLS: Record<string, string> = {
  NGN: "₦", USD: "$", GBP: "£", EUR: "€",
  CAD: "CA$", AUD: "A$", NZD: "NZ$", GHS: "GH₵",
  ZAR: "R", KES: "KSh", EGP: "E£", INR: "₹",
  JPY: "¥", CNY: "¥", KRW: "₩", SGD: "S$",
  AED: "AED ", SAR: "SAR ", BRL: "R$", CHF: "CHF ",
  TRY: "₺", RUB: "₽", PHP: "₱", THB: "฿",
};

export function currencySymbol(code: string): string {
  const c = (code || "").toUpperCase();
  return SYMBOLS[c] ?? (c ? c + " " : "");
}

/**
 * Format an amount ALREADY expressed in `currency`. Whole units for readable
 * prices, 2dp only for tiny amounts (matches CurrencyService::roundDisplay so
 * the client never re-rounds differently from the server).
 */
export function formatPrice(amount: number, currency = "NGN"): string {
  const n = Number(amount) || 0;
  const digits = n > 0 && n < 10 ? 2 : 0;
  return `${currencySymbol(currency)}${n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

/**
 * The currencies offered in the manual selector — the guaranteed fallback for
 * visitors whose country we can't detect or whose local currency we don't map.
 * Mirrors CurrencyService::selectableCurrencies().
 */
export const CURRENCY_OPTIONS: { code: string; symbol: string }[] = [
  "NGN", "USD", "GBP", "EUR", "CAD", "GHS", "ZAR", "KES", "INR", "AUD",
].map((code) => ({ code, symbol: currencySymbol(code) }));

/** Read a browser cookie by name (client-only; returns "" on the server). */
export function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : "";
}
