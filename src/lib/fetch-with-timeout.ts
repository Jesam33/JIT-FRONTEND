const LOGIN_PAGE = "/lms/login";

function getToken(key: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) ?? "";
}

export function onUnauthorized() {
  localStorage.removeItem("lms_student_token");
  localStorage.removeItem("lms_staff_token");
  window.location.href = `${LOGIN_PAGE}?expired=1`;
}

export async function fetchWithTimeout(input: RequestInfo, init?: RequestInit & { timeout?: number }): Promise<Response> {
  const timeout = init?.timeout ?? 15000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(new DOMException("Request timed out", "TimeoutError")), timeout);
  try {
    let response = await fetch(input, { ...init, signal: controller.signal });
    if (response.status === 401) {
      onUnauthorized();
      throw new Error("Unauthorized");
    }
    return response;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
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
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}
