/* ============================================================
   AJ's Annual Quest — interactions & effects
   Reads window.QUEST_CONFIG (js/config.js). No build step.
   ============================================================ */
(function () {
  "use strict";
  const CFG = window.QUEST_CONFIG || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const html = document.documentElement;
  const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  let userReduce = false;
  try { userReduce = localStorage.getItem("quest-reduce-motion") === "1"; } catch (e) { /* private mode */ }
  const reduceMotion = () => userReduce || mqReduce.matches;
  if (userReduce) html.classList.add("reduce-motion");

  /* ---------- toast ---------- */
  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2600);
  }

  /* ---------- link wiring (no fabricated URLs) ---------- */
  const links = CFG.links || {};
  $$("[data-link]").forEach((a) => {
    const key = a.dataset.link;
    const url = links[key];
    if (url) {
      a.href = url;
      if (/^https?:/i.test(url) && !a.hasAttribute("target")) { a.target = "_blank"; a.rel = "noopener"; }
      a.classList.remove("is-disabled");
    } else {
      const inPage = (a.getAttribute("href") || "").startsWith("#") && a.getAttribute("href").length > 1;
      if (!inPage) {
        a.classList.add("is-disabled");
        a.setAttribute("aria-disabled", "true");
        a.removeAttribute("target");
        a.href = "#";
        a.addEventListener("click", (e) => e.preventDefault());
      }
    }
  });
  $$("[data-coming]").forEach((el) => { if (!links[el.dataset.coming]) el.classList.add("is-visible"); });

  /* ---------- copy sign-up template ---------- */
  $("#copySignup")?.addEventListener("click", async () => {
    const text = $("#signupTemplate")?.textContent || "";
    try { await navigator.clipboard.writeText(text); toast("Copied! Send it to AJ."); }
    catch (e) { toast("Couldn't copy automatically. Select the text and copy it."); }
  });

  /* ---------- nav ---------- */
  const burger = $("#navBurger"), navLinks = $("#navLinks");
  burger?.addEventListener("click", () => {
    const open = navLinks.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  navLinks?.addEventListener("click", (e) => { if (e.target.tagName === "A") { navLinks.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); } });

  // scroll spy
  const sections = $$("main section[id]");
  const navAnchors = $$("#navLinks a");
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          navAnchors.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id));
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach((s) => spy.observe(s));
  }


  /* ---------- signpost tabs ---------- */
  const signs = $$(".sign");
  const panels = $$(".game-panel");
  function selectSign(btn) {
    signs.forEach((s) => { const on = s === btn; s.classList.toggle("is-active", on); s.setAttribute("aria-selected", String(on)); s.tabIndex = on ? 0 : -1; });
    panels.forEach((p) => { const on = p.id === btn.getAttribute("aria-controls"); p.hidden = !on; p.classList.toggle("is-active", on); });
  }
  signs.forEach((btn, i) => {
    btn.addEventListener("click", () => selectSign(btn));
    btn.addEventListener("keydown", (e) => {
      const dir = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      const next = signs[(i + dir + signs.length) % signs.length];
      next.focus(); selectSign(next);
    });
  });

  /* ---------- reveal on scroll ---------- */
  const revealEls = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion()) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- countdown ---------- */
  const start = new Date(CFG.eventStart || "2026-11-07T14:00:00-05:00");
  const partyEnd = new Date(CFG.partyEnd || "2026-11-07T22:00:00-05:00");
  const streamEnd = new Date(CFG.streamEnd || "2026-11-07T23:30:00-05:00");
  const cd = { d: $("#cdDays"), h: $("#cdHours"), m: $("#cdMins"), s: $("#cdSecs"), label: $("#countdownLabel"), wrap: $("#countdown") };
  const pad = (n) => String(n).padStart(2, "0");
  function setNum(el, v) {
    if (!el || el.textContent === v) return;
    el.textContent = v;
    if (!reduceMotion()) { el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick"); }
  }
  function tickCountdown() {
    const now = new Date();
    let diff = start - now;
    if (diff <= 0 && now < streamEnd) {
      cd.wrap?.classList.add("is-live");
      cd.label.textContent = now < partyEnd ? "The quest is underway! Stream ends in" : "Party's still going. Stream ends in";
      diff = streamEnd - now;
    } else if (diff <= 0) {
      cd.label.textContent = "The quest is complete. Thank you for playing for the kids!";
      $(".countdown__grid")?.setAttribute("hidden", "");
      return;
    }
    const s = Math.floor(diff / 1000);
    setNum(cd.d, pad(Math.floor(s / 86400)));
    setNum(cd.h, pad(Math.floor((s % 86400) / 3600)));
    setNum(cd.m, pad(Math.floor((s % 3600) / 60)));
    setNum(cd.s, pad(s % 60));
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* ---------- schedule ---------- */
  const SCHEDULE = [
    { t: "2:00 PM", h: 14, m: 0, icon: "🚪", title: "Doors open · stream goes live", desc: "Snacks out, consoles on, Smash sign-ups at the door. Say hi to the webcam.", tags: ["inperson", "stream"] },
    { t: "2:30 PM", h: 14, m: 30, icon: "🔺", title: "Ocarina of Time remake showcase", desc: "AJ's first-ever playthrough, 30 minutes, live. No spoilers in chat.", tags: ["inperson", "stream"] },
    { t: "3:00 PM", h: 15, m: 0, icon: "⭐", title: "Casual Smash Cup", desc: "Beginner-friendly free-for-alls. Items on, egos off. Small prize for the winner.", tags: ["inperson", "stream"] },
    { t: "4:00 PM", h: 16, m: 0, icon: "📱", title: "Casual Jackbox · remote play", desc: "Online friends, this one's for you. Food lands around 4 too, so eat when you like.", tags: ["inperson", "remote", "stream"] },
    { t: "5:00 PM", h: 17, m: 0, icon: "🎂", title: "Cake, group photo & the fundraising moment", desc: "The one time we gather everybody in one room. Bring your best photo face.", tags: ["inperson", "stream"], big: true },
    { t: "5:25 PM", h: 17, m: 25, icon: "🏆", title: "Competitive Smash Championship", desc: "One bracket, local and remote players together. 1v1, 3 stock, no items. Remote entrants check in on Discord by 5:10.", tags: ["inperson", "remote", "stream"] },
    { t: "6:45 PM", h: 18, m: 45, icon: "💬", title: "friendslop main event", desc: "The featured party-game block with open slots for remote players. Game reveal coming soon.", tags: ["inperson", "remote", "stream"] },
    { t: "7:30 PM", h: 19, m: 30, icon: "🌙", title: "Quiet hour · free play", desc: "Volume down, board games up. Stream takes a cozy intermission.", tags: ["inperson"] },
    { t: "8:30 PM", h: 20, m: 30, icon: "🎯", title: "Fortnite after dark", desc: "The stream shifts to an online squad session with the remote crew. The house party keeps rolling at its own pace.", tags: ["remote", "stream"] },
    { t: "11:15 PM", h: 23, m: 15, icon: "💛", title: "Final fundraising recap & sign-off", desc: "The total, the thank-yous, and goodnight.", tags: ["stream"] },
  ];
  const TAG_LABEL = { inperson: ["In person", "tag--inperson"], remote: ["Remote-friendly", "tag--remote"], stream: ["On stream", "tag--stream"] };
  const timeline = $("#timeline");
  function eventTime(it) {
    const d = new Date(start);
    d.setHours(it.h, it.m, 0, 0);
    return d;
  }
  function renderSchedule() {
    if (!timeline) return;
    timeline.innerHTML = "";
    const now = new Date();
    const isEventDay = now.toDateString() === start.toDateString();
    let nowIdx = -1;
    if (isEventDay) {
      SCHEDULE.forEach((it, i) => { if (eventTime(it) <= now) nowIdx = i; });
    }
    SCHEDULE.forEach((it, i) => {
      const li = document.createElement("li");
      li.className = "timeline__item" + (it.big ? " timeline__item--big" : "") + (i === nowIdx ? " timeline__item--now" : "") + (isEventDay && i < nowIdx ? " timeline__item--past" : "");
      li.dataset.tags = it.tags.join(" ");
      li.innerHTML = `
        <div class="timeline__time">${it.t}</div>
        <div class="timeline__dot" aria-hidden="true">${it.icon}</div>
        <div class="timeline__body">
          <h3>${it.title}</h3>
          <p>${it.desc}</p>
          <ul class="tags">${it.tags.map((t) => `<li class="tag ${TAG_LABEL[t][1]}">${TAG_LABEL[t][0]}</li>`).join("")}</ul>
        </div>`;
      timeline.appendChild(li);
    });
    observeTimeline();
  }
  function observeTimeline() {
    const items = $$(".timeline__item");
    if (!("IntersectionObserver" in window) || reduceMotion()) { items.forEach((el) => el.classList.add("is-in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.2 });
    items.forEach((el) => io.observe(el));
  }
  renderSchedule();
  $$(".filters .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      $$(".filters .chip").forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      const f = chip.dataset.filter;
      $$(".timeline__item").forEach((li) => {
        const show = f === "all" || li.dataset.tags.split(" ").includes(f);
        li.classList.toggle("is-hidden", !show);
      });
    });
  });
  // timeline path draws as you scroll
  function updateTimelinePath() {
    if (!timeline || reduceMotion()) return;
    const r = timeline.getBoundingClientRect();
    const vh = window.innerHeight;
    const progress = Math.min(1, Math.max(0, (vh * 0.75 - r.top) / r.height));
    timeline.style.setProperty("--progress", progress.toFixed(3));
  }

  /* ---------- parallax forest + nav hide ---------- */
  const forestLayers = $$(".forest__layer");
  const nav = $("#nav");
  let lastY = 0, ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (!reduceMotion()) {
        forestLayers.forEach((l) => { l.style.transform = `translate3d(0, ${(-y * parseFloat(l.dataset.depth)).toFixed(1)}px, 0)`; });
      }
      if (nav) nav.style.transform = y > 120 && y > lastY + 4 ? "translateY(-110%)" : "translateY(0)";
      lastY = y;
      updateTimelinePath();
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 3D tilt (poster + cards) ---------- */
  function tilt(el, max = 10, scale = 1.02) {
    if (!finePointer) return;
    let raf;
    el.addEventListener("pointermove", (e) => {
      if (reduceMotion()) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        el.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        el.style.transform = `perspective(900px) rotateX(${((0.5 - py) * max).toFixed(2)}deg) rotateY(${((px - 0.5) * max).toFixed(2)}deg) scale(${scale})`;
      });
    });
    el.addEventListener("pointerleave", () => { cancelAnimationFrame(raf); el.style.transform = ""; });
  }
  const posterFrame = $("#posterTilt");
  if (posterFrame) {
    tilt(posterFrame, 6, 1.01);
    posterFrame.addEventListener("pointerenter", () => { posterFrame.style.animationPlayState = "paused"; });
    posterFrame.addEventListener("pointerleave", () => { posterFrame.style.animationPlayState = ""; });
  }

  /* ---------- lightbox ---------- */
  const lightbox = $("#lightbox");
  function openLightbox() { lightbox.hidden = false; document.body.style.overflow = "hidden"; $("#lightboxClose").focus(); }
  function closeLightbox() { lightbox.hidden = true; document.body.style.overflow = ""; }
  posterFrame?.addEventListener("click", openLightbox);
  lightbox?.addEventListener("click", closeLightbox);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !lightbox.hidden) closeLightbox(); });

  /* ---------- add to calendar (.ics) ---------- */
  $("#addToCal")?.addEventListener("click", () => {
    const fmt = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const esc = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
    const desc = "District Nerds presents AJ's Annual Quest — For the Kids. An Extra Life gaming fundraiser benefiting Children's National Hospital. Party 2 PM–10 PM+, stream runs until ~11:30 PM. Details: " + (CFG.siteUrl || "https://districtnerds.com");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//District Nerds//AJs Annual Quest//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:ajs-annual-quest-2026@districtnerds.com",
      "DTSTAMP:" + fmt(new Date()),
      "DTSTART:" + fmt(start),
      "DTEND:" + fmt(partyEnd),
      "SUMMARY:" + esc("AJ's Annual Quest — For the Kids (District Nerds)"),
      "DESCRIPTION:" + esc(desc),
      "URL:" + (CFG.siteUrl || "https://districtnerds.com"),
      "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:AJ's Annual Quest is tomorrow!", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ajs-annual-quest.ics";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast("Calendar file downloaded. See you November 7!");
  });

  /* ---------- fundraising meter ---------- */
  const fr = CFG.fundraising || {};
  if (typeof fr.goal === "number" && fr.goal > 0) {
    const raised = typeof fr.raised === "number" ? fr.raised : 0;
    const money = (n) => n.toLocaleString(undefined, { style: "currency", currency: fr.currency || "USD", maximumFractionDigits: 0 });
    const meter = $("#meter");
    meter.hidden = false;
    $("#meterRaised").textContent = money(raised);
    $("#meterGoal").textContent = "of " + money(fr.goal);
    const pct = Math.min(100, Math.round((raised / fr.goal) * 100));
    $("#meterPct").textContent = pct >= 100 ? "Goal reached! Every extra dollar still goes to the kids." : pct + "% of the way there";
    const fill = $("#meterFill");
    const show = () => { fill.style.width = pct + "%"; };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { show(); io.disconnect(); } });
      io.observe(meter);
    } else show();
  }

  /* ---------- stream embed + on-air ---------- */
  const onAir = $("#onAir");
  const streamCfg = CFG.stream || {};
  const HOUR = 3600 * 1000;
  function streamWindow() { const now = new Date(); return now >= new Date(start - HOUR) && now <= new Date(streamEnd.getTime() + HOUR); }
  function embedUrl() {
    if (streamCfg.embedUrl) return streamCfg.embedUrl;
    if (streamCfg.twitchChannel) {
      // Twitch requires every embedding hostname as a parent= param.
      const parents = new Set([location.hostname || "localhost"]);
      try { if (document.referrer) parents.add(new URL(document.referrer).hostname); } catch (e) { /* ignore */ }
      const p = Array.from(parents).filter(Boolean).map((h) => "parent=" + encodeURIComponent(h)).join("&");
      return `https://player.twitch.tv/?channel=${encodeURIComponent(streamCfg.twitchChannel)}&${p}&muted=true&autoplay=true`;
    }
    return "";
  }
  let embedded = false;
  function mountEmbed() {
    const url = embedUrl();
    if (!url || embedded) return;
    embedded = true;
    const frame = $("#streamFrame");
    $("#streamPlaceholder")?.remove();
    const iframe = document.createElement("iframe");
    iframe.src = url; iframe.allowFullscreen = true; iframe.allow = "autoplay; fullscreen; picture-in-picture";
    iframe.title = "AJ's Annual Quest livestream";
    frame.appendChild(iframe);
  }
  function updateOnAir() {
    const now = new Date();
    const live = now >= start && now <= streamEnd;
    onAir?.classList.toggle("is-live", live);
    if ((streamCfg.alwaysEmbed || streamWindow()) && embedUrl()) mountEmbed();
    const ph = $("#streamPlaceholder p b");
    if (ph && links.stream && !live) ph.textContent = "We go live November 7 at 2 PM ET.";
    if (ph && live) ph.textContent = links.stream ? "We're live right now. Tap below to watch." : "We're live! Stream link coming to this page any minute.";
  }
  updateOnAir(); setInterval(updateOnAir, 30000);


  /* ---------- RSVP form ---------- */
  const rsvpCfg = CFG.rsvp || {};
  const sb = rsvpCfg.supabase || {};
  const rsvpBackend = (sb.url && sb.anonKey) ? "supabase" : (rsvpCfg.endpoint ? "endpoint" : "");
  const rsvpForm = $("#rsvpForm"), rsvpSuccess = $("#rsvpSuccess"), rsvpOffline = $("#rsvpOffline"), rsvpStatus = $("#rsvpStatus");
  if (rsvpForm) {
    if (!rsvpBackend) { rsvpForm.hidden = true; rsvpOffline.hidden = false; }

    // show/hide conditional groups based on attendance
    const groups = $$("[data-show-for]", rsvpForm);
    function syncGroups() {
      const v = rsvpForm.attendance.value;
      groups.forEach((g) => { g.hidden = !(v && g.dataset.showFor.split(" ").includes(v)); });
    }
    $$("input[name=attendance]", rsvpForm).forEach((r) => r.addEventListener("change", syncGroups));
    syncGroups();

    // returning visitor
    try {
      const prev = JSON.parse(localStorage.getItem("quest-rsvp") || "null");
      if (prev && prev.name) showSuccess(prev);
    } catch (e) { /* ignore */ }

    function showSuccess(data) {
      rsvpForm.hidden = true; rsvpSuccess.hidden = false;
      const t = $("#rsvpSuccessText");
      if (data.attendance === "in_person") t.textContent = `Your seat's saved, ${data.name}. AJ will send the address to ${data.email} before the big day.`;
      else if (data.attendance === "online") t.textContent = `Your seat's saved, ${data.name}. Keep an eye on ${data.email} for Discord and match details.`;
      else t.textContent = `Thanks, ${data.name}! The stream goes live November 7 at 2 PM ET. See you in chat.`;
    }
    $("#rsvpAgain")?.addEventListener("click", () => {
      try { localStorage.removeItem("quest-rsvp"); } catch (e) { /* ignore */ }
      rsvpForm.reset(); syncGroups(); rsvpSuccess.hidden = true; rsvpForm.hidden = false; rsvpStatus.textContent = "";
      rsvpForm.name.focus();
    });
    $("[data-action=calendar]", rsvpSuccess)?.addEventListener("click", () => $("#addToCal")?.click());

    function collect() {
      const fd = new FormData(rsvpForm);
      const clean = (k, max = 200) => String(fd.get(k) || "").trim().slice(0, max);
      return {
        name: clean("name", 120),
        email: clean("email", 200).toLowerCase(),
        attendance: clean("attendance", 20),
        guests: Math.max(0, Math.min(10, parseInt(fd.get("guests") || "0", 10) || 0)),
        events: fd.getAll("events").map(String).slice(0, 10),
        friend_code: clean("friend_code", 20),
        discord: clean("discord", 60),
        dietary: clean("dietary", 200),
        camera_ok: clean("camera_ok", 3) || null,
        note: clean("note", 1000),
        user_agent: navigator.userAgent.slice(0, 200),
      };
    }
    function validate(d) {
      let bad = null;
      $$("[aria-invalid]", rsvpForm).forEach((el) => el.removeAttribute("aria-invalid"));
      if (!d.name) { bad = rsvpForm.name; rsvpStatus.textContent = "Tell us your name so we know who's coming."; }
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) { bad = rsvpForm.email; rsvpStatus.textContent = "That email doesn't look right."; }
      else if (!d.attendance) { bad = $("input[name=attendance]", rsvpForm); rsvpStatus.textContent = "Let us know how you're joining."; }
      if (bad) { bad.setAttribute("aria-invalid", "true"); bad.focus(); return false; }
      return true;
    }
    async function submit(d) {
      if (rsvpBackend === "supabase") {
        const res = await fetch(`${sb.url.replace(/\/$/, "")}/rest/v1/${encodeURIComponent(sb.table || "rsvps")}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: sb.anonKey, Authorization: "Bearer " + sb.anonKey, Prefer: "return=minimal" },
          body: JSON.stringify(d),
        });
        if (!res.ok) throw new Error("supabase " + res.status + " " + (await res.text().catch(() => "")));
      } else {
        const res = await fetch(rsvpCfg.endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(d) });
        if (!res.ok) throw new Error("endpoint " + res.status);
      }
    }
    rsvpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (rsvpForm.website.value) { showSuccess(collect()); return; } // honeypot: pretend success
      const d = collect();
      if (!validate(d)) return;
      const btn = $("#rsvpSubmit");
      btn.classList.add("is-busy"); btn.disabled = true;
      rsvpStatus.textContent = "Sending…"; rsvpStatus.classList.remove("is-ok");
      try {
        await submit(d);
        try { localStorage.setItem("quest-rsvp", JSON.stringify({ name: d.name, email: d.email, attendance: d.attendance })); } catch (err) { /* ignore */ }
        rsvpStatus.textContent = "";
        showSuccess(d);
        partyRain(true);
        rsvpSuccess.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "center" });
      } catch (err) {
        console.error(err);
        rsvpStatus.textContent = "Hmm, that didn't go through. Check your connection and try again, or message AJ directly.";
      } finally {
        btn.classList.remove("is-busy"); btn.disabled = false;
      }
    });
  }

  /* ---------- sky canvas: stars, shooting stars ---------- */
  const sky = $("#sky");
  if (sky && sky.getContext) {
    const ctx = sky.getContext("2d");
    let W, H, stars = [], shooters = [], dpr = Math.min(window.devicePixelRatio || 1, 2), running = true;
    function resize() {
      W = sky.width = Math.floor(innerWidth * dpr); H = sky.height = Math.floor(innerHeight * dpr);
      sky.style.width = innerWidth + "px"; sky.style.height = innerHeight + "px";
      const n = Math.min(200, Math.floor((innerWidth * innerHeight) / 8000));
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H * 0.9, r: (Math.random() * 1.4 + 0.4) * dpr,
        p: Math.random() * Math.PI * 2, s: 0.4 + Math.random() * 1.2,
        c: Math.random() < 0.12 ? "#ffd9e6" : Math.random() < 0.3 ? "#cdefff" : "#fff6d6",
      }));
    }
    function drawStatic() {
      ctx.clearRect(0, 0, W, H);
      stars.forEach((st) => { ctx.globalAlpha = 0.7; ctx.fillStyle = st.c; ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 1;
    }
    let last = 0;
    function frame(t) {
      if (!running) return;
      requestAnimationFrame(frame);
      if (t - last < 1000 / 45) return; // cap ~45fps
      last = t;
      if (reduceMotion()) { drawStatic(); running = false; return; }
      ctx.clearRect(0, 0, W, H);
      const time = t / 1000;
      for (const st of stars) {
        const a = 0.45 + 0.55 * Math.sin(time * st.s + st.p);
        ctx.globalAlpha = a;
        ctx.fillStyle = st.c;
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill();
        if (st.r > 1.4 * dpr) { // little cross sparkle on bigger stars
          ctx.globalAlpha = a * 0.5; ctx.fillRect(st.x - st.r * 3, st.y - 0.5 * dpr, st.r * 6, dpr); ctx.fillRect(st.x - 0.5 * dpr, st.y - st.r * 3, dpr, st.r * 6);
        }
      }
      // shooting stars
      if (Math.random() < 0.0025 && shooters.length < 1) {
        shooters.push({ x: Math.random() * W * 0.8, y: Math.random() * H * 0.3, vx: (6 + Math.random() * 5) * dpr, vy: (2.5 + Math.random() * 2) * dpr, life: 1 });
      }
      ctx.globalAlpha = 1;
      shooters = shooters.filter((s) => s.life > 0);
      for (const s of shooters) {
        const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 12, s.y - s.vy * 12);
        g.addColorStop(0, `rgba(255,255,255,${s.life})`); g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = g; ctx.lineWidth = 2 * dpr; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 12, s.y - s.vy * 12); ctx.stroke();
        s.x += s.vx; s.y += s.vy; s.life -= 0.018;
      }
    }
    resize();
    window.addEventListener("resize", () => { resize(); if (reduceMotion()) drawStatic(); });
    document.addEventListener("visibilitychange", () => { if (document.hidden) running = false; else if (!reduceMotion() && !running) { running = true; requestAnimationFrame(frame); } });
    if (reduceMotion()) drawStatic(); else requestAnimationFrame(frame);
    html.addEventListener("quest:motionchange", () => { if (reduceMotion()) { running = false; drawStatic(); } else if (!running) { running = true; requestAnimationFrame(frame); } });
  }

  /* ---------- campfire embers (canvas) ---------- */
  const fire = $(".scene"), emberCanvas = $("#emberCanvas");
  if (fire && emberCanvas && emberCanvas.getContext) {
    const ctx = emberCanvas.getContext("2d");
    const W = emberCanvas.width, H = emberCanvas.height;
    let embers = [], visible = false, raf;
    function spawn(n, burst = false) {
      for (let i = 0; i < n; i++) {
        embers.push({
          x: W / 2 + (Math.random() - 0.5) * 40, y: H / 2 + 60 - Math.random() * 20,
          vx: (Math.random() - 0.5) * (burst ? 3 : 1), vy: -(burst ? 2.5 + Math.random() * 3 : 0.8 + Math.random() * 1.4),
          r: 1.5 + Math.random() * 2.5, life: 1, hue: 20 + Math.random() * 30,
        });
      }
    }
    function loop() {
      if (!visible || reduceMotion()) { ctx.clearRect(0, 0, W, H); return; }
      raf = requestAnimationFrame(loop);
      ctx.clearRect(0, 0, W, H);
      if (Math.random() < 0.35) spawn(1);
      embers = embers.filter((e) => e.life > 0 && e.y > 0);
      for (const e of embers) {
        e.x += e.vx + Math.sin(e.y / 18) * 0.6; e.y += e.vy; e.life -= 0.012; e.vy *= 0.995;
        ctx.globalAlpha = Math.max(0, e.life);
        ctx.fillStyle = `hsl(${e.hue}, 100%, ${55 + (1 - e.life) * 20}%)`;
        ctx.shadowBlur = 10; ctx.shadowColor = "rgba(255,140,50,.9)";
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r * e.life, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((en) => { visible = en[0].isIntersecting; cancelAnimationFrame(raf); if (visible) loop(); }).observe(fire);
    } else { visible = true; loop(); }
    html.addEventListener("quest:motionchange", () => { cancelAnimationFrame(raf); if (visible) loop(); });
  }

  /* ---------- easter egg: Konami code → party rain ---------- */
  const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let kIdx = 0;
  function partyRain(quiet) {
    if (!quiet) toast("Secret unlocked. Happy birthday, AJ.");
    if (reduceMotion()) return;
    const colors = ["#f3c45a", "#f6e6bd", "#e85d75", "#7fd3de"];
    for (let i = 0; i < 70; i++) {
      const c = document.createElement("i");
      c.className = "confetti";
      c.style.left = Math.random() * 100 + "vw";
      c.style.background = colors[i % colors.length];
      c.style.setProperty("--d", 2.5 + Math.random() * 2.5 + "s");
      c.style.animationDelay = Math.random() * 1.2 + "s";
      c.style.transform = `rotate(${Math.random() * 360}deg)`;
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 6000);
    }
  }
  document.addEventListener("keydown", (e) => {
    kIdx = e.key === KONAMI[kIdx] ? kIdx + 1 : (e.key === KONAMI[0] ? 1 : 0);
    if (kIdx === KONAMI.length) { kIdx = 0; partyRain(); }
  });
  // mobile: tap the brand badge 7 times
  let taps = 0, tapTimer;
  $(".nav__brand-badge")?.addEventListener("click", (e) => {
    e.preventDefault(); taps++; clearTimeout(tapTimer); tapTimer = setTimeout(() => (taps = 0), 1500);
    if (taps >= 7) { taps = 0; partyRain(); }
  });

  /* ---------- motion toggle ---------- */
  const motionBtn = $("#motionToggle");
  function syncMotionBtn() {
    if (!motionBtn) return;
    motionBtn.setAttribute("aria-pressed", String(userReduce));
    motionBtn.textContent = userReduce ? "Motion reduced ✓" : "Reduce motion";
  }
  syncMotionBtn();
  motionBtn?.addEventListener("click", () => {
    userReduce = !userReduce;
    html.classList.toggle("reduce-motion", userReduce);
    try { localStorage.setItem("quest-reduce-motion", userReduce ? "1" : "0"); } catch (e) { /* ignore */ }
    syncMotionBtn();
    revealEls.forEach((el) => el.classList.add("is-in"));
    $$(".timeline__item").forEach((el) => el.classList.add("is-in"));
    html.dispatchEvent(new Event("quest:motionchange"));
    toast(userReduce ? "Animations toned down." : "Full sparkle restored.");
  });
})();
