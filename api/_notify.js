// Emails the host about each new sign-up through Resend (https://resend.com).
// Does nothing unless RESEND_API_KEY and RSVP_NOTIFY_TO are set. Never throws:
// a failed email must not fail the sign-up that triggered it.
//
//   RESEND_API_KEY    Resend API key
//   RSVP_NOTIFY_TO    where alerts go (comma-separated for several)
//   RSVP_NOTIFY_FROM  sender; defaults to Resend's shared test address, which
//                     only delivers to the Resend account owner's own email
import { loadRecords, tally, esc, eventLabel, whenET } from "./_shared.js";

const SITE = "https://districtnerds.com";

export async function notifySignup(record) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = (process.env.RSVP_NOTIFY_TO || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!apiKey || !to.length) return;
  try {
    let records = [];
    try { records = await loadRecords(); } catch (err) { console.error("notify: load failed", err); }
    // A just-written blob can lag behind list(); make sure this sign-up counts.
    if (!records.some((r) => r.id === record.id)) records.unshift(record);
    const { total, events } = tally(records);

    const evs = (record.events || []).map(eventLabel);
    const subject = `New sign-up: ${record.name}${evs.length ? ` (${evs.join(", ")})` : " (watching)"} · ${total} total`;
    const adminKey = process.env.RSVP_ADMIN_KEY;
    const listUrl = adminKey ? `${SITE}/api/rsvps?key=${encodeURIComponent(adminKey)}&format=html` : "";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RSVP_NOTIFY_FROM || "AJ's Annual Quest <onboarding@resend.dev>",
        to,
        reply_to: record.email,
        subject,
        html: renderEmail(record, total, events, listUrl),
        text: renderText(record, total, events, listUrl),
      }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) console.error("notify: resend", res.status, await res.text().catch(() => ""));
  } catch (err) {
    console.error("notify failed", err);
  }
}

function details(r) {
  return [
    ["Email", r.email],
    ["Events", (r.events || []).length ? r.events.map(eventLabel).join(", ") : "Just watching"],
    ["Discord", r.discord],
    ["Friend code", r.friend_code],
    ["Suggests", r.suggestion],
    ["Note", r.note],
  ].filter(([, v]) => v);
}

function renderText(r, total, events, listUrl) {
  return [
    `${r.name} signed up (${whenET(r.submitted_at)} ET)`,
    "",
    ...details(r).map(([k, v]) => `${k}: ${v}`),
    "",
    `Totals: ${total} signed up · ${events.map(([e, n]) => `${eventLabel(e)} ${n}`).join(" · ")}`,
    listUrl ? `\nSee everyone: ${listUrl}` : "",
  ].join("\n");
}

function renderEmail(r, total, events, listUrl) {
  const rows = details(r).map(([k, v]) => `
    <tr><td style="padding:6px 12px 6px 0;color:#7a7396;font-size:14px;vertical-align:top;white-space:nowrap">${k}</td>
    <td style="padding:6px 0;font-size:15px;color:#1d1946;word-break:break-word">${k === "Email" ? `<a href="mailto:${esc(v)}" style="color:#9a6b12">${esc(v)}</a>` : esc(v)}</td></tr>`).join("");
  const chips = [`<b>${total}</b> signed up`].concat(events.map(([e, n]) => `${esc(eventLabel(e))} <b>${n}</b>`))
    .map((t) => `<span style="display:inline-block;margin:0 6px 6px 0;padding:5px 10px;border-radius:999px;background:#f6eed8;color:#4b3a12;font-size:13px">${t}</span>`).join("");
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f2fa">
  <div style="max-width:520px;margin:0 auto;padding:20px 16px;font-family:-apple-system,'Segoe UI',Roboto,sans-serif">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#7a7396">AJ's Annual Quest · new sign-up</p>
    <h1 style="margin:0 0 4px;font-size:22px;color:#1d1946">${esc(r.name)}</h1>
    <p style="margin:0 0 14px;font-size:13px;color:#7a7396">${esc(whenET(r.submitted_at))} ET</p>
    <div style="background:#fff;border-radius:12px;padding:12px 16px;margin-bottom:16px">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">${rows}</table>
    </div>
    <div style="margin-bottom:18px">${chips}</div>
    ${listUrl ? `<a href="${esc(listUrl)}" style="display:block;text-align:center;background:#1d1946;color:#f3c45a;text-decoration:none;font-weight:700;padding:14px;border-radius:10px">See everyone</a>` : ""}
    <p style="margin:16px 0 0;font-size:12px;color:#9a93b6">Reply to this email to write back to ${esc(r.name)}.</p>
  </div></body></html>`;
}
