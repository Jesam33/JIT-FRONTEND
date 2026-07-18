"use client";

import { useEffect, useState, useCallback } from "react";
import { STAFF_API, api } from "../../../../lib/api";
import { fetchWithTimeout } from "../../../../lib/fetch-with-timeout";
import ConfirmDialog from "../../../../components/ConfirmDialog";
import { useToast } from "../../../../components/ToastProvider";

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

const headers = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const uploadableTypes = ["slides", "pdf", "file"];
const typeLabels: Record<string, string> = {
  slides: "Slides", pdf: "PDF", video: "Video", link: "Link",
  text: "Text", code: "Code", file: "File",
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
  const [uploadingFile, setUploadingFile] = useState(false);

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

      const modRes = await fetchWithTimeout(STAFF_API.modules + (qs ? `?${qs}` : ""), { headers: headers(token), timeout: 120000 }).catch((e) => { console.error("Modules fetch failed:", e); return null; });
      const courseRes = await fetchWithTimeout(STAFF_API.assignedCourses, { headers: headers(token), timeout: 120000 }).catch((e) => { console.error("Courses fetch failed:", e); return null; });
      const classRes = await fetchWithTimeout(STAFF_API.scheduledClasses, { headers: headers(token), timeout: 120000 }).catch((e) => { console.error("Classes fetch failed:", e); return null; });

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
      const res = await fetchWithTimeout(
        editing ? STAFF_API.module(selectedId!) : STAFF_API.modules,
        {
          method: editing ? "PUT" : "POST",
          headers: headers(token),
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
    setSaving(true);
    try {
      const res = await fetchWithTimeout(STAFF_API.moduleContents(moduleId), {
        method: "POST",
        headers: headers(token),
        body: JSON.stringify({
          title: newContentTitle.trim(),
          type: newContentType,
          content_url: newContentUrl || null,
          content_body: newContentBody || null,
        }),
      });
      if (!res.ok) { showToast("Failed to add content", "error"); return; }
      showToast("Content added", "success");
      setNewContentTitle(""); setNewContentType("text"); setNewContentUrl(""); setNewContentBody("");
      await load();
    } catch { showToast("Failed to add content", "error"); }
    setSaving(false);
  }

  async function handleFileUpload(moduleId: number, file: File) {
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(api(`/api/frontend/lms/staff/modules/${moduleId}/contents/upload`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) { showToast("Upload failed", "error"); return; }
      const data = await res.json();
      setNewContentUrl(data.url);
      showToast("File uploaded", "success");
    } catch { showToast("Upload failed", "error"); }
    setUploadingFile(false);
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
      await fetchWithTimeout(api(`/api/frontend/lms/staff/modules/${selectedModule.id}/contents/reorder`), {
        method: "PUT",
        headers: headers(token),
        body: JSON.stringify({ items: payload }),
      });
      await load();
    } catch { showToast("Reorder failed", "error"); }
  }

  async function removeContent(contentId: number) {
    if (!selectedId) return;
    setSaving(true);
    try {
      await fetchWithTimeout(STAFF_API.moduleContent(selectedId, contentId), {
        method: "DELETE",
        headers: headers(token),
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
      await fetchWithTimeout(STAFF_API.module(id), {
        method: "DELETE",
        headers: headers(token),
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
      const res = await fetchWithTimeout(STAFF_API.moduleContent(selectedId, contentId), {
        method: "PUT",
        headers: headers(token),
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

  function formatForDatetimeLocal(iso: string): string {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  async function saveClassEdit(classId: number) {
    if (!editClassTitle.trim() || !editClassStarts) return;
    setSaving(true);
    try {
      const res = await fetchWithTimeout(STAFF_API.scheduledClass(classId), {
        method: "PUT",
        headers: headers(token),
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
      const res = await fetchWithTimeout(STAFF_API.scheduleClass(moduleId), {
        method: "POST",
        headers: headers(token),
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
      await fetchWithTimeout(STAFF_API.scheduledClass(classId), {
        method: "DELETE",
        headers: headers(token),
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
      <p className="text-sm text-white/70">Create course modules with content (slides, PDFs, videos, links, text, code) and schedule classes.</p>

      <div className="mt-4 mb-4 flex items-center gap-3">
        <label className="text-xs text-white/60">Filter by course:</label>
        <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="rounded border border-white/20 bg-black/30 px-3 py-1.5 text-sm">
          <option value="">All courses</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <label className="text-xs text-white/60">Search:</label>
        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search modules..." className="rounded border border-white/20 bg-black/30 px-3 py-1.5 text-sm max-w-xs" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <h3 className="font-semibold">{editing ? "Edit Module" : "New Module"}</h3>
            <div className="mt-2 grid gap-2">
              <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Module title" className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm" />
              <select value={formCourseId} onChange={(e) => setFormCourseId(e.target.value)} className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm">
                <option value="">Select course...</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Description" className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm" rows={2} />
              <textarea value={formObj} onChange={(e) => setFormObj(e.target.value)} placeholder="Learning objectives" className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm" rows={3} />
              <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as "draft" | "published")} className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              <div className="flex gap-2">
                <button onClick={saveModule} disabled={saving || !formTitle.trim() || !formCourseId} className="rounded bg-white px-3 py-2 text-sm text-black disabled:opacity-60">
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </button>
                {editing ? <button onClick={resetForm} className="rounded border border-white/20 px-3 py-2 text-sm">Cancel</button> : null}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <h3 className="font-semibold">Modules ({filteredModules.length})</h3>
            {loading ? <p className="mt-2 text-sm text-white/60">Loading...</p> :
              filteredModules.length === 0 ? <p className="mt-2 text-sm text-white/60">No modules.</p> :
              <div className="mt-2 space-y-2 max-h-[500px] overflow-y-auto">
                {filteredModules.map((m) => (
                  <div key={m.id}>
                    <button
                      onClick={() => { setSelectedId(m.id); editModule(m); }}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${selectedId === m.id ? "border-white/30 bg-white/10" : "border-white/10 bg-white/[0.02] hover:bg-white/5"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{m.title}</span>
                        <span className={`text-[10px] uppercase tracking-wider ${m.status === "published" ? "text-emerald-400" : "text-amber-400"}`}>{m.status}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-white/50">{m.course?.title ?? `Course #${m.course_id}`} &middot; {m.contents.length} items</p>
                    </button>
                    <button onClick={() => setConfirmDelete(m.id)} className="mt-1 text-xs text-red-400 underline hover:text-red-300">Delete</button>
                  </div>
                ))}
              </div>
            }
          </div>
        </div>

        <div className="space-y-4">
          {selectedModule ? (
            <>
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                <h3 className="font-semibold">Contents &mdash; {selectedModule.title}</h3>

                {selectedModule.contents.length === 0 ? (
                  <p className="mt-2 text-sm text-white/60">No content yet.</p>
                ) : (
                  <div className="mt-2 space-y-2 max-h-[400px] overflow-y-auto">
                    {selectedModule.contents.map((c, i) => {
                      const editing = editContentId === c.id;
                      return (
                      <div key={c.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                        {editing ? (
                          <div className="grid gap-2">
                            <input value={editFormTitle} onChange={(e) => setEditFormTitle(e.target.value)} className="rounded border border-white/20 bg-black/30 px-2 py-1 text-xs" />
                            <select value={editFormType} onChange={(e) => setEditFormType(e.target.value)} className="rounded border border-white/20 bg-black/30 px-2 py-1 text-xs">
                              {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                            <input type="file" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setUploadingFile(true); try { const fd = new FormData(); fd.append("file", f); const r = await fetch(api(`/api/frontend/lms/staff/modules/${selectedModule.id}/contents/upload`), { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd }); if (!r.ok) return; const d = await r.json(); setEditFormUrl(d.url); showToast("File uploaded", "success"); } catch {} finally { setUploadingFile(false); } }} className="w-full rounded border border-white/20 bg-black/30 px-2 py-1 text-xs file:mr-2 file:rounded file:border-0 file:bg-white/10 file:px-2 file:py-0.5 file:text-xs file:text-white" />
                            <textarea value={editFormBody} onChange={(e) => setEditFormBody(e.target.value)} placeholder="Body" className="rounded border border-white/20 bg-black/30 px-2 py-1 text-xs" rows={3} />
                            <div className="flex gap-2">
                              <button onClick={() => saveContentEdit(c.id)} disabled={saving} className="rounded bg-white px-2 py-1 text-xs text-black">{saving ? "Saving..." : "Save"}</button>
                              <button onClick={() => setEditContentId(null)} className="rounded border border-white/20 px-2 py-1 text-xs">Cancel</button>
                            </div>
                          </div>
                        ) : (
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{c.title}</p>
                            <p className="text-xs text-white/60">{typeLabels[c.type] ?? c.type} &middot; Order: {i}</p>
                            {c.content_url ? (
                              <a href={c.content_url} target="_blank" rel="noreferrer" className="mt-2 inline-block rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white transition hover:bg-white/20">Open file</a>
                            ) : null}
                            {c.content_body ? <p className="mt-1 text-xs text-white/70 line-clamp-2">{c.content_body}</p> : null}
                          </div>
                          <div className="flex shrink-0 items-center gap-1 ml-2">
                            <button onClick={() => startContentEdit(c)} className="text-xs text-blue-400 underline hover:text-blue-300">Edit</button>
                            <button onClick={() => reorderContent(c.id, "up")} disabled={i === 0} className="text-white/40 hover:text-white/80 disabled:opacity-20 text-xs" title="Move up">&#x25B2;</button>
                            <button onClick={() => reorderContent(c.id, "down")} disabled={i === selectedModule.contents.length - 1} className="text-white/40 hover:text-white/80 disabled:opacity-20 text-xs" title="Move down">&#x25BC;</button>
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
                  <div className="mt-2 grid gap-2">
                    <input value={newContentTitle} onChange={(e) => setNewContentTitle(e.target.value)} placeholder="Content title" className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm" />
                    <select value={newContentType} onChange={(e) => setNewContentType(e.target.value)} className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm">
                      {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>

                    <div className="flex items-center gap-2">
                      <input type="file" onChange={(e) => e.target.files?.[0] && handleFileUpload(selectedModule.id, e.target.files[0])} className="w-full rounded border border-white/20 bg-black/30 px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-xs file:text-white" />
                      {uploadingFile ? <span className="text-xs text-white/60">Uploading...</span> : null}
                    </div>

                    <textarea value={newContentBody} onChange={(e) => setNewContentBody(e.target.value)} placeholder="Content body (for text/code entries)" className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm" rows={4} />
                    <button onClick={() => addContent(selectedModule.id)} disabled={saving || !newContentTitle.trim()} className="rounded bg-white px-3 py-2 text-sm text-black disabled:opacity-60">
                      {saving ? "Adding..." : "Add Content"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                <h3 className="font-semibold">Schedule a Class</h3>
                <p className="mt-1 text-xs text-white/60">Create a scheduled class for this module.</p>
                <div className="mt-2 grid gap-2">
                  <input value={schedTitle} onChange={(e) => setSchedTitle(e.target.value)} placeholder="Class title" className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm" />
                  <textarea value={schedDesc} onChange={(e) => setSchedDesc(e.target.value)} placeholder="Description (optional)" className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm" rows={2} />
                  <input value={schedStarts} onChange={(e) => setSchedStarts(e.target.value)} type="datetime-local" className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm" />
                  {schedStarts ? <p className="text-[11px] text-white/50">Starts: {new Date(schedStarts).toLocaleString([], { hour: "2-digit", minute: "2-digit", hour12: true })}</p> : null}
                  <input value={schedEnds} onChange={(e) => setSchedEnds(e.target.value)} type="datetime-local" className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm" />
                  {schedEnds ? <p className="text-[11px] text-white/50">Ends: {new Date(schedEnds).toLocaleString([], { hour: "2-digit", minute: "2-digit", hour12: true })}</p> : null}
                  <input value={schedMeetingId} onChange={(e) => setSchedMeetingId(e.target.value)} placeholder="Meeting ID" className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm" />
                  <input value={schedMeetingPwd} onChange={(e) => setSchedMeetingPwd(e.target.value)} placeholder="Meeting password" className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm" />
                  <button onClick={() => scheduleClass(selectedModule.id)} disabled={saving || !schedTitle.trim() || !schedStarts || !schedEnds} className="rounded bg-white px-3 py-2 text-sm text-black disabled:opacity-60">
                    {saving ? "Scheduling..." : "Schedule Class"}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                <h3 className="font-semibold">Scheduled Classes for This Module ({moduleClasses.length})</h3>
                {moduleClasses.length === 0 ? (
                  <p className="mt-2 text-sm text-white/60">No classes scheduled for this module.</p>
                ) : (
                  <div className="mt-2 space-y-2 max-h-[400px] overflow-y-auto">
                    {moduleClasses.map((c) => {
                      const editing = editClassId === c.id;
                      return editing ? (
                        <div key={c.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                          <div className="grid gap-2">
                            <input value={editClassTitle} onChange={(e) => setEditClassTitle(e.target.value)} className="rounded border border-white/20 bg-black/30 px-2 py-1 text-xs" />
                            <textarea value={editClassDesc} onChange={(e) => setEditClassDesc(e.target.value)} className="rounded border border-white/20 bg-black/30 px-2 py-1 text-xs" rows={2} />
                            <input value={editClassStarts} onChange={(e) => setEditClassStarts(e.target.value)} type="datetime-local" className="rounded border border-white/20 bg-black/30 px-2 py-1 text-xs" />
                            {editClassStarts ? <p className="text-[10px] text-white/50">Starts: {new Date(editClassStarts).toLocaleString([], { hour: "2-digit", minute: "2-digit", hour12: true })}</p> : null}
                            <input value={editClassEnds} onChange={(e) => setEditClassEnds(e.target.value)} type="datetime-local" className="rounded border border-white/20 bg-black/30 px-2 py-1 text-xs" />
                            {editClassEnds ? <p className="text-[10px] text-white/50">Ends: {new Date(editClassEnds).toLocaleString([], { hour: "2-digit", minute: "2-digit", hour12: true })}</p> : null}
                            <input value={editClassMeetingId} onChange={(e) => setEditClassMeetingId(e.target.value)} placeholder="Meeting ID" className="rounded border border-white/20 bg-black/30 px-2 py-1 text-xs" />
                            <input value={editClassMeetingPwd} onChange={(e) => setEditClassMeetingPwd(e.target.value)} placeholder="Password" className="rounded border border-white/20 bg-black/30 px-2 py-1 text-xs" />
                            <select value={editClassStatus} onChange={(e) => setEditClassStatus(e.target.value)} className="rounded border border-white/20 bg-black/30 px-2 py-1 text-xs">
                              <option value="scheduled">Scheduled</option>
                              <option value="ongoing">Ongoing</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            <div className="flex gap-2">
                              <button onClick={() => saveClassEdit(c.id)} disabled={saving} className="rounded bg-white px-2 py-1 text-xs text-black">{saving ? "Saving..." : "Save"}</button>
                              <button onClick={cancelClassEdit} className="rounded border border-white/20 px-2 py-1 text-xs">Cancel</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div key={c.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium">{c.title}</p>
                              <p className="text-xs text-white/60">{new Date(c.starts_at).toLocaleString()}</p>
                              <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                                c.status === "scheduled" ? "bg-blue-500/20 text-blue-200" :
                                c.status === "ongoing" ? "bg-emerald-500/20 text-emerald-200" :
                                c.status === "completed" ? "bg-white/10 text-white/50" :
                                "bg-emerald-500/20 text-emerald-200"
                              }`}>{c.status}</span>
                            </div>
                            <div className="flex shrink-0 items-center gap-1 ml-2">
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
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <p className="text-sm text-white/60">Select a module to manage content and scheduling.</p>
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
