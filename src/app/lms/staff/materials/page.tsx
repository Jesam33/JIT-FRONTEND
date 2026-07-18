"use client";

import { useEffect, useState } from "react";
import { STAFF_API } from "../../../../lib/api";

type Material = {
  id: number;
  course_id: number;
  title: string;
  type: string;
  file_url: string;
  session_id?: number | null;
  created_at: string;
};

export default function StaffMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("pdf");
  const [fileUrl, setFileUrl] = useState("");
  const [courseId, setCourseId] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("lms_staff_token") ?? "" : "";

  async function load() {
    const res = await fetch(STAFF_API.materials, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setMaterials(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { if (token) load(); }, [token]);

  async function createMaterial() {
    setCreating(true);
    await fetch(STAFF_API.materials, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ course_id: Number(courseId), title, type, file_url: fileUrl }),
    });
    setCreating(false);
    setTitle(""); setType("pdf"); setFileUrl(""); setCourseId("");
    await load();
  }

  async function remove(id: number) {
    if (!confirm("Delete this material?")) return;
    setDeleting(id);
    await fetch(STAFF_API.material(id), { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setDeleting(null);
    await load();
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">Materials</h1>
      <p className="text-sm text-white/70">Upload and manage learning materials per course.</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <h3 className="font-semibold">Upload Material</h3>
          <div className="mt-2 grid gap-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Material title" className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm" />
            <input value={courseId} onChange={(e) => setCourseId(e.target.value)} placeholder="Course ID" type="number" className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm" />
            <select value={type} onChange={(e) => setType(e.target.value)} className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm">
              <option value="pdf">PDF</option>
              <option value="doc">Document</option>
              <option value="video">Video / Recording</option>
              <option value="link">Link</option>
              <option value="other">Other</option>
            </select>
            <input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="File URL" className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm" />
            <button onClick={createMaterial} disabled={creating} className="rounded bg-white px-3 py-2 text-sm text-black disabled:opacity-60">
              {creating ? <span className="inline-flex items-center gap-2"><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Uploading</span> : "Upload"}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <h3 className="font-semibold">Materials</h3>
          {loading ? (
            <p className="mt-2 text-sm text-white/60">Loading...</p>
          ) : materials.length === 0 ? (
            <p className="mt-2 text-sm text-white/60">No materials uploaded yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {materials.map((m) => (
                <div key={m.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{m.title}</p>
                      <p className="text-xs text-white/60">Type: {m.type} &middot; Course ID: {m.course_id}</p>
                      <a href={m.file_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-blue-400 underline">Open material</a>
                    </div>
                    <button onClick={() => remove(m.id)} disabled={deleting === m.id} className="text-xs text-red-400 underline disabled:opacity-40 shrink-0 ml-2">
                      {deleting === m.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
