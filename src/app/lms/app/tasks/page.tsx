"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { STUDENT_API } from "../../../../lib/api";
import { getToken } from "../../../../lib/lms-utils";
import type { TaskItem } from "../../../../lib/lms-types";
import { apiFetch, okJson } from "../../../../lib/fetch-with-timeout";
import LoadingSpinner from "../../../../components/LoadingSpinner";

type Filter = "all" | "pending" | "submitted" | "graded";

const statusColors: Record<TaskItem["status"], string> = {
  graded: "#059669",
  submitted: "#d97706",
  pending: "#2563eb",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function StudentTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const token = useMemo(() => getToken(), []);

  useEffect(() => {
    if (!token) return;
    setLoadError(false);
    apiFetch(STUDENT_API.tasks)
      .then((r) => okJson<TaskItem[]>(r))
      .then((d) => { setTasks(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => { setLoadError(true); setLoading(false); });
  }, [token, reloadKey]);

  const counts = useMemo(() => ({
    all: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    submitted: tasks.filter((t) => t.status === "submitted").length,
    graded: tasks.filter((t) => t.status === "graded").length,
  }), [tasks]);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      const filterOk = filter === "all" || t.status === filter;
      const searchOk = !q || t.title.toLowerCase().includes(q);
      return filterOk && searchOk;
    });
  }, [tasks, filter, search]);

  if (loading) return <LoadingSpinner />;

  if (loadError) {
    return (
      <div>
        <h2 className="text-xl font-semibold">Tasks</h2>
        <p className="mt-2 text-sm text-white/70">
          Couldn&apos;t load your tasks.{" "}
          <button type="button" onClick={() => { setLoading(true); setReloadKey((k) => k + 1); }} className="text-white underline underline-offset-2">Retry</button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">Tasks</h2>
      <p className="mt-2 text-sm text-white/70">All your assigned tasks and their current status.</p>

      {/* Summary tiles */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {(["pending", "submitted", "graded"] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(filter === status ? "all" : status)}
            className={`rounded-lg border px-3 py-3 text-left transition ${filter === status ? "border-white/40 bg-white/10" : "border-white/15 bg-black/30 hover:bg-white/5"}`}
          >
            <p className="text-2xl font-semibold" style={{ color: statusColors[status] }}>{counts[status]}</p>
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/60">{status}</p>
          </button>
        ))}
      </div>

      {/* Filter chips + search */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {(["all", "pending", "submitted", "graded"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] ${filter === f ? "border-white bg-white text-black" : "border-white/20 bg-white/5 text-white"}`}
          >
            {f}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks…"
          className="ml-auto w-full max-w-xs rounded-full border border-white/20 bg-black/30 px-4 py-1.5 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
        />
      </div>

      {/* Task list */}
      <div className="mt-4 space-y-2">
        {filteredTasks.length === 0 ? (
          <p className="rounded-lg border border-white/15 bg-black/30 px-4 py-8 text-center text-sm text-white/70">
            {search.trim() || filter !== "all" ? "No tasks match this filter." : "No tasks assigned yet."}
          </p>
        ) : (
          filteredTasks.map((t) => {
            const overdue = t.status === "pending" && t.due_at && new Date(t.due_at).getTime() < Date.now();
            const attachmentCount = t.attachments?.length ?? 0;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => router.push(`/lms/tasks/${t.id}`)}
                className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3 text-left transition hover:bg-white/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-white">{t.title}</p>
                    <p className={`mt-1 text-xs ${overdue ? "text-red-400" : "text-white/60"}`}>
                      {t.due_at ? `${overdue ? "Overdue · " : ""}Due: ${formatDate(t.due_at)}` : "No deadline"}
                      {t.module_id ? ` · Module ${t.module_id}` : ""}
                      {attachmentCount > 0 ? ` · ${attachmentCount} file${attachmentCount === 1 ? "" : "s"}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${t.status === "graded" ? "bg-emerald-500/20" : t.status === "submitted" ? "bg-amber-500/20" : "bg-blue-500/20"}`}
                    style={{ color: statusColors[t.status] }}
                  >
                    {t.status === "graded" && t.score !== null ? `${t.score}%` : t.status}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
