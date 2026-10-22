// GET /api/health?key=ADMIN_KEY — proves the store works: writes a probe
// record, reads it back, and reports how many RSVPs are stored.
import { put, get, list } from "@vercel/blob";

export default async function handler(req, res) {
  const key = process.env.RSVP_ADMIN_KEY;
  const given = (req.query && req.query.key) || "";
  if (!key || given !== key) return res.status(401).json({ ok: false, error: "unauthorized" });
  const auth = process.env.BLOB_READ_WRITE_TOKEN ? "token" : process.env.BLOB_STORE_ID ? "oidc" : "none";
  if (auth === "none") return res.status(503).json({ ok: false, error: "storage not configured" });
  try {
    const payload = { at: new Date().toISOString() };
    await put("probe/health.json", JSON.stringify(payload), { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true });
    const got = await get("probe/health.json", { access: "private", useCache: false });
    const back = got.statusCode === 200 ? JSON.parse(await new Response(got.stream).text()) : null;
    const rsvps = await list({ prefix: "rsvps/", limit: 1000 });
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ ok: back && back.at === payload.at, auth, store: process.env.BLOB_STORE_ID || null, rsvpCount: rsvps.blobs.length });
  } catch (err) {
    console.error("health failed", err);
    return res.status(500).json({ ok: false, auth, error: String(err && err.message || err) });
  }
}
