# AJ's Annual Quest — handoff

Last updated: October 22, 2026. Event: Saturday, November 7, 2026, stream live from 2 PM ET.
Live site: https://districtnerds.com. Repo: github.com/quickitsaj/districtnerds (public), branch `claude/beautiful-wright-ho8w8o`.

## 1. What the public site says (current state)

The public site is a **stream event only**. The in-person party exists but is invited privately,
so nothing on the site, the form, or the export labels mentions a house, an address, local or
remote players, or in-person attendance. Keep it that way.

Current lineup and run of show (all Eastern):

| Time | Block | Joinable |
| --- | --- | --- |
| 2:00 | Stream goes live | watch |
| 2:15 | Ocarina of Time remake, AJ's first playthrough | watch |
| 4:00 | Casual Jackbox, room code on stream | join |
| 5:25 | Smash Ultimate, one open bracket, ~50 min, 1v1 / 3 stock / no items | join |
| 6:15 | friendslop main event, runs to intermission | join |
| 7:30 | Intermission, 30 min | — |
| 8:00 | Fortnite after dark, squads | join |
| 2:00 AM | Final fundraising recap and sign-off | watch |

Signpost games (hero art and "On the Signpost" tabs): Ocarina of Time Remake, Smash Ultimate,
friendslop, Fortnite, Board Games. Mario Kart was removed from the lineup; the painted signpost in
the poster crop still shows a Mario Kart plank (no longer clickable). A re-exported poster without
that plank would let the hero layers be recut (see §3).

Decisions made and settled: no nav bar; no "Watch. Play. Give." heading in the hero (it stays in
the footer); no districtnerds.com plank or QR card on the page; no fineprint lines; no Camp or
quiet-hour section; no in-person language; one Smash bracket instead of two; intermission is 30
minutes; the intermission FAQ and the email fineprint are gone.

Sign-up form fields: name, email, events (Smash, friendslop, Fortnite; none = just watching),
Nintendo friend code, Discord handle, Suggest a game, note, plus a honeypot.

## 2. Links and config

Everything outward lives in `js/config.js`:

- Donate: https://dd.extra-life.org/participants/quickitsaj (live on three buttons).
- Stream: https://www.twitch.tv/quickitsaj. The Twitch player embeds itself from one hour before
  doors to one hour after sign-off (`stream.twitchChannel`, `alwaysEmbed` to force).
