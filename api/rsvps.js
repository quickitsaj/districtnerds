// GET /api/rsvps?key=ADMIN_KEY[&format=json] — the host's private export.
// Lists every stored RSVP, newest first, as a CSV download (or JSON).
import { list, get } from "@vercel/blob";

const COLUMNS = ["submitted_at", "name", "email", "attendance", "guests", "events", "friend_code", "discord", "dietary", "camera_ok", "note", "user_agent"];
const LABELS = { in_person: "In person", online: "Online", watching: "Watching" };
const EVENT_LABELS = { casual_smash: "Casual Smash Cup", smash_championship: "Smash Championship", friendslop: "friendslop", jackbox: "Casual Jackbox", fortnite: "Fortnite", freeplay: "Mario Kart & tabletop", watching: "Just watching" };

const csvCell = (v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

export default async function handler(req, res) {
  const key = process.env.RSVP_ADMIN_KEY;
  const given = (req.query && req.query.key) || (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!key || !given || given.length !== key.length || !timingSafeEqual(given, key)) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) return res.status(503).json({ ok: false, error: "storage not configured" });

  const records = [];
  let cursor;
  do {
    const page = await list({ prefix: "rsvps/", cursor, limit: 1000 });
    for (const b of page.blobs) {
      try {
        const got = await get(b.pathname, { access: "private", useCache: false });
        if (got.statusCode === 200) records.push(JSON.parse(await new Response(got.stream).text()));
      } catch (err) { console.error("read failed", b.pathname, err); }
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  records.sort((a, b) => (a.submitted_at < b.submitted_at ? 1 : -1));

  res.setHeader("Cache-Control", "no-store");
  if (req.query && req.query.format === "json") return res.status(200).json({ ok: true, count: records.length, rsvps: records });

  const rows = records.map((r) => COLUMNS.map((c) => {
    if (c === "attendance") return LABELS[r[c]] || r[c];
    if (c === "events") return (r.events || []).map((e) => EVENT_LABELS[e] || e).join(", ");
    return r[c];
  }));
  const csv = [COLUMNS.join(","), ...rows.map((row) => row.map(csvCell).join(","))].join("\r\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="ajs-annual-quest-rsvps.csv"`);
  return res.status(200).send("﻿" + csv);
}

function timingSafeEqual(a, b) {
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}
