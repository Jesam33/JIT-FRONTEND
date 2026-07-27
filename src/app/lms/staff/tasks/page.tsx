"use client";

import { useEffect, useState } from "react";
import { STAFF_API } from "../../../../lib/api";
import { apiFetchStaff } from "../../../../lib/fetch-with-timeout";

type Course = { id: number; title: string };
type Module = { id: number; title: string; course_id: number };

type Task = {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  instructions?: string;
  due_at?: string;
  submission_type: string;
  submissions_count?: number;
};

type Submission = {
  id: number;
  task_id: number;
  student_id: number;
  student?: { id: number; first_name?: string; last_name?: string; email?: string };
  submitted_link?: string;
  submitted_file_url?: string;
  score?: number;
  feedback?: string;
  graded_at?: string;
};

export default function StaffTasksPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");

  const [courseId, setCourseId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [submissionType, setSubmissionType] = useState("link");
  const [creating, setCreating] = useState(false);

  const [gradingId, setGradingId] = useState<number | null>(null);
  const [gradeScore, setGradeScore] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("lms_staff_token") ?? "";
    setToken(t);
    if (!t) return;

    Promise.all([
      apiFetchStaff(STAFF_API.assignedCourses).then((r) => r.json()),
      apiFetchStaff(STAFF_API.tasks).then((r) => r.json()),
    ]).then(([coursesData, tasksData]) => {
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!courseId || !token) { setModules([]); return; }
    apiFetchStaff(`${STAFF_API.modules}?course_id=${courseId}`)
      .then((r) => r.json())
      .then((data) => setModules(Array.isArray(data) ? data : []));
  }, [courseId, token]);

  async function viewTask(task: Task) {
    setSelectedTask(task);
    const res = await apiFetchStaff(STAFF_API.task(task.id));
    const data = await res.json();
    setSubmissions(Array.isArray(data?.submissions) ? data.submissions : []);
  }

  async function createTask() {
    if (!courseId || !title.trim()) return;
    setCreating(true);
    const body: any = { course_id: Number(courseId), module_id: Number(moduleId), title, submission_type: submissionType };
    if (description) body.description = description;
    if (instructions) body.instructions = instructions;
    if (dueAt) body.due_at = dueAt;

    await apiFetchStaff(STAFF_API.tasks, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setCreating(false);
    setTitle(""); setDescription(""); setInstructions(""); setDueAt(""); setModuleId("");
    const res = await apiFetchStaff(STAFF_API.tasks);
    const data = await res.json();
    setTasks(Array.isArray(data) ? data : []);
  }

  async function grade(submissionId: number) {
    if (!selectedTask) return;
    setGradingId(submissionId);
    await apiFetchStaff(STAFF_API.task(selectedTask.id) + `/submissions/${submissionId}/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: Number(gradeScore), feedback: gradeFeedback || null }),
    });
    setGradingId(null);
    setGradeScore(""); setGradeFeedback("");
    await viewTask(selectedTask);
  }

  const filteredTasks = tasks.filter((t) => !courseId || t.course_id === Number(courseId));

  return (
    <section>
      <h1 className="text-2xl font-bold">Tasks</h1>
      <p className="text-sm text-white/70">Create tasks per module, view submissions, and grade student work.</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <h3 className="font-semibold">Create Task</h3>
            <div className="mt-2 grid gap-2">
              <select value={courseId} onChange={(e) => { setCourseId(e.target.value); setModuleId(""); }} className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm">
                <option value="">Select course</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <select value={moduleId} onChange={(e) => setModuleId(e.target.value)} className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm">
                <option value="">Select module</option>
                {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm" rows={2} />
              <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Instructions" className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm" rows={3} />
              <input value={dueAt} onChange={(e) => setDueAt(e.target.value)} type="datetime-local" className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm" />
              <select value={submissionType} onChange={(e) => setSubmissionType(e.target.value)} className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm">
                <option value="link">Link</option>
                <option value="file_upload">File Upload</option>
              </select>
              <button onClick={createTask} disabled={creating || !courseId || !moduleId || !title.trim()} className="rounded bg-white px-3 py-2 text-sm text-black disabled:opacity-60">
                {creating ? "Creating..." : "Create Task"}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <h3 className="font-semibold">Task List</h3>
            {loading ? (
              <p className="mt-2 text-sm text-white/60">Loading...</p>
            ) : filteredTasks.length === 0 ? (
              <p className="mt-2 text-sm text-white/60">No tasks yet for this course.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {filteredTasks.map((t) => (
                  <button key={t.id} onClick={() => viewTask(t)} className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${selectedTask?.id === t.id ? "border-white/30 bg-white/10" : "border-white/10 bg-white/[0.02] hover:bg-white/5"}`}>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-white/60">{t.submissions_count ?? 0} submissions</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          {selectedTask ? (
            <>
              <h3 className="font-semibold">{selectedTask.title}</h3>
              <p className="mt-1 text-xs text-white/60">Due: {selectedTask.due_at ? new Date(selectedTask.due_at).toLocaleString() : "No deadline"}</p>
              {selectedTask.description ? <p className="mt-2 text-sm text-white/80">{selectedTask.description}</p> : null}

              <h4 className="mt-4 font-semibold text-sm">Submissions ({submissions.length})</h4>
              {submissions.length === 0 ? (
                <p className="mt-2 text-sm text-white/60">No submissions yet.</p>
              ) : (
                <div className="mt-2 space-y-3">
                  {submissions.map((s) => (
                    <div key={s.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-sm font-medium">{s.student?.first_name ?? "Student"} {s.student?.last_name ?? `#${s.student_id}`}</p>
                      {s.submitted_link ? (
                        <p className="mt-1 text-xs text-white/70">
                          Link: <a href={s.submitted_link} target="_blank" rel="noreferrer" className="text-blue-400 underline">{s.submitted_link}</a>
                        </p>
                      ) : null}
                      {s.submitted_file_url ? (
                        <a href={s.submitted_file_url} target="_blank" rel="noreferrer" download className="mt-2 inline-block rounded-lg bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20">Download submitted file</a>
                      ) : null}
                      {s.score !== null && s.score !== undefined ? (
                        <p className="mt-1 text-xs text-white/80">Score: {s.score}{s.feedback ? ` Feedback: ${s.feedback}` : ""}</p>
                      ) : (
                        <div className="mt-2 flex gap-2">
                          <input value={gradeScore} onChange={(e) => setGradeScore(e.target.value)} placeholder="Score (0-100)" type="number" className="w-24 rounded border border-white/20 bg-black/30 px-2 py-1 text-xs" />
                          <input value={gradeFeedback} onChange={(e) => setGradeFeedback(e.target.value)} placeholder="Feedback" className="flex-1 rounded border border-white/20 bg-black/30 px-2 py-1 text-xs" />
                          <button onClick={() => grade(s.id)} disabled={gradingId === s.id} className="rounded bg-white px-2 py-1 text-xs text-black disabled:opacity-60">
                            {gradingId === s.id ? "..." : "Grade"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-white/60">Select a task to view submissions.</p>
          )}
        </div>
      </div>
    </section>
  );
}
