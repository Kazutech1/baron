// Thin Paystack REST client — Standard (redirect) integration, secret key only.
import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "./config.ts";

const BASE = "https://api.paystack.co";

type InitializeResponse = {
  status: boolean;
  message: string;
  data: { authorization_url: string; access_code: string; reference: string };
};

type VerifyResponse = {
  status: boolean;
  message: string;
  data: {
    status: "success" | "failed" | "abandoned" | string;
    reference: string;
    amount: number;
    currency: string;
    paid_at: string | null;
    gateway_response: string;
    metadata: Record<string, unknown> | null;
  };
};

async function paystackFetch<T extends { status: boolean; message?: string }>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.paystackSecretKey}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const data = (await res.json().catch(() => ({}))) as T;
  if (!res.ok || !data.status) {
    throw new Error(data.message || `Paystack API error (${res.status})`);
  }
  return data;
}

export function initializeTransaction(input: {
  email: string;
  amountNgn: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<InitializeResponse> {
  return paystackFetch<InitializeResponse>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: Math.round(input.amountNgn * 100), // kobo
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });
}

export function verifyTransaction(reference: string): Promise<VerifyResponse> {
  return paystackFetch<VerifyResponse>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

/** HMAC-SHA512 of the raw request body using the secret key — Paystack's webhook auth scheme. */
export function verifyWebhookSignature(rawBody: Buffer, signature: string | undefined): boolean {
  if (!signature) return false;
  const expected = createHmac("sha512", config.paystackSecretKey).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
