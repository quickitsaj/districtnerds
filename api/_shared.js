// Helpers shared by the RSVP functions. The leading underscore keeps Vercel
// from exposing this file as its own route.
import { list, get } from "@vercel/blob";

export const EVENT_LABELS = { smash: "Smash Ultimate", casual_smash: "Casual Smash Cup", smash_championship: "Smash Championship", friendslop: "friendslop", jackbox: "Casual Jackbox", fortnite: "Fortnite", freeplay: "Mario Kart & tabletop", watching: "Just watching" };
// Events on the current sign-up form, in the order the form lists them.
export const CURRENT_EVENTS = ["smash", "friendslop", "fortnite"];

export const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const eventLabel = (e) => EVENT_LABELS[e] || e;

// Every stored RSVP, newest first.
export async function loadRecords() {
  const paths = [];
  let cursor;
  do {
    const page = await list({ prefix: "rsvps/", cursor, limit: 1000 });
    paths.push(...page.blobs.map((b) => b.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  const records = await Promise.all(paths.map(async (p) => {
    try {
      const got = await get(p, { access: "private", useCache: false });
      return got.statusCode === 200 ? JSON.parse(await new Response(got.stream).text()) : null;
    } catch (err) { console.error("read failed", p, err); return null; }
  }));
  return records.filter(Boolean).sort((a, b) => (a.submitted_at < b.submitted_at ? 1 : -1));
}

// { total, events: [[key, count], ...] } with current form events first, then any legacy ones seen.
export function tally(records) {
  const counts = new Map(CURRENT_EVENTS.map((e) => [e, 0]));
  for (const r of records) for (const e of r.events || []) counts.set(e, (counts.get(e) || 0) + 1);
  const events = [...counts].filter(([e, n]) => CURRENT_EVENTS.includes(e) || n > 0);
  return { total: records.length, events };
}

export const whenET = (iso) => {
  try {
    return new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch { return iso; }
};

export function timingSafeEqual(a, b) {
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

// Phone-first page listing every sign-up, with event counts that double as filters.
export function renderPage(records) {
  const { total, events } = tally(records);
  const chips = [`<button class="chip is-on" data-f="">Everyone <b>${total}</b></button>`]
    .concat(events.map(([e, n]) => `<button class="chip" data-f="${esc(e)}">${esc(eventLabel(e))} <b>${n}</b></button>`)).join("");
  const field = (label, value, html) => value ? `<div class="row"><dt>${label}</dt><dd>${html ?? esc(value)}</dd></div>` : "";
  const cards = records.map((r) => {
    const evs = r.events || [];
    const text = [r.name, r.email, r.discord, r.friend_code, r.suggestion, r.note].join(" ").toLowerCase();
    return `<article class="card" data-ev="${esc(evs.join(" "))}" data-q="${esc(text)}">
      <header><h2>${esc(r.name)}</h2><time>${esc(whenET(r.submitted_at))}</time></header>
      <div class="evs">${evs.length ? evs.map((e) => `<span class="ev">${esc(eventLabel(e))}</span>`).join("") : `<span class="ev ev--watch">Just watching</span>`}</div>
      <dl>
        ${field("Email", r.email, `<a href="mailto:${esc(r.email)}">${esc(r.email)}</a>`)}
        ${field("Discord", r.discord)}
        ${field("Friend code", r.friend_code, `<button class="copy" data-copy="${esc(r.friend_code)}">${esc(r.friend_code)}</button>`)}
        ${field("Suggests", r.suggestion)}
        ${field("Note", r.note)}
      </dl>
    </article>`;
  }).join("");

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow"><meta name="referrer" content="no-referrer">
<meta name="theme-color" content="#120f2e"><meta name="apple-mobile-web-app-capable" content="yes">
<title>Quest sign-ups (${total})</title>
<style>
  :root { --bg: #120f2e; --card: #1d1946; --line: #332d6b; --text: #ece6f7; --muted: #b9b0d6; --gold: #f3c45a; --coral: #e85d75; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; padding: 16px max(16px, env(safe-area-inset-right)) 40px max(16px, env(safe-area-inset-left)); }
  h1 { font-size: 1.35rem; margin: 4px 0 2px; color: var(--gold); }
  .sub { color: var(--muted); font-size: .85rem; margin: 0 0 14px; }
  .chips { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; margin: 0 -16px 12px; padding-inline: 16px; scrollbar-width: none; }
  .chip { flex: none; border: 1px solid var(--line); background: var(--card); color: var(--text); border-radius: 999px; padding: 8px 14px; font: inherit; font-size: .9rem; }
  .chip b { color: var(--gold); margin-left: 4px; }
  .chip.is-on { border-color: var(--gold); background: #2a2350; }
  input[type=search] { width: 100%; padding: 11px 14px; border-radius: 12px; border: 1px solid var(--line); background: var(--card); color: var(--text); font: inherit; margin-bottom: 14px; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 14px 16px; margin-bottom: 12px; }
  .card header { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
  .card h2 { font-size: 1.1rem; margin: 0; overflow-wrap: anywhere; }
  time { color: var(--muted); font-size: .8rem; flex: none; }
  .evs { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 6px; }
  .ev { font-size: .78rem; font-weight: 600; padding: 3px 9px; border-radius: 999px; background: rgba(243, 196, 90, .15); color: var(--gold); }
  .ev--watch { background: rgba(185, 176, 214, .15); color: var(--muted); }
  dl { margin: 0; }
  .row { display: flex; gap: 10px; padding: 5px 0; border-top: 1px solid rgba(51, 45, 107, .6); font-size: .92rem; }
  dt { flex: 0 0 88px; color: var(--muted); }
  dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
  a { color: var(--gold); }
  .copy { font: inherit; color: var(--text); background: none; border: 1px dashed var(--line); border-radius: 6px; padding: 0 6px; }
  .empty { color: var(--muted); text-align: center; padding: 30px 0; }
  .toast { position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); background: var(--gold); color: #2b1f12; font-weight: 700; padding: 8px 16px; border-radius: 8px; opacity: 0; transition: opacity .2s; }
  .toast.on { opacity: 1; }
</style></head><body>
<h1>AJ's Annual Quest sign-ups</h1>
<p class="sub">${total} ${total === 1 ? "person" : "people"} · newest first · updated ${esc(whenET(new Date().toISOString()))} ET</p>
<div class="chips">${chips}</div>
<input type="search" id="q" placeholder="Search names, emails, Discord…" autocomplete="off">
<main id="list">${cards || ""}</main>
<p class="empty" id="empty"${records.length ? " hidden" : ""}>No sign-ups match.</p>
<div class="toast" id="toast">Copied</div>
<script>
  const cards = [...document.querySelectorAll(".card")], chips = [...document.querySelectorAll(".chip")];
  let f = "", q = "";
  function apply() {
    let shown = 0;
    for (const c of cards) {
      const ok = (!f || c.dataset.ev.split(" ").includes(f)) && (!q || c.dataset.q.includes(q));
      c.hidden = !ok; if (ok) shown++;
    }
    document.getElementById("empty").hidden = shown > 0;
  }
  chips.forEach((b) => b.addEventListener("click", () => { f = b.dataset.f; chips.forEach((x) => x.classList.toggle("is-on", x === b)); apply(); }));
  document.getElementById("q").addEventListener("input", (e) => { q = e.target.value.trim().toLowerCase(); apply(); });
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-copy]"); if (!b) return;
    try { await navigator.clipboard.writeText(b.dataset.copy); const t = document.getElementById("toast"); t.classList.add("on"); setTimeout(() => t.classList.remove("on"), 1200); } catch (err) {}
  });
</script>
</body></html>`;
}
