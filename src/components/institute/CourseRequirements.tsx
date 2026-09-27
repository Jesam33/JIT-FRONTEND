"use client";
import { useMemo, useState } from "react";

// The "Requirements" list with a See more / See less toggle. Mirrors
// CourseDescription: the owner types one requirement per line in the course
// form, so the list is clamped by LINES to keep the page scannable. A value
// typed as one enormous run-on line is clamped by CHARACTERS instead, since a
// line limit would never fire on it. Server-rendered text is passed in as a
// prop, so this stays a thin client wrapper and the course page itself stays a
// server component.
const LINE_LIMIT = 5;
const CHAR_LIMIT = 400;

export default function CourseRequirements({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  const lines = useMemo(
    () =>
      text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    [text],
  );

  const tooManyLines = lines.length > LINE_LIMIT;
  const isLong = tooManyLines || text.trim().length > CHAR_LIMIT;

  const shown = useMemo(() => {
    if (!isLong || expanded) {
      return lines;
    }

    if (tooManyLines) {
      return lines.slice(0, LINE_LIMIT);
    }

    // One long line: cut at the last whole word that fits, then re-split so any
    // newlines inside the kept part still render as their own bullets.
    const cut = text.trim().slice(0, CHAR_LIMIT);
    const lastSpace = cut.lastIndexOf(" ");
    const clipped = (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";

    return clipped
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }, [isLong, expanded, lines, tooManyLines, text]);

  // How much is still hidden. Zero in the single-long-line case (the clip is
  // inside one line, not a whole line), which is why the label checks it.
  const hiddenCount = lines.length - shown.length;

  return (
    <div className="mt-6 text-sm leading-7 text-white/85">
      <h2 className="mb-2 text-lg font-semibold text-white">Requirements</h2>
      <ul className="list-none space-y-1.5">
        {shown.map((line, i) => (
          <li key={i} className="flex gap-2.5">
            <span aria-hidden className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-primary)]" />
            <span className="whitespace-pre-line break-words">{line}</span>
          </li>
        ))}
      </ul>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-sm font-semibold text-[color:var(--color-primary)] underline underline-offset-2 transition hover:opacity-80"
        >
          {expanded ? "See less" : hiddenCount > 0 ? `See more (${hiddenCount} more)` : "See more"}
        </button>
      ) : null}
    </div>
  );
}
