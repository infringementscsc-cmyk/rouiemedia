import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyStreamWebhook(body: string, header: string | null, secret: string | undefined, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!secret || !header || body.length > 1024 * 1024) return false;
  const fields = Object.fromEntries(header.split(",").map(part => part.trim().split("=")));
  const time = fields.time;
  const sig = fields.sig1;
  if (!time || !/^\d{10,}$/.test(time) || !sig || !/^[a-f0-9]{64}$/i.test(sig)) return false;
  const timestamp = Number(time);
  if (!Number.isSafeInteger(timestamp) || Math.abs(nowSeconds - timestamp) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${time}.${body}`).digest();
  const actual = Buffer.from(sig, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
