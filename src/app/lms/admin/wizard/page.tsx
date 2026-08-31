"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OWNER_API } from "@/lib/api";
import { ownerAuthHeaders, getOwnerToken, readOwnerBranding } from "@/lib/owner-client";
import { academyLabel } from "@/lib/owner-branding";

export default function WizardPage() {
  const router = useRouter();
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState("");
  const [emails, setEmails] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // This academy's configurable noun (Jorsas → "Institute", others → their label),
  // read synchronously from the shell's branding cookie.
  const label = academyLabel(readOwnerBranding()).singular;

  // Resolve the tenant from the owner session (never typed by hand).
  useEffect(() => {
    if (!getOwnerToken()) {
      router.replace("/lms/admin/login");
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(OWNER_API.billingStatus, { headers: ownerAuthHeaders() });
        if (res.status === 401 || res.status === 403) {
          router.replace("/lms/admin/login");
          return;
        }
        if (!mounted) return;
        if (res.ok) {
          const json = await res.json();
          setTenantId(json.tenant?.id ?? null);
          setOrgName(json.tenant?.name ?? "");
        } else {
          setMsg(`Could not load your ${label} (HTTP ${res.status}).`);
        }
      } catch (e) {
        setMsg(e instanceof Error ? e.message : String(e));
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  const post = async (url: string, body: Record<string, unknown>) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...ownerAuthHeaders() },
      body: JSON.stringify({ ...body, tenant: tenantId }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
    return json;
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const doOrg = () =>
    run(async () => {
      setMsg("Saving…");
      await post(OWNER_API.onboardingOrg, { name: orgName });
      setMsg("Organisation updated.");
      setStep(2);
    });

  const doImport = () =>
    run(async () => {
      setMsg("Importing…");
      const arr = emails.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
      const resp = await post(OWNER_API.importStudents, { emails: arr });
      setMsg(`Added ${resp.imported} student(s), sent ${resp.invited} invite(s).`);
      setStep(3);
    });

  const doCourse = () =>
    run(async () => {
      setMsg("Creating course…");
      const resp = await post(OWNER_API.createCourse, { title: courseTitle, description: "" });
      setMsg(`Created course #${resp.course_id}.`);
      setStep(4);
    });

  const doInvite = () =>
    run(async () => {
      setMsg("Inviting…");
      const resp = await post(OWNER_API.inviteStaff, { email: staffEmail });
      setMsg(`Invited ${resp.invited}.`);
      setStep(5);
    });

  const inputCls = "w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-sm text-white";
  const primaryBtn = "rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:opacity-60";

  // Renders as plain content INSIDE the owner shell (this route isn't a
  // PUBLIC_PATH, so OwnerLayoutClient wraps it with the sidebar/topbar and the
  // branded container). Must NOT add its own `site-shell` or `container-wide`:
  // site-shell paints an opaque base + a hardcoded blue glow that would sit on
  // top of the academy's customised background, and a second container-wide
  // double-wraps the width → horizontal overflow. (Same fix as billing/verify.)
  return (
    <div className="py-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-[20px] border border-white/20 bg-white/[0.04] p-8">
            <h1 className="mb-1 text-2xl font-semibold text-white">Onboarding wizard</h1>
            <p className="mb-6 text-sm text-site-muted">A few quick steps to get your {label} running.</p>

            {!ready && <div className="text-sm text-site-muted">Loading…</div>}

            {ready && (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Step {Math.min(step, 4)} of 4</span>
                  {msg && <span className="text-sm text-site-muted">{msg}</span>}
                </div>

                {step === 1 && (
                  <div className="space-y-3">
                    <label className="block text-sm text-white/80">{label} name</label>
                    <input value={orgName} onChange={(e) => setOrgName(e.target.value)} className={inputCls} />
                    <button onClick={doOrg} disabled={busy} className={primaryBtn}>
                      Save &amp; continue
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-3">
                    <label className="block text-sm text-white/80">Student emails (comma or space separated)</label>
                    <textarea value={emails} onChange={(e) => setEmails(e.target.value)} rows={4} className={inputCls} />
                    <p className="text-xs text-site-muted">Each student gets an email to set their password.</p>
                    <div className="flex gap-3">
                      <button onClick={doImport} disabled={busy} className={primaryBtn}>
                        Import students
                      </button>
                      <button onClick={() => setStep(3)} className="text-sm text-site-muted hover:text-white">
                        Skip
                      </button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-3">
                    <label className="block text-sm text-white/80">Your first course title</label>
                    <input value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} className={inputCls} />
                    <div className="flex gap-3">
                      <button onClick={doCourse} disabled={busy} className={primaryBtn}>
                        Create course
                      </button>
                      <button onClick={() => setStep(4)} className="text-sm text-site-muted hover:text-white">
                        Skip
                      </button>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-3">
                    <label className="block text-sm text-white/80">Invite a staff member (email)</label>
                    <input value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} className={inputCls} />
                    <div className="flex gap-3">
                      <button onClick={doInvite} disabled={busy} className={primaryBtn}>
                        Send invite
                      </button>
                      <button onClick={() => setStep(5)} className="text-sm text-site-muted hover:text-white">
                        Skip
                      </button>
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-4">
                    <p className="text-sm text-white">You&apos;re all set. Everything else lives in your dashboard.</p>
                    <Link href="/lms/admin" className={primaryBtn}>
                      Go to dashboard
                    </Link>
                  </div>
                )}
              </>
            )}
        </div>
      </div>
    </div>
  );
}
