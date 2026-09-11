"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OWNER_API, STAFF_API } from "@/lib/api";
import { apiFetchStaff } from "@/lib/fetch-with-timeout";
import { ownerAuthHeaders, getOwnerToken, maybeUpgrade } from "@/lib/owner-client";
import { tenantLoginPath } from "@/lib/tenant-client";
import { useToast } from "@/components/ToastProvider";

// AI training-material generator (Gamma, Pro+), shared by the OWNER admin page
// (/lms/admin/ai-materials) and the STAFF portal page (/lms/staff/ai-materials).
// Teachers are the ones authoring course content, so both roles get the flow;
// the only per-variant differences live in the `config` object below (endpoints,
// auth transport, how the course list is fetched, and how a 402 plan gate is
// presented — the owner sees the UpgradeModal, staff get an inline "ask your
// academy owner to upgrade" note since they can't upgrade the plan themselves).
//
// Describe a topic → an async generation starts → poll to completion → save
// the finished material. Both save targets behave the same way:
//  • Into a MODULE → the backend stores the downloadable copy (PDF/PPTX
//    export) as a module content item.
//  • Into the whole COURSE → the same downloadable copy as a course material.
// The export links expire (~1 week), which is exactly why the backend
// downloads the bytes at save time and serves our own copy. The editable
// vendor doc link is kept server-side (provider/external_id) but is NEVER
// shown to students, or to anyone else: the platform is white-labeled, end
// users must not learn which AI vendor powers this.

type Course = { id: number; title: string };
type Module = { id: number; title: string };

export type AiVariant = "owner" | "staff";

// The generation lifecycle. `starting` = the create POST is in flight; `pending`
// = we're polling for the result; then it resolves to completed / failed.
type Phase = "idle" | "starting" | "pending" | "completed" | "failed";

const FORMATS: { value: string; label: string }[] = [
  { value: "presentation", label: "Presentation (slides)" },
  { value: "document", label: "Document" },
  { value: "social", label: "Social post" },
  { value: "webpage", label: "Web page" },
];

// The file format students will download. An export is ALWAYS requested (the
// backend defaults an omitted one to PDF) because the stored file is the
// student-facing artifact, not an optional extra. Pick Word or PowerPoint when
// you want to edit the file yourself (download, tweak, re-upload); PDF is
// read-only but opens anywhere. Word has no native vendor export — the backend
// converts the PowerPoint master into a .docx on save/download.
const EXPORTS: { value: string; label: string }[] = [
  { value: "pdf", label: "PDF (read-only, opens anywhere)" },
  { value: "docx", label: "Word (.docx, editable)" },
  { value: "pptx", label: "PowerPoint (.pptx, editable)" },
];

const emptyForm = {
  prompt: "",
  format: "presentation",
  numCards: "",
  audience: "",
  tone: "",
  instructions: "",
  exportAs: "pdf",
};

