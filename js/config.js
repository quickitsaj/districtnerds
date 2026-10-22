/* ============================================================
   AJ's Annual Quest — site configuration
   Edit this file only. Everything else reads from here.
   Leave a link as "" until you have the real URL; the site will
   show a "coming soon" state instead of a broken link.
   ============================================================ */
window.QUEST_CONFIG = {
  // Event timing (Eastern Time; DST ends Nov 1 2026 so Nov 7 is EST / UTC-5)
  eventStart: "2026-11-07T14:00:00-05:00", // doors + stream go live
  partyEnd:   "2026-11-07T22:00:00-05:00", // advertised "10 PM+"
  streamEnd:  "2026-11-07T23:30:00-05:00", // approximate sign-off

  // Public links — fill in when confirmed. Empty = "coming soon".
  links: {
    donate:   "https://dd.extra-life.org/participants/quickitsaj",   // official Extra Life participant page
    rsvp:     "",   // party RSVP form
    signup:   "",   // Smash / game sign-up form (can be the same as rsvp)
    stream:   "https://www.twitch.tv/quickitsaj",
    discord:  "",   // invite for remote players (optional)
    extraLife: "https://www.extra-life.org",
    childrensNational: "https://childrensnational.org",
  },

  // Stream player in the Watch section.
  // twitchChannel: the player appears automatically from 1 hour before doors
  // until 1 hour after sign-off (set alwaysEmbed: true to show it year-round).
  // embedUrl: alternative for YouTube etc. ("https://www.youtube.com/embed/VIDEO_ID").
  stream: { twitchChannel: "quickitsaj", alwaysEmbed: false, embedUrl: "" },

  // RSVP form backend. Pick ONE:
  //  A) Supabase: create the table with supabase/migrations/0001_rsvps.sql, then
  //     fill in url + anonKey (Project Settings → API). Only inserts are allowed
  //     from the site; you read responses in the Supabase table editor.
  //  B) endpoint: any URL that accepts a JSON POST (Formspree, a Google Apps
  //     Script web app, a Netlify/Vercel function...).
  // Leave both empty and the form shows a "coming soon" state with the copy-and-
  // send fallback instead.
  rsvp: {
    supabase: { url: "", anonKey: "", table: "rsvps" },
    endpoint: "https://districtnerds.vercel.app/api/rsvp", // Vercel receiver (api/rsvp.js)
  },

  // Fundraising meter. Set goal to a number to show the progress bar.
  // Update "raised" by hand (or wire it to the Extra Life API later).
  fundraising: { goal: null, raised: null, currency: "USD" },

  // Where the QR code on the poster and site points.
  siteUrl: "https://districtnerds.com",

  // Public contact for sign-ups until a form exists (optional, e.g. "hello@districtnerds.com")
  contactEmail: "",
};
