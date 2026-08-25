"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OWNER_API } from "@/lib/api";
import { ownerAuthHeaders, getOwnerToken } from "@/lib/owner-client";

type Student = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  course: string | null;
  learning_mode: string | null;
  onboarding_completed: boolean;
  created_at: string | null;
};

export default function OwnerStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [emails, setEmails] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  // false → some accounts were created but their invite email could not be sent.
  const [inviteOk, setInviteOk] = useState(true);

  // Per-row actions: inline two-step confirm before a destructive remove (same
  // pattern as the Courses page), plus a re-send-invite spinner. `actionMsg`
  // surfaces the outcome (esp. whether a resend email actually went out).
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [actionMsg, setActionMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(OWNER_API.students, { headers: ownerAuthHeaders() });
      if (res.status === 401 || res.status === 403) {
        router.replace("/lms/admin/login");
        return;
      }
      if (!res.ok) {
        setError(`Could not load students (HTTP ${res.status}).`);
        return;
      }
      const json = await res.json();
      setStudents(json.students ?? []);
      setTenantId(json.tenant_id ?? null);
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

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    const list = emails
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!list.length) {
      setInviteMsg("Enter at least one email address.");
      return;
    }
    setInviting(true);
    setInviteMsg(null);
    setInviteOk(true);
    try {
      const res = await fetch(OWNER_API.importStudents, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...ownerAuthHeaders() },
        body: JSON.stringify({ tenant: tenantId, emails: list }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setInviteOk(false);
        setInviteMsg(json?.message || `Could not send invites (HTTP ${res.status}).`);
        return;
      }
      const failedCount: number = json.failed ?? 0;
      const failedList: string[] = json.failed_emails ?? [];
      setInviteOk(failedCount === 0);
      setInviteMsg(
        `Invited ${json.invited ?? 0} student${(json.invited ?? 0) === 1 ? "" : "s"}` +
          (json.skipped ? `, skipped ${json.skipped} invalid` : "") +
          (failedCount
            ? `. ${failedCount} account${failedCount === 1 ? "" : "s"} created but the invite email failed${
                failedList.length ? ` (${failedList.join(", ")})` : ""
              } — check mail settings and resend.`
            : ".")
      );
      setEmails("");
      load();
    } catch (err) {
      setInviteOk(false);
      setInviteMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setInviting(false);
    }
  };

  const removeStudent = async (s: Student) => {
    setDeletingId(s.id);
    setActionMsg(null);
    try {
      const res = await fetch(OWNER_API.deleteStudent(s.id), {
        method: "DELETE",
        headers: { Accept: "application/json", ...ownerAuthHeaders() },
      });
      if (res.status === 401 || res.status === 403) {
        router.replace("/lms/admin/login");
        return;
      }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setActionMsg({ kind: "err", text: json?.message || `Could not remove student (HTTP ${res.status}).` });
        return;
      }
      setActionMsg({ kind: "ok", text: `Removed ${s.name}.` });
      load();
    } catch (err) {
      setActionMsg({ kind: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  };

  const resendInvite = async (s: Student) => {
    setResendingId(s.id);
    setActionMsg(null);
    try {
      const res = await fetch(OWNER_API.resendStudentInvite(s.id), {
        method: "POST",
        headers: { Accept: "application/json", ...ownerAuthHeaders() },
      });
      if (res.status === 401 || res.status === 403) {
        router.replace("/lms/admin/login");
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionMsg({ kind: "err", text: json?.message || `Could not resend invite (HTTP ${res.status}).` });
        return;
      }
      // The endpoint reports honestly whether the email left the server.
      setActionMsg({
        kind: json?.email_sent === false ? "err" : "ok",
        text: json?.message || `Invite re-sent to ${s.email ?? "the student"}.`,
      });
    } catch (err) {
      setActionMsg({ kind: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setResendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">All Students</h1>
        <p className="mt-1 text-sm text-site-muted">
          {loading ? "Loading…" : `${students.length} student${students.length === 1 ? "" : "s"} enrolled`}
        </p>
      </div>

      {/* Invite */}
      <div className="rounded-[20px] border border-white/20 bg-white/[0.04] p-6">
        <h2 className="text-lg font-semibold text-white">Invite students</h2>
        <p className="mt-1 text-sm text-site-muted">
          Paste one or more email addresses. Each student gets an email with a link to set their password and sign in.
        </p>
        <form onSubmit={invite} className="mt-4 space-y-3">
          <textarea
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            rows={3}
            placeholder="student1@example.com, student2@example.com"
            className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-sm text-white"
          />
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={inviting || !tenantId}
              className="rounded-full bg-site-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {inviting ? "Sending…" : "Send invites"}
            </button>
            {inviteMsg && <p className={`text-sm ${inviteOk ? "text-site-muted" : "text-amber-300"}`}>{inviteMsg}</p>}
          </div>
        </form>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      )}

      {actionMsg && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            actionMsg.kind === "ok"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-amber-500/30 bg-amber-500/10 text-amber-200"
          }`}
        >
          {actionMsg.text}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-[20px] border border-white/20 bg-white/[0.04]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wide text-site-muted">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Phone</th>
                <th className="px-5 py-3 font-semibold">Course</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3 text-white">{s.name}</td>
                  <td className="px-5 py-3 text-site-muted">{s.email ?? "—"}</td>
                  <td className="px-5 py-3 text-site-muted">{s.phone ?? "—"}</td>
                  <td className="px-5 py-3 text-site-muted">{s.course ?? "—"}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        s.onboarding_completed
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {s.onboarding_completed ? "Active" : "Pending"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {confirmingId === s.id ? (
                        <>
                          <span className="text-xs text-white/60">Remove?</span>
                          <button
                            type="button"
                            onClick={() => removeStudent(s)}
                            disabled={deletingId === s.id}
                            className="rounded-full bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/30 disabled:opacity-60"
                          >
                            {deletingId === s.id ? "Removing…" : "Confirm"}
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
                          {!s.onboarding_completed && (
                            <button
                              type="button"
                              onClick={() => resendInvite(s)}
                              disabled={resendingId === s.id}
                              className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white/85 transition hover:bg-white/10 disabled:opacity-60"
                            >
                              {resendingId === s.id ? "Sending…" : "Resend invite"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setConfirmingId(s.id)}
                            className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-red-300/80 transition hover:bg-red-500/10 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !students.length && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-site-muted">
                    No students yet. Invite your first students above.
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
