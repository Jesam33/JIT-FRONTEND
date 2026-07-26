const LOGIN_PAGE = "/lms/login";

export function onUnauthorized() {
  localStorage.removeItem("lms_student_token");
  localStorage.removeItem("lms_staff_token");
  window.location.href = `${LOGIN_PAGE}?expired=1`;
}

export async function fetchWithTimeout(input: RequestInfo, init?: RequestInit & { timeout?: number }): Promise<Response> {
  const timeout = init?.timeout ?? 15000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    let response = await fetch(input, { ...init, signal: controller.signal });
    if (response.status === 401) {
      onUnauthorized();
      throw new Error("Unauthorized");
    }
    return response;
  } finally {
    clearTimeout(id);
  }
}
