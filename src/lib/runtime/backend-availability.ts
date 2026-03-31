const DEFAULT_PROBE_TIMEOUT_MS = 2500;

export async function probeBackendAvailability(
  baseUrl: string,
  options?: { timeoutMs?: number },
): Promise<boolean> {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, "");
  if (!normalizedBaseUrl) {
    return false;
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), options?.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS);

  try {
    const response = await fetch(normalizedBaseUrl, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "text/plain,application/json",
      },
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
