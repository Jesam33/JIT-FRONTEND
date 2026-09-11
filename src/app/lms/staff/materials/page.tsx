"use client";

import { useEffect, useRef, useState } from "react";
import { STAFF_API } from "../../../../lib/api";
import { apiFetchStaff } from "../../../../lib/fetch-with-timeout";
import { uploadToBunny, type BunnyUploadSession } from "../../../../lib/bunny-upload";

type Material = {
  id: number;
  course_id: number;
  title: string;
  type: string;
  file_url: string;
  session_id?: number | null;
  provider?: string | null;
  thumbnail_url?: string | null;
  created_at: string;
};

type Course = { id: number; title: string };

// File extensions the backend's material upload accepts (mirrors the mimes
// rule in StaffPortalController::uploadMaterialFile). Kept in sync so the
// picker only offers what the server will take.
const DOC_ACCEPT =
  ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.rtf,.zip,.png,.jpg,.jpeg,.webp,.gif,.mp3,.wav,.m4a";

// Best-effort material-type suggestion from a picked file's extension, so
// choosing "lecture.pdf" flips the type select to PDF by itself. Unknown
// extensions fall back to "other".
function typeForFile(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx", "rtf", "txt", "csv", "ppt", "pptx", "xls", "xlsx"].includes(ext)) return "doc";
  return "other";
}

