export async function fetchWithTimeout(input: RequestInfo, init?: RequestInit & { timeout?: number }): Promise<Response> {
  const timeout = init?.timeout ?? 15000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(id);
  }
}
