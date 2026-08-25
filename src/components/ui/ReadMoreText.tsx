"use client";

import { useState } from "react";

type ReadMoreTextProps = {
  text: string;
  collapsedLines?: number;
};

export default function ReadMoreText({ text, collapsedLines = 4 }: ReadMoreTextProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <p
        className={expanded ? "" : "line-clamp-4"}
        style={expanded ? undefined : { WebkitLineClamp: collapsedLines }}
      >
        {text}
      </p>
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-site-primary transition hover:brightness-110"
        aria-expanded={expanded}
      >
        {expanded ? "Show Less" : "Read More"}
        <span aria-hidden="true" className={expanded ? "rotate-180 transition-transform" : "transition-transform"}>
          ↓
        </span>
      </button>
    </div>
  );
}
