// GET /api/rsvps?key=ADMIN_KEY[&format=json|html] — the host's private export.
// Lists every stored RSVP, newest first, as a CSV download, JSON, or a
// phone-friendly page (format=html).
import { EVENT_LABELS, loadRecords, renderPage, timingSafeEqual } from "./_shared.js";

const COLUMNS = ["submitted_at", "name", "email", "attendance", "guests", "events", "friend_code", "discord", "suggestion", "dietary", "camera_ok", "note", "user_agent"];
const LABELS = { in_person: "In person", online: "Online", watching: "Watching" };

const csvCell = (v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

export default async function handler(req, res) {
  const key = process.env.RSVP_ADMIN_KEY;
  const given = (req.query && req.query.key) || (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!key || !given || given.length !== key.length || !timingSafeEqual(given, key)) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) return res.status(503).json({ ok: false, error: "storage not configured" });

  const records = await loadRecords();

  res.setHeader("Cache-Control", "no-store");
  if (req.query && req.query.format === "html") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.setHeader("Referrer-Policy", "no-referrer");
    return res.status(200).send(renderPage(records));
  }
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

