"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { STUDENT_MODULE_API } from "../../../../../lib/api";
import { apiFetch } from "../../../../../lib/fetch-with-timeout";

type ModuleContent = {
  id: number;
  module_id: number;
  title: string;
  type: string;
  content_url: string | null;
  content_body: string | null;
  sort_order: number;
  // Externally-hosted video (Bunny Stream) pointers, content_url is the player
  // embed URL for a video uploaded to Bunny.
  provider?: string | null;
  thumbnail_url?: string | null;
  status?: string | null;
};

type Module = {
  id: number;
  course_id: number;
  title: string;
  description: string | null;
  objectives: string | null;
  sort_order: number;
  contents: ModuleContent[];
};

const typeIcons: Record<string, string> = {
  slides: "📽",
  pdf: "📄",
  video: "🎬",
  link: "🔗",
  text: "📝",
  code: "💻",
  file: "📁",
  doc: "📄",
  image: "🖼",
};

function renderContent(c: ModuleContent) {
  switch (c.type) {
    case "link":
      return c.content_url ? (
        <a href={c.content_url} target="_blank" rel="noreferrer" className="text-blue-400 underline hover:text-blue-300">
          {c.content_url}
        </a>
      ) : null;
    case "video":
      return c.content_url ? (
        <div>
          <div className="aspect-video overflow-hidden rounded bg-black">
            <iframe
              src={c.content_url}
              className="h-full w-full"
              loading="lazy"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              title={c.title}
            />
          </div>
          {c.provider === "bunny_stream" && c.status === "processing" ? (
            <p className="mt-1 text-[11px] text-amber-300/80">Still processing. If it doesn&apos;t play yet, check back in a few minutes.</p>
          ) : null}
        </div>
      ) : null;
    case "image":
      return c.content_url ? (
        <a href={c.content_url} target="_blank" rel="noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.content_url} alt={c.title} className="max-h-[420px] max-w-full rounded-lg border border-white/15 object-contain" />
        </a>
      ) : null;
    case "slides":
    case "pdf":
    case "file":
    case "doc":
      return c.content_url ? (
        <a href={c.content_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded bg-white/10 px-4 py-2 text-sm text-blue-400 underline hover:bg-white/15">
          Open {c.type}
        </a>
      ) : null;
    case "code":
      return c.content_body ? (
        <pre className="overflow-x-auto rounded bg-black/50 p-4 text-sm text-green-300"><code>{c.content_body}</code></pre>
      ) : null;
    case "text":
    default:
      return c.content_body ? (
        <div className="prose prose-invert max-w-none text-sm text-white/80 whitespace-pre-wrap">{c.content_body}</div>
      ) : null;
  }
}

export default function ModuleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("lms_student_token") ?? "" : "";

  useEffect(() => {
    if (!token || !id) return;
    apiFetch(STUDENT_MODULE_API.module(id))
      .then((r) => { if (!r.ok) throw new Error("Not OK"); return r.json(); })
      .then((d) => { setModule(Array.isArray(d) ? null : d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token, id]);

  // One-click module zip (files + README of links/text/Bunny videos). Fetched
  // as a blob because the auth header can't ride on a plain anchor href.
  async function downloadModule() {
    if (!module || downloading) return;
    setDownloading(true);
    try {
      const res = await apiFetch(STUDENT_MODULE_API.moduleDownload(module.id));
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${module.title.replace(/[^\w-]+/g, "-").toLowerCase() || "module"}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Silent failure keeps the page calm; the button just re-enables.
    } finally {
      setDownloading(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        <p className="text-sm text-white/50">Loading module...</p>
      </div>
    </div>
  );
  if (!module) return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-sm text-white/60">Module not found.</p>
    </div>
  );

  const sortedContents = [...module.contents].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="max-w-4xl">
      <div className="relative mb-6 pt-1">
        <Link
          href="/lms/app/modules"
          className="absolute -left-1 top-0 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/60 shadow-lg backdrop-blur-sm transition hover:border-white/30 hover:bg-white/10 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
        </Link>
        <div className="pl-12">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{module.title}</h1>
              {module.description ? <p className="mt-1 text-sm text-white/60">{module.description}</p> : null}
            </div>
            <button
              type="button"
              onClick={downloadModule}
              disabled={downloading || module.contents.length === 0}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/10 hover:text-white disabled:opacity-50"
              title="Download this module's files as a zip (links and videos are listed in a README)"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {downloading ? "Preparing…" : "Download module"}
            </button>
          </div>
        </div>
      </div>

      {module.objectives ? (
        <div className="mb-8 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-5">
          <h2 className="text-xs uppercase tracking-[0.18em] text-emerald-400/70">Learning Objectives</h2>
          <p className="mt-2 text-sm text-white/75 leading-relaxed whitespace-pre-wrap">{module.objectives}</p>
        </div>
      ) : null}

      <div className="space-y-1">
        {sortedContents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 py-12 text-center">
            <p className="text-sm text-white/40">No content in this module yet.</p>
          </div>
        ) : (
          sortedContents.map((c, i) => (
            <div key={c.id} className="group rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent p-5 transition hover:border-white/[0.12]">
              <div className="flex items-start gap-4">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm">{typeIcons[c.type] ?? "📄"}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-white">{c.title}</h3>
                  <span className="mt-0.5 inline-block text-[11px] uppercase tracking-wider text-white/35">{c.type}</span>
                  <div className="mt-3">{renderContent(c)}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
