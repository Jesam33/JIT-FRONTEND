"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { STAFF_API, api } from "../../../../lib/api";
import { apiFetchStaff } from "../../../../lib/fetch-with-timeout";
import ConfirmDialog from "../../../../components/ConfirmDialog";
import { useToast } from "../../../../components/ToastProvider";
import { uploadToBunny, type BunnyUploadSession } from "../../../../lib/bunny-upload";

const jsonHeaders = { "Content-Type": "application/json" };

type ModuleContent = {
  id: number;
  module_id: number;
  title: string;
  type: string;
  content_url: string | null;
  content_body: string | null;
  sort_order: number;
  // Externally-hosted video (Bunny Stream) pointers — set only for a video whose
  // file was uploaded to Bunny (content_url is then the player embed URL).
  provider?: string | null;
  external_id?: string | null;
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
  status: "draft" | "published";
  contents: ModuleContent[];
  course?: { id: number; title: string };
};

type ScheduledClass = {
  id: number;
  module_id: number;
  title: string;
  description?: string | null;
  starts_at: string;
  ends_at: string | null;
  meeting_url: string | null;
  meeting_id: string | null;
  meeting_password: string | null;
  location: string | null;
  status: string;
};

type Course = {
  id: number;
  title: string;
};

const typeLabels: Record<string, string> = {
  slides: "Slides", pdf: "PDF", video: "Video", link: "Link",
  text: "Text", code: "Code", file: "File", doc: "Doc",
};

