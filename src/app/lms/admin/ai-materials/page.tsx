"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OWNER_API } from "@/lib/api";
import { ownerAuthHeaders, getOwnerToken, maybeUpgrade } from "@/lib/owner-client";
import { useToast } from "@/components/ToastProvider";

// AI training-material generator (Gamma, Pro+). The owner describes a topic, we
// kick off an async Gamma generation, poll it to completion, then let them save
// the finished (editable, durable) Gamma link into one of their courses as a
// material. Every call sends the owner bearer token; a lower-plan academy hits
// the backend Pro gate → 402 → maybeUpgrade() raises the shared UpgradeModal.
//
// NOTE: we deliberately save the durable `gammaUrl` (the editable doc), never the
// export URL — Gamma's export links expire in ~1 week, so the PDF/PPTX is offered
// only as an immediate one-off download here.

type Course = { id: number; title: string };

// The generation lifecycle. `starting` = the create POST is in flight; `pending`
// = we're polling Gamma; then it resolves to completed / failed.
type Phase = "idle" | "starting" | "pending" | "completed" | "failed";

const FORMATS: { value: string; label: string }[] = [
  { value: "presentation", label: "Presentation (slides)" },
  { value: "document", label: "Document" },
  { value: "social", label: "Social post" },
  { value: "webpage", label: "Web page" },
];

const EXPORTS: { value: string; label: string }[] = [
  { value: "", label: "None — just the editable Gamma doc" },
  { value: "pdf", label: "PDF" },
  { value: "pptx", label: "PowerPoint (.pptx)" },
];

const emptyForm = {
  prompt: "",
  format: "presentation",
  numCards: "",
  audience: "",
  tone: "",
  instructions: "",
  exportAs: "",
};

