/* ============================================================
   AJ's Annual Quest — site configuration (post-event)
   Edit this file only. Everything else reads from here.
   ============================================================ */
window.QUEST_CONFIG = {
  // Public links. An empty value renders as a disabled link.
  links: {
    donate: "https://dd.extra-life.org/participants/quickitsaj", // Extra Life page, still accepting donations
    extraLife: "https://www.extra-life.org",
    childrensNational: "https://childrensnational.org",
  },

  // Final total: the District Nerds team on Extra Life (AJ's page plus teammates'),
  // as read on November 9, 2026. The page shows these figures immediately, then
  // refreshes from liveUrl (public Extra Life API) so late donations are counted.
  // Set liveUrl to "" to freeze the numbers below.
  fundraising: {
    raised: 2750,
    donations: 26,
    currency: "USD",
    liveUrl: "https://dd.extra-life.org/api/teams/75170",
  },

  siteUrl: "https://districtnerds.com",
};
