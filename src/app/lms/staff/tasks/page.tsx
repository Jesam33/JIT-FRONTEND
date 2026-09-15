"use client";

import { useEffect, useMemo, useState } from "react";
import { STAFF_API } from "../../../../lib/api";
import { apiFetchStaff, okJson } from "../../../../lib/fetch-with-timeout";
import type { TaskAttachment } from "../../../../lib/lms-types";
import ConfirmDialog from "../../../../components/ConfirmDialog";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import { useToast } from "../../../../components/ToastProvider";

type Course = { id: number; title: string };
type Module = { id: number; title: string; course_id: number };

// What the list/detail endpoints return (model shape): attachments carry the
// internal storage path too, which the form needs for edit + file cleanup.
type Task = {
  id: number;
  course_id: number;
  module_id: number;
  title: string;
  description?: string | null;
  instructions?: string | null;
  due_at?: string | null;
  submission_type: string;
  attachments?: TaskAttachmentInternal[] | null;
  submissions_count?: number;
  ungraded_count?: number;
};

type TaskAttachmentInternal = TaskAttachment & { path?: string | null };

type Submission = {
  id: number;
  task_id: number;
  student_id: number;
  student?: { id: number; first_name?: string; last_name?: string; email?: string };
  task?: { id: number; title: string; course_id: number; due_at?: string | null; submission_type: string } | null;
  submitted_link?: string | null;
  // Multiple labelled links (label + URL + optional comment) the student
  // attached to this submission.
  links?: { label: string; url: string; comment: string | null }[] | null;
  submitted_file_url?: string | null;
  submitted_at?: string | null;
  score?: number | null;
  feedback?: string | null;
  graded_at?: string | null;
};

const MAX_ATTACHMENTS = 5;

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

