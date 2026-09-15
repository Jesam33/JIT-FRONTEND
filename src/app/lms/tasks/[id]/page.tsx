"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { STUDENT_API } from "../../../../lib/api";
import { apiFetch, okJson } from "../../../../lib/fetch-with-timeout";
import type { TaskAttachment } from "../../../../lib/lms-types";

type TaskDetail = {
  id: number;
  title: string;
  description: string;
  instructions: string | null;
  due_at: string;
  submission_type: "link" | "file_upload";
  attachments?: TaskAttachment[];
  submission: {
    submitted_link: string | null;
    // Multiple labelled links (label + URL + optional comment) when the task
    // asks for more than one deliverable.
    links?: { label: string; url: string; comment: string | null }[] | null;
    submitted_file_url: string | null;
    submitted_at: string;
    score: number | null;
    feedback: string | null;
    graded_at: string | null;
  } | null;
};

// One editable row of the link list the student builds before submitting.
type LinkRow = { label: string; url: string; comment: string };

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 10 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function LmsTaskDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const taskId = params?.id;

  const [task, setTask] = useState<TaskDetail | null>(null);
  // Repeatable labelled links (Label + URL + Comment per row); starts with one
  // empty row, more are added with "+ Add another link".
  const [linkRows, setLinkRows] = useState<LinkRow[]>([{ label: "", url: "", comment: "" }]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  // Success confirmation — shown instead of bouncing the student off the page.
  const [showSuccess, setShowSuccess] = useState(false);

  const token = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return localStorage.getItem("lms_student_token") ?? "";
  }, []);

  useEffect(() => {
    if (!token || !taskId) {
      return;
    }

    setLoadError(false);
    apiFetch(STUDENT_API.taskDetail(taskId))
      .then((res) => okJson<TaskDetail>(res))
      .then((payload) => setTask(payload))
      .catch(() => setLoadError(true));
  }, [taskId, token, reloadKey]);

  function updateLinkRow(i: number, patch: Partial<LinkRow>) {
    setLinkRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function submitTask() {
    if (!task || !token || isSubmitting || task.submission) {
      return;
    }

    setMessage("");
    setIsSubmitting(true);

    // Each link needs a label and a URL (the comment is optional). Rows the
    // student never touched are ignored entirely.
    const filledRows =
      task.submission_type === "link"
        ? linkRows.filter((r) => r.label.trim() || r.url.trim() || r.comment.trim())
        : [];
    if (task.submission_type === "link") {
      if (filledRows.length === 0 || filledRows.some((r) => !r.label.trim() || !r.url.trim())) {
        setMessage("Every link needs a label and a URL (the comment is optional).");
        setIsSubmitting(false);
        return;
      }
    }

    let response: Response;

    if (task.submission_type === "file_upload" && selectedFile) {
      const formData = new FormData();
      formData.append("submitted_file", selectedFile);
      response = await apiFetch(STUDENT_API.submitTask(task.id), {
        method: "POST",
        body: formData,
      });
    } else {
      const payload =
        task.submission_type === "link"
          ? {
              // First URL also lands in the legacy single-link field so older
              // consumers (and the previous display) keep working.
              submitted_link: filledRows[0].url.trim(),
              links: filledRows.map((r) => ({
                label: r.label.trim(),
                url: r.url.trim(),
                comment: r.comment.trim() || null,
              })),
            }
          : { submitted_link: linkRows[0].url.trim() };
      response = await apiFetch(STUDENT_API.submitTask(task.id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    const result = await response.json();
    setMessage(result?.message ?? (response.ok ? "Submitted." : "Submission failed."));

    if (response.ok) {
      // Reflect the new submission on the page, then confirm with the modal.
      setTask((prev) =>
        prev
          ? {
              ...prev,
              submission: {
                submitted_link: task.submission_type === "link" ? filledRows[0].url.trim() : null,
                links:
                  task.submission_type === "link"
                    ? filledRows.map((r) => ({
                        label: r.label.trim(),
                        url: r.url.trim(),
                        comment: r.comment.trim() || null,
                      }))
                    : null,
                submitted_file_url: task.submission_type === "file_upload" ? (result?.submission?.submitted_file_url ?? null) : null,
                submitted_at: new Date().toISOString(),
                score: null,
                feedback: null,
                graded_at: null,
              },
            }
          : prev,
      );
      setShowSuccess(true);
      return;
    }

    setIsSubmitting(false);
  }

  // Esc closes the success modal (same convention as the staff task modals).
  useEffect(() => {
    if (!showSuccess) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") router.push("/lms/app/tasks"); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showSuccess, router]);

  if (!task) {
    return (
      <div className="max-w-3xl pb-8 pl-2 md:pl-6">
        <Link href="/lms/app/tasks" className="text-xs uppercase tracking-[0.14em] text-white/50 transition hover:text-white">Tasks</Link>
        <p className="mt-4 text-sm text-white/70">
          {loadError ? (
            <>
              Couldn&apos;t load this task.{" "}
              <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="text-white underline underline-offset-2">Retry</button>
            </>
          ) : (
            "Loading task..."
          )}
        </p>
      </div>
    );
  }

  const overdue = !task.submission && task.due_at && new Date(task.due_at).getTime() < Date.now();
  const submission = task.submission;
  const status = submission ? (submission.score !== null ? "graded" : "submitted") : "pending";

  return (
    <div className="max-w-3xl pb-8 pl-2 md:pl-6">
      {/* Breadcrumb instead of a back button: the sidebar (or browser back
          on mobile) already handles navigation — this just names the parent. */}
      <Link href="/lms/app/tasks" className="text-xs uppercase tracking-[0.14em] text-white/50 transition hover:text-white">Tasks</Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <h1 className="text-2xl font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>{task.title}</h1>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${status === "graded" ? "bg-emerald-500/20" : status === "submitted" ? "bg-amber-500/20" : "bg-blue-500/20"}`}
          style={{ color: status === "graded" ? "#059669" : status === "submitted" ? "#d97706" : "#2563eb" }}
        >
          {status === "graded" && submission?.score !== null ? `${submission?.score}%` : status}
        </span>
      </div>

      {/* Meta row */}
      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
        {task.due_at ? (
          <span className={overdue ? "text-red-400" : "text-white/70"}>
            <span className="text-white/40">Due </span>
            {overdue ? "Overdue · " : ""}{formatDate(task.due_at)}
          </span>
        ) : null}
        <span className="text-white/70">
          <span className="text-white/40">Submit via </span>
          {task.submission_type === "link" ? "Link" : "File upload"}
        </span>
      </div>

      {/* Body */}
      <p className="mt-6 leading-relaxed text-white/85">{task.description}</p>

      {task.instructions ? (
        <div className="mt-6 border-l-2 border-white/25 pl-4 text-sm leading-relaxed text-white/75">
          {task.instructions}
        </div>
      ) : null}

      {/* Files the teacher attached to this task (datasets, documents…). */}
      {task.attachments && task.attachments.length > 0 ? (
        <section className="mt-10 border-t border-white/10 pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">Task resources</h2>
          <ul className="mt-3 divide-y divide-white/10">
            {task.attachments.map((a, i) => (
              <li key={i} className="flex items-center gap-3 py-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-white/50" aria-hidden="true"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-white">{a.name}</span>
                  {a.size ? <span className="block text-[11px] text-white/40">{formatBytes(a.size)}</span> : null}
                </span>
                <a href={a.url} target="_blank" rel="noreferrer" download className="shrink-0 text-xs font-semibold uppercase tracking-[0.08em] text-white/70 underline underline-offset-4 transition hover:text-white">Download</a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Submission */}
      <section className="mt-10 border-t border-white/10 pt-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
          {submission ? "Your submission" : "Submit your work"}
        </h2>

        {!submission ? (
          <div className="mt-4 space-y-4">
            {task.submission_type === "link" ? (
              <div className="space-y-3">
                {linkRows.map((row, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">Link {i + 1}</span>
                      {linkRows.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => setLinkRows((rows) => rows.filter((_, idx) => idx !== i))}
                          className="text-xs text-red-400 transition hover:text-red-300"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <input value={row.label} onChange={(e) => updateLinkRow(i, { label: e.target.value })} placeholder="Label (e.g. GitHub repo)" className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" />
                      <input value={row.url} onChange={(e) => updateLinkRow(i, { url: e.target.value })} placeholder="https://…" className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" />
                    </div>
                    <input value={row.comment} onChange={(e) => updateLinkRow(i, { comment: e.target.value })} placeholder="Comment — what is this link? (optional)" className="mt-2 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" />
                  </div>
                ))}
                {linkRows.length < 20 ? (
                  <button
                    type="button"
                    onClick={() => setLinkRows((rows) => [...rows, { label: "", url: "", comment: "" }])}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    Add another link
                  </button>
                ) : null}
              </div>
            ) : (
              <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} className="w-full text-sm text-white file:mr-3 file:rounded file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:text-white" />
            )}

            <div className="flex items-center gap-4">
              <button type="button" onClick={submitTask} disabled={isSubmitting} className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50">
                {isSubmitting ? "Submitting..." : "Submit Task"}
              </button>
              <p className="text-xs text-white/50">One-time only. You cannot edit after submitting.</p>
            </div>

            {message ? <p className="text-sm text-white/80">{message}</p> : null}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-white/70">Submitted on {formatDate(submission.submitted_at)}</p>

            {submission.links && submission.links.length > 0 ? (
              <ul className="space-y-2">
                {submission.links.map((l, i) => (
                  <li key={i} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <span className="text-sm font-semibold text-white">{l.label}</span>
                      <a href={l.url} target="_blank" rel="noreferrer" className="break-all text-sm text-blue-400 underline underline-offset-2">{l.url}</a>
                    </div>
                    {l.comment ? <p className="mt-1 text-sm leading-relaxed text-white/60">{l.comment}</p> : null}
                  </li>
                ))}
              </ul>
            ) : submission.submitted_link ? (
              <p className="text-sm break-all">
                <span className="text-white/50">Link: </span>
                <a href={submission.submitted_link} target="_blank" rel="noreferrer" className="text-blue-400 underline underline-offset-2">{submission.submitted_link}</a>
              </p>
            ) : null}

            {submission.submitted_file_url ? (
              <a href={submission.submitted_file_url} target="_blank" rel="noreferrer" download className="inline-flex items-center gap-2 text-sm font-semibold text-white underline underline-offset-4">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Download submitted file
              </a>
            ) : null}

            {submission.score !== null ? (
              <div>
                <p className="text-5xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                  {submission.score}
                  <span className="text-xl text-white/50">/100</span>
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em]" style={{ color: submission.score >= 70 ? "#059669" : "#d97706" }}>
                  {submission.score >= 70 ? "Passed" : "Below passing grade"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-white/60">Awaiting grading.</p>
            )}

            {submission.feedback ? (
              <div className="border-l-2 border-white/25 pl-4 text-sm leading-relaxed text-white/75">
                <span className="text-white/50">Feedback: </span>{submission.feedback}
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* Success confirmation modal — pops in (slideUp) over a faded backdrop. */}
      {showSuccess ? (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => router.push("/lms/app/tasks")}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-submitted-title"
            className="animate-slide-up w-full max-w-sm rounded-2xl border border-white/15 bg-[#0b0b0b] p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
            </span>
            <h2 id="task-submitted-title" className="mt-4 text-lg font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>Task submitted successfully</h2>
            <p className="mt-2 text-sm text-white/60">Your submission has been received and is now awaiting grading.</p>
            <button
              type="button"
              onClick={() => router.push("/lms/app/tasks")}
              className="mt-6 w-full rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              View Tasks
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
