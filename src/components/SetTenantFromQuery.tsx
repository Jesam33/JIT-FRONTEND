"use client";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function SetTenantFromQuery() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const tenant = params.get("tenant");
    if (!tenant) return;

    // set a cookie for the tenant (expires in 7 days)
    document.cookie = `tenant=${encodeURIComponent(tenant)}; path=/; max-age=${60 * 60 * 24 * 7}`;

    // preserve tenant_name if present (not required by backend)
    const tenantName = params.get("tenant_name");
    if (tenantName) {
      document.cookie = `tenant_name=${encodeURIComponent(tenantName)}; path=/; max-age=${60 * 60 * 24 * 7}`;
    }

    // reload without query params so server can read cookie on next render
    const url = new URL(window.location.href);
    url.search = "";
    router.replace(url.toString());
  }, [params, router]);

  return null;
}
