"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { STUDENT_API } from "../../../../lib/api";
import { getToken } from "../../../../lib/lms-utils";

type TaskItem = {
  id: number;
  module_id?: number | null;
  title: string;
  description: string;
  instructions: string | null;
  due_at: string;
  submission_type: "link" | "file_upload";
  status: "pending" | "submitted" | "graded";
  submitted_at: string | null;
  score: number | null;
};

export default function StudentTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  const token = useMemo(() => getToken(), []);

  useEffect(() => {
    if (!token) return;
    fetch(STUDENT_API.tasks, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setTasks(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  if (loading) return <p className="text-sm text-white/60">Loading tasks...</p>;

  const grouped = { pending: tasks.filter((t) => t.status === "pending"), submitted: tasks.filter((t) => t.status === "submitted"), graded: tasks.filter((t) => t.status === "graded") };

  return (
    <div>
      <h2 className="text-xl font-semibold">Tasks</h2>
      <p className="mt-2 text-sm text-white/70">All your assigned tasks and their current status.</p>

      <div className="mt-4 space-y-6">
        {(["pending", "submitted", "graded"] as const).map((section) => (
          <div key={section}>
            <h3 className="mb-2 text-xs uppercase tracking-[0.14em] text-white/60 capitalize">{section} ({grouped[section].length})</h3>
            {grouped[section].length === 0 ? (
              <p className="text-sm text-white/60">No {section} tasks.</p>
            ) : (
              <div className="space-y-2">
                {grouped[section].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => router.push(`/lms/tasks/${t.id}`)}
                    className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3 text-left transition hover:bg-white/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-white">{t.title}</p>
                        <p className="mt-1 text-xs text-white/60">
                          {t.due_at ? `Due: ${new Date(t.due_at).toLocaleString()}` : "No deadline"}
                          {t.module_id ? ` \u00b7 Module ${t.module_id}` : ""}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${
                        t.status === "graded" ? (t.score !== null && t.score >= 70 ? "bg-emerald-500/20 text-emerald-200" : "bg-emerald-500/20 text-emerald-200") :
                        t.status === "submitted" ? "bg-amber-500/20 text-amber-200" :
                        "bg-blue-500/20 text-blue-200"
                      }`}>
                        {t.status === "graded" && t.score !== null ? `${t.score}%` : t.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
