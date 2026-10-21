import "server-only";

export async function updateStreamPrivacy(uid: string, isPrivate: boolean) {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_STREAM_API_TOKEN;
  if (!account || !token || !/^[a-zA-Z0-9]+$/.test(uid)) throw new Error("Cloudflare Stream not configured");
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/stream/${uid}`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ requireSignedURLs: isPrivate }), cache: "no-store"
  });
  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.success) throw new Error("Cloudflare privacy update failed");
}
