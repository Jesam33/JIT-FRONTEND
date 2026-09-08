"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// One searchable thing in the portal: what it's called, which group it belongs
// to (the dropdown's section headers), the text we match beyond the title, and
// where selecting it navigates.
export type NavbarSearchItem = {
  key: string;
  group: string;
  title: string;
  subtitle?: string;
  searchText: string;
  href: string;
};

// How many matches each group shows before cutting off. The "see all results"
// row at the bottom is the escape hatch for everything that didn't fit.
const MAX_PER_GROUP = 4;

type NavbarSearchProps = {
  placeholder: string;
  // Redirect target for the "everything" fallback: Enter with nothing
  // highlighted, or the see-all row. Gets ?search=<query> appended, exactly
  // like the old plain search did.
  fallbackHref?: string;
  // Optional live index. When provided, the box becomes an auto-complete
  // dropdown over these items as the user types (loaded once on first use,
  // then filtered client-side). Without it, it stays the plain
  // redirect-to-page search (staff and agent portals for now).
  loadItems?: () => Promise<NavbarSearchItem[]>;
};

export default function NavbarSearch({ placeholder, fallbackHref, loadItems }: NavbarSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  // null = not loaded yet; [] = loaded (possibly empty); the load is attempted
  // once, on the first keystroke, and cached for the portal session (the navbar
  // lives in the layout, so it survives page navigation).
  const [items, setItems] = useState<NavbarSearchItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  // If the index can't be fetched (network hiccup), fall back silently to the
  // old redirect-only behavior rather than showing a broken dropdown.
  const [loadFailed, setLoadFailed] = useState(false);
  // Index into the flat rendered rows, where flat.length is the see-all row
  // and -1 means nothing is highlighted (the input itself).
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const live = typeof loadItems === "function" && !loadFailed;

  // Dismiss on outside click. mousedown (not click) so it closes before other
  // click handlers on the page run.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Grouped matches for the current query, capped per group, in the order the
  // loader listed them (modules, then tasks, then materials for students).
  const groups = useMemo(() => {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const map = new Map<string, NavbarSearchItem[]>();
    for (const it of items) {
      if (!it.searchText.includes(q)) continue;
      const arr = map.get(it.group) ?? [];
      if (arr.length < MAX_PER_GROUP) arr.push(it);
      map.set(it.group, arr);
    }
    return Array.from(map, ([group, entries]) => ({ group, entries }));
  }, [items, query]);

  const flat = useMemo(() => groups.flatMap((g) => g.entries), [groups]);
  // The see-all row participates in keyboard navigation after the last match.
  const totalRows = flat.length + (fallbackHref ? 1 : 0);

  const onChange = (value: string) => {
    setQuery(value);
    setActive(-1);
    if (!live) return;
    if (!value.trim()) {
      setOpen(false);
      return;
    }
    setOpen(true);
    // First use: fetch the index once. Later keystrokes only filter locally.
    if (items === null && !loading) {
      setLoading(true);
      loadItems!()
        .then((list) => setItems(Array.isArray(list) ? list : []))
        .catch(() => setLoadFailed(true))
        .finally(() => setLoading(false));
    }
  };

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const submitFallback = () => {
    const q = query.trim();
    setOpen(false);
    if (!q || !fallbackHref) return;
    router.push(`${fallbackHref}?search=${encodeURIComponent(q)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && open && totalRows > 0) {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, totalRows - 1));
    } else if (e.key === "ArrowUp" && open && totalRows > 0) {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && active >= 0 && active < flat.length) go(flat[active].href);
      else if (open && active === flat.length && fallbackHref) submitFallback();
      else submitFallback();
    } else if (e.key === "Escape" && open) {
      setOpen(false);
    }
  };

  const showPanel = open && live;

  const rowClass = (isActive: boolean) =>
    `flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
      isActive
        ? "bg-white/10 text-white [html.light_&]:bg-black/[0.07] [html.light_&]:text-black"
        : "text-white/80 hover:bg-white/10 [html.light_&]:text-black/80 [html.light_&]:hover:bg-black/5"
    }`;

  return (
    <div className="relative flex-1 max-w-md" ref={rootRef}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitFallback();
        }}
        className="relative"
      >
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-white/40 [html.light_&]:text-black/40">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showPanel}
          aria-autocomplete="list"
          aria-label="Search the portal"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (live && query.trim()) setOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/20 focus:bg-white/10 focus:ring-1 focus:ring-white/10 transition [html.light_&]:bg-black/5 [html.light_&]:border-black/10 [html.light_&]:text-black [html.light_&]:placeholder-black/40 [html.light_&]:focus:border-black/20 [html.light_&]:focus:bg-black/[0.08]"
        />
      </form>

      {showPanel ? (
        <div
          role="listbox"
          aria-label="Search results"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-white/15 bg-[#0c0f13] p-2 shadow-2xl [html.light_&]:border-black/10 [html.light_&]:bg-white [html.light_&]:shadow-lg"
        >
          {loading ? (
            <p className="px-3 py-3 text-xs text-white/50 [html.light_&]:text-black/50">Searching…</p>
          ) : flat.length === 0 ? (
            <p className="px-3 py-3 text-xs text-white/50 [html.light_&]:text-black/50">
              No matches for &ldquo;{query.trim()}&rdquo;
              {fallbackHref ? ". Press Enter to search materials." : ""}
            </p>
          ) : (
            <>
              {groups.map((g) => (
                <div key={g.group}>
                  <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-white/40 [html.light_&]:text-black/40">
                    {g.group}
                  </p>
                  {g.entries.map((it) => {
                    const idx = flat.indexOf(it);
                    return (
                      <button
                        key={it.key}
                        type="button"
                        role="option"
                        aria-selected={active === idx}
                        onClick={() => go(it.href)}
                        onMouseEnter={() => setActive(idx)}
                        className={rowClass(active === idx)}
                      >
                        <span className="min-w-0 truncate">{it.title}</span>
                        {it.subtitle ? (
                          <span className="shrink-0 text-[10px] uppercase tracking-wide text-white/40 [html.light_&]:text-black/40">
                            {it.subtitle}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ))}
              {fallbackHref ? (
                <button
                  type="button"
                  onClick={submitFallback}
                  onMouseEnter={() => setActive(flat.length)}
                  className={`${rowClass(active === flat.length)} mt-1 border-t border-white/10 [html.light_&]:border-black/10`}
                >
                  <span className="truncate">
                    See all results for &ldquo;{query.trim()}&rdquo;
                  </span>
                  <span aria-hidden="true" className="shrink-0 text-white/40 [html.light_&]:text-black/40">
                    ↵
                  </span>
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
