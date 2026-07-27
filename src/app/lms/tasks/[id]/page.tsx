"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { STUDENT_API } from "../../../../lib/api";
import { apiFetch } from "../../../../lib/fetch-with-timeout";

type TaskDetail = {
  id: number;
  title: string;
  description: string;
  instructions: string | null;
  due_at: string;
  submission_type: "link" | "file_upload";
  submission: {
    submitted_link: string | null;
    submitted_file_url: string | null;
    submitted_at: string;
    score: number | null;
    feedback: string | null;
    graded_at: string | null;
  } | null;
};

export default function LmsTaskDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const taskId = params?.id;

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [linkInput, setLinkInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    apiFetch(STUDENT_API.taskDetail(taskId))
      .then((res) => res.json())
      .then((payload) => setTask(payload))
      .catch(() => {});
  }, [taskId, token]);

  async function submitTask() {
    if (!task || !token || isSubmitting || task.submission) {
      return;
    }

    setMessage("");
    setIsSubmitting(true);

    let response: Response;

    if (task.submission_type === "file_upload" && selectedFile) {
      const formData = new FormData();
      formData.append("submitted_file", selectedFile);
      response = await apiFetch(STUDENT_API.submitTask(task.id), {
        method: "POST",
        body: formData,
      });
    } else {
      response = await apiFetch(STUDENT_API.submitTask(task.id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submitted_link: linkInput.trim() }),
      });
    }

    const result = await response.json();
    setMessage(result?.message ?? (response.ok ? "Submitted." : "Submission failed."));

    if (response.ok) {
      router.push("/lms/app");
      return;
    }

    setIsSubmitting(false);
  }

  return (
    <section className="section-pad section-divider">
      <div className="container-wide max-w-3xl rounded-2xl border border-white/20 bg-white/[0.03] p-6">
        <button type="button" onClick={() => router.push("/lms/app/tasks")} className="text-xs uppercase tracking-[0.14em] text-white/65">
          ← Back to Tasks
        </button>

        {task ? (
          <div className="mt-4 space-y-5">
            <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{task.title}</h1>
            <p className="text-sm text-white/70">Due: {new Date(task.due_at).toLocaleString()}</p>
            <p className="text-white/85">{task.description}</p>
            {task.instructions ? <p className="rounded-xl border border-white/15 bg-black/25 p-4 text-sm text-white/80">{task.instructions}</p> : null}

            {!task.submission ? (
              <div className="space-y-3 rounded-xl border border-white/15 bg-black/30 p-4">
                <p className="text-sm text-white/80">Submission type: <span className="font-semibold">{task.submission_type === "link" ? "Link" : "File Upload"}</span></p>

                {task.submission_type === "link" ? (
                  <input value={linkInput} onChange={(e) => setLinkInput(e.target.value)} placeholder="Paste your submission link" className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm" />
                ) : (
                  <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} className="w-full text-sm text-white file:mr-3 file:rounded file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:text-white" />
                )}

                <button type="button" onClick={submitTask} disabled={isSubmitting} className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:opacity-50">
                  {isSubmitting ? "Submitting..." : "Submit Task"}
                </button>
                <p className="text-xs text-white/60">Submission is one-time only. You cannot edit after submitting.</p>
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border border-emerald-300/20 bg-emerald-400/5 p-4 text-sm">
                <p style={{ color: '#059669' }}>Submitted on {new Date(task.submission.submitted_at).toLocaleString()}</p>
                {task.submission.submitted_link ? <p>Link: <a href={task.submission.submitted_link} target="_blank" rel="noreferrer" className="underline text-blue-400">{task.submission.submitted_link}</a></p> : null}
                {task.submission.submitted_file_url ? <p>File: <a href={task.submission.submitted_file_url} target="_blank" rel="noreferrer" download className="inline-block rounded-lg bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20">Download submitted file</a></p> : null}
                {task.submission.score !== null ? <p>Score: <span className="font-semibold">{task.submission.score}/100</span></p> : <p>Status: Awaiting grading</p>}
                {task.submission.feedback ? <p>Feedback: {task.submission.feedback}</p> : null}
              </div>
            )}

            {message ? <p className="text-sm text-white/80">{message}</p> : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-white/70">Loading task...</p>
        )}
      </div>
    </section>
  );
}
