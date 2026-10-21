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
    donate:   "",   // official Extra Life participant/team page
    rsvp:     "",   // party RSVP form
    signup:   "",   // Smash / game sign-up form (can be the same as rsvp)
    stream:   "",   // e.g. https://twitch.tv/... or YouTube live URL
    discord:  "",   // invite for remote players (optional)
    extraLife: "https://www.extra-life.org",
    childrensNational: "https://childrensnational.org",
  },

  // Optional stream embed (shown in the Watch section when set).
  // Twitch:  "https://player.twitch.tv/?channel=CHANNEL&parent=districtnerds.com"
  // YouTube: "https://www.youtube.com/embed/VIDEO_ID"
  stream: { embedUrl: "" },

  // Fundraising meter. Set goal to a number to show the progress bar.
  // Update "raised" by hand (or wire it to the Extra Life API later).
  fundraising: { goal: null, raised: null, currency: "USD" },

  // Where the QR code on the poster and site points.
  siteUrl: "https://districtnerds.com",

  // Public contact for sign-ups until a form exists (optional, e.g. "hello@districtnerds.com")
  contactEmail: "",
};
