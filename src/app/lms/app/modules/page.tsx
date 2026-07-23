"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { STUDENT_MODULE_API } from "../../../../lib/api";
import { fetchWithTimeout } from "../../../../lib/fetch-with-timeout";

type ModuleContent = {
  id: number;
  module_id: number;
  title: string;
  type: string;
  content_url: string | null;
  content_body: string | null;
  sort_order: number;
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
};

export default function StudentModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("lms_student_token") ?? "" : "";

  useEffect(() => {
    if (!token) return;
    fetchWithTimeout(STUDENT_MODULE_API.modules, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { setModules(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  if (loading) return <p className="text-sm text-white/60">Loading modules...</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold">Course Modules</h2>
      <p className="mt-2 text-sm text-white/70">Work through the modules for your course.</p>

      <div className="mt-4 space-y-4">
        {modules.length === 0 ? (
          <p className="text-sm text-white/60">No modules available yet.</p>
        ) : (
          modules.map((m, i) => (
            <Link
              key={m.id}
              href={`/lms/app/modules/${m.id}`}
              className="block rounded-lg border border-white/15 bg-black/30 p-4 transition hover:border-white/30 hover:bg-black/40"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">Module {i + 1}: {m.title}</p>
                  {m.description ? <p className="mt-1 text-xs text-white/60 line-clamp-2">{m.description}</p> : null}
                </div>
                <span className="shrink-0 text-xs text-white/50">{m.contents.length} items</span>
              </div>
              {m.contents.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.contents.map((c) => (
                    <span key={c.id} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-white/70">
                      {typeIcons[c.type] ?? "📄"} {c.title}
                    </span>
                  ))}
                </div>
              ) : null}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
