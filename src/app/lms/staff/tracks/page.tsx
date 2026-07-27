"use client";

import { useEffect, useState } from "react";
import { STAFF_API } from "../../../../lib/api";
import { apiFetchStaff } from "../../../../lib/fetch-with-timeout";

type Track = { id: number; name: string; instructor_id?: number | null };

export default function StaffTracksPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("lms_staff_token") ?? "" : "";

  useEffect(() => {
    if (!token) return;
    apiFetchStaff(STAFF_API.assignedTracks)
      .then((r) => r.json())
      .then((data) => { setTracks(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  return (
    <section>
      <h1 className="text-2xl font-bold">Tracks</h1>
      <p className="text-sm text-white/70">Tracks assigned to you.</p>

      <div className="mt-4 grid gap-3">
        {loading ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">Loading...</div>
        ) : tracks.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">No tracks assigned to you yet.</div>
        ) : (
          tracks.map((t) => (
            <article key={t.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
              <h3 className="font-semibold">{t.name}</h3>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
