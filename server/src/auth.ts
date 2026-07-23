import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { config } from "./config.ts";

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function secret(): Buffer {
  return createHmac("sha256", "loadax-admin-v1").update(config.adminPassword).digest();
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function issueToken(): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  return `${exp}.${sign(String(exp))}`;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expStr, sig] = token.split(".");
  if (!expStr || !sig) return false;
  if (Number(expStr) < Date.now()) return false;
  const expected = Buffer.from(sign(expStr));
  const actual = Buffer.from(sig);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function checkPassword(password: unknown): boolean {
  if (typeof password !== "string" || password.length === 0) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(config.adminPassword);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!verifyToken(token)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
