import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { publishSchema } from "@/lib/validators";
import { updateStreamPrivacy } from "@/lib/cloudflare";

export const runtime = "nodejs";
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Admin access required" }, { status: auth.status });
  const { id } = await context.params;
  const parsed = publishSchema.safeParse({ ...(await request.json().catch(() => ({}))), videoId: id });
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { data: video } = await supabaseAdmin.from("videos").select("id,status,visibility,provider_asset_id").eq("id", id).maybeSingle();
  if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });
  if (video.status !== "ready" || !video.provider_asset_id) return NextResponse.json({ error: "Video not ready" }, { status: 409 });
  const visibility = parsed.data.visibility;
  if (visibility === video.visibility) return NextResponse.json({ success: true });
  // Fail closed when making a video private: hide it in DB before updating Cloudflare.
  if (visibility === "private") {
    const { error } = await supabaseAdmin.from("videos").update({ visibility: "private", published_at: null }).eq("id", id);
    if (error) return NextResponse.json({ error: "Database update failed" }, { status: 500 });
    try { await updateStreamPrivacy(video.provider_asset_id, true); }
    catch { return NextResponse.json({ error: "Video hidden from Rouie; Cloudflare restriction failed. Retry before treating as private." }, { status: 502 }); }
  } else {
    try { await updateStreamPrivacy(video.provider_asset_id, false); }
    catch { return NextResponse.json({ error: "Cloudflare publication failed" }, { status: 502 }); }
    const { error } = await supabaseAdmin.from("videos").update({ visibility: "public", published_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      await updateStreamPrivacy(video.provider_asset_id, true).catch(() => {});
      return NextResponse.json({ error: "Database publication failed; inspect Stream privacy settings" }, { status: 500 });
    }
  }
  return NextResponse.json({ success: true });
}
