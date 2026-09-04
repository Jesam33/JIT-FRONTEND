"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OWNER_API } from "@/lib/api";
import { ownerAuthHeaders, getOwnerToken } from "@/lib/owner-client";

type Track = {
  id: number;
  name: string;
  course: string | null;
  course_id: number | null;
  instructor: string | null;
  instructor_id: number | null;
  created_at: string | null;
};

type CourseOption = { id: number; title: string };
type StaffOption = { id: number; name: string };

export default function OwnerTracksPage() {
  const router = useRouter();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create-cohort form.
  const [name, setName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  // Row whose instructor is being reassigned (disables just that select).
  const [savingId, setSavingId] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tRes, cRes, sRes] = await Promise.all([
        fetch(OWNER_API.tracks, { headers: ownerAuthHeaders() }),
        fetch(OWNER_API.courses, { headers: ownerAuthHeaders() }),
        fetch(OWNER_API.staff, { headers: ownerAuthHeaders() }),
      ]);
      if ([tRes, cRes, sRes].some((r) => r.status === 401 || r.status === 403)) {
        router.replace("/lms/admin/login");
        return;
      }
      if (!tRes.ok) {
        setError(`Could not load cohorts (HTTP ${tRes.status}).`);
        return;
      }
      const tJson = await tRes.json();
      setTracks(tJson.tracks ?? []);
      if (cRes.ok) {
        const cJson = await cRes.json();
        setCourses((cJson.courses ?? []).map((c: { id: number; title: string }) => ({ id: c.id, title: c.title })));
      }
      if (sRes.ok) {
        const sJson = await sRes.json();
        setStaff((sJson.staff ?? []).map((s: { id: number; name: string }) => ({ id: s.id, name: s.name })));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!getOwnerToken()) {
      router.replace("/lms/admin/login");
      return;
    }
    load();
  }, [load, router]);

  const createTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setCreateMsg({ kind: "err", text: "Enter a cohort name (e.g. “March 2026 Batch”)." });
      return;
    }
    if (!courseId) {
      setCreateMsg({ kind: "err", text: "Pick which course this cohort belongs to." });
      return;
    }
    setCreating(true);
    setCreateMsg(null);
    try {
      const res = await fetch(OWNER_API.createTrack, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...ownerAuthHeaders() },
        body: JSON.stringify({
          name: trimmed,
          course_id: Number(courseId),
          instructor_id: instructorId ? Number(instructorId) : null,
        }),
      });
      if (res.status === 401 || res.status === 403) {
        router.replace("/lms/admin/login");
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCreateMsg({ kind: "err", text: json?.message || `Could not create cohort (HTTP ${res.status}).` });
        return;
      }
      setCreateMsg({ kind: "ok", text: `Created “${trimmed}”.` });
      setName("");
      setCourseId("");
      setInstructorId("");
      load();
    } catch (err) {
      setCreateMsg({ kind: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setCreating(false);
    }
  };

  const reassign = async (track: Track, newInstructorId: string) => {
    setSavingId(track.id);
    setError(null);
    try {
      const res = await fetch(OWNER_API.updateTrack(track.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...ownerAuthHeaders() },
        // Empty string clears the assignment; the backend treats 0/"" as "unassign".
        body: JSON.stringify({ instructor_id: newInstructorId ? Number(newInstructorId) : 0 }),
      });
      if (res.status === 401 || res.status === 403) {
        router.replace("/lms/admin/login");
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.message || `Could not reassign instructor (HTTP ${res.status}).`);
        return;
      }
      // Patch the row in place from the returned payload.
      if (json?.track) {
        setTracks((prev) => prev.map((t) => (t.id === track.id ? { ...t, ...json.track } : t)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingId(null);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/40";
  const selectClass = `${inputClass} appearance-none`;
  const optionClass = "bg-[#0b0b0b] text-white";

  const noCourses = !loading && courses.length === 0;
  const noStaff = !loading && staff.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Tracks &amp; Cohorts</h1>
        <p className="mt-1 text-sm text-site-muted">
          {loading ? "Loading…" : `${tracks.length} cohort${tracks.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {/* Create cohort */}
      <div ref={formRef} className="rounded-[20px] border border-white/20 bg-white/[0.04] p-6">
        <h2 className="text-lg font-semibold text-white">Create a cohort</h2>
        <p className="mt-1 text-sm text-site-muted">
          A cohort (track) is a batch of students taking a course together, led by one instructor. Assign the
          instructor now or later.
        </p>

        {noCourses ? (
          <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            Create a course first: cohorts belong to a course. Add one on the{" "}
            <button type="button" onClick={() => router.push("/lms/admin/courses")} className="font-semibold underline">
              Courses
            </button>{" "}
            page.
          </div>
        ) : (
          <form onSubmit={createTrack} className="mt-4 space-y-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cohort name (e.g. March 2026 Batch)"
              className={inputClass}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
                  Course
                </label>
                <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={selectClass}>
                  <option value="" className={optionClass}>
                    Select a course…
                  </option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id} className={optionClass}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
                  Instructor <span className="text-white/30">(optional)</span>
                </label>
                <select
                  value={instructorId}
                  onChange={(e) => setInstructorId(e.target.value)}
                  disabled={noStaff}
                  className={`${selectClass} disabled:opacity-50`}
                >
                  <option value="" className={optionClass}>
                    {noStaff ? "No staff yet, assign later" : "Unassigned"}
                  </option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id} className={optionClass}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={creating}
                className="rounded-full bg-site-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {creating ? "Creating…" : "Create cohort"}
              </button>
              {createMsg && (
                <p className={`text-sm ${createMsg.kind === "ok" ? "text-emerald-300" : "text-red-300"}`}>
                  {createMsg.text}
                </p>
              )}
            </div>
            {noStaff && (
              <p className="text-xs text-site-muted">
                Tip: invite instructors on the Staff page, then assign them to a cohort here.
              </p>
            )}
          </form>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-[20px] border border-white/20 bg-white/[0.04]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wide text-site-muted">
                <th className="px-5 py-3 font-semibold">Cohort</th>
                <th className="px-5 py-3 font-semibold">Course</th>
                <th className="px-5 py-3 font-semibold">Instructor</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((t) => (
                <tr key={t.id} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3 text-white">{t.name}</td>
                  <td className="px-5 py-3 text-site-muted">{t.course ?? "—"}</td>
                  <td className="px-5 py-3">
                    <select
                      value={t.instructor_id ? String(t.instructor_id) : ""}
                      disabled={savingId === t.id || noStaff}
                      onChange={(e) => reassign(t, e.target.value)}
                      className="rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-white outline-none transition focus:border-white/40 disabled:opacity-60"
                    >
                      <option value="" className={optionClass}>
                        {noStaff ? "No staff yet" : "Unassigned"}
                      </option>
                      {/* Keep the current instructor selectable even if they were
                          filtered out of the staff list for any reason. */}
                      {t.instructor_id && !staff.some((s) => s.id === t.instructor_id) && (
                        <option value={String(t.instructor_id)} className={optionClass}>
                          {t.instructor ?? "Current instructor"}
                        </option>
                      )}
                      {staff.map((s) => (
                        <option key={s.id} value={s.id} className={optionClass}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    {savingId === t.id && <span className="ml-2 text-[11px] text-white/50">Saving…</span>}
                  </td>
                </tr>
              ))}
              {!loading && !tracks.length && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-sm text-site-muted">
                    No cohorts yet. Create your first cohort above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
