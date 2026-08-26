"use client";

import { useState } from "react";
import InnerPageHero from "@/components/layout/InnerPageHero";
import { policies, type Policy, type PolicyBlock } from "@/lib/policies-content";

/** A PART and the blocks that belong under it (up to the next PART). */
type PartSegment = { part: Extract<PolicyBlock, { type: "part" }>; body: PolicyBlock[] };

/**
 * Split a policy's flat block list into:
 *  - intro:      blocks before the first PART (always visible)
 *  - segments:   each PART + the blocks beneath it (rendered as a collapsible accordion)
 *  - copyright:  the trailing copyright line (always visible)
 * Policies with no PART blocks (e.g. the shorter ones) fall through with everything in `intro`.
 */
function groupByPart(blocks: PolicyBlock[]) {
  const intro: PolicyBlock[] = [];
  const segments: PartSegment[] = [];
  let copyright: Extract<PolicyBlock, { type: "copyright" }> | null = null;
  let current: PartSegment | null = null;

  for (const block of blocks) {
    if (block.type === "copyright") {
      copyright = block;
      continue;
    }
    if (block.type === "part") {
      current = { part: block, body: [] };
      segments.push(current);
      continue;
    }
    if (current) current.body.push(block);
    else intro.push(block);
  }

  return { intro, segments, copyright };
}

function renderBlock(block: PolicyBlock, i: number) {
  switch (block.type) {
    case "part":
      // PARTs are rendered as accordion headers by PolicyBody, never inline.
      return null;
    case "section":
      return (
        <h4 key={i} className="mt-7 font-semibold text-site-text">
          {block.num}. {block.title}
        </h4>
      );
    case "list":
      return (
        <ul
          key={i}
          className="mt-3 list-disc space-y-1.5 pl-5 text-site-text/80 marker:text-site-primary"
        >
          {block.items.map((item, j) => (
            <li key={j} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      );
    case "copyright":
      return (
        <p key={i} className="mt-12 border-t border-site-border/25 pt-6 text-sm text-site-text/50">
          {block.text}
        </p>
      );
    case "paragraph":
    default:
      return (
        <p key={i} className="mt-3 leading-relaxed text-site-text/80">
          {block.text}
        </p>
      );
  }
}

function PolicyBody({ policy }: { policy: Policy }) {
  const { intro, segments, copyright } = groupByPart(policy.blocks);

  return (
    <article className="max-w-3xl">
      <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
        {policy.title}
      </h2>
      {(policy.lastUpdated || policy.effectiveDate) && (
        <p className="mt-2 text-sm text-site-text/55">
          {policy.lastUpdated ? <>Last updated: {policy.lastUpdated}</> : null}
          {policy.lastUpdated && policy.effectiveDate ? " · " : ""}
          {policy.effectiveDate ? <>Effective: {policy.effectiveDate}</> : null}
        </p>
      )}

      {/* Intro blocks (before the first PART) always visible */}
      {intro.length > 0 && <div className="mt-8">{intro.map(renderBlock)}</div>}

      {/* Each PART is a collapsible accordion, closed by default so the page stays compact */}
      {segments.length > 0 && (
        <div className="mt-8 space-y-3">
          {segments.map((seg, i) => (
            <details
              key={i}
              className="group rounded-xl border border-site-border/25 bg-site-surface-soft/40 open:bg-site-surface-soft/60"
            >
              <summary className="flex cursor-pointer list-none items-start gap-3 rounded-xl px-5 py-4 transition hover:bg-site-surface-soft/80">
                <div className="min-w-0 flex-1">
                  {seg.part.label ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-site-primary">
                      {seg.part.label}
                    </p>
                  ) : null}
                  <h3
                    className={`text-base font-semibold text-site-text${seg.part.label ? " mt-1" : ""}`}
                  >
                    {seg.part.title}
                  </h3>
                </div>
                <svg
                  className="mt-1 h-5 w-5 shrink-0 text-site-text/50 transition-transform duration-200 group-open:rotate-180"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                >
                  <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <div className="border-t border-site-border/20 px-5 pb-6 pt-1">
                {seg.body.map(renderBlock)}
              </div>
            </details>
          ))}
        </div>
      )}

      {copyright ? renderBlock(copyright, -1) : null}
    </article>
  );
}

export default function PoliciesPage() {
  const [activeId, setActiveId] = useState(policies[0]?.id ?? "");
  const active = policies.find((p) => p.id === activeId) ?? policies[0];

  return (
    <section>
      <InnerPageHero title="Policies" subtitle="LEGAL & COMPLIANCE">
        <p>
          These policies govern how the JIT Campus platform may be used. Select a policy to read it
          in full.
        </p>
      </InnerPageHero>

      <div className="container-wide py-14">
        {policies.length === 0 ? (
          <p className="text-site-text/70">Our policies will be published here shortly.</p>
        ) : (
          <div className="lg:flex lg:gap-12">
            {/* Policy nav: horizontal scroll on mobile, sticky vertical list on desktop */}
            <nav
              aria-label="Policies"
              className="mb-8 flex gap-2 overflow-x-auto pb-1 lg:mb-0 lg:w-72 lg:shrink-0 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:pb-0 lg:self-start lg:sticky lg:top-24"
            >
              {policies.map((p) => {
                const isActive = p.id === active?.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActiveId(p.id)}
                    aria-current={isActive ? "true" : undefined}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition lg:whitespace-normal lg:text-left ${
                      isActive
                        ? "bg-[#ed180d] text-white"
                        : "border border-site-border/30 text-site-text/70 hover:border-site-border/60 hover:text-site-text"
                    }`}
                  >
                    {p.shortTitle}
                  </button>
                );
              })}
            </nav>

            {/* key={active.id} resets accordion open/closed state when switching policies */}
            <div className="min-w-0 flex-1">
              {active ? <PolicyBody key={active.id} policy={active} /> : null}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