function formatDate(iso?: string | null): string {
  if (!iso) return "No deadline";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

// ─── Modal shell ────────────────────────────────────────────

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className={`max-h-[85vh] w-full overflow-y-auto rounded-2xl border border-white/15 bg-[#0b0b0b] p-6 shadow-2xl ${wide ? "max-w-2xl" : "max-w-lg"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none";

// ─── Create / Edit form ─────────────────────────────────────

type AttachmentDraft = TaskAttachmentInternal & { uploading?: boolean; uploadError?: string };

function TaskFormModal({
  task, courses, onClose, onSaved,
}: {
  task: Task | null;
  courses: Course[];
  onClose: () => void;
  onSaved: (task: Task) => void;
}) {
  const { toast } = useToast();
  const editing = task !== null;

  const [courseId, setCourseId] = useState(task ? String(task.course_id) : "");
  const [moduleId, setModuleId] = useState(task ? String(task.module_id) : "");
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [instructions, setInstructions] = useState(task?.instructions ?? "");
  // datetime-local wants "YYYY-MM-DDTHH:mm", not the ISO-8601 the API stores.
  const [dueAt, setDueAt] = useState(
    task?.due_at ? new Date(new Date(task.due_at).getTime() - new Date(task.due_at).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
  );
  const [submissionType, setSubmissionType] = useState(task?.submission_type ?? "link");
  const [attachments, setAttachments] = useState<AttachmentDraft[]>(task?.attachments ?? []);
  const [modules, setModules] = useState<Module[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!courseId) { setModules([]); return; }
    apiFetchStaff(`${STAFF_API.modules}?course_id=${courseId}`)
      .then((r) => okJson<Module[]>(r))
      .then((data) => setModules(Array.isArray(data) ? data : []))
      .catch(() => setModules([]));
  }, [courseId]);

  async function pickFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = MAX_ATTACHMENTS - attachments.length;
    const picked = Array.from(files).slice(0, room);
    if (picked.length < files.length) {
      setError(`A task can have at most ${MAX_ATTACHMENTS} attachments.`);
    }
    for (const file of picked) {
      // Optimistic row with uploading state, replaced by the saved pointer on
      // success. Uploads reuse the materials upload endpoint (platform public
      // disk, 50MB cap, mimes allowlist).
      const tempKey = `${file.name}-${Date.now()}-${Math.random()}`;
      setAttachments((prev) => [...prev, { name: file.name, url: "", size: file.size, uploading: true, path: tempKey }]);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await apiFetchStaff(STAFF_API.materialUpload, { method: "POST", body: fd });
        const data = await okJson<{ url: string; path: string }>(res);
        setAttachments((prev) => prev.map((a) => (a.path === tempKey ? { ...a, url: data.url, path: data.path, uploading: false } : a)));
      } catch (err) {
        const message = err instanceof Error ? err.message : `Could not upload ${file.name}.`;
        setAttachments((prev) => prev.map((a) => (a.path === tempKey ? { ...a, uploading: false, uploadError: message } : a)));
      }
    }
  }

  async function save() {
    if (!courseId || !moduleId || !title.trim()) {
      setError("Course, module and title are required.");
      return;
    }
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }
    if (!instructions.trim()) {
      setError("Instructions are required.");
      return;
    }
    if (!dueAt) {
      setError("Due date is required.");
      return;
    }
    if (attachments.some((a) => a.uploading)) {
      setError("Wait for the uploads to finish.");
      return;
    }
    if (attachments.some((a) => a.uploadError)) {
      setError("Remove the files that failed to upload first.");
      return;
    }

    setSaving(true);
    setError("");

    const body: Record<string, unknown> = {
      course_id: Number(courseId),
      module_id: Number(moduleId),
      title: title.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      due_at: dueAt,
      submission_type: submissionType,
      attachments: attachments.map((a) => ({ name: a.name, url: a.url, path: a.path, size: a.size })),
    };

    try {
      const res = await apiFetchStaff(editing ? STAFF_API.taskUpdate(task.id) : STAFF_API.tasks, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const saved = await okJson<Task>(res);
      toast(editing ? "Task updated." : "Task created.", "success");
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the task.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={editing ? "Edit Task" : "New Task"} onClose={onClose} wide>
      <div className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-xs font-medium uppercase tracking-[0.08em] text-white/60">
            <span>Course <span className="text-red-400">*</span></span>
            <select value={courseId} onChange={(e) => { setCourseId(e.target.value); setModuleId(""); }} disabled={editing} className={inputClass}>
              <option value="">Select course</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-medium uppercase tracking-[0.08em] text-white/60">
            <span>Module <span className="text-red-400">*</span></span>
            <select value={moduleId} onChange={(e) => setModuleId(e.target.value)} className={inputClass}>
              <option value="">Select module</option>
              {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </label>
        </div>

        <label className="grid gap-1 text-xs font-medium uppercase tracking-[0.08em] text-white/60">
          <span>Title <span className="text-red-400">*</span></span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Clean the customer dataset" className={inputClass} required />
        </label>

        <label className="grid gap-1 text-xs font-medium uppercase tracking-[0.08em] text-white/60">
          <span>Description <span className="text-red-400">*</span></span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short summary of the task" rows={2} className={inputClass} required />
        </label>

        <label className="grid gap-1 text-xs font-medium uppercase tracking-[0.08em] text-white/60">
          <span>Instructions <span className="text-red-400">*</span></span>
          <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Step-by-step instructions for students" rows={3} className={inputClass} required />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-xs font-medium uppercase tracking-[0.08em] text-white/60">
            <span>Due date <span className="text-red-400">*</span></span>
            <input value={dueAt} onChange={(e) => setDueAt(e.target.value)} type="datetime-local" className={inputClass} required />
          </label>
          <label className="grid gap-1 text-xs font-medium uppercase tracking-[0.08em] text-white/60">
            <span>Submission type <span className="text-red-400">*</span></span>
            <select value={submissionType} onChange={(e) => setSubmissionType(e.target.value)} className={inputClass}>
              <option value="link">Link</option>
              <option value="file_upload">File upload</option>
            </select>
          </label>
        </div>

        {/* Attachments: files students download while working on the task. */}
        <div className="rounded-xl border border-white/15 bg-black/25 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-white/60">Attachments ({attachments.length}/{MAX_ATTACHMENTS})</p>
            <label className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition ${attachments.length >= MAX_ATTACHMENTS ? "pointer-events-none border-white/10 text-white/30" : "border-white/25 text-white hover:bg-white/10"}`}>
              Add files
              <input type="file" multiple className="hidden" onChange={(e) => { pickFiles(e.target.files); e.currentTarget.value = ""; }} />
            </label>
          </div>
          <p className="mt-1 text-[11px] text-white/40">Datasets, documents, images or archives students need for this task. Max 50MB each.</p>
          {attachments.length > 0 ? (
            <ul className="mt-3 grid gap-2">
              {attachments.map((a, i) => (
                <li key={`${a.path}-${i}`} className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-white/50" aria-hidden="true"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                  <span className="min-w-0 flex-1 truncate text-sm text-white">{a.name}</span>
                  <span className="shrink-0 text-[11px] text-white/40">{a.uploading ? "Uploading…" : a.uploadError ? "" : formatBytes(a.size)}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                    aria-label={`Remove ${a.name}`}
                    className="shrink-0 rounded-full p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-white/40">No files attached yet.</p>
          )}
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-white/20 px-4 py-2 text-sm text-white transition hover:bg-white/10">
            Cancel
          </button>
          <button type="button" onClick={save} disabled={saving} className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60">
            {saving ? "Saving…" : editing ? "Save changes" : "Create task"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Grading row (shared by the Submissions tab) ────────────

function studentName(s: Submission): string {
  const first = s.student?.first_name?.trim();
  const last = s.student?.last_name?.trim();
  if (first || last) return [first, last].filter(Boolean).join(" ");
  return `Student #${s.student_id}`;
}

function GradingInputs({ submission, onGraded }: {
  submission: Submission;
  onGraded: (submission: Submission) => void;
}) {
  const { toast } = useToast();
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [grading, setGrading] = useState(false);

  async function grade() {
    const value = Number(score);
    if (score === "" || Number.isNaN(value) || value < 0 || value > 100) {
      toast("Enter a score between 0 and 100.", "error");
      return;
    }
    setGrading(true);
    try {
      const res = await apiFetchStaff(`${STAFF_API.task(submission.task_id)}/submissions/${submission.id}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: value, feedback: feedback.trim() || null }),
      });
      await okJson(res);
      toast("Submission graded.", "success");
      onGraded({ ...submission, score: value, feedback: feedback.trim() || null, graded_at: new Date().toISOString() });
    } catch {
      toast("Could not save the grade.", "error");
    } finally {
      setGrading(false);
    }
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <input
        value={score}
        onChange={(e) => setScore(e.target.value)}
        placeholder="Score 0-100"
        type="number"
        min={0}
        max={100}
        className="w-28 rounded border border-white/20 bg-black/30 px-2 py-1.5 text-xs text-white placeholder:text-white/40"
      />
      <input
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Feedback (optional)"
        className="min-w-40 flex-1 rounded border border-white/20 bg-black/30 px-2 py-1.5 text-xs text-white placeholder:text-white/40"
      />
      <button
        type="button"
        onClick={grade}
        disabled={grading}
        className="rounded bg-white px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-60"
      >
        {grading ? "Saving…" : "Grade"}
      </button>
    </div>
  );
}

function SubmissionRow({ submission, courseTitles, onGraded }: {
  submission: Submission;
  courseTitles: Map<number, string>;
  onGraded: (submission: Submission) => void;
}) {
  const graded = Boolean(submission.graded_at);
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{studentName(submission)}</p>
          <p className="mt-0.5 truncate text-xs text-white/50">
            {submission.task?.title ?? `Task #${submission.task_id}`}
            {submission.task && courseTitles.has(submission.task.course_id) ? ` · ${courseTitles.get(submission.task.course_id)}` : ""}
            {submission.submitted_at ? ` · ${formatDate(submission.submitted_at)}` : ""}
          </p>
        </div>
        {graded ? (
          <span className="shrink-0 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#059669" }}>
            Graded {submission.score}/100
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#d97706" }}>Awaiting grade</span>
        )}
      </div>
      {submission.links && submission.links.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {submission.links.map((l, i) => (
            <li key={i} className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
              <p className="text-xs font-semibold text-white">{l.label}</p>
              <a href={l.url} target="_blank" rel="noreferrer" className="break-all text-xs text-blue-400 underline">{l.url}</a>
              {l.comment ? <p className="mt-0.5 text-xs leading-relaxed text-white/60">{l.comment}</p> : null}
            </li>
          ))}
        </ul>
      ) : submission.submitted_link ? (
        <p className="mt-1 truncate text-xs text-white/70">
          Link: <a href={submission.submitted_link} target="_blank" rel="noreferrer" className="text-blue-400 underline">{submission.submitted_link}</a>
        </p>
      ) : null}
      {submission.submitted_file_url ? (
        <a href={submission.submitted_file_url} target="_blank" rel="noreferrer" download className="mt-2 inline-block rounded-lg bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20">Download submitted file</a>
      ) : null}
      {graded ? (
        submission.feedback ? <p className="mt-2 text-xs text-white/70">Feedback: {submission.feedback}</p> : null
      ) : (
        <GradingInputs submission={submission} onGraded={onGraded} />
      )}
    </div>
  );
}

// ─── Submissions tab ────────────────────────────────────────

function SubmissionsView({ courses, refreshKey }: {
  courses: Course[];
  refreshKey: number;
}) {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<"awaiting" | "graded" | "all">("awaiting");
  const [courseFilter, setCourseFilter] = useState<number | "all">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiFetchStaff(STAFF_API.taskSubmissions)
      .then((r) => okJson<Submission[]>(r))
      .then((data) => setSubmissions(Array.isArray(data) ? data : []))
      .catch(() => { toast("Could not load submissions.", "error"); setSubmissions([]); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const courseTitles = useMemo(() => new Map(courses.map((c) => [c.id, c.title])), [courses]);

  const counts = useMemo(() => ({
    all: submissions?.length ?? 0,
    awaiting: submissions?.filter((s) => !s.graded_at).length ?? 0,
    graded: submissions?.filter((s) => s.graded_at).length ?? 0,
  }), [submissions]);

  const filtered = useMemo(() => {
    if (!submissions) return [];
    const q = search.trim().toLowerCase();
    return submissions.filter((s) => {
      const statusOk = statusFilter === "all" || (statusFilter === "graded" ? Boolean(s.graded_at) : !s.graded_at);
      const courseOk = courseFilter === "all" || s.task?.course_id === courseFilter;
      const searchOk = !q || studentName(s).toLowerCase().includes(q) || (s.task?.title ?? "").toLowerCase().includes(q);
      return statusOk && courseOk && searchOk;
    });
  }, [submissions, statusFilter, courseFilter, search]);

  const hasMultipleCourses = courses.length > 1;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {(["awaiting", "graded", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setStatusFilter(f)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] ${statusFilter === f ? "border-white bg-white text-black" : "border-white/20 bg-white/5 text-white"}`}
          >
            {f === "awaiting" ? `Awaiting grade (${counts.awaiting})` : f === "graded" ? `Graded (${counts.graded})` : `All (${counts.all})`}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search student or task…"
          className="ml-auto w-full max-w-xs rounded-full border border-white/20 bg-black/30 px-4 py-1.5 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
        />
      </div>

      {hasMultipleCourses ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCourseFilter("all")}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] ${courseFilter === "all" ? "border-white bg-white text-black" : "border-white/20 bg-white/5 text-white"}`}
          >
            All
          </button>
          {courses.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCourseFilter(c.id)}
              className={`max-w-44 truncate rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] ${courseFilter === c.id ? "border-white bg-white text-black" : "border-white/20 bg-white/5 text-white"}`}
            >
              {c.title}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-4">
        {submissions === null ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-white/15 bg-black/30 px-4 py-10 text-center">
            <p className="text-sm text-white/70">
              {submissions.length === 0
                ? "No submissions yet."
                : statusFilter === "awaiting"
                  ? "Nothing waiting on a grade. All caught up."
                  : "No submissions match this filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => (
              <SubmissionRow key={s.id} submission={s} courseTitles={courseTitles} onGraded={(updated) => setSubmissions((prev) => prev?.map((p) => (p.id === updated.id ? updated : p)) ?? prev)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Task detail (info + edit/delete only) ──────────────────

function TaskDetailModal({ task, courses, onEdit, onDelete, onClose }: {
  task: Task;
  courses: Course[];
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const courseTitle = courses.find((c) => c.id === task.course_id)?.title;

  return (
    <Modal title={task.title} onClose={onClose} wide>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
          {courseTitle ? <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5">{courseTitle}</span> : null}
          <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 capitalize">{task.submission_type === "link" ? "Link" : "File upload"}</span>
          <span>Due {formatDate(task.due_at)}</span>
        </div>

        {task.description ? <p className="text-sm text-white/80">{task.description}</p> : null}
        {task.instructions ? (
          <div className="rounded-xl border border-white/15 bg-black/25 p-4 text-sm text-white/80">{task.instructions}</div>
        ) : null}

        {task.attachments && task.attachments.length > 0 ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-white/60">Attachments</p>
            <ul className="mt-2 grid gap-2">
              {task.attachments.map((a, i) => (
                <li key={i} className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-sm text-white">{a.name}</span>
                  <a href={a.url} target="_blank" rel="noreferrer" download className="shrink-0 text-xs text-blue-400 underline hover:text-blue-300">Download</a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="text-xs text-white/50">Submissions and grading live in the Submissions tab.</p>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onEdit} className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10">Edit task</button>
          <button type="button" onClick={onDelete} className="rounded-full border border-red-400/30 px-4 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-400/10">Delete task</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Page ───────────────────────────────────────────────────

export default function StaffTasksPage() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // "tasks" = manage task cards; "submissions" = grade everything across tasks.
  const [view, setView] = useState<"tasks" | "submissions">("tasks");
  // Bumped when a task is created/deleted so the Submissions tab refetches.
  const [submissionsRefreshKey, setSubmissionsRefreshKey] = useState(0);

  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<number | "all">("all");

  const [formTask, setFormTask] = useState<Task | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);

  async function loadTasks() {
    try {
      const data = await apiFetchStaff(STAFF_API.tasks).then((r) => okJson<Task[]>(r));
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      toast("Could not load tasks.", "error");
    }
  }

  useEffect(() => {
    Promise.all([
      apiFetchStaff(STAFF_API.assignedCourses).then((r) => okJson<Course[]>(r)),
      apiFetchStaff(STAFF_API.tasks).then((r) => okJson<Task[]>(r)),
    ])
      .then(([coursesData, tasksData]) => {
        setCourses(Array.isArray(coursesData) ? coursesData : []);
        setTasks(Array.isArray(tasksData) ? tasksData : []);
        setLoading(false);
      })
      .catch(() => {
        toast("Could not load the tasks page.", "error");
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function confirmDelete() {
    if (!deleteTask) return;
    try {
      await okJson(await apiFetchStaff(STAFF_API.taskDelete(deleteTask.id), { method: "DELETE" }));
      toast("Task deleted.", "success");
      setTasks((prev) => prev.filter((t) => t.id !== deleteTask.id));
      setSubmissionsRefreshKey((k) => k + 1);
      if (detailTask?.id === deleteTask.id) setDetailTask(null);
    } catch {
      toast("Could not delete the task.", "error");
    } finally {
      setDeleteTask(null);
    }
  }

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      const courseOk = courseFilter === "all" || t.course_id === courseFilter;
      const searchOk = !q || t.title.toLowerCase().includes(q);
      return courseOk && searchOk;
    });
  }, [tasks, courseFilter, search]);

  const hasMultipleCourses = courses.length > 1;
  const totalUngraded = tasks.reduce((sum, t) => sum + (t.ungraded_count ?? 0), 0);

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-white/70">Create tasks per module, attach files for students to work with, review submissions and grade.</p>
        </div>
        <button
          type="button"
          onClick={() => { setFormTask(null); setFormOpen(true); }}
          className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
        >
          New Task
        </button>
      </div>

      {/* Tasks | Submissions tabs */}
      <div className="mt-4 flex gap-1 border-b border-white/10" role="tablist" aria-label="Tasks views">
        <button
          type="button"
          role="tab"
          aria-selected={view === "tasks"}
          onClick={() => setView("tasks")}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${view === "tasks" ? "border-white text-white" : "border-transparent text-white/55 hover:text-white"}`}
        >
          Tasks
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "submissions"}
          onClick={() => setView("submissions")}
          className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-semibold transition ${view === "submissions" ? "border-white text-white" : "border-transparent text-white/55 hover:text-white"}`}
        >
          Submissions
          {totalUngraded > 0 ? (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#d97706" }}>
              {totalUngraded} to grade
            </span>
          ) : null}
        </button>
      </div>

      {view === "submissions" ? (
        <div className="mt-4">
          <SubmissionsView courses={courses} refreshKey={submissionsRefreshKey} />
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks…"
              className="w-full max-w-xs rounded-full border border-white/20 bg-black/30 px-4 py-1.5 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
            />
            {hasMultipleCourses ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCourseFilter("all")}
                  className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] ${courseFilter === "all" ? "border-white bg-white text-black" : "border-white/20 bg-white/5 text-white"}`}
                >
                  All
                </button>
                {courses.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCourseFilter(c.id)}
                    className={`max-w-44 truncate rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] ${courseFilter === c.id ? "border-white bg-white text-black" : "border-white/20 bg-white/5 text-white"}`}
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-4">
            {loading ? (
              <LoadingSpinner />
            ) : filteredTasks.length === 0 ? (
              <div className="rounded-lg border border-white/15 bg-black/30 px-4 py-10 text-center">
                <p className="text-sm text-white/70">{search.trim() || courseFilter !== "all" ? "No tasks match this filter." : "No tasks yet. Create the first one."}</p>
              </div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filteredTasks.map((t) => {
                  const overdue = t.due_at && new Date(t.due_at).getTime() < Date.now();
                  const attachmentCount = t.attachments?.length ?? 0;
                  const ungraded = t.ungraded_count ?? 0;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => setDetailTask(t)}
                        className="h-full w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3 text-left transition hover:border-white/30 hover:bg-white/5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 flex-1 font-medium text-white">{t.title}</p>
                          <span className="shrink-0 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-white/60">
                            {t.submission_type === "link" ? "Link" : "File"}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/55">
                          <span className={overdue ? "text-red-400" : ""}>{formatDate(t.due_at)}{overdue ? " · overdue" : ""}</span>
                          <span>
                            {t.submissions_count ?? 0} submission{(t.submissions_count ?? 0) === 1 ? "" : "s"}
                            {ungraded > 0 ? ` · ${ungraded} to grade` : ""}
                          </span>
                          {attachmentCount > 0 ? (
                            <span className="inline-flex items-center gap-1">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                              {attachmentCount}
                            </span>
                          ) : null}
                        </div>
                        {ungraded > 0 ? (
                          <span className="mt-2 inline-block rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#d97706" }}>
                            {ungraded} awaiting grade
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}

      {formOpen ? (
        <TaskFormModal
          task={formTask}
          courses={courses}
          onClose={() => { setFormOpen(false); setFormTask(null); }}
          onSaved={() => { setFormOpen(false); setFormTask(null); loadTasks(); setSubmissionsRefreshKey((k) => k + 1); }}
        />
      ) : null}

      {detailTask ? (
        <TaskDetailModal
          task={detailTask}
          courses={courses}
          onEdit={() => { setFormTask(detailTask); setFormOpen(true); setDetailTask(null); }}
          onDelete={() => setDeleteTask(detailTask)}
          onClose={() => setDetailTask(null)}
        />
      ) : null}

      <ConfirmDialog
        open={deleteTask !== null}
        title="Delete task"
        message={`Delete "${deleteTask?.title ?? ""}" and all its submissions? Attached files are removed too. This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTask(null)}
      />
    </section>
  );
}