export default function AiMaterialsWorkspace({ variant }: { variant: AiVariant }) {
  const router = useRouter();
  const { toast } = useToast();
  const isOwner = variant === "owner";

  // ── Per-variant wiring ─────────────────────────────────────────────────
  // Everything that differs between the owner and staff pages, in one place.
  const config = {
    // Endpoints (same generate/status/save/modules contract on both).
    aiGenerate: isOwner ? OWNER_API.aiGenerate : STAFF_API.aiGenerate,
    aiStatus: isOwner ? OWNER_API.aiStatus : STAFF_API.aiStatus,
    aiSave: isOwner ? OWNER_API.aiSave : STAFF_API.aiSave,
    // One-off Word download: converts the pptx export and streams the .docx.
    aiDocx: isOwner ? OWNER_API.aiDocxDownload : STAFF_API.aiDocxDownload,
    courseModules: isOwner ? OWNER_API.courseModules : STAFF_API.courseModules,

    // The staff transport is apiFetchStaff (bearer lms_staff_token + timeout +
    // the shared 401 → staff-login redirect); the owner page keeps its raw
    // fetch + ownerAuthHeaders so maybeUpgrade can intercept the 402s itself.
    send: (url: string, init: RequestInit = {}): Promise<Response> =>
      isOwner
        ? fetch(url, { ...init, headers: { ...init.headers, ...ownerAuthHeaders() } })
        : apiFetchStaff(url, init),

    // Courses the user may save into: all of the institute's (owner) vs. the
    // teacher's assigned ones (staff). Owner response is {courses:[...]}, the
    // staff assigned-courses endpoint returns a bare array.
    loadCourses: async (): Promise<Course[]> => {
      if (isOwner) {
        const res = await fetch(OWNER_API.courses, { headers: ownerAuthHeaders() });
        if (res.status === 401 || res.status === 403) {
          router.replace("/lms/admin/login");
          return [];
        }
        if (!res.ok) return [];
        const json = await res.json();
        return (json.courses ?? []).map((c: { id: number; title: string }) => ({ id: c.id, title: c.title }));
      }
      const res = await apiFetchStaff(STAFF_API.assignedCourses);
      if (res.status === 401 || res.status === 403) {
        router.replace(tenantLoginPath("staff"));
        return [];
      }
      if (!res.ok) return [];
      const json = await res.json();
      return (Array.isArray(json) ? json : []).map((c: { id: number; title: string }) => ({ id: c.id, title: c.title }));
    },

    // A 402 means the academy's plan lacks ai_materials. The owner can upgrade,
    // so raise the UpgradeModal; staff can't, so surface an inline note instead.
    planGate: async (res: Response, fail: (msg: string) => void): Promise<boolean> => {
      if (res.status !== 402) return false;
      if (isOwner) return maybeUpgrade(res);
      fail("This is a Pro feature. Ask your academy owner to upgrade to the Pro plan to unlock AI materials.");
      return true;
    },

    // An auth failure mid-flow sends the right role to ITS login page. (A staff
    // 401 never arrives as a response — apiFetchStaff redirects and throws.)
    sessionExpired: () => {
      if (isOwner) router.replace("/lms/admin/login");
      else window.location.href = tenantLoginPath("staff");
    },
  };

  // Courses power the "save into" dropdown; picking a course then loads its
  // modules, so the user can target a specific module (the file lands inside
  // the module's content) or the course as a whole (its materials page).
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  const [form, setForm] = useState({ ...emptyForm });
  const [phase, setPhase] = useState<Phase>("idle");
  const [genError, setGenError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  // The export format actually requested for THIS generation (captured at kick-off,
  // not read from the live form at save time, the user may edit the brief after).
  // The backend defaults an omitted export to PDF, so a downloadable copy always
  // exists; "docx"/"pptx" only when explicitly picked (a Word choice is served
  // from the pptx master, converted server-side).
  const [resultFormat, setResultFormat] = useState<"pdf" | "docx" | "pptx">("pdf");

  // Save-into block: a course (required) and, within it, an optional module.
  const [saveTitle, setSaveTitle] = useState("");
  const [saveCourseId, setSaveCourseId] = useState("");
  const [saveModuleId, setSaveModuleId] = useState(""); // "" = the course as a whole
  const [modules, setModules] = useState<Module[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  // True while the Word copy is being converted server-side (the pptx export is
  // fetched + converted, then streamed back as a .docx attachment).
  const [docxBusy, setDocxBusy] = useState(false);

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
      const list = await config.loadCourses();
      setCourses(list);
      if (list.length) setSaveCourseId((cur) => cur || String(list[0].id));
    } catch {
      /* non-fatal, the user can still generate, just can't save without courses */
    } finally {
      setCoursesLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, variant]);

  // Load the selected course's modules so the user can save into a specific one.
  // Called whenever the target course changes; the module selection resets to the
  // course-level default ("") each time so a stale module id can't leak across.
  const loadModules = useCallback(
    async (courseId: string) => {
      setSaveModuleId("");
      if (!courseId) {
        setModules([]);
        return;
      }
      setModulesLoading(true);
      try {
        const res = await config.send(config.courseModules(courseId));
        if (res.status === 401 || res.status === 403) {
          config.sessionExpired();
          return;
        }
        if (await config.planGate(res, (msg) => setModules([]))) return;
        if (!res.ok) {
          setModules([]);
          return;
        }
        const json = await res.json();
        setModules(
          (json.modules ?? []).map((m: { id: number; title: string }) => ({ id: m.id, title: m.title })),
        );
      } catch {
        setModules([]); // non-fatal, the course-level save still works
      } finally {
        setModulesLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, variant],
  );

  // Refresh the module list whenever the chosen course changes.
  useEffect(() => {
    loadModules(saveCourseId);
  }, [saveCourseId, loadModules]);

  useEffect(() => {
    const hasToken = isOwner ? getOwnerToken() : localStorage.getItem("lms_staff_token");
    if (!hasToken) {
      config.sessionExpired();
      return;
    }
    loadCourses();
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadCourses, router, variant]);

  // Poll one generation to a terminal state, re-scheduling itself while pending.
  // exportWaits counts the extra polls done after "completed" while the export
  // file is still missing — the export finishes slightly AFTER the doc flips to
  // completed, and the save needs it, so we keep waiting (up to ~1 minute)
  // instead of landing in a state that can only fail.
  const poll = useCallback(
    async (id: string, exportWaits = 0) => {
      try {
        const res = await config.send(config.aiStatus(id));
        if (res.status === 401 || res.status === 403) {
          config.sessionExpired();
          return;
        }
        if (await config.planGate(res, (msg) => setGenError(msg))) {
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
          if (!j.export_url && exportWaits < 12) {
            pollRef.current = window.setTimeout(() => poll(id, exportWaits + 1), 5000);
            return;
          }
          setPhase("completed");
          return;
        }
        if (status === "failed") {
          setGenError(j.error || "The AI couldn't finish this one. Try rewording your brief and generate again.");
          setPhase("failed");
          return;
        }
        // Still working, check again shortly.
        pollRef.current = window.setTimeout(() => poll(id), 5000);
      } catch {
        // Transient network blip, back off a touch and keep waiting rather than
        // failing a generation that's probably still running server-side.
        pollRef.current = window.setTimeout(() => poll(id), 6000);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, variant],
  );

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = form.prompt.trim();
    if (prompt.length < 3) {
      setGenError("Describe what you'd like the AI to create. A sentence or two is enough.");
      return;
    }

    stopPolling();
    setGenError(null);
    setResultUrl(null);
    setExportUrl(null);
    // Lock in the export format for this run (PDF unless Word/PowerPoint was
    // chosen) so the eventual save stores the file with the right type even if
    // the brief is edited afterwards. Mirrors the backend's "default an omitted
    // export to PDF".
    setResultFormat(form.exportAs === "docx" || form.exportAs === "pptx" ? form.exportAs : "pdf");
    setSaveMsg(null);
    setPhase("starting");

    const body: Record<string, unknown> = { prompt, format: form.format };
    if (form.numCards.trim() && Number(form.numCards) > 0) body.num_cards = Number(form.numCards);
    if (form.instructions.trim()) body.additional_instructions = form.instructions.trim();
    if (form.tone.trim()) body.tone = form.tone.trim();
    if (form.audience.trim()) body.audience = form.audience.trim();
    if (form.exportAs) body.export_as = form.exportAs;

    try {
      const res = await config.send(config.aiGenerate, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401 || res.status === 403) {
        config.sessionExpired();
        return;
      }
      // Pro-gate: a lower-plan academy gets the upgrade modal (owner) or the
      // inline "ask your owner" note (staff) instead of a job.
      if (await config.planGate(res, (msg) => setGenError(msg))) {
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
      // Prefill a sensible material title from the brief; the user can edit it.
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

  // "Download copy" when Word was chosen: the backend fetches the pptx export
  // (the editable master), converts it to .docx and streams it back. The vendor
  // only offers pdf/pptx, so the Word file is produced by us, on demand.
  const downloadWordCopy = async () => {
    if (!exportUrl || docxBusy) return;
    setDocxBusy(true);
    try {
      const res = await config.send(config.aiDocx, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/octet-stream, application/json" },
        body: JSON.stringify({ export_url: exportUrl, title: saveTitle.trim() || undefined }),
      });
      if (res.status === 401 || res.status === 403) {
        config.sessionExpired();
        return;
      }
      if (await config.planGate(res, (msg) => setSaveMsg({ kind: "err", text: msg }))) return;
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast(j?.message || "Could not prepare the Word copy. Please try again.", "error");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        (saveTitle.trim().replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "ai-materials") +
        ".docx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not prepare the Word copy. Please try again.", "error");
    } finally {
      setDocxBusy(false);
    }
  };

  const save = async () => {
    const title = saveTitle.trim();
    if (!title) {
      setSaveMsg({ kind: "err", text: "Give this material a title." });
      return;
    }
    if (!saveCourseId) {
      setSaveMsg({
        kind: "err",
        text: isOwner ? "Choose a course to save it into." : "You have no assigned courses to save into yet.",
      });
      return;
    }
    if (!resultUrl) {
      setSaveMsg({ kind: "err", text: "Generate a document first." });
      return;
    }

    setSaving(true);
    setSaveMsg(null);
    try {
      // Both targets get the export URL + format so the backend downloads and
      // stores a real file (module contents and course materials alike); `url`
      // is the vendor doc link the backend keeps server-side for recovery.
      const body: Record<string, unknown> = { title, url: resultUrl };
      if (exportUrl) {
        body.export_url = exportUrl;
        body.format = resultFormat;
      }
      if (saveModuleId) {
        body.module_id = Number(saveModuleId);
      } else {
        body.course_id = Number(saveCourseId);
      }

      const res = await config.send(config.aiSave, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401 || res.status === 403) {
        config.sessionExpired();
        return;
      }
      if (await config.planGate(res, (msg) => setSaveMsg({ kind: "err", text: msg }))) {
        setSaving(false);
        return;
      }
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveMsg({ kind: "err", text: j?.message || `Could not save (HTTP ${res.status}).` });
        return;
      }
      const courseTitle = courses.find((c) => String(c.id) === String(saveCourseId))?.title || "your course";
      if (saveModuleId) {
        const moduleTitle = modules.find((m) => String(m.id) === String(saveModuleId))?.title || "the module";
        toast(`Saved “${title}” to ${moduleTitle}.`, "success");
        setSaveMsg({
          kind: "ok",
          text: `Saved to ${moduleTitle} as a downloadable file, students will find it inside the module.`,
        });
      } else {
        toast(`Saved “${title}” to ${courseTitle}.`, "success");
        setSaveMsg({
          kind: "ok",
          text: `Saved to ${courseTitle} as a downloadable file, students will find it under the course's materials.`,
        });
      }
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
          {isOwner ? (
            <>
              Describe a topic and generate a polished presentation or document with AI, then save it straight into one of
              your courses as a material. Available on the Pro plan and above.
            </>
          ) : (
            <>
              Describe a topic and generate a polished presentation or document with AI, then save it straight into one of
              the courses you teach. Available on the Pro plan and above.
            </>
          )}
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
            placeholder="e.g. A beginner-friendly lesson on the fundamentals of HTML (elements, tags, attributes, and page structure) with examples."
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
            placeholder="Anything specific, e.g. include a short quiz at the end, or use real-world examples."
            className={inputClass}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>File format students download</label>
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
            className="rounded-full bg-site-primary px-6 py-2.5 text-sm font-semibold text-[#fff] transition hover:brightness-110 disabled:opacity-60"
          >
            {phase === "starting" ? "Starting…" : phase === "pending" ? "Generating…" : "Generate with AI"}
          </button>
          {genError && phase !== "pending" ? <p className="text-sm text-red-300">{genError}</p> : null}
        </div>
      </form>

      {/* Result / progress, only once a job has been kicked off */}
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
                  This usually takes one to three minutes. You can leave this page open, it&apos;ll update on its own.
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
                    Download a copy to review or edit it, then save it into a course or a specific module below.
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
                {exportUrl ? (
                  resultFormat === "docx" ? (
                    <button
                      type="button"
                      onClick={downloadWordCopy}
                      disabled={docxBusy}
                      className="rounded-full bg-site-primary px-5 py-2.5 text-sm font-semibold text-[#fff] transition hover:brightness-110 disabled:opacity-60"
                    >
                      {docxBusy ? "Preparing Word file…" : "Download copy"}
                    </button>
                  ) : (
                    <a
                      href={exportUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-site-primary px-5 py-2.5 text-sm font-semibold text-[#fff] transition hover:brightness-110"
                    >
                      Download copy
                    </a>
                  )
                ) : null}
              </div>

              {/* Save into a course or a specific module; both store a real
                  downloadable file students open directly. */}
              <div className="rounded-2xl border border-white/12 bg-black/20 p-5">
                <p className="text-sm font-semibold text-white">Save to {isOwner ? "your course" : "a course you teach"}</p>
                <p className="mt-0.5 text-xs text-site-muted">
                  Choose a course, and optionally a module. A downloadable copy is saved that students can open right
                  away.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Material title</label>
                    <input
                      type="text"
                      value={saveTitle}
                      onChange={(e) => setSaveTitle(e.target.value)}
                      placeholder="e.g. HTML Fundamentals: Slides"
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
                          {isOwner ? "No courses yet, create one first" : "No assigned courses yet"}
                        </option>
                      )}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className={labelClass}>Module (optional)</label>
                  <select
                    value={saveModuleId}
                    onChange={(e) => setSaveModuleId(e.target.value)}
                    disabled={modulesLoading || !saveCourseId}
                    className={inputClass}
                  >
                    <option value="" className="bg-[#0b0b0b]">
                      Whole course (its materials page)
                    </option>
                    {modules.map((m) => (
                      <option key={m.id} value={String(m.id)} className="bg-[#0b0b0b]">
                        {m.title}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-site-muted">
                    {modulesLoading
                      ? "Loading modules…"
                      : saveModuleId
                        ? "A downloadable copy will be added to this module's content."
                        : modules.length
                          ? "Pick a module to save the file inside it, or leave as the whole course."
                          : "This course has no modules yet, it'll be saved to the course's materials."}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={save}
                    disabled={saving || !courses.length || !resultUrl}
                    className="rounded-full bg-site-primary px-6 py-2.5 text-sm font-semibold text-[#fff] transition hover:brightness-110 disabled:opacity-60"
                  >
                    {saving ? "Saving…" : saveModuleId ? "Save to module" : "Save to course"}
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
