# AJ's Annual Quest — For the Kids

Event site for **District Nerds presents AJ's Annual Quest**, an Extra Life gaming fundraiser
benefiting Children's National Hospital. Saturday, November 7, 2026 · 2 PM – 10 PM+ · districtnerds.com

Static site, no build step. Open `index.html` or host the folder anywhere (GitHub Pages, Netlify,
Vercel, Cloudflare Pages).

## Edit the links (the only file you should need to touch)

`js/config.js` holds every outward link and the event timing:

| Key | What it does |
| --- | --- |
| `links.donate` | Official Extra Life page. Until set, the Donate buttons are greyed out with a "coming soon" note. |
| `links.stream` | Twitch / YouTube URL for the "Open the stream" button. |
| `links.discord` | Discord invite for remote players. |
| `stream.twitchChannel` | Twitch channel for the embedded player. It appears from 1 hour before doors until 1 hour after sign-off; `alwaysEmbed: true` shows it year-round. `embedUrl` overrides it for YouTube etc. |
| `rsvp.supabase` | `url` + `anonKey` of the Supabase project holding the `rsvps` table (see below). |
| `rsvp.endpoint` | Alternative: any URL that accepts a JSON POST (Formspree, Google Apps Script, a serverless function). |
| `fundraising.goal` / `raised` | Set `goal` to a number to show the animated progress bar. Update `raised` by hand. |
| `contactEmail` | Shown in the sign-up fallback text if you want people to email instead. |

Nothing on the site fabricates a URL: an empty value renders as a disabled button plus a note.

## The RSVP form

The form on the page collects name, email, attendance mode (in person / online / watching),
guest count, event interests, Nintendo friend code, Discord handle, food notes, camera
preference and a note. It has a honeypot field for bots and remembers a completed RSVP in the
visitor's browser.

Submissions go to whichever backend is configured in `js/config.js`:

- **Supabase** — run `supabase/migrations/0001_rsvps.sql` in the project's SQL editor, then set
  `rsvp.supabase.url` and `rsvp.supabase.anonKey`. The policy allows inserts only, so the anon
  key in the page can never read responses. View them in Table Editor → `rsvps` (or the
  `rsvp_summary` view) and export CSV from there.
- **Google Sheet (chosen)** — the sheet "AJ's Annual Quest RSVPs" lives in AJ's Google Drive. Open it,
  go to Extensions → Apps Script, paste `google-apps-script/Code.gs`, run `setup` once, then
  Deploy → New deployment → Web app, Execute as *Me*, Who has access *Anyone*. Paste the web app URL
  into `rsvp.endpoint`. Set `NOTIFY_EMAIL` in the script to get an email per RSVP. After editing the
  script, Manage deployments → edit → New version, or the live URL keeps running the old code.
- **Any other JSON endpoint** — set `rsvp.endpoint`. The body is a JSON object with the fields above.

With neither configured, the form is replaced by a copy-and-send message template.

## What's in here

- `index.html` — the page. The game signpost panels are in the HTML; schedule items live in `js/main.js` (`SCHEDULE` array).
- `css/styles.css` — all styling. Palette: midnight indigo, forest teal, lantern gold, a little coral. Display type is Metamorphous, headings Montserrat, body Nunito (Google Fonts). Motion is limited to the world itself: star twinkle and the odd shooting star, firelight that breathes across the camp, embers and smoke, glowing lanterns and castle windows, the ON AIR neon and booth lamp, a flickering TV, a few fireflies, a drifting moon, pointer and scroll parallax on the sky layers, a staged entrance on load, and a one-time glow wave across the signpost planks. Honors `prefers-reduced-motion`; a footer toggle lets visitors turn effects off.
- `js/main.js` — star canvas, countdown (goes "live" on event day), signpost tabs, schedule filters and "NOW" marker, parallax treeline, campfire embers, Twitch embed, RSVP form, add-to-calendar (.ics), Konami-code easter egg.
- `assets/poster-*.{webp,jpg}` — the approved poster, web-sized. `assets/scene-campfire.*` is the campfire crop used behind the cause section; `assets/logo-*.png` are the Extra Life and Children's National marks lifted from the poster. `assets/qr-districtnerds.svg|png` — programmatically generated QR for https://districtnerds.com (verified to decode).
- `assets/og.jpg` — social share image.

## Before it goes public

1. Pick an RSVP backend and fill in `rsvp` in `js/config.js` (Extra Life and Twitch links are already in).
2. Point `districtnerds.com` at this site (currently it redirects to a Linktree).
3. Confirm the Ocarina of Time remake details; swap the card and schedule copy if the segment changes.
4. Decide what "friendslop" is and update its card/schedule description.
5. Test on a real iPhone and Android over mobile data.
