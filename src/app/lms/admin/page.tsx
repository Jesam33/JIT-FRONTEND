"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OWNER_API } from "@/lib/api";
import { ownerAuthHeaders, getOwnerToken, readOwnerBranding } from "@/lib/owner-client";
import { academyLabel, type OwnerBranding } from "@/lib/owner-branding";
import { tenantLoginUrls, tenantStorefrontUrl, tenantLoginPath } from "@/lib/tenant-client";

type Overview = {
  tenant: { id: number; name: string; slug: string; status: string };
  owner: { email: string | null; name: string | null };
  plan: string;
  subscription_status: string;
  current_period_end: string | null;
  counts: { students: number; staff: number; courses: number; tracks: number };
  recent_students: Array<{ id: number; name: string; email: string | null; created_at: string | null }>;
  // The academy's own branding (colors/logo + entity_label). Present on the owner
  // overview payload; used to render this academy's configurable noun in copy.
  branding?: OwnerBranding | null;
};

// Real per-institute analytics (fix #1) — 6-month series + funnel + totals.
// `advanced` (Pro+) gates the time-series trend charts; the KPI totals and the
// registration funnel are standard analytics shown on every plan. When advanced
// is false the backend returns empty `series`, so the trend charts are hidden
// behind an upgrade prompt rather than rendered flat.
type Analytics = {
  advanced: boolean;
  months: string[];
  series: { students: number[]; enrollments: number[]; revenue: number[] };
  totals: { revenue: number; students: number; enrollments: number; active_courses: number };
  registrations: { pending: number; approved: number; rejected: number; total: number };
  currency: string;
};

const STAT_CARDS: Array<{ key: keyof Overview["counts"]; label: string; href: string }> = [
  { key: "students", label: "Students", href: "/lms/admin/students" },
  { key: "staff", label: "Staff", href: "/lms/admin/staff" },
  { key: "courses", label: "Courses", href: "/lms/admin/courses" },
  { key: "tracks", label: "Tracks", href: "/lms/admin/tracks" },
];

// Institute-branded accent for the charts (brandingStyle sets --color-primary on
// the owner shell; falls back to the site red outside it).
const ACCENT = "var(--color-primary, #ed180d)";

function money(n: number, currency: string): string {
  return `${currency}${Math.round(n).toLocaleString()}`;
}