export default function StaffMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("pdf");
  const [fileUrl, setFileUrl] = useState("");
  const [courseId, setCourseId] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  // Video-upload state (Bunny Stream). When type=video the staffer picks a file
  // that uploads straight to Bunny; uploadPct drives the progress bar.
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  // Non-video file upload (PDF/document/…): picked from the staffer's PC and
  // stored on the platform's own disk (unlike videos, which go to Bunny). When
  // set, it wins over the pasted URL.
  const [docFile, setDocFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const docRef = useRef<HTMLInputElement | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("lms_staff_token") ?? "" : "";
  const isVideo = type === "video";
  const isLink = type === "link";

  async function load() {
    const [mats, crs] = await Promise.all([
      apiFetchStaff(STAFF_API.materials).then((r) => r.json()),
      apiFetchStaff(STAFF_API.assignedCourses).then((r) => r.json()),
    ]);
    setMaterials(Array.isArray(mats) ? mats : []);
    setCourses(Array.isArray(crs) ? crs : []);
    setLoading(false);
  }

  useEffect(() => { if (token) load(); }, [token]);

  function resetForm() {
    setTitle(""); setType("pdf"); setFileUrl(""); setCourseId("");
    setVideoFile(null); setUploadPct(null); setDocFile(null);
    if (fileRef.current) fileRef.current.value = "";
    if (docRef.current) docRef.current.value = "";
  }

  // Upload a picked video to Bunny (direct, bytes never touch our server), then
  // save it as a video material whose file_url is the player embed URL.
  async function createVideoMaterial() {
    if (!videoFile) { setError("Choose a video file to upload."); return; }

    // 1) Ask our server for a signed direct-upload envelope. This is where the
    //    plan gate lives: a 402 means the academy's plan doesn't include video.
    const upRes = await apiFetchStaff(STAFF_API.videoUpload, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title || videoFile.name }),
    });

    if (upRes.status === 402) {
      // Staff can't upgrade, point them at their admin (no owner UpgradeModal here).
      setError("Video lessons need the Basic plan or higher. Ask your academy admin to upgrade to add videos.");
      return;
    }
    if (upRes.status === 503) {
      setError("Video uploads aren't available right now. Please try again later.");
      return;
    }
    if (!upRes.ok) {
      setError(`Could not start the upload (HTTP ${upRes.status}).`);
      return;
    }

    const session = (await upRes.json()) as BunnyUploadSession;

    // 2) Push the bytes straight to Bunny with progress.
    setUploadPct(0);
    await uploadToBunny(session, videoFile, setUploadPct);

    // 3) Save the material pointing at the embed URL + thumbnail. It's still
    //    transcoding on Bunny's side ("processing"); the player handles that.
    const saveRes = await apiFetchStaff(STAFF_API.materials, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        course_id: Number(courseId),
        title: title || videoFile.name,
        type: "video",
        file_url: session.embed_url,
        provider: "bunny_stream",
        external_id: session.video_id,
        thumbnail_url: session.thumbnail_url ?? null,
        status: "processing",
      }),
    });
    if (!saveRes.ok) {
      setError(`The video uploaded but couldn't be saved (HTTP ${saveRes.status}).`);
      return;
    }
    setNotice("Video uploaded. It will be ready to watch in a few minutes while it finishes processing.");
  }

  async function createMaterial() {
    setError(null);
    setNotice(null);
    if (!courseId) { setError("Select a course."); return; }
    setCreating(true);
    try {
      if (isVideo) {
        await createVideoMaterial();
      } else {
        // Either a picked file (stored on our disk) or a pasted link. A picked
        // file wins; the upload endpoint returns the hosted URL + storage path
        // (the path rides along so deleting the material deletes the file).
        let url = fileUrl.trim();
        let filePath: string | null = null;
        if (docFile) {
          const fd = new FormData();
          fd.append("file", docFile);
          const upRes = await apiFetchStaff(STAFF_API.materialUpload, { method: "POST", body: fd });
          if (!upRes.ok) {
            setError(upRes.status === 422
              ? "That file type isn't supported. Use a PDF, document, slides, spreadsheet, archive, image or audio file."
              : `Could not upload the file (HTTP ${upRes.status}).`);
            return;
          }
          const up = await upRes.json() as { url: string; path: string };
          url = up.url;
          filePath = up.path;
        }
        if (!url) { setError("Attach a file or paste a link."); return; }
        const res = await apiFetchStaff(STAFF_API.materials, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_id: Number(courseId), title, type, file_url: url, file_path: filePath }),
        });
        if (!res.ok) { setError(`Could not save the material (HTTP ${res.status}).`); return; }
      }
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setCreating(false);
      setUploadPct(null);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this material?")) return;
    setDeleting(id);
    await apiFetchStaff(STAFF_API.material(id), { method: "DELETE" });
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

          {error && (
            <div className="mt-2 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</div>
          )}
          {notice && (
            <div className="mt-2 rounded border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100">{notice}</div>
          )}

          <div className="mt-2 grid gap-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Material title" className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm" />
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm"
            >
              <option value="">Select course…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <select value={type} onChange={(e) => { setType(e.target.value); setError(null); }} className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm">
              <option value="pdf">PDF</option>
              <option value="doc">Document</option>
              <option value="video">Video / Recording</option>
              <option value="link">Link</option>
              <option value="other">Other</option>
            </select>

            {isVideo ? (
              <>
                {/* Video type: upload a file straight to Bunny (not a pasted URL). */}
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                  className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-white"
                />
                <p className="text-xs text-white/50">
                  The video is hosted externally and streamed to students. It never loads down your server. MP4, WebM or MOV.
                </p>
                {uploadPct !== null && (
                  <div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-white transition-all" style={{ width: `${uploadPct}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-white/60">{uploadPct < 100 ? `Uploading… ${uploadPct}%` : "Finishing up…"}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Everything else: upload a file from this device, or paste a
                    link. A picked file wins over the URL field. */}
                <input
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  disabled={!!docFile}
                  placeholder={isLink ? "https://… (any public link)" : "Paste a link (https://…), or pick a file below"}
                  className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm disabled:opacity-40"
                />
                {!isLink && (
                  <>
                    <input
                      ref={docRef}
                      type="file"
                      accept={DOC_ACCEPT}
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setDocFile(f);
                        // Suggest the matching material type from the file's
                        // extension (pdf/doc/other) so the filter on the
                        // student side lines up.
                        if (f) setType(typeForFile(f.name));
                      }}
                      className="rounded border border-white/20 bg-black/30 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-white"
                    />
                    {docFile ? (
                      <p className="text-xs text-white/50">
                        Attaching <span className="text-white/80">{docFile.name}</span> — it uploads from your device, the link field is ignored.
                      </p>
                    ) : (
                      <p className="text-xs text-white/50">
                        PDF, document, slides, spreadsheet, archive, image or audio (max 50MB) — or paste a link above.
                      </p>
                    )}
                  </>
                )}
              </>
            )}

            <button onClick={createMaterial} disabled={creating} className="rounded bg-white px-3 py-2 text-sm text-black disabled:opacity-60">
              {creating ? <span className="inline-flex items-center gap-2"><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> {isVideo ? "Uploading video" : "Uploading"}</span> : isVideo ? "Upload video" : "Upload"}
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
                    <div className="flex items-start gap-3">
                      {m.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.thumbnail_url} alt="" className="h-12 w-20 shrink-0 rounded object-cover" />
                      ) : null}
                      <div>
                        <p className="font-medium text-sm">{m.title}</p>
                        <p className="text-xs text-white/60">
                          Type: {m.type}{m.provider === "bunny_stream" ? " · hosted video" : ""} &middot; {courses.find((c) => c.id === m.course_id)?.title ?? `Course #${m.course_id}`}
                        </p>
                        <a href={m.file_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-blue-400 underline">Open material</a>
                      </div>
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
