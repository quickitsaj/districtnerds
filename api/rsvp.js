// POST /api/rsvp — receives an RSVP from the site and stores it as one JSON
// blob in Vercel Blob (rsvps/<timestamp>-<id>.json). One blob per RSVP means
// two people submitting at once never overwrite each other.
import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";

const ATTENDANCE = new Set(["in_person", "online", "watching"]);
const EVENTS = new Set(["smash", "casual_smash", "smash_championship", "friendslop", "jackbox", "fortnite", "freeplay", "watching"]);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const clip = (v, max) => String(v ?? "").trim().slice(0, max);

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });

  let data = req.body;
  if (typeof data === "string") { try { data = JSON.parse(data); } catch { data = null; } }
  if (!data || typeof data !== "object") return res.status(400).json({ ok: false, error: "bad json" });

  // Honeypot: bots fill the hidden field. Say yes, store nothing.
  if (data.website) return res.status(200).json({ ok: true });

  const name = clip(data.name, 120);
  const email = clip(data.email, 200).toLowerCase();
  const attendance = ATTENDANCE.has(clip(data.attendance, 20)) ? clip(data.attendance, 20) : "";
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: "missing fields" });
  }

  const record = {
    id: randomUUID(),
    submitted_at: new Date().toISOString(),
    name,
    email,
    attendance,
    guests: Math.max(0, Math.min(10, parseInt(data.guests, 10) || 0)),
    events: (Array.isArray(data.events) ? data.events : []).map(String).filter((e) => EVENTS.has(e)).slice(0, 10),
    friend_code: clip(data.friend_code, 20),
    discord: clip(data.discord, 60),
    dietary: clip(data.dietary, 200),
    camera_ok: data.camera_ok === "no" ? "no" : data.camera_ok === "yes" ? "yes" : "",
    note: clip(data.note, 1000),
    user_agent: clip(data.user_agent || req.headers["user-agent"], 200),
    ip_hint: clip(req.headers["x-forwarded-for"], 60).split(",")[0],
  };

  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    return res.status(503).json({ ok: false, error: "storage not configured" });
  }
  try {
    const stamp = record.submitted_at.replace(/[:.]/g, "-");
    await put(`rsvps/${stamp}-${record.id}.json`, JSON.stringify(record), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("rsvp store failed", err);
    return res.status(500).json({ ok: false, error: "store failed" });
  }
}
