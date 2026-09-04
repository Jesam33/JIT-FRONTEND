"use client";

import { useEffect, useMemo, useState } from "react";
import type { MaterialItem } from "../../../../lib/lms-types";
import { getToken } from "../../../../lib/lms-utils";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import { STUDENT_API } from "../../../../lib/api";
import { apiFetch } from "../../../../lib/fetch-with-timeout";

function isVideoUrl(url: string): boolean {
  const u = url.toLowerCase();
  return u.match(/\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/) !== null
    || u.includes("zoom.us/rec/")
    || u.includes("zoom.us/recording/")
    || u.includes("cloudfront.net")
    || u.includes("s3.amazonaws.com");
}

function MaterialCard({ item }: { item: MaterialItem }) {
  const [playing, setPlaying] = useState(false);
  // Bunny videos stream HLS behind a player iframe (NOT an mp4 <video>). file_url
  // is the player embed URL; thumbnail_url is the poster.
  const isBunny = item.provider === "bunny_stream" || /mediadelivery\.net/.test(item.file_url);
  const resolvedType = item.type === "video" || isBunny || isVideoUrl(item.file_url) ? "video" : item.type ?? "file";
  const processing = isBunny && item.status === "processing";

  return (
    <li className="rounded-lg border border-white/15 bg-black/30 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-white">{item.title}</p>
          <p className="mt-1 text-xs text-white/55">Type: {resolvedType.toUpperCase()}</p>
          {resolvedType === "video" && isBunny ? (
            // Only mount the iframe on click so a page of videos doesn't spin up
            // N players at once — until then we show the thumbnail as a poster.
            <div className="mt-2">
              {playing ? (
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                  <iframe
                    src={`${item.file_url}${item.file_url.includes("?") ? "&" : "?"}autoplay=true&preload=true`}
                    className="h-full w-full"
                    loading="lazy"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    title={item.title}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPlaying(true)}
                  className="group relative block aspect-video w-full overflow-hidden rounded-lg bg-black"
                  aria-label={`Play ${item.title}`}
                >
                  {item.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnail_url} alt="" className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-white/40">Video lesson</div>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 ring-1 ring-white/40 backdrop-blur-sm transition group-hover:scale-105">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="white" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                    </span>
                  </span>
                </button>
              )}
              {processing ? (
                <p className="mt-1 text-[11px] text-amber-300/80">Still processing. If it doesn&apos;t play yet, check back in a few minutes.</p>
              ) : null}
            </div>
          ) : resolvedType === "video" ? (
            // Legacy direct video (Zoom recording / hosted mp4).
            <div className="mt-2">
              <video
                controls
                preload="metadata"
                className="w-full max-h-64 rounded-lg bg-black"
                onError={(e) => { (e.target as HTMLVideoElement).style.display = "none"; }}
              >
                <source src={item.file_url} />
              </video>
              <div className="mt-2 flex gap-3">
                <button type="button" onClick={() => window.open(item.file_url, "_blank")} className="text-xs text-blue-400 underline hover:text-blue-300">
                  Open in new tab
                </button>
                <a href={item.file_url} download className="text-xs text-emerald-400 underline hover:text-emerald-300">
                  Download
                </a>
              </div>
            </div>
          ) : resolvedType === "image" ? (
            <div className="mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.file_url} alt={item.title} className="max-h-64 rounded-lg object-contain bg-black" loading="lazy" />
              <a href={item.file_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-blue-400 underline">
                Open full size
              </a>
            </div>
          ) : (
            <a href={item.file_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-blue-400 underline hover:text-blue-300">
              Open material
            </a>
          )}
        </div>
      </div>
    </li>
  );
}

export default function StudentMaterialsPage() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [materialsFilter, setMaterialsFilter] = useState<"all" | "file" | "link" | "image" | "video">("all");
  const [loading, setLoading] = useState(true);

  const token = useMemo(() => getToken(), []);

  useEffect(() => {
    if (!token) return;

    apiFetch(STUDENT_API.materials)
      .then((res) => res.json())
      .then((payload) => { setMaterials(Array.isArray(payload) ? payload : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const inferredMaterials = useMemo(() => {
    return materials.map((item) => {
      const isBunny = item.provider === "bunny_stream" || /mediadelivery\.net/.test(item.file_url);
      if (item.type === "video" || isBunny || isVideoUrl(item.file_url)) {
        return { ...item, type: "video" as const };
      }
      if (item.type === "image" || item.file_url.toLowerCase().match(/\.(png|jpg|jpeg|gif|webp|svg)(\?|$)/)) {
        return { ...item, type: "image" as const };
      }
      if (item.type === "link" || item.file_url.startsWith("http://") || item.file_url.startsWith("https://")) {
        return { ...item, type: "link" as const };
      }
      return { ...item, type: "file" as const };
    });
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    if (materialsFilter === "all") return inferredMaterials;
    return inferredMaterials.filter((item) => item.type === materialsFilter);
  }, [inferredMaterials, materialsFilter]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="text-xl font-semibold">Materials</h2>
      <p className="mt-2 text-sm text-white/70">All your learning materials with inline video player and download.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(["all", "file", "link", "image", "video"] as const).map((filter) => (
          <button key={filter} type="button" onClick={() => setMaterialsFilter(filter)} className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] ${materialsFilter === filter ? "border-white bg-white text-black" : "border-white/20 bg-white/5 text-white"}`}>
            {filter}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {filteredMaterials.length === 0 ? (
          <p className="text-sm text-white/70">No materials available for this filter.</p>
        ) : (
          <ul className="space-y-2">
            {filteredMaterials.map((item) => (
              <MaterialCard key={item.id} item={item} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
