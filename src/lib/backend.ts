const BACKEND = process.env.LARAVEL_BACKEND_URL ?? "http://127.0.0.1:8000";

export async function backendFetch(path: string, options: RequestInit = {}) {
  const url = `${BACKEND}${path}`;
  return fetch(url, { ...options, cache: "no-store" });
}

export function tenantHeaderFromCookie(cookie?: string | null) {
  if (!cookie) return {};
  return { "X-Tenant-Slug": cookie };
}
