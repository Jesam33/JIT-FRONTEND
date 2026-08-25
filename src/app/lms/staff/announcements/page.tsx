"use client";

import { useCallback, useEffect, useState } from "react";
import { STAFF_API } from "../../../../lib/api";
import { apiFetchStaff } from "../../../../lib/fetch-with-timeout";

type Announcement = {
  id: number;
  batch_id: number;
  title: string;
  body?: string;
  is_published: boolean;
  batch?: { id: number; name: string };
  created_at: string;
};

export default function StaffAnnouncementsPage() {
  const token = typeof window !== "undefined" ? localStorage.getItem("lms_staff_token") ?? "" : "";

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [batches, setBatches] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [batchId, setBatchId] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async () => {
    const [annRes, trackRes] = await Promise.all([
      apiFetchStaff(STAFF_API.announcements),
      apiFetchStaff(STAFF_API.assignedTracks),
    ]);
    const annData = await annRes.json();
    setAnnouncements(Array.isArray(annData) ? annData : []);

    const tracks = await trackRes.json();
    if (Array.isArray(tracks)) {
      const seen = new Set<number>();
      const batchList: { id: number; name: string }[] = [];
      for (const t of tracks) {
        if (t.batch_id && !seen.has(t.batch_id)) {
          seen.add(t.batch_id);
          batchList.push({ id: t.batch_id, name: t.batch?.name ?? `Cohort #${t.batch_id}` });
        }
      }
      setBatches(batchList);
      if (batchList.length === 1) setBatchId(String(batchList[0].id));
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { if (token) load(); }, [load]);

  async function createAnnouncement() {
    setCreating(true);
    await apiFetchStaff(STAFF_API.announcements, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batch_id: Number(batchId), title, body: body || undefined }),
    });
    setCreating(false);
    setTitle(""); setBody("");
    if (batches.length === 1) setBatchId(String(batches[0].id));
    await load();
  }

  async function remove(id: number) {
    if (!confirm("Delete this announcement?")) return;
    setDeleting(id);
    await apiFetchStaff(STAFF_API.announcement(id), { method: "DELETE" });
    setDeleting(null);
    await load();
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">Announcements</h1>
      <p className="text-sm text-white/70">Post and manage announcements for your cohorts.</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <h3 className="font-semibold">New Announcement</h3>
          <div className="mt-2 grid gap-2">
            <select value={batchId} onChange={(e) => setBatchId(e.target.value)} className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm">
              <option value="">Select cohort</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {!loading && batches.length === 0 ? (
              <p className="text-xs text-white/50">You have no cohorts assigned yet. Ask your admin to assign you to a course cohort, then you can post announcements to it.</p>
            ) : null}
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm" />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Announcement body" className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm" rows={4} />
            <button onClick={createAnnouncement} disabled={creating || !batchId || !title.trim()} className="rounded bg-white px-3 py-2 text-sm text-black disabled:opacity-60">
              {creating ? <span className="inline-flex items-center gap-2"><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Posting</span> : "Post Announcement"}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <h3 className="font-semibold">Posted Announcements</h3>
          {loading ? (
            <p className="mt-2 text-sm text-white/60">Loading...</p>
          ) : announcements.length === 0 ? (
            <p className="mt-2 text-sm text-white/60">No announcements yet.</p>
          ) : (
            <div className="mt-2 space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{a.title}</p>
                      {a.body ? <p className="mt-1 text-xs text-white/70">{a.body}</p> : null}
                      <p className="mt-1 text-xs text-white/50">{a.batch?.name ?? ""} &middot; {new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => remove(a.id)} disabled={deleting === a.id} className="text-xs text-red-400 underline disabled:opacity-40 shrink-0 ml-2">
                      {deleting === a.id ? "Deleting..." : "Delete"}
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
