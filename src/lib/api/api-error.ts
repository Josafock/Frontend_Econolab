export type ApiErrorPayload = {
  errors: string[];
};

function extractMessage(candidate: unknown): string | null {
  if (typeof candidate === "string" && candidate.trim().length > 0) {
    return candidate;
  }

  if (candidate && typeof candidate === "object" && "message" in candidate) {
    const nested = (candidate as { message?: unknown }).message;
    if (typeof nested === "string" && nested.trim().length > 0) {
      return nested;
    }
  }

  return null;
}

export function normalizeApiErrors(payload: unknown): ApiErrorPayload {
  if (!payload || typeof payload !== "object") {
    return { errors: ["Error desconocido"] };
  }

  const candidate = payload as { errors?: unknown; message?: unknown };

  if (Array.isArray(candidate.errors)) {
    const errors = candidate.errors
      .map((entry) => extractMessage(entry))
      .filter((entry): entry is string => Boolean(entry));

    if (errors.length > 0) {
      return { errors };
    }
  }

  const message = extractMessage(candidate.message);
  if (message) {
    return { errors: [message] };
  }

  return { errors: ["Error desconocido"] };
}

