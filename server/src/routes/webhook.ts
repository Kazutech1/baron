// Paystack webhook — async backup confirmation path (the sync path is GET /orders/:ref/verify).
// Mounted in index.ts with express.raw() BEFORE the global express.json(), because the
// signature is an HMAC over the raw request bytes.
import type { Request, Response } from "express";
import { orders, updatePaymentStatus } from "../db.ts";
import { verifyWebhookSignature } from "../paystack.ts";
import { refreshOrderMessage } from "../telegram.ts";

type ChargeSuccessEvent = {
  event: string;
  data: {
    reference: string;
    amount: number;
    metadata: { orderRef?: string } | null;
  };
};

export async function paystackWebhook(req: Request, res: Response) {
  const signature = req.headers["x-paystack-signature"] as string | undefined;
  const rawBody = req.body as Buffer;

  if (!verifyWebhookSignature(rawBody, signature)) {
    res.status(401).end();
    return;
  }

  // ack immediately — Paystack retries on slow/failed responses, don't make it wait on our DB
  res.status(200).end();

  let event: ChargeSuccessEvent;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return;
  }
  if (event.event !== "charge.success") return;

  const orderRef = event.data.metadata?.orderRef;
  if (!orderRef) return;

  try {
    const order = await orders().findOne({ _id: orderRef });
    if (!order || order.paymentStatus === "paid") return; // idempotent guard
    if (event.data.amount !== Math.round(order.totalNgn * 100)) {
      console.error(`[paystack] webhook amount mismatch for ${orderRef}`);
      return;
    }
    const updated = await updatePaymentStatus(orderRef, "paid", event.data.reference);
    if (updated) refreshOrderMessage(updated).catch(() => {});
  } catch (err) {
    console.error("[paystack] webhook handling error:", (err as Error).message);
  }
}
