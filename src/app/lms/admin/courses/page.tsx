"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OWNER_API } from "@/lib/api";
import { ownerAuthHeaders, getOwnerToken } from "@/lib/owner-client";
import { useToast } from "@/components/ToastProvider";
import StarRating from "@/components/ui/StarRating";

type Course = {
  id: number;
  title: string;
  slug: string | null;
  description: string | null;
  requirements: string | null;
  price: number | string | null;
  original_price?: number | string | null;
  cover_image_url?: string | null;
  rating_average?: number;
  rating_count?: number;
  instructor_name?: string | null;
  is_bestseller?: boolean;
  max_students: number | null;
  students_count: number;
  tracks_count: number;
  is_live_available: boolean;
  is_prerecorded_available: boolean;
  is_active: boolean;
};

function formatPrice(price: Course["price"]): string {
  if (price === null || price === undefined || price === "") return "—";
  const n = typeof price === "string" ? Number(price) : price;
  if (Number.isNaN(n)) return "—";
  if (n === 0) return "Free";
  return `₦${n.toLocaleString()}`;
}

// First character of the title, for the branded placeholder when no cover is set.
function coverInitial(title: string): string {
  const c = (title || "").trim().charAt(0);
  return c ? c.toUpperCase() : "•";
}

const emptyForm = {
  title: "",
  description: "",
  requirements: "",
  price: "",
  originalPrice: "",
  maxStudents: "",
  isLive: true,
  isPrerecorded: true,
  isActive: true,
};

