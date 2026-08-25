import { backendFetch, tenantHeaderFromCookie } from "@/lib/backend";
import { cookies } from "next/headers";
import SetTenantFromQuery from "@/components/SetTenantFromQuery";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const tenant = cookieStore.get?.("tenant")?.value ?? null;

  const headers: any = {};
  if (tenant) Object.assign(headers, tenantHeaderFromCookie(tenant));

  let data = null;
  try {
    const res = await backendFetch(`/api/frontend/lms/dashboard`, { headers });
    if (res.ok) data = await res.json();
  } catch (e) {
    data = null;
  }

  return (
    <main className="site-shell">
      <SetTenantFromQuery />
      <section className="container-wide section-pad">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-[20px] border border-white/20 bg-white/[0.04] p-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-semibold display-gradient">Tenant Dashboard</h1>
            </div>

            <div className="mb-6">
              <div className="text-sm text-white/80">Tenant</div>
              <div className="mt-2 font-medium text-white">{tenant ?? 'not set'}</div>
            </div>

            <div className="bg-white/6 border border-white/10 rounded p-4">
              <div className="text-sm text-white/80 mb-2">Dashboard data (from backend)</div>
              <pre className="text-xs whitespace-pre-wrap break-words bg-transparent p-0 m-0">{data ? JSON.stringify(data, null, 2) : 'No data available'}</pre>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
