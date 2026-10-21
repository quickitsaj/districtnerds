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
| `links.rsvp` | Party RSVP form. Until set, "Join the Party" scrolls to the sign-up section. |
| `links.signup` | Player sign-up form. Until set, the site shows a copy-and-send message template instead. |
| `links.stream` | Twitch / YouTube URL for the "Open the stream" button. |
| `links.discord` | Discord invite for remote players. |
| `stream.embedUrl` | Optional player embed shown in the Watch section (Twitch needs `&parent=districtnerds.com`). |
| `fundraising.goal` / `raised` | Set `goal` to a number to show the animated progress bar. Update `raised` by hand. |
| `contactEmail` | Shown in the sign-up fallback text if you want people to email instead. |

Nothing on the site fabricates a URL: an empty value renders as a disabled button plus a note.

## What's in here

- `index.html` — the page. Schedule items live in `js/main.js` (`SCHEDULE` array).
- `css/styles.css` — all styling and CSS animations. Honors `prefers-reduced-motion`; a footer toggle lets visitors turn effects off (stored in localStorage).
- `js/main.js` — star canvas, countdown (goes "live" on event day), schedule filters and "NOW" marker, 3D tilt, parallax, campfire embers, add-to-calendar (.ics), sign-up copy helper, Konami-code easter egg.
- `assets/poster-*.{webp,jpg}` — the approved poster, web-sized. `assets/qr-districtnerds.svg|png` — programmatically generated QR for https://districtnerds.com (verified to decode).
- `assets/og.jpg` — social share image.

## Before it goes public

1. Fill in `js/config.js` with the real Extra Life, RSVP / sign-up and stream links.
2. Point `districtnerds.com` at this site (currently it redirects to a Linktree).
3. Confirm the Ocarina of Time remake details; swap the card and schedule copy if the segment changes.
4. Decide what "friendslop" is and update its card/schedule description.
5. Test on a real iPhone and Android over mobile data.