export default function OwnerCoursesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // One form drives both create and edit. `editingId` null = create mode.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  // Cover image is managed separately from the text form: it POSTs immediately on
  // pick/remove (the endpoint needs the course id, so it's only shown while editing).
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const setField = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(OWNER_API.courses, { headers: ownerAuthHeaders() });
      if (res.status === 401 || res.status === 403) {
        router.replace("/lms/admin/login");
        return;
      }
      if (!res.ok) {
        setError(`Could not load courses (HTTP ${res.status}).`);
        return;
      }
      const json = await res.json();
      setCourses(json.courses ?? []);
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

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setCoverUrl(null);
    setSaveMsg(null);
  };

  const startEdit = (c: Course) => {
    setEditingId(c.id);
    setSaveMsg(null);
    setForm({
      title: c.title ?? "",
      description: c.description ?? "",
      requirements: c.requirements ?? "",
      price: c.price === null || c.price === undefined ? "" : String(c.price),
      originalPrice: c.original_price === null || c.original_price === undefined ? "" : String(c.original_price),
      maxStudents: c.max_students ? String(c.max_students) : "",
      isLive: !!c.is_live_available,
      isPrerecorded: !!c.is_prerecorded_available,
      isActive: !!c.is_active,
    });
    setCoverUrl(c.cover_image_url ?? null);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setSaveMsg({ kind: "err", text: "Enter a course title." });
      return;
    }
    if (form.price !== "" && (Number.isNaN(Number(form.price)) || Number(form.price) < 0)) {
      setSaveMsg({ kind: "err", text: "Price must be a number (0 or more)." });
      return;
    }
    if (form.originalPrice !== "" && (Number.isNaN(Number(form.originalPrice)) || Number(form.originalPrice) < 0)) {
      setSaveMsg({ kind: "err", text: "Original price must be a number (0 or more)." });
      return;
    }
    if (form.maxStudents !== "" && (!Number.isInteger(Number(form.maxStudents)) || Number(form.maxStudents) < 0)) {
      setSaveMsg({ kind: "err", text: "Capacity must be a whole number (0 = unlimited)." });
      return;
    }

    const body = {
      title,
      description: form.description.trim() || null,
      requirements: form.requirements.trim() || null,
      price: form.price === "" ? 0 : Number(form.price),
      original_price: form.originalPrice === "" ? null : Number(form.originalPrice),
      max_students: form.maxStudents === "" ? 0 : Number(form.maxStudents),
      is_live_available: form.isLive,
      is_prerecorded_available: form.isPrerecorded,
      is_active: form.isActive,
    };

    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(editingId ? OWNER_API.updateCourse(editingId) : OWNER_API.storeCourse, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...ownerAuthHeaders() },
        body: JSON.stringify(body),
      });
      if (res.status === 401 || res.status === 403) {
        router.replace("/lms/admin/login");
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveMsg({ kind: "err", text: json?.message || `Could not save (HTTP ${res.status}).` });
        return;
      }
      if (editingId) {
        setSaveMsg({ kind: "ok", text: `Updated “${title}”.` });
        toast(`Course “${title}” updated.`, "success");
        resetForm();
      } else {
        // Drop straight into edit mode for the just-created course so the owner
        // can add a cover image (the uploader needs the new course id).
        const created: Course | undefined = json?.course;
        toast(`Course “${title}” created.`, "success");
        if (created?.id) {
          startEdit(created);
          setSaveMsg({ kind: "ok", text: `Created “${title}”. Add a cover image below (optional).` });
        } else {
          resetForm();
        }
      }
      load();
    } catch (err) {
      setSaveMsg({ kind: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setSaving(false);
    }
  };

  const onPickCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingId) return;
    setCoverBusy(true);
    setSaveMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(OWNER_API.courseCover(editingId), {
        method: "POST",
        headers: ownerAuthHeaders(), // no Content-Type — browser sets the multipart boundary
        body: fd,
      });
      if (res.status === 401 || res.status === 403) {
        router.replace("/lms/admin/login");
        return;
      }
      const j = await res.json().catch(() => null);
      if (!res.ok) {
        setSaveMsg({ kind: "err", text: j?.message ?? "Upload failed. Use a PNG/JPG under 4MB." });
        return;
      }
      const updated: Course | undefined = j?.course;
      setCoverUrl(updated?.cover_image_url ?? null);
      setSaveMsg({ kind: "ok", text: "Cover image updated." });
      load();
    } catch (err) {
      setSaveMsg({ kind: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setCoverBusy(false);
      if (coverFileRef.current) coverFileRef.current.value = "";
    }
  };

  const removeCover = async () => {
    if (!editingId) return;
    setCoverBusy(true);
    setSaveMsg(null);
    try {
      const res = await fetch(OWNER_API.courseCover(editingId), {
        method: "POST",
        headers: { ...ownerAuthHeaders(), "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ remove_cover: true }),
      });
      if (res.status === 401 || res.status === 403) {
        router.replace("/lms/admin/login");
        return;
      }
      const j = await res.json().catch(() => null);
      if (!res.ok) {
        setSaveMsg({ kind: "err", text: j?.message ?? "Could not remove cover." });
        return;
      }
      setCoverUrl(null);
      setSaveMsg({ kind: "ok", text: "Cover image removed." });
      load();
    } catch (err) {
      setSaveMsg({ kind: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setCoverBusy(false);
    }
  };

  const remove = async (c: Course) => {
    setDeletingId(c.id);
    try {
      const res = await fetch(OWNER_API.deleteCourse(c.id), {
        method: "DELETE",
        headers: { Accept: "application/json", ...ownerAuthHeaders() },
      });
      if (res.status === 401 || res.status === 403) {
        router.replace("/lms/admin/login");
        return;
      }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json?.message || `Could not delete course (HTTP ${res.status}).`);
        return;
      }
      if (editingId === c.id) resetForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/40";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Courses</h1>
        <p className="mt-1 text-sm text-site-muted">
          {loading ? "Loading…" : `${courses.length} course${courses.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {/* Create / edit */}
      <div ref={formRef} className="rounded-[20px] border border-white/20 bg-white/[0.04] p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {editingId ? "Edit course" : "Create a course"}
            </h2>
            <p className="mt-1 text-sm text-site-muted">
              {editingId
                ? "Update the details, pricing, and availability for this program."
                : "Add a program your institute offers. Set its description, price, and capacity."}
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="shrink-0 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10"
            >
              Cancel edit
            </button>
          )}
        </div>

        <form onSubmit={save} className="mt-4 space-y-4">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            placeholder="Course title (e.g. Full Stack Web Development)"
            className={inputClass}
          />
          <textarea
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            rows={3}
            placeholder="Description — what students will learn (optional)"
            className={inputClass}
          />
          <textarea
            value={form.requirements}
            onChange={(e) => setField("requirements", e.target.value)}
            rows={2}
            placeholder="Requirements / prerequisites (optional)"
            className={inputClass}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
                Price (₦)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                placeholder="0 (free)"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
                Original price (₦)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.originalPrice}
                onChange={(e) => setField("originalPrice", e.target.value)}
                placeholder="Optional"
                className={inputClass}
              />
              <p className="mt-1 text-[11px] text-white/40">Shown struck-through when higher than the price.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
                Capacity
              </label>
              <input
                type="number"
                min={0}
                step="1"
                value={form.maxStudents}
                onChange={(e) => setField("maxStudents", e.target.value)}
                placeholder="0 = unlimited"
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input type="checkbox" checked={form.isLive} onChange={(e) => setField("isLive", e.target.checked)} className="h-4 w-4 accent-[color:var(--color-primary)]" />
              Live classes available
            </label>
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input type="checkbox" checked={form.isPrerecorded} onChange={(e) => setField("isPrerecorded", e.target.checked)} className="h-4 w-4 accent-[color:var(--color-primary)]" />
              Pre-recorded available
            </label>
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setField("isActive", e.target.checked)} className="h-4 w-4 accent-[color:var(--color-primary)]" />
              Published (visible on your public page)
            </label>
          </div>

          {/* Cover image — the storefront card's thumbnail. Managed inline (POSTs
              immediately); only available once the course exists (needs its id). */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">Cover image</label>
            {editingId ? (
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg ring-1 ring-inset ring-[color:var(--color-primary)]/40">
                  {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center"
                      style={{ background: "linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 45%, #000))" }}
                    >
                      <span className="text-2xl font-black text-white/90">{coverInitial(form.title)}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <input ref={coverFileRef} type="file" accept="image/*" onChange={onPickCover} className="hidden" />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => coverFileRef.current?.click()}
                      disabled={coverBusy}
                      className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/10 disabled:opacity-60"
                    >
                      {coverBusy ? "Working…" : coverUrl ? "Replace cover" : "Upload cover"}
                    </button>
                    {coverUrl ? (
                      <button
                        type="button"
                        onClick={removeCover}
                        disabled={coverBusy}
                        className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-red-300/80 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-60"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-white/40">Shown on your public course card. PNG/JPG under 4MB. No cover → a branded placeholder.</p>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-white/40">You can add a cover image right after creating the course.</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-site-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Create course"}
            </button>
            {saveMsg && (
              <p className={`text-sm ${saveMsg.kind === "ok" ? "text-emerald-300" : "text-red-300"}`}>{saveMsg.text}</p>
            )}
          </div>
        </form>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-[20px] border border-white/20 bg-white/[0.04]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wide text-site-muted">
                <th className="px-5 py-3 font-semibold">Course</th>
                <th className="px-5 py-3 font-semibold">Price</th>
                <th className="px-5 py-3 font-semibold">Students</th>
                <th className="px-5 py-3 font-semibold">Tracks</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative aspect-video w-16 shrink-0 overflow-hidden rounded-md ring-1 ring-inset ring-[color:var(--color-primary)]/30">
                        {c.cover_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.cover_image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center"
                            style={{ background: "linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 45%, #000))" }}
                          >
                            <span className="text-sm font-black text-white/90">{coverInitial(c.title)}</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium text-white">{c.title}</span>
                          {c.is_bestseller ? (
                            <span className="shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: "#ccfbf1", color: "#115e59" }}>
                              Bestseller
                            </span>
                          ) : null}
                        </div>
                        {(c.rating_count ?? 0) > 0 ? (
                          <div className="mt-1">
                            <StarRating value={c.rating_average ?? 0} count={c.rating_count ?? 0} size="sm" />
                          </div>
                        ) : (
                          <p className="mt-1 text-[11px] text-white/40">No ratings yet</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-site-muted">
                    <div>{formatPrice(c.price)}</div>
                    {c.original_price != null && Number(c.original_price) > Number(c.price ?? 0) ? (
                      <div className="text-[11px] text-white/40 line-through">{formatPrice(c.original_price)}</div>
                    ) : null}
                  </td>
                  <td className="px-5 py-3 text-site-muted">{c.students_count}</td>
                  <td className="px-5 py-3 text-site-muted">{c.tracks_count}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        c.is_active ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/60"
                      }`}
                    >
                      {c.is_active ? "Active" : "Draft"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {confirmingId === c.id ? (
                        <>
                          <span className="text-xs text-white/60">Delete?</span>
                          <button
                            type="button"
                            onClick={() => remove(c)}
                            disabled={deletingId === c.id}
                            className="rounded-full bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/30 disabled:opacity-60"
                          >
                            {deletingId === c.id ? "Deleting…" : "Confirm"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingId(null)}
                            className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(c)}
                            className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white/85 transition hover:bg-white/10"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingId(c.id)}
                            className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-red-300/80 transition hover:bg-red-500/10 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !courses.length && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-site-muted">
                    No courses yet. Create your first course above.
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
