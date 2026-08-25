import { tenantLoginPath } from "./tenant-client";

type Portal = "student" | "staff";

function getToken(key: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) ?? "";
}

// A session that expires must return the user to THEIR institute's login, not
// the primary (JIT) one. tenantLoginPath resolves the current tenant from the
// subdomain/cookie; ?expired=1 lets the login page show the "session expired"
// banner. Portal-aware so a staff 401 lands on the staff login, not student.
export function onUnauthorized(portal: Portal = "student") {
  localStorage.removeItem("lms_student_token");
  localStorage.removeItem("lms_staff_token");
  const path = tenantLoginPath(portal);
  const sep = path.includes("?") ? "&" : "?";
  window.location.href = `${path}${sep}expired=1`;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchWithTimeout(
  input: RequestInfo,
  init?: RequestInit & { timeout?: number; portal?: Portal; retries?: number },
): Promise<Response> {
  // 30s (not 15s): a portal page fires ~10-14 API calls in parallel on load.
  // Behind a single-threaded dev server (`php artisan serve`, one worker, no
  // opcache) those requests serialize at ~0.8s each, so the tail can take ~16s
  // — past a 15s ceiling — and abort mid-load, surfacing as a false "couldn't
  // load"/login-bounce even though every request ultimately returns 200. In
  // production (php-fpm workers + opcache) requests are ~100ms and concurrent,
  // so this higher ceiling is pure safety margin, never hit on the happy path.
  //
  // Retries (idempotent reads only): under that same single-worker burst the
  // server can momentarily stop accepting connections, so ONE call in the
  // burst comes back as a network error / connection reset while every other
  // returns 200. Those fail FAST (milliseconds), so a quick retry a beat later
  // — server now free — succeeds, and the load stays seamless instead of the
  // single blip ejecting a validly-logged-in user (the StaffGuard bounce) or
  // dead-ending the dashboard ("we hit a snag"). We retry GET/HEAD on a fast
  // transient failure (network error, or a 5xx server hiccup). We deliberately
  // do NOT retry a full timeout: a request that genuinely hung for the whole
  // `timeout` window is pathological, and retrying would make the user stare at
  // a blank guard for 2-3× as long — surface it once instead. Non-idempotent
  // methods (POST/PUT/DELETE) are NEVER retried (a half-applied submit/payment
  // must not be replayed). A 401 is auth, not transient: handled immediately.
  const { timeout = 30000, portal = "student", retries = 2, ...rest } = init ?? {};
  const method = (rest.method ?? "GET").toString().toUpperCase();
  const idempotent = method === "GET" || method === "HEAD";
  const maxAttempts = idempotent ? Math.max(1, retries + 1) : 1;
  const callerSignal = rest.signal as AbortSignal | null | undefined;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    // Honor the caller's own abort (e.g. a guard aborting on unmount) alongside
    // our timeout, so retries stop the moment the component goes away.
    const relayAbort = () => controller.abort((callerSignal as any)?.reason);
    if (callerSignal) {
      if (callerSignal.aborted) controller.abort((callerSignal as any).reason);
      else callerSignal.addEventListener("abort", relayAbort, { once: true });
    }
    const id = setTimeout(() => controller.abort(new DOMException("Request timed out", "TimeoutError")), timeout);
    try {
      const response = await fetch(input, { ...rest, signal: controller.signal });
      if (response.status === 401) {
        onUnauthorized(portal);
        throw new Error("Unauthorized");
      }
      // Transient server hiccup on an idempotent read — retry before surfacing.
      if (response.status >= 500 && attempt < maxAttempts) {
        lastError = new Error(`Server error ${response.status}`);
        await sleep(300 * attempt);
        continue;
      }
      return response;
    } catch (err) {
      // Genuine auth failure — onUnauthorized already redirected; never retry.
      if (err instanceof Error && err.message === "Unauthorized") throw err;
      // The caller aborted (unmount / navigation): stop quietly, don't retry.
      if (callerSignal?.aborted) throw err;
      const isTimeout = err instanceof DOMException && (err.name === "TimeoutError" || err.name === "AbortError");
      const isNetwork = err instanceof TypeError; // connection refused/reset/DNS
      // Retry only the FAST transient failure (a connection blip); let a genuine
      // full-window timeout surface on the first occurrence.
      if (isNetwork && attempt < maxAttempts) {
        lastError = err;
        await sleep(300 * attempt);
        continue;
      }
      if (isTimeout) throw new Error(`Request timed out after ${timeout}ms`);
      throw err;
    } finally {
      clearTimeout(id);
      if (callerSignal) callerSignal.removeEventListener("abort", relayAbort);
    }
  }
  throw lastError ?? new Error("Request failed");
}

// Guard a response before reading its body as data. A non-OK response
// (403/404/500 from a tenant/auth hiccup or a server error) still carries a
// JSON body — usually `{message: "..."}` — and `.then((r) => r.json())` will
// happily parse THAT into component state, painting a misleading "empty" UI
// with zero error signal (the "No course selected yet" class of bug). Throw
// instead, so the caller's `.catch()` / `Promise.allSettled` path runs and the
// state keeps its safe default (or shows an explicit error+retry). 401s never
// reach here — fetchWithTimeout redirects to login first.
export async function okJson<T = any>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export async function apiFetch(
  url: string,
  options: RequestInit & { timeout?: number } = {},
): Promise<Response> {
  const token = getToken("lms_student_token");
  return fetchWithTimeout(url, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

export async function apiFetchStaff(
  url: string,
  options: RequestInit & { timeout?: number } = {},
): Promise<Response> {
  const token = getToken("lms_staff_token");
  return fetchWithTimeout(url, {
    ...options,
    portal: "staff",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}
