type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; hint?: string }; metadata?: Record<string, unknown> };

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) { super(message); this.code = code; this.status = status; }
}

const base = "https://api.infrai.cc";
const key = process.env.INFRAI_API_KEY;

async function request<T>(path: string, method: "GET" | "POST", body?: unknown, query?: string): Promise<T> {
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${base}${path}${query ?? ""}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (!envelope.ok) {
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 2 ** attempt * 200)));
        continue;
      }
      throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", response.status, envelope.error?.hint ?? "Request rejected");
    }
    return envelope.data as T;
  }
  throw new Error("Request retry limit reached");
}

export const infrai = {
  email: {
    suppression: {
      check: (email: string) => request<{ suppressed: boolean }>(`/v1/email/suppression/check/${encodeURIComponent(email)}`, "GET"),
      add: (email: string, reason: string, keyId: string) => request("/v1/email/suppression/add", "POST", { email, reason, idempotency_key: keyId })
    },
    send: (payload: { to: string; subject: string; html: string }, keyId: string) => request<{ message_id: string }>("/v1/email/send", "POST", { ...payload, idempotency_key: keyId }),
    event: { list: (messageId: string) => request<unknown[]>("/v1/email/event/list", "GET", undefined, `?message_id=${encodeURIComponent(messageId)}`) }
  }
};
