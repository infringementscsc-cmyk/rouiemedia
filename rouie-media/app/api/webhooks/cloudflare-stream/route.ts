import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyStreamWebhook } from "@/lib/webhook-signature";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const body = await request.text();
  if (!verifyStreamWebhook(body, request.headers.get("Webhook-Signature"), process.env.CLOUDFLARE_STREAM_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }
  let payload: any;
  try { payload = JSON.parse(body); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const uid = payload?.uid;
  if (typeof uid !== "string" || !/^[a-zA-Z0-9]+$/.test(uid)) return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
  const state = payload?.status?.state;
  const ready = state === "ready" && payload?.readyToStream === true;
  if (!ready && state !== "error") return NextResponse.json({ received: true, ignored: true });
  const update: Record<string, unknown> = ready ? {
    status: "ready",
    duration_seconds: Number.isFinite(payload.duration) ? Math.max(0, Math.round(payload.duration)) : null,
    thumbnail_url: typeof payload.thumbnail === "string" ? payload.thumbnail : null,
  } : { status: "failed", published_at: null };
  const { data, error } = await supabaseAdmin.from("videos").update(update)
    .eq("provider_asset_id", uid).neq("status", "removed").select("id,visibility,published_at").maybeSingle();
  if (error) return NextResponse.json({ error: "Database update failed" }, { status: 500 });
  if (!data) return NextResponse.json({ received: true, ignored: true });
  if (ready && data.visibility === "public" && !data.published_at) {
    const { error: publishError } = await supabaseAdmin.from("videos").update({ published_at: new Date().toISOString() }).eq("id", data.id);
    if (publishError) return NextResponse.json({ error: "Publication update failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
