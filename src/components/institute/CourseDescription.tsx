"use client";
import { useMemo, useState } from "react";

// "About This Course" body with a word count and a Read more / Show less toggle.
// Long descriptions are clamped to WORD_LIMIT words so the card stays scannable;
// short ones render whole with no toggle. Server-rendered text is passed in as a
// prop, so this stays a thin client wrapper (the page itself stays a server component).
const WORD_LIMIT = 60;

export default function CourseDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  const words = useMemo(() => text.trim().split(/\s+/).filter(Boolean), [text]);
  const wordCount = words.length;
  const isLong = wordCount > WORD_LIMIT;
  const shown = expanded || !isLong ? text : words.slice(0, WORD_LIMIT).join(" ") + "…";

  return (
    <div className="mt-6 text-sm leading-7 text-white/85">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">About This Course</h2>
        <span className="shrink-0 text-xs text-white/45">{wordCount} words</span>
      </div>
      <p className="whitespace-pre-line">{shown}</p>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-sm font-semibold text-[color:var(--color-primary)] underline underline-offset-2 transition hover:opacity-80"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}