export default function OwnerAiMaterialsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Courses power the "save into" dropdown (module-level saving is backend-ready
  // but there's no owner modules-listing endpoint yet, so we target courses here).
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  const [form, setForm] = useState({ ...emptyForm });
  const [phase, setPhase] = useState<Phase>("idle");
  const [genError, setGenError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  // Save-into-course block.
  const [saveTitle, setSaveTitle] = useState("");
  const [saveCourseId, setSaveCourseId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Recursive setTimeout (not setInterval) so a slow status call never overlaps
  // the next poll. Cleared on unmount and whenever a new job starts.
  const pollRef = useRef<number | null>(null);
  const stopPolling = () => {
    if (pollRef.current) {
      window.clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  };

  const setField = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const loadCourses = useCallback(async () => {
    setCoursesLoading(true);
    try {
      const res = await fetch(OWNER_API.courses, { headers: ownerAuthHeaders() });
      if (res.status === 401 || res.status === 403) {
        router.replace("/lms/admin/login");
        return;
      }
      if (!res.ok) return;
      const json = await res.json();
      const list: Course[] = (json.courses ?? []).map((c: { id: number; title: string }) => ({
        id: c.id,
        title: c.title,
      }));
      setCourses(list);
      if (list.length) setSaveCourseId((cur) => cur || String(list[0].id));
    } catch {
      /* non-fatal — the owner can still generate, just can't save without courses */
    } finally {
      setCoursesLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!getOwnerToken()) {
      router.replace("/lms/admin/login");
      return;
    }
    loadCourses();
    return () => stopPolling();
  }, [loadCourses, router]);

  // Poll one generation to a terminal state, re-scheduling itself while pending.
  const poll = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(OWNER_API.aiStatus(id), { headers: ownerAuthHeaders() });
        if (res.status === 401 || res.status === 403) {
          router.replace("/lms/admin/login");
          return;
        }
        if (await maybeUpgrade(res)) {
          setPhase("idle");
          return;
        }
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setGenError(j?.message || `Could not check the generation (HTTP ${res.status}).`);
          setPhase("failed");
          return;
        }
        const j = await res.json();
        const status = String(j.status || "pending");
        if (status === "completed") {
          setResultUrl(j.url || null);
          setExportUrl(j.export_url || null);
          setPhase("completed");
          return;
        }
        if (status === "failed") {
          setGenError(j.error || "The AI couldn't finish this one. Try rewording your brief and generate again.");
          setPhase("failed");
          return;
        }
        // Still working — check again shortly.
        pollRef.current = window.setTimeout(() => poll(id), 5000);
      } catch {
        // Transient network blip — back off a touch and keep waiting rather than
        // failing a generation that's probably still running server-side.
        pollRef.current = window.setTimeout(() => poll(id), 6000);
      }
    },
    [router],
  );

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = form.prompt.trim();
    if (prompt.length < 3) {
      setGenError("Describe what you'd like the AI to create — a sentence or two is enough.");
      return;
    }

    stopPolling();
    setGenError(null);
    setResultUrl(null);
    setExportUrl(null);
    setSaveMsg(null);
    setPhase("starting");

    const body: Record<string, unknown> = { prompt, format: form.format };
    if (form.numCards.trim() && Number(form.numCards) > 0) body.num_cards = Number(form.numCards);
    if (form.instructions.trim()) body.additional_instructions = form.instructions.trim();
    if (form.tone.trim()) body.tone = form.tone.trim();
    if (form.audience.trim()) body.audience = form.audience.trim();
    if (form.exportAs) body.export_as = form.exportAs;

    try {
      const res = await fetch(OWNER_API.aiGenerate, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...ownerAuthHeaders() },
        body: JSON.stringify(body),
      });
      if (res.status === 401 || res.status === 403) {
        router.replace("/lms/admin/login");
        return;
      }
      // Pro-gate: a lower-plan academy gets the upgrade modal instead of a job.
      if (await maybeUpgrade(res)) {
        setPhase("idle");
        return;
      }
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGenError(j?.message || `Could not start the generation (HTTP ${res.status}).`);
        setPhase("failed");
        return;
      }
      const id = j.generation_id;
      if (!id) {
        setGenError("The AI service didn't return a job to track. Please try again in a moment.");
        setPhase("failed");
        return;
      }
      // Prefill a sensible material title from the brief; the owner can edit it.
      setSaveTitle((t) => t || prompt.slice(0, 80));
      setPhase("pending");
      poll(id);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : String(err));
      setPhase("failed");
    }
  };

  const startOver = () => {
    stopPolling();
    setPhase("idle");
    setGenError(null);
    setResultUrl(null);
    setExportUrl(null);
    setSaveMsg(null);
  };

  const save = async () => {
    const title = saveTitle.trim();
    if (!title) {
      setSaveMsg({ kind: "err", text: "Give this material a title." });
      return;
    }
    if (!saveCourseId) {
      setSaveMsg({ kind: "err", text: "Choose a course to save it into." });
      return;
    }
    if (!resultUrl) {
      setSaveMsg({ kind: "err", text: "Generate a document first." });
      return;
    }

    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(OWNER_API.aiSave, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...ownerAuthHeaders() },
        body: JSON.stringify({ title, url: resultUrl, course_id: Number(saveCourseId) }),
      });
      if (res.status === 401 || res.status === 403) {
        router.replace("/lms/admin/login");
        return;
      }
      if (await maybeUpgrade(res)) {
        setSaving(false);
        return;
      }
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveMsg({ kind: "err", text: j?.message || `Could not save (HTTP ${res.status}).` });
        return;
      }
      const courseTitle = courses.find((c) => String(c.id) === String(saveCourseId))?.title || "your course";
      toast(`Saved “${title}” to ${courseTitle}.`, "success");
      setSaveMsg({ kind: "ok", text: `Saved to ${courseTitle} — students will find it under the course's materials.` });
    } catch (err) {
      setSaveMsg({ kind: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/40";
  const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50";
  const busy = phase === "starting" || phase === "pending";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Create with AI</h1>
        <p className="mt-1 max-w-2xl text-sm text-site-muted">
          Describe a topic and generate a polished presentation or document with AI, then save it straight into one of
          your courses as a material. Powered by Gamma — available on the Pro plan and above.
        </p>
      </div>

      {/* Brief */}
      <form onSubmit={generate} className="rounded-[20px] border border-white/20 bg-white/[0.04] p-6">
        <div>
          <label className={labelClass}>What should the AI create?</label>
          <textarea
            value={form.prompt}
            onChange={(e) => setField("prompt", e.target.value)}
            rows={4}
            placeholder="e.g. A beginner-friendly lesson on the fundamentals of HTML — elements, tags, attributes, and page structure — with examples."
            className={inputClass}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Format</label>
            <select value={form.format} onChange={(e) => setField("format", e.target.value)} className={inputClass}>
              {FORMATS.map((f) => (
                <option key={f.value} value={f.value} className="bg-[#0b0b0b]">
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Length (cards / sections)</label>
            <input
              type="number"
              min={1}
              max={60}
              value={form.numCards}
              onChange={(e) => setField("numCards", e.target.value)}
              placeholder="Auto"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Audience (optional)</label>
            <input
              type="text"
              value={form.audience}
              onChange={(e) => setField("audience", e.target.value)}
              placeholder="e.g. Absolute beginners"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Tone (optional)</label>
            <input
              type="text"
              value={form.tone}
              onChange={(e) => setField("tone", e.target.value)}
              placeholder="e.g. Friendly and encouraging"
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className={labelClass}>Extra instructions (optional)</label>
          <textarea
            value={form.instructions}
            onChange={(e) => setField("instructions", e.target.value)}
            rows={2}
            placeholder="Anything specific — e.g. include a short quiz at the end, or use real-world examples."
            className={inputClass}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Downloadable copy (optional)</label>
            <select value={form.exportAs} onChange={(e) => setField("exportAs", e.target.value)} className={inputClass}>
              {EXPORTS.map((x) => (
                <option key={x.value} value={x.value} className="bg-[#0b0b0b]">
                  {x.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-site-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {phase === "starting" ? "Starting…" : phase === "pending" ? "Generating…" : "Generate with AI"}
          </button>
          {genError && phase !== "pending" ? <p className="text-sm text-red-300">{genError}</p> : null}
        </div>
      </form>

      {/* Result / progress — only once a job has been kicked off */}
      {phase !== "idle" && (
        <div className="rounded-[20px] border border-white/20 bg-white/[0.04] p-6">
          {phase === "starting" || phase === "pending" ? (
            <div className="flex items-center gap-4">
              <svg className="h-6 w-6 shrink-0 animate-spin text-site-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-90" d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-white">Generating your material…</p>
                <p className="mt-0.5 text-sm text-site-muted">
                  This usually takes one to three minutes. You can leave this page open — it&apos;ll update on its own.
                </p>
              </div>
            </div>
          ) : null}

          {phase === "failed" ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-red-300">Generation didn&apos;t complete</p>
              <p className="text-sm text-site-muted">{genError || "Something went wrong. Please try again."}</p>
              <button
                type="button"
                onClick={startOver}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10"
              >
                Start over
              </button>
            </div>
          ) : null}

          {phase === "completed" ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-emerald-300">Your material is ready</p>
                  <p className="mt-0.5 text-sm text-site-muted">
                    Open it in Gamma to review or edit, then save the link into a course below.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={startOver}
                  className="shrink-0 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10"
                >
                  Create another
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                {resultUrl ? (
                  <a
                    href={resultUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-site-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    Open in Gamma
                  </a>
                ) : null}
                {exportUrl ? (
                  <a
                    href={exportUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/10"
                  >
                    Download copy
                  </a>
                ) : null}
              </div>

              {/* Save into a course. We persist the durable Gamma link; students open
                  it from the course's materials. */}
              <div className="rounded-2xl border border-white/12 bg-black/20 p-5">
                <p className="text-sm font-semibold text-white">Save to a course</p>
                <p className="mt-0.5 text-xs text-site-muted">
                  This adds the Gamma link as a material. Make sure the document&apos;s share setting in Gamma lets your
                  students view it.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Material title</label>
                    <input
                      type="text"
                      value={saveTitle}
                      onChange={(e) => setSaveTitle(e.target.value)}
                      placeholder="e.g. HTML Fundamentals — Slides"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Course</label>
                    <select
                      value={saveCourseId}
                      onChange={(e) => setSaveCourseId(e.target.value)}
                      disabled={coursesLoading || !courses.length}
                      className={inputClass}
                    >
                      {coursesLoading ? (
                        <option className="bg-[#0b0b0b]">Loading…</option>
                      ) : courses.length ? (
                        courses.map((c) => (
                          <option key={c.id} value={String(c.id)} className="bg-[#0b0b0b]">
                            {c.title}
                          </option>
                        ))
                      ) : (
                        <option value="" className="bg-[#0b0b0b]">
                          No courses yet — create one first
                        </option>
                      )}
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={save}
                    disabled={saving || !courses.length || !resultUrl}
                    className="rounded-full bg-site-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save to course"}
                  </button>
                  {saveMsg ? (
                    <p className={`text-sm ${saveMsg.kind === "ok" ? "text-emerald-300" : "text-red-300"}`}>
                      {saveMsg.text}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
