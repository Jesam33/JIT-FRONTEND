"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OWNER_API } from "@/lib/api";
import { ownerAuthHeaders, getOwnerToken } from "@/lib/owner-client";

type Staff = {
  id: number;
  name: string;
  email: string | null;
  role: string;
  phone: string | null;
  is_active: boolean;
  created_at: string | null;
};

export default function OwnerStaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  // false → the last invite could not be emailed (show as a warning, not success).
  const [inviteOk, setInviteOk] = useState(true);

  // Per-row actions live in a "⋮" menu (avoids the wide button row that forced the
  // table to scroll sideways). `menuFor` = which staff id's menu is open; `menuPos`
  // is its fixed viewport position (the row sits inside overflow-x-auto, so an
  // absolute menu would be clipped — we anchor a fixed one to the button instead).
  // `confirmingId` switches the open menu to a Remove-confirm step. In-flight state
  // (deleting/resending/toggling) drives the spinners; `actionMsg` is the outcome
  // banner — importantly the cohort-guard warning when a Remove is refused, and
  // whether a resend email actually left the server.
  const [menuFor, setMenuFor] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [actionMsg, setActionMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const closeMenu = () => {
    setMenuFor(null);
    setConfirmingId(null);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(OWNER_API.staff, { headers: ownerAuthHeaders() });
      if (res.status === 401 || res.status === 403) {
        router.replace("/lms/admin/login");
        return;
      }
      if (!res.ok) {
        setError(`Could not load staff (HTTP ${res.status}).`);
        return;
      }
      const json = await res.json();
      setStaff(json.staff ?? []);
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

  // A fixed-positioned menu can't follow the page, so dismiss it on scroll/resize
  // (capture=true also catches the table's own horizontal scroll) and on Escape.
  useEffect(() => {
    if (menuFor === null) return;
    const close = () => {
      setMenuFor(null);
      setConfirmingId(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuFor]);

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    if (menuFor === id) {
      closeMenu();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const MENU_W = 208; // matches w-52
    const MENU_H = 168; // rough height of the 3-item menu, for the flip-up check
    const left = Math.max(8, Math.min(rect.right - MENU_W, window.innerWidth - MENU_W - 8));
    const top =
      rect.bottom + 8 + MENU_H > window.innerHeight ? Math.max(8, rect.top - 8 - MENU_H) : rect.bottom + 8;
    setConfirmingId(null);
    setMenuPos({ top, left });
    setMenuFor(id);
  };

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    const addr = email.trim();
    if (!addr) {
      setInviteMsg("Enter an email address.");
      return;
    }
    setInviting(true);
    setInviteMsg(null);
    setInviteOk(true);
    try {
      const res = await fetch(OWNER_API.inviteStaff, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...ownerAuthHeaders() },
        body: JSON.stringify({ tenant: tenantId, email: addr }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setInviteOk(false);
        setInviteMsg(json?.message || `Could not send invite (HTTP ${res.status}).`);
        return;
      }
      // The account is created even if the email failed — always refresh the list
      // and clear the field, but only claim success when it was actually emailed.
      setInviteOk(json?.email_sent !== false);
      setInviteMsg(json?.message || `Invited ${addr}. They'll get an email to set their password.`);
      setEmail("");
      load();
    } catch (err) {
      setInviteOk(false);
      setInviteMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setInviting(false);
    }
  };

  const removeStaff = async (t: Staff) => {
    setDeletingId(t.id);
    setActionMsg(null);
    try {
      const res = await fetch(OWNER_API.deleteStaff(t.id), {
        method: "DELETE",
        headers: { Accept: "application/json", ...ownerAuthHeaders() },
      });
      if (res.status === 401 || res.status === 403) {
        router.replace("/lms/admin/login");
        return;
      }
      if (!res.ok) {
        // 422 here is the cohort-guard: the staff still leads a cohort and must be
        // reassigned on Tracks & Cohorts first. Surface that message verbatim.
        const json = await res.json().catch(() => ({}));
        setActionMsg({ kind: "err", text: json?.message || `Could not remove staff (HTTP ${res.status}).` });
        return;
      }
      setActionMsg({ kind: "ok", text: `Removed ${t.name}.` });
      load();
    } catch (err) {
      setActionMsg({ kind: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setDeletingId(null);
      closeMenu();
    }
  };

  const resendInvite = async (t: Staff) => {
    setResendingId(t.id);
    setActionMsg(null);
    try {
      const res = await fetch(OWNER_API.resendStaffInvite(t.id), {
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
        text: json?.message || `Invite re-sent to ${t.email ?? "the staff member"}.`,
      });
    } catch (err) {
      setActionMsg({ kind: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setResendingId(null);
      closeMenu();
    }
  };

  const toggleActive = async (t: Staff) => {
    setTogglingId(t.id);
    setActionMsg(null);
    try {
      const res = await fetch(OWNER_API.setStaffActive(t.id), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...ownerAuthHeaders() },
        body: JSON.stringify({ is_active: !t.is_active }),
      });
      if (res.status === 401 || res.status === 403) {
        router.replace("/lms/admin/login");
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionMsg({ kind: "err", text: json?.message || `Could not update staff (HTTP ${res.status}).` });
        return;
      }
      setActionMsg({
        kind: "ok",
        text: json?.message || (t.is_active ? `Suspended ${t.name}.` : `Re-enabled ${t.name}.`),
      });
      load();
    } catch (err) {
      setActionMsg({ kind: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setTogglingId(null);
      closeMenu();
    }
  };

  const activeStaff = menuFor === null ? null : staff.find((s) => s.id === menuFor) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Staff Accounts</h1>
        <p className="mt-1 text-sm text-site-muted">
          {loading ? "Loading…" : `${staff.length} staff member${staff.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {/* Invite */}
      <div className="rounded-[20px] border border-white/20 bg-white/[0.04] p-6">
        <h2 className="text-lg font-semibold text-white">Invite staff</h2>
        <p className="mt-1 text-sm text-site-muted">
          Add a lecturer or admin. They receive an email with a link to set their password and sign in.
        </p>
        <form onSubmit={invite} className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="lecturer@example.com"
            className="min-w-[240px] flex-1 rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-sm text-white"
          />
          <button
            type="submit"
            disabled={inviting || !tenantId}
            className="rounded-full bg-site-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {inviting ? "Sending…" : "Send invite"}
          </button>
        </form>
        {inviteMsg && (
          <p className={`mt-3 text-sm ${inviteOk ? "text-site-muted" : "text-amber-300"}`}>{inviteMsg}</p>
        )}
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
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wide text-site-muted">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((t) => (
                <tr key={t.id} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3 text-white">{t.name}</td>
                  <td className="px-5 py-3 text-site-muted">{t.email ?? "—"}</td>
                  <td className="px-5 py-3 capitalize text-site-muted">{t.role}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        t.is_active ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {t.is_active ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => openMenu(e, t.id)}
                        aria-label={`Actions for ${t.name}`}
                        aria-haspopup="menu"
                        aria-expanded={menuFor === t.id}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
                          menuFor === t.id
                            ? "border-white/20 bg-white/10 text-white [html.light_&]:border-black/20 [html.light_&]:bg-black/[0.08] [html.light_&]:text-black"
                            : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white [html.light_&]:border-black/10 [html.light_&]:bg-black/5 [html.light_&]:text-black/70 [html.light_&]:hover:bg-black/[0.08]"
                        }`}
                      >
                        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <circle cx="12" cy="5" r="1.8" />
                          <circle cx="12" cy="12" r="1.8" />
                          <circle cx="12" cy="19" r="1.8" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !staff.length && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-site-muted">
                    No staff yet. Invite your first lecturer above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row actions menu — fixed-positioned so it escapes the table's overflow
          clipping; same look as the owner topbar dropdowns. */}
      {menuFor !== null && menuPos && activeStaff && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" aria-label="Close menu" onClick={closeMenu} />
          <div
            role="menu"
            style={{ top: menuPos.top, left: menuPos.left }}
            className="fixed z-50 w-52 overflow-hidden rounded-2xl border border-white/15 bg-[#0b0b0b] py-1.5 shadow-2xl [html.light_&]:border-site-border [html.light_&]:bg-white"
          >
            {confirmingId === activeStaff.id ? (
              <div className="px-4 py-3">
                <p className="text-xs text-white/70 [html.light_&]:text-black/70">
                  Remove{" "}
                  <span className="font-semibold text-white [html.light_&]:text-black">{activeStaff.name}</span>? This
                  can’t be undone.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => removeStaff(activeStaff)}
                    disabled={deletingId === activeStaff.id}
                    className="rounded-full bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/30 disabled:opacity-60"
                  >
                    {deletingId === activeStaff.id ? "Removing…" : "Remove"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 [html.light_&]:border-black/15 [html.light_&]:text-black/70 [html.light_&]:hover:bg-black/5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => resendInvite(activeStaff)}
                  disabled={resendingId === activeStaff.id}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white/85 transition hover:bg-white/10 disabled:opacity-60 [html.light_&]:text-black/85 [html.light_&]:hover:bg-black/5"
                >
                  <svg className="h-4 w-4 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 7.5l8.5 6 8.5-6" />
                  </svg>
                  {resendingId === activeStaff.id ? "Sending…" : "Resend invite"}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => toggleActive(activeStaff)}
                  disabled={togglingId === activeStaff.id}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white/85 transition hover:bg-white/10 disabled:opacity-60 [html.light_&]:text-black/85 [html.light_&]:hover:bg-black/5"
                >
                  {activeStaff.is_active ? (
                    <svg className="h-4 w-4 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.6 5.6l12.8 12.8" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 12l2.5 2.5 4.5-5" />
                    </svg>
                  )}
                  {togglingId === activeStaff.id ? "Saving…" : activeStaff.is_active ? "Suspend" : "Activate"}
                </button>
                <div className="my-1 border-t border-white/10 [html.light_&]:border-black/10" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setConfirmingId(activeStaff.id)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M18 7l-1 13a2 2 0 01-2 2H9a2 2 0 01-2-2L6 7" />
                  </svg>
                  Remove
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