- Discord invite: set in `links.discord` (https://discord.gg/upgXwh2fN).
- RSVP endpoint: https://districtnerds.vercel.app/api/rsvp (see §4).
- Fundraising meter: hidden until `fundraising.goal` is a number; `raised` is updated by hand.
- Event timing: `eventStart` 2026-11-07T14:00-05:00, `streamEnd` 2026-11-08T02:30-05:00. On the day,
  the countdown is replaced by the stream booth (player, Twitch and Discord buttons) in the hero, the
  Watch section below hides, the ON AIR signs light, and the schedule marks the current block "NOW"
  (times computed from the start, so the marker is right in any time zone). After `streamEnd` the
  booth moves back down and the hero shows a thank-you line.

## 3. Site architecture

Static site, no build step locally: `index.html`, `css/styles.css`, `js/main.js`, `js/config.js`,
`assets/`. Fonts from Google Fonts: Metamorphous (display), Montserrat (headings), Nunito (body).

**Hero = the poster, rebuilt.** `assets/hero/` holds slices of the 1024×1536 poster: `top-left`
(treehouse, x 0–205, y 0–470), `top-right` (castle, x 835–1024), `moon` (x 752–856, y 18–118),
`scene` (x 0–1024, y 445–1105, the campsite with signpost), `bottom-left` (x 0–172, y 1092–1350),
`bottom-right` (x 862–1024, y 1100–1255). Three full-bleed bands: sky with the title as live text
and its own star canvas; the scene with glow overlays, embers, smoke, and clickable plank hotspots
(percent positions in the `.hotspot` style attributes); the bottom block with buttons, date,
countdown, logos and two text links. To recut from a new poster, run the crops in the same
coordinates (the Python used is in this session's history; it is plain PIL `crop`), then regenerate
webp and jpg. The art is upscaled from 1024px; a 2048px export would make it crisp.

**Motion** is deliberately limited to the world: star twinkle, rare shooting star, firelight
breathing, embers and smoke, lantern and castle-window glows, ON AIR neon (stronger while live),
booth lamp, TV flicker, fireflies, moon drift, pointer and scroll parallax on sky layers, a staged
entrance, a title light sweep, and a one-time glow wave across the planks. `prefers-reduced-motion`
and the footer toggle calm everything. Confetti only on sign-up success and the Konami code.

**Design DNA** (from AJ's notes, keep it): one coherent nighttime campsite rather than a collage;
deliberate negative space; midnight indigo, forest teal, lantern gold, restrained coral; typography
that feels built into the world (banners, planks); the gathering around the fire is the emotional
center; no floating hearts, stickers or icon explosions; invite people into a world, don't
advertise at them.

## 4. Hosting, deploys, RSVP backend

**Vercel.** Team "Capno Labs LLC" (`team_dukw4YHQa9ikDXNCiuZ9G1EX`), project `districtnerds`
(`prj_q3I3AXXTnDGgBinLQGJS1FcS4suh`). Domains `districtnerds.com` and `www` (308 → apex) are
attached and verified; GoDaddy DNS: A @ → 216.150.1.1 and 216.150.16.1, CNAME www →
cname.vercel-dns.com. Vercel Authentication is off for the project.

**No Git integration.** AJ's GitHub (quickitsaj) is connected to his personal Vercel account, not to
the Capno Labs team, so the project is not linked to the repo. Instead the build runs
`scripts/fetch-source.sh`, which downloads the public repo tarball for the branch in the
`SOURCE_REF` env var and stages `index.html`, `css`, `js`, `assets` into `public/`. Functions in
`api/` are uploaded with each deployment. Consequences:

- A push does not deploy. Trigger a deploy through the Vercel API: a redeploy of the latest
  deployment with `withLatestCommit: true` when only site files changed; a fresh `create_deployment`
  with `api/*.js`, `package.json`, `vercel.json`, `scripts/fetch-source.sh` inlined when functions
  changed. Builds take about ten seconds.
- To go live from `main` later, merge the branch and set `SOURCE_REF=main`.
- Auto-deploy options: a GitHub Action with a Vercel token (needs the token as a repo secret), or
  connecting the quickitsaj GitHub account inside the Capno Labs team from a desktop.

**RSVP receiver.** `api/rsvp.js` validates and stores one JSON blob per sign-up in the private Blob
store `districtnerds-rsvps` (`store_kbM9C4dTPQTuqca2`), authenticated through `BLOB_STORE_ID` plus
Vercel OIDC (no read-write token variable exists; the SDK handles it). `api/rsvps.js` exports CSV
(`?format=json` for JSON) and `api/health.js` does a write-read probe, both gated by
`RSVP_ADMIN_KEY`, a sensitive project env var whose value was shared with AJ in chat and is not in
the repo. One real sign-up exists (AJ's test). Export columns: submitted_at, name, email,
attendance (legacy, blank now), guests (legacy), events, friend_code, discord, suggestion, dietary
(legacy), camera_ok (legacy), note, user_agent.

**Alternatives kept in the repo but unused:** `google-apps-script/Code.gs` plus the Google Sheet
"AJ's Annual Quest RSVPs" in AJ's Drive (never deployed; needs a desktop to publish the script), and
`supabase/migrations/0001_rsvps.sql`. The client in `js/main.js` supports Supabase, Apps Script
(text/plain body, no preflight) and any JSON endpoint.

## 5. Open items

1. **friendslop**: decide the actual game; the panel and schedule say "game reveal coming soon".
2. **Ocarina of Time remake**: confirm title, release, platform and streaming rules before the day;
   fall back to a Zelda showcase if needed.
3. ~~**Discord invite** into `links.discord`~~ (done).
4. **Fundraising meter**: set a goal if wanted; update `raised` by hand or wire the Extra Life API.
5. **Poster**: the hero art still shows a Mario Kart plank; a new export would fix it.
6. **Promote to main** and point `SOURCE_REF` at it once content is final.
7. **Auto-deploys** if AJ wants pushes to go live without a manual trigger.
8. **Delete AJ's test RSVP** if he doesn't want it in the export.
9. Share the preview artifact (https://claude.ai/artifact/GxRe56J1iCdH7nk8EFD1Ds) is private to AJ;
   the live site is the thing to share.

## 6. Gotchas learned the hard way

- `[hidden]` needs `display:none !important` because flex containers override it.
- Twitch embeds need every embedding hostname as a `parent=` param; the code adds the current host
  and the referrer host.
- Apps Script web apps answer only "simple" requests: send JSON as `text/plain`.
- The Claude sandbox egress proxy blocks `*.vercel.app` and `districtnerds.com`; use the Vercel
  connector's `web_fetch_vercel_url` (GET only) to probe, and browser tests against a local server.
- The Vercel connector cannot create storage (403) and sees only the Capno Labs team; the user has
  to create stores and connect them from the dashboard. Env vars added after a deploy need a redeploy.
- Full-page Playwright screenshots need `scroll-behavior:auto` injected or scroll-reveal never fires.
- Animated elements make Playwright's `click` wait forever; use `{ force: true }`.