export default function StaffModulesPage() {
  const token = typeof window !== "undefined" ? localStorage.getItem("lms_staff_token") ?? "" : "";

  const [modules, setModules] = useState<Module[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [courseFilter, setCourseFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formObj, setFormObj] = useState("");
  const [formCourseId, setFormCourseId] = useState("");
  const [formStatus, setFormStatus] = useState<"draft" | "published">("draft");

  const [newContentTitle, setNewContentTitle] = useState("");
  const [newContentType, setNewContentType] = useState("text");
  const [newContentUrl, setNewContentUrl] = useState("");
  const [newContentBody, setNewContentBody] = useState("");
  // Video content uploads its file straight to Bunny (bytes never touch our
  // server); contentUploadPct drives the progress bar during that upload.
  const [contentVideoFile, setContentVideoFile] = useState<File | null>(null);
  const [contentUploadPct, setContentUploadPct] = useState<number | null>(null);
  const contentFileRef = useRef<HTMLInputElement | null>(null);

  const [schedTitle, setSchedTitle] = useState("");
  const [schedDesc, setSchedDesc] = useState("");
  const [schedStarts, setSchedStarts] = useState("");
  const [schedEnds, setSchedEnds] = useState("");

  const [schedMeetingId, setSchedMeetingId] = useState("");
  const [schedMeetingPwd, setSchedMeetingPwd] = useState("");

  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [confirmContentDelete, setConfirmContentDelete] = useState<number | null>(null);
  const [confirmClassDelete, setConfirmClassDelete] = useState<number | null>(null);

  const [editContentId, setEditContentId] = useState<number | null>(null);
  const [editFormTitle, setEditFormTitle] = useState("");
  const [editFormType, setEditFormType] = useState("text");
  const [editFormUrl, setEditFormUrl] = useState("");
  const [editFormBody, setEditFormBody] = useState("");

  const [editClassId, setEditClassId] = useState<number | null>(null);
  const [editClassTitle, setEditClassTitle] = useState("");
  const [editClassDesc, setEditClassDesc] = useState("");
  const [editClassStarts, setEditClassStarts] = useState("");
  const [editClassEnds, setEditClassEnds] = useState("");
  const [editClassMeetingId, setEditClassMeetingId] = useState("");
  const [editClassMeetingPwd, setEditClassMeetingPwd] = useState("");
  const [editClassStatus, setEditClassStatus] = useState("scheduled");

  const { toast: showToast } = useToast();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (courseFilter) params.set("course_id", courseFilter);
      if (searchTerm) params.set("search", searchTerm);
      const qs = params.toString();

      // These three reads are independent — run them in parallel instead of a
      // three-step waterfall. Each keeps its own catch so one failure doesn't
      // reject the batch.
      const [modRes, courseRes, classRes] = await Promise.all([
        apiFetchStaff(STAFF_API.modules + (qs ? `?${qs}` : ""), { timeout: 30000 }).catch((e) => { console.error("Modules fetch failed:", e); return null; }),
        apiFetchStaff(STAFF_API.assignedCourses, { timeout: 30000 }).catch((e) => { console.error("Courses fetch failed:", e); return null; }),
        apiFetchStaff(STAFF_API.scheduledClasses, { timeout: 30000 }).catch((e) => { console.error("Classes fetch failed:", e); return null; }),
      ]);

      if (modRes && modRes.ok) {
        const mods = await modRes.json();
        setModules(Array.isArray(mods) ? mods : []);
      }
      if (courseRes && courseRes.ok) {
        const crs = await courseRes.json();
        setCourses(Array.isArray(crs) ? crs : []);
      }
      if (classRes && classRes.ok) {
        const cls = await classRes.json();
        setClasses(Array.isArray(cls) ? cls : []);
      }
    } catch (e) {
      console.error("Staff modules load error:", e);
      showToast("Failed to load data", "error");
    }
    setLoading(false);
  }, [token, courseFilter, searchTerm, showToast]);

  useEffect(() => { if (token) load(); }, [load, token]);

  function resetForm() {
    setFormTitle(""); setFormDesc(""); setFormObj(""); setFormCourseId(""); setFormStatus("draft");
    setEditing(false);
  }

  async function saveModule() {
    if (!formTitle.trim() || !formCourseId) return;
    setSaving(true);
    try {
      const res = await apiFetchStaff(
        editing ? STAFF_API.module(selectedId!) : STAFF_API.modules,
        {
          method: editing ? "PUT" : "POST",
          headers: jsonHeaders,
          body: JSON.stringify({
            course_id: Number(formCourseId),
            title: formTitle.trim(),
            description: formDesc || null,
            objectives: formObj || null,
            status: formStatus,
          }),
        }
      );
      if (!res.ok) { showToast("Failed to save module", "error"); return; }
      showToast(editing ? "Module updated" : "Module created", "success");
      if (!editing) resetForm();
      setSelectedId(null);
      await load();
    } catch { showToast("Save failed", "error"); }
    setSaving(false);
  }

  function editModule(m: Module) {
    setSelectedId(m.id);
    setEditing(true);
    setFormTitle(m.title);
    setFormDesc(m.description ?? "");
    setFormObj(m.objectives ?? "");
    setFormCourseId(String(m.course_id));
    setFormStatus(m.status);
  }

  async function addContent(moduleId: number) {
    if (!newContentTitle.trim()) return;
    if (newContentType === "video" && !contentVideoFile) { showToast("Choose a video file to upload.", "error"); return; }
    setSaving(true);
    try {
      let contentUrl: string | null = newContentUrl || null;
      let bunnyFields: Record<string, unknown> = {};

      // Video content: upload the picked file straight to Bunny (the bytes never
      // touch our server), then store the player embed URL as the content_url.
      if (newContentType === "video" && contentVideoFile) {
        const upRes = await apiFetchStaff(STAFF_API.videoUpload, {
          method: "POST",
          headers: jsonHeaders,
          body: JSON.stringify({ title: newContentTitle.trim() }),
        });
        if (upRes.status === 402) { showToast("Video lessons need the Basic plan or higher. Ask your academy admin to upgrade.", "error"); return; }
        if (upRes.status === 503) { showToast("Video uploads aren't available right now. Please try again later.", "error"); return; }
        if (!upRes.ok) { showToast(`Could not start the upload (HTTP ${upRes.status}).`, "error"); return; }
        const session = (await upRes.json()) as BunnyUploadSession;
        setContentUploadPct(0);
        await uploadToBunny(session, contentVideoFile, setContentUploadPct);
        contentUrl = session.embed_url;
        bunnyFields = {
          provider: "bunny_stream",
          external_id: session.video_id,
          thumbnail_url: session.thumbnail_url ?? null,
          status: "processing",
        };
      }

      const res = await apiFetchStaff(STAFF_API.moduleContents(moduleId), {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          title: newContentTitle.trim(),
          type: newContentType,
          content_url: contentUrl,
          content_body: newContentBody || null,
          ...bunnyFields,
        }),
      });
      if (!res.ok) { showToast("Failed to add content", "error"); return; }
      showToast("Content added", "success");
      setNewContentTitle(""); setNewContentType("text"); setNewContentUrl(""); setNewContentBody("");
      setContentVideoFile(null);
      if (contentFileRef.current) contentFileRef.current.value = "";
      await load();
    } catch (e) { showToast(e instanceof Error ? e.message : "Failed to add content", "error"); }
    finally { setSaving(false); setContentUploadPct(null); }
  }

  async function reorderContent(contentId: number, direction: "up" | "down") {
    const idx = selectedModule?.contents.findIndex((c) => c.id === contentId) ?? -1;
    if (idx < 0 || !selectedModule) return;
    const items = [...selectedModule.contents];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    [items[idx], items[swapIdx]] = [items[swapIdx], items[idx]];
    const payload = items.map((c, i) => ({ id: c.id, sort_order: i }));
    try {
      await apiFetchStaff(api(`/api/frontend/lms/staff/modules/${selectedModule.id}/contents/reorder`), {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify({ items: payload }),
      });
      await load();
    } catch { showToast("Reorder failed", "error"); }
  }

  async function removeContent(contentId: number) {
    if (!selectedId) return;
    setSaving(true);
    try {
      await apiFetchStaff(STAFF_API.moduleContent(selectedId, contentId), {
        method: "DELETE",
      });
      showToast("Content removed", "success");
      setConfirmContentDelete(null);
      await load();
    } catch { showToast("Failed to remove content", "error"); }
    setSaving(false);
  }

  async function deleteModule(id: number) {
    setSaving(true);
    try {
      await apiFetchStaff(STAFF_API.module(id), {
        method: "DELETE",
      });
      showToast("Module deleted", "success");
      setConfirmDelete(null);
      if (selectedId === id) { setSelectedId(null); resetForm(); }
      await load();
    } catch { showToast("Failed to delete module", "error"); }
    setSaving(false);
  }

  function startContentEdit(c: ModuleContent) {
    setEditContentId(c.id);
    setEditFormTitle(c.title);
    setEditFormType(c.type);
    setEditFormUrl(c.content_url ?? "");
    setEditFormBody(c.content_body ?? "");
  }

  async function saveContentEdit(contentId: number) {
    if (!selectedId || !editFormTitle.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetchStaff(STAFF_API.moduleContent(selectedId, contentId), {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify({
          title: editFormTitle.trim(),
          type: editFormType,
          content_url: editFormUrl || null,
          content_body: editFormBody || null,
        }),
      });
      if (!res.ok) { showToast("Failed to update content", "error"); return; }
      showToast("Content updated", "success");
      setEditContentId(null);
      await load();
    } catch { showToast("Failed to update content", "error"); }
    setSaving(false);
  }

  function startClassEdit(c: ScheduledClass) {
    setEditClassId(c.id);
    setEditClassTitle(c.title);
    setEditClassDesc(c.description ?? "");
    setEditClassStarts(formatForDatetimeLocal(c.starts_at));
    setEditClassEnds(formatForDatetimeLocal(c.ends_at));
    setEditClassMeetingId(c.meeting_id ?? "");
    setEditClassMeetingPwd(c.meeting_password ?? "");
    setEditClassStatus(c.status);
  }

  function cancelClassEdit() {
    setEditClassId(null);
  }

  function formatForDatetimeLocal(iso: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  async function saveClassEdit(classId: number) {
    if (!editClassTitle.trim() || !editClassStarts) return;
    setSaving(true);
    try {
      const res = await apiFetchStaff(STAFF_API.scheduledClass(classId), {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify({
          title: editClassTitle.trim(),
          description: editClassDesc || null,
          starts_at: new Date(editClassStarts).toISOString(),
          ends_at: new Date(editClassEnds).toISOString(),
          meeting_id: editClassMeetingId || null,
          meeting_password: editClassMeetingPwd || null,
          status: editClassStatus,
        }),
      });
      if (!res.ok) { showToast("Failed to update class", "error"); return; }
      showToast("Class updated", "success");
      cancelClassEdit();
      await load();
    } catch { showToast("Failed to update class", "error"); }
    setSaving(false);
  }

  async function scheduleClass(moduleId: number) {
    if (!schedTitle.trim() || !schedStarts || !schedEnds) return;
    setSaving(true);
    try {
      const res = await apiFetchStaff(STAFF_API.scheduleClass(moduleId), {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          title: schedTitle.trim(),
          description: schedDesc || null,
          starts_at: new Date(schedStarts).toISOString(),
          ends_at: new Date(schedEnds).toISOString(),
          meeting_id: schedMeetingId || null,
          meeting_password: schedMeetingPwd || null,
        }),
      });
      if (!res.ok) { showToast("Failed to schedule class", "error"); return; }
      showToast("Class scheduled", "success");
      setSchedTitle(""); setSchedDesc(""); setSchedStarts(""); setSchedEnds("");
      setSchedMeetingId(""); setSchedMeetingPwd("");
      await load();
    } catch { showToast("Failed to schedule class", "error"); }
    setSaving(false);
  }

  async function deleteClass(classId: number) {
    setSaving(true);
    try {
      await apiFetchStaff(STAFF_API.scheduledClass(classId), {
        method: "DELETE",
      });
      showToast("Class cancelled", "success");
      setConfirmClassDelete(null);
      await load();
    } catch { showToast("Failed to cancel class", "error"); }
    setSaving(false);
  }

  const selectedModule = modules.find((m) => m.id === selectedId);
  const moduleClasses = classes.filter((c) => c.module_id === selectedId);

  const filteredModules = courseFilter
    ? modules.filter((m) => String(m.course_id) === courseFilter)
    : modules;

  return (
    <section>
      <h1 className="text-2xl font-bold">Modules</h1>
      <p className="mt-1 text-sm text-white/70">Create course modules with content (slides, PDFs, videos, links, text, code) and schedule classes.</p>

      {/* Filters */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-white/50">Filter by course</label>
          <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="w-full rounded-lg border border-white/15 bg-white/[0.05] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30 sm:w-auto">
            <option value="">All courses</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1 sm:flex-1">
          <label className="text-xs font-medium text-white/50">Search</label>
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search modules..." className="w-full rounded-lg border border-white/15 bg-white/[0.05] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/30" />
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.5fr]">
        {/* Left column */}
        <div className="space-y-5">
          {/* Create / Edit form */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="text-base font-semibold">{editing ? "Edit Module" : "New Module"}</h3>
            <div className="mt-3 flex flex-col gap-2.5">
              <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Module title" className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/30" />
              <select value={formCourseId} onChange={(e) => setFormCourseId(e.target.value)} className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/30">
                <option value="">Select course...</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Description (optional)" className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 resize-none" rows={2} />
              <textarea value={formObj} onChange={(e) => setFormObj(e.target.value)} placeholder="Learning objectives (optional)" className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 resize-none" rows={3} />
              <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as "draft" | "published")} className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/30">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              <div className="flex gap-2 pt-1">
                <button onClick={saveModule} disabled={saving || !formTitle.trim() || !formCourseId} className="flex-1 rounded-lg bg-white px-3 py-2.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-50">
                  {saving ? "Saving…" : editing ? "Update" : "Create"}
                </button>
                {editing ? <button onClick={resetForm} className="rounded-lg border border-white/20 px-3 py-2.5 text-sm transition hover:bg-white/5">Cancel</button> : null}
              </div>
            </div>
          </div>

          {/* Modules list */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="text-base font-semibold">Modules ({filteredModules.length})</h3>
            {loading ? (
              <p className="mt-3 text-sm text-white/50">Loading…</p>
            ) : filteredModules.length === 0 ? (
              <p className="mt-3 text-sm text-white/50">No modules found.</p>
            ) : (
              <div className="mt-3 space-y-2 max-h-[480px] overflow-y-auto pr-0.5">
                {filteredModules.map((m) => (
                  <div key={m.id}>
                    <button
                      onClick={() => { setSelectedId(m.id); editModule(m); }}
                      className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition ${selectedId === m.id ? "border-white/30 bg-white/10" : "border-white/10 bg-white/[0.02] hover:bg-white/5"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium leading-snug">{m.title}</span>
                        <span className={`shrink-0 text-[10px] uppercase tracking-wider ${m.status === "published" ? "text-emerald-400" : "text-amber-400"}`}>{m.status}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-white/45">{m.course?.title ?? `Course #${m.course_id}`} &middot; {m.contents.length} items</p>
                    </button>
                    <button onClick={() => setConfirmDelete(m.id)} className="mt-1 text-xs text-red-400 underline hover:text-red-300">Delete</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {selectedModule ? (
            <>
              {/* Contents */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <h3 className="text-base font-semibold">Contents &mdash; <span className="font-normal text-white/70">{selectedModule.title}</span></h3>

                {selectedModule.contents.length === 0 ? (
                  <p className="mt-3 text-sm text-white/50">No content yet.</p>
                ) : (
                  <div className="mt-3 space-y-2 max-h-[400px] overflow-y-auto pr-0.5">
                    {selectedModule.contents.map((c, i) => {
                      const editing = editContentId === c.id;
                      return (
                      <div key={c.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                        {editing ? (
                          <div className="flex flex-col gap-2">
                            <input value={editFormTitle} onChange={(e) => setEditFormTitle(e.target.value)} className="w-full rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-xs focus:outline-none" />
                            <select value={editFormType} onChange={(e) => setEditFormType(e.target.value)} className="w-full rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-xs focus:outline-none">
                              {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                            <input value={editFormUrl} onChange={(e) => setEditFormUrl(e.target.value)} type="url" inputMode="url" placeholder="Content link (Google Drive, YouTube, or any URL)" className="w-full rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-xs placeholder:text-white/30 focus:outline-none" />
                            <textarea value={editFormBody} onChange={(e) => setEditFormBody(e.target.value)} placeholder="Body" className="w-full rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-xs resize-none focus:outline-none" rows={3} />
                            <div className="flex gap-2">
                              <button onClick={() => saveContentEdit(c.id)} disabled={saving} className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
                              <button onClick={() => setEditContentId(null)} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs">Cancel</button>
                            </div>
                          </div>
                        ) : (
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-snug truncate">{c.title}</p>
                            <p className="mt-0.5 text-xs text-white/50">{typeLabels[c.type] ?? c.type} &middot; #{i + 1}</p>
                            {c.content_url ? (
                              <a href={c.content_url} target="_blank" rel="noreferrer" className="mt-2 inline-block rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white transition hover:bg-white/20">Open file</a>
                            ) : null}
                            {c.content_body ? <p className="mt-1 text-xs text-white/60 line-clamp-2">{c.content_body}</p> : null}
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <button onClick={() => startContentEdit(c)} className="text-xs text-blue-400 underline hover:text-blue-300">Edit</button>
                            <div className="flex items-center gap-1">
                              <button onClick={() => reorderContent(c.id, "up")} disabled={i === 0} className="text-white/40 hover:text-white/80 disabled:opacity-20 text-xs" title="Move up">&#x25B2;</button>
                              <button onClick={() => reorderContent(c.id, "down")} disabled={i === selectedModule.contents.length - 1} className="text-white/40 hover:text-white/80 disabled:opacity-20 text-xs" title="Move down">&#x25BC;</button>
                            </div>
                            <button onClick={() => setConfirmContentDelete(c.id)} className="text-xs text-red-400 underline hover:text-red-300">Remove</button>
                          </div>
                        </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-4 border-t border-white/10 pt-4">
                  <h4 className="text-sm font-semibold">Add Content</h4>
                  <div className="mt-3 flex flex-col gap-2.5">
                    <input value={newContentTitle} onChange={(e) => setNewContentTitle(e.target.value)} placeholder="Content title" className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/30" />
                    <select value={newContentType} onChange={(e) => setNewContentType(e.target.value)} className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/30">
                      {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    {newContentType === "video" ? (
                      <div>
                        <input
                          ref={contentFileRef}
                          type="file"
                          accept="video/*"
                          onChange={(e) => setContentVideoFile(e.target.files?.[0] ?? null)}
                          className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-white focus:outline-none focus:ring-1 focus:ring-white/30"
                        />
                        <p className="mt-1 text-[11px] text-white/40">Upload a video file. It&apos;s hosted externally and streamed to students, so it never loads down your server. MP4, WebM or MOV.</p>
                        {contentUploadPct !== null ? (
                          <div className="mt-2">
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${contentUploadPct}%` }} />
                            </div>
                            <p className="mt-1 text-[11px] text-white/50">{contentUploadPct < 100 ? `Uploading… ${contentUploadPct}%` : "Finishing up…"}</p>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div>
                        <input value={newContentUrl} onChange={(e) => setNewContentUrl(e.target.value)} type="url" inputMode="url" placeholder="Content link (Google Drive, YouTube, or any URL)" className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/30" />
                        <p className="mt-1 text-[11px] text-white/40">Paste a Google Drive, YouTube, or any public link, no file uploads. Leave blank for text/code content.</p>
                      </div>
                    )}
                    <textarea value={newContentBody} onChange={(e) => setNewContentBody(e.target.value)} placeholder="Content body (for text/code)" className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm placeholder:text-white/30 resize-none focus:outline-none focus:ring-1 focus:ring-white/30" rows={4} />
                    <button onClick={() => addContent(selectedModule.id)} disabled={saving || !newContentTitle.trim() || (newContentType === "video" && !contentVideoFile)} className="w-full rounded-lg bg-white px-3 py-2.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-50">
                      {saving ? (newContentType === "video" ? "Uploading…" : "Adding…") : "Add Content"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Schedule class */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <h3 className="text-base font-semibold">Schedule a Class</h3>
                <p className="mt-1 text-xs text-white/50">Create a scheduled class for this module.</p>
                <div className="mt-3 flex flex-col gap-2.5">
                  <input value={schedTitle} onChange={(e) => setSchedTitle(e.target.value)} placeholder="Class title" className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/30" />
                  <textarea value={schedDesc} onChange={(e) => setSchedDesc(e.target.value)} placeholder="Description (optional)" className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm placeholder:text-white/30 resize-none focus:outline-none focus:ring-1 focus:ring-white/30" rows={2} />
                  <div>
                    <label className="mb-1 block text-xs text-white/45">Start time</label>
                    <input value={schedStarts} onChange={(e) => setSchedStarts(e.target.value)} type="datetime-local" className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/30" />
                    {schedStarts ? <p className="mt-1 text-[11px] text-white/40">{new Date(schedStarts).toLocaleString([], { hour: "2-digit", minute: "2-digit", hour12: true })}</p> : null}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/45">End time</label>
                    <input value={schedEnds} onChange={(e) => setSchedEnds(e.target.value)} type="datetime-local" className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/30" />
                    {schedEnds ? <p className="mt-1 text-[11px] text-white/40">{new Date(schedEnds).toLocaleString([], { hour: "2-digit", minute: "2-digit", hour12: true })}</p> : null}
                  </div>
                  <button onClick={() => scheduleClass(selectedModule.id)} disabled={saving || !schedTitle.trim() || !schedStarts || !schedEnds} className="w-full rounded-lg bg-white px-3 py-2.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-50">
                    {saving ? "Scheduling…" : "Schedule Class"}
                  </button>
                </div>
              </div>

              {/* Scheduled classes list */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <h3 className="text-base font-semibold">Scheduled Classes <span className="text-white/40 font-normal text-sm">({moduleClasses.length})</span></h3>
                {moduleClasses.length === 0 ? (
                  <p className="mt-3 text-sm text-white/50">No classes scheduled for this module.</p>
                ) : (
                  <div className="mt-3 space-y-2 max-h-[400px] overflow-y-auto pr-0.5">
                    {moduleClasses.map((c) => {
                      const editing = editClassId === c.id;
                      return editing ? (
                        <div key={c.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                          <div className="flex flex-col gap-2">
                            <input value={editClassTitle} onChange={(e) => setEditClassTitle(e.target.value)} className="w-full rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-xs focus:outline-none" />
                            <textarea value={editClassDesc} onChange={(e) => setEditClassDesc(e.target.value)} className="w-full rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-xs resize-none focus:outline-none" rows={2} />
                            <input value={editClassStarts} onChange={(e) => setEditClassStarts(e.target.value)} type="datetime-local" className="w-full rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-xs focus:outline-none" />
                            {editClassStarts ? <p className="text-[10px] text-white/40">{new Date(editClassStarts).toLocaleString([], { hour: "2-digit", minute: "2-digit", hour12: true })}</p> : null}
                            <input value={editClassEnds} onChange={(e) => setEditClassEnds(e.target.value)} type="datetime-local" className="w-full rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-xs focus:outline-none" />
                            {editClassEnds ? <p className="text-[10px] text-white/40">{new Date(editClassEnds).toLocaleString([], { hour: "2-digit", minute: "2-digit", hour12: true })}</p> : null}
                            <select value={editClassStatus} onChange={(e) => setEditClassStatus(e.target.value)} className="w-full rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-xs focus:outline-none">
                              <option value="scheduled">Scheduled</option>
                              <option value="ongoing">Ongoing</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            <div className="flex gap-2">
                              <button onClick={() => saveClassEdit(c.id)} disabled={saving} className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
                              <button onClick={cancelClassEdit} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs">Cancel</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div key={c.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium leading-snug">{c.title}</p>
                              <p className="mt-0.5 text-xs text-white/50">{new Date(c.starts_at).toLocaleString()}</p>
                              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                                c.status === "scheduled" ? "bg-blue-500/20 text-blue-200" :
                                c.status === "ongoing" ? "bg-emerald-500/20 text-emerald-200" :
                                c.status === "completed" ? "bg-white/10 text-white/50" :
                                "bg-red-500/20 text-red-200"
                              }`}>{c.status}</span>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <button onClick={() => startClassEdit(c)} className="text-xs text-blue-400 underline hover:text-blue-300">Edit</button>
                              <button onClick={() => setConfirmClassDelete(c.id)} className="text-xs text-red-400 underline hover:text-red-300">Cancel</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-white/50">Select a module from the list to manage its content and scheduled classes.</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog open={confirmDelete !== null} title="Delete Module" message="Delete this module and all its contents?" onConfirm={() => deleteModule(confirmDelete!)} onCancel={() => setConfirmDelete(null)} />
      <ConfirmDialog open={confirmContentDelete !== null} title="Remove Content" message="Remove this content item?" onConfirm={() => removeContent(confirmContentDelete!)} onCancel={() => setConfirmContentDelete(null)} />
      <ConfirmDialog open={confirmClassDelete !== null} title="Cancel Class" message="Cancel this scheduled class?" onConfirm={() => deleteClass(confirmClassDelete!)} onCancel={() => setConfirmClassDelete(null)} />
    </section>
  );
}