function CopyRow({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — user can select manually */
    }
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-site-muted">{label}</div>
        <div className="truncate text-sm text-white">{url}</div>
      </div>
      <button
        onClick={copy}
        className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/10"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

// Vertical bars (revenue / enrolments). Heights are % of the tallest bar; a fixed
// track height keeps the % resolution reliable. Zero-value bars show a hairline.
function BarChart({ values, labels, format }: { values: number[]; labels: string[]; format?: (n: number) => string }) {
  const max = Math.max(...values, 1);
  return (
    <div>
      <div className="flex h-40 items-end gap-2 sm:gap-3">
        {values.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-md transition-[height] duration-500"
            style={{
              height: `${max > 0 ? (v / max) * 100 : 0}%`,
              minHeight: v > 0 ? "0.5rem" : "2px",
              background: v > 0 ? ACCENT : "rgba(255,255,255,0.12)",
            }}
            title={format ? format(v) : String(v)}
          />
        ))}
      </div>
      <div className="mt-2 flex gap-2 sm:gap-3">
        {labels.map((l, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-site-muted">
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

// Smooth area + line (new students). Stretches to fill width; a non-scaling
// stroke keeps the line crisp under the stretch.
function AreaChart({ values, labels }: { values: number[]; labels: string[] }) {
  const W = 320;
  const H = 120;
  const pad = 6;
  const n = values.length;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = n > 1 ? (i / (n - 1)) * (W - 2 * pad) + pad : W / 2;
    const y = H - pad - (v / max) * (H - 2 * pad);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${pts[n - 1][0].toFixed(1)},${H - pad} L${pts[0][0].toFixed(1)},${H - pad} Z`;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.35" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#area-fill)" />
        <path d={line} fill="none" stroke={ACCENT} strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-2 flex gap-2 sm:gap-3">
        {labels.map((l, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-site-muted">
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

// Registration funnel — horizontal bars per status.
function Funnel({ reg }: { reg: Analytics["registrations"] }) {
  const rows = [
    { label: "Approved", value: reg.approved, color: "#10b981" },
    { label: "Pending", value: reg.pending, color: "#f59e0b" },
    { label: "Rejected", value: reg.rejected, color: "#f43f5e" },
  ];
  const max = Math.max(reg.approved, reg.pending, reg.rejected, 1);
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-xs text-site-muted">{r.label}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${(r.value / max) * 100}%`, background: r.color }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-sm font-semibold text-white">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/20 bg-white/[0.04] p-5">
      <div className="text-xs uppercase tracking-wide text-site-muted">{label}</div>
      <div className="mt-2 text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

const chartCard = "rounded-[20px] border border-white/20 bg-white/[0.04] p-6";

export default function OwnerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ovRes, anRes] = await Promise.all([
        fetch(OWNER_API.overview, { headers: ownerAuthHeaders() }),
        fetch(OWNER_API.analytics, { headers: ownerAuthHeaders() }),
      ]);
      if (ovRes.status === 401 || ovRes.status === 403) {
        router.replace(tenantLoginPath("owner"));
        return;
      }
      if (!ovRes.ok) {
        setError(`Could not load your dashboard (HTTP ${ovRes.status}).`);
        return;
      }
      setData(await ovRes.json());
      // Analytics is best-effort — a failure here still leaves the dashboard usable.
      if (anRes.ok) setAnalytics(await anRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!getOwnerToken()) {
      router.replace(tenantLoginPath("owner"));
      return;
    }
    load();
  }, [load, router]);

  const plan = data?.plan ?? "free";
  const isPaid = plan !== "free";
  const links = data ? tenantLoginUrls(data.tenant.slug) : null;
  const currency = analytics?.currency ?? "₦";
  // This academy's configurable noun (Jorsas → "Institute", others → their own
  // label / "Online Academy"). Read from the loaded overview, falling back to the
  // shell's branding cookie so the right word shows even before the fetch lands.
  const label = academyLabel(data?.branding ?? readOwnerBranding()).singular;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-site-muted">
          {data ? `Managing ${data.tenant.name}` : `Your ${label} at a glance`}
        </p>
      </div>

      {loading && <div className="text-sm text-site-muted">Loading…</div>}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {data && (
        <>
          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STAT_CARDS.map((card) => (
              <Link
                key={card.key}
                href={card.href}
                className="group rounded-[20px] border border-white/20 bg-white/[0.04] p-6 transition hover:border-white/35 hover:bg-white/[0.07]"
              >
                <div className="text-sm text-site-muted">{card.label}</div>
                <div className="mt-2 text-3xl font-bold text-white">{data.counts[card.key]}</div>
                <div className="mt-2 text-xs text-site-muted group-hover:text-white/70">Manage →</div>
              </Link>
            ))}
          </div>

          {/* Analytics — real, tenant-scoped data */}
          {analytics && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Analytics</h2>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard label="Revenue (all-time)" value={money(analytics.totals.revenue, currency)} />
                <KpiCard label="Enrolments" value={analytics.totals.enrollments.toLocaleString()} />
                <KpiCard label="Registrations" value={analytics.registrations.total.toLocaleString()} />
                <KpiCard label="Active courses" value={analytics.totals.active_courses.toLocaleString()} />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Trend charts are advanced analytics (Pro+). On plans without
                    it the backend sends empty series, so show one upgrade card
                    in their place — the funnel below stays on every plan. */}
                {analytics.advanced ? (
                  <>
                    <div className={chartCard}>
                      <div className="mb-4 flex items-baseline justify-between gap-3">
                        <h3 className="text-sm font-semibold text-white">Revenue</h3>
                        <span className="text-xs text-site-muted">
                          Last 6 months · {money(analytics.series.revenue.reduce((a, b) => a + b, 0), currency)}
                        </span>
                      </div>
                      <BarChart
                        values={analytics.series.revenue}
                        labels={analytics.months}
                        format={(n) => money(n, currency)}
                      />
                    </div>

                    <div className={chartCard}>
                      <div className="mb-4 flex items-baseline justify-between gap-3">
                        <h3 className="text-sm font-semibold text-white">New students</h3>
                        <span className="text-xs text-site-muted">
                          Last 6 months · {analytics.series.students.reduce((a, b) => a + b, 0)}
                        </span>
                      </div>
                      <AreaChart values={analytics.series.students} labels={analytics.months} />
                    </div>

                    <div className={chartCard}>
                      <div className="mb-4 flex items-baseline justify-between gap-3">
                        <h3 className="text-sm font-semibold text-white">Enrolments</h3>
                        <span className="text-xs text-site-muted">
                          Last 6 months · {analytics.series.enrollments.reduce((a, b) => a + b, 0)}
                        </span>
                      </div>
                      <BarChart values={analytics.series.enrollments} labels={analytics.months} />
                    </div>
                  </>
                ) : (
                  <div className={`${chartCard} flex flex-col items-center justify-center gap-3 text-center`}>
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/80">
                      Pro
                    </span>
                    <h3 className="text-base font-semibold text-white">Trend analytics</h3>
                    <p className="max-w-xs text-sm text-site-muted">
                      Track revenue, new students and enrolments over time. Upgrade to Pro to unlock
                      6-month trend charts.
                    </p>
                    <Link
                      href="/lms/admin/billing"
                      className="rounded-full bg-site-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                    >
                      Upgrade to Pro
                    </Link>
                  </div>
                )}

                <div className={chartCard}>
                  <div className="mb-4 flex items-baseline justify-between gap-3">
                    <h3 className="text-sm font-semibold text-white">Registrations</h3>
                    <span className="text-xs text-site-muted">{analytics.registrations.total} total</span>
                  </div>
                  {analytics.registrations.total > 0 ? (
                    <Funnel reg={analytics.registrations} />
                  ) : (
                    <p className="py-6 text-center text-sm text-site-muted">
                      No course registrations yet. Share your public page so new students can register.
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Plan */}
            <div className="rounded-[20px] border border-white/20 bg-white/[0.04] p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-site-muted">Current plan</div>
                  <div className="mt-1 text-xl font-semibold capitalize text-white">{plan}</div>
                  {isPaid && data.current_period_end && (
                    <p className="mt-1 text-xs text-site-muted">
                      Renews {new Date(data.current_period_end).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold capitalize text-white/80">
                  {data.subscription_status}
                </span>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/lms/admin/billing"
                  className="rounded-full bg-site-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  {isPaid ? "Manage billing" : "Upgrade plan"}
                </Link>
              </div>
            </div>

            {/* Recent students */}
            <div className="rounded-[20px] border border-white/20 bg-white/[0.04] p-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Recent students</h2>
                <Link href="/lms/admin/students" className="text-xs font-semibold text-site-muted hover:text-white">
                  View all
                </Link>
              </div>
              {data.recent_students.length ? (
                <ul className="space-y-2">
                  {data.recent_students.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-2.5"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm text-white">{s.name}</div>
                        {s.email && <div className="truncate text-xs text-site-muted">{s.email}</div>}
                      </div>
                      {s.created_at && (
                        <div className="shrink-0 text-xs text-site-muted">
                          {new Date(s.created_at).toLocaleDateString()}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-site-muted">
                  No students yet. Invite your first students from the{" "}
                  <Link href="/lms/admin/students" className="text-white underline">
                    Students
                  </Link>{" "}
                  page.
                </p>
              )}
            </div>
          </div>

          {/* Share links */}
          {links && (
            <div className="rounded-[20px] border border-white/20 bg-white/[0.04] p-8">
              <h2 className="mb-1 text-lg font-semibold text-white">Share with your people</h2>
              <p className="mb-4 text-sm text-site-muted">
                Your public page is where new students browse your courses and register on their own.
                The sign-in links below are for people already in your {label}.
              </p>
              <div className="mb-3">
                <CopyRow label="Public page — for new students" url={tenantStorefrontUrl(data.tenant.slug)} />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <CopyRow label="Students" url={links.student} />
                <CopyRow label="Staff" url={links.staff} />
                <CopyRow label="Owners / admins" url={links.owner} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
