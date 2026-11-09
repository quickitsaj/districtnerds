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

  /* ---------- hero motion: entrance, parallax, signpost hint ---------- */
  const hero = $(".hero");
  if (hero) {
    const ready = () => hero.classList.add("is-ready");
    if (document.readyState === "complete") setTimeout(ready, 80); else window.addEventListener("load", () => setTimeout(ready, 80));
    setTimeout(ready, 1800); // never wait on a slow image

    if (finePointer) {
      let raf;
      hero.addEventListener("pointermove", (e) => {
        if (reduceMotion()) return;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = hero.getBoundingClientRect();
          hero.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
          hero.style.setProperty("--my", (((e.clientY - r.top) / Math.min(r.height, innerHeight)) * 2 - 1).toFixed(3));
        });
      });
      hero.addEventListener("pointerleave", () => { hero.style.setProperty("--mx", 0); hero.style.setProperty("--my", 0); });
    }
  }

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

  /* ---------- scroll hint + hero scroll parallax ---------- */
  const scrollHint = $("#scrollHint");
  if (scrollHint) scrollHint.addEventListener("click", () => window.scrollBy({ top: window.innerHeight * 0.8, behavior: reduceMotion() ? "auto" : "smooth" }));
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (hero && !reduceMotion()) hero.style.setProperty("--sy", Math.min(y, 900));
      if (scrollHint) scrollHint.classList.toggle("is-hidden", y > 60);
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- lightbox ---------- */
  const lightbox = $("#lightbox");
  function openLightbox() { lightbox.hidden = false; document.body.style.overflow = "hidden"; $("#lightboxClose").focus(); }
  function closeLightbox() { lightbox.hidden = true; document.body.style.overflow = ""; }
  $("#posterOpen")?.addEventListener("click", openLightbox);
  lightbox?.addEventListener("click", closeLightbox);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && lightbox && !lightbox.hidden) closeLightbox(); });

  /* ---------- final total ---------- */
  // Shows the figures from js/config.js straight away, then refreshes them from the
  // public Extra Life API so donations that arrive after the event still count.
  const fr = CFG.fundraising || {};
  const money = (n) => n.toLocaleString("en-US", { style: "currency", currency: fr.currency || "USD", maximumFractionDigits: 0 });
  function showTotal(raised, donations) {
    if (typeof raised === "number") $$("[data-raised]").forEach((el) => { el.textContent = money(raised); });
    if (typeof donations === "number") $$("[data-donations]").forEach((el) => { el.textContent = donations.toLocaleString("en-US") + (donations === 1 ? " donation" : " donations"); });
  }
  showTotal(fr.raised, fr.donations);
  if (fr.liveUrl && window.fetch) {
    fetch(fr.liveUrl, { headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        // Totals only grow; ignore anything lower than the recorded figure.
        if (d && typeof d.sumDonations === "number" && d.sumDonations >= (fr.raised || 0)) showTotal(d.sumDonations, d.numDonations);
      })
      .catch(() => { /* keep the recorded total */ });
  }

  /* ---------- star canvases: fixed page sky + the hero's sky band ---------- */
  function starField(canvas, sizeOf, opts) {
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const density = opts.density || 8000, shootRate = opts.shootRate || 0;
    let W, H, stars = [], shooters = [], dpr = Math.min(window.devicePixelRatio || 1, 2), running = true, last = 0;
    function resize() {
      const { w, h } = sizeOf();
      W = canvas.width = Math.floor(w * dpr); H = canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      const n = Math.min(opts.max || 200, Math.floor((w * h) / density));
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H * (opts.yMax || 0.9), r: (Math.random() * 1.3 + 0.4) * dpr,
        p: Math.random() * Math.PI * 2, s: 0.3 + Math.random() * 0.9,
        c: Math.random() < 0.12 ? "#ffd9e6" : Math.random() < 0.3 ? "#cdefff" : "#fff6d6",
      }));
    }
    function drawStatic() {
      ctx.clearRect(0, 0, W, H);
      stars.forEach((st) => { ctx.globalAlpha = 0.7; ctx.fillStyle = st.c; ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 1;
    }
    function frame(t) {
      if (!running) return;
      requestAnimationFrame(frame);
      if (t - last < 1000 / 30) return;
      last = t;
      if (reduceMotion()) { drawStatic(); running = false; return; }
      ctx.clearRect(0, 0, W, H);
      const time = t / 1000;
      for (const st of stars) {
        const a = 0.45 + 0.55 * Math.sin(time * st.s + st.p);
        ctx.globalAlpha = a; ctx.fillStyle = st.c;
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill();
        if (st.r > 1.4 * dpr) { ctx.globalAlpha = a * 0.5; ctx.fillRect(st.x - st.r * 3, st.y - 0.5 * dpr, st.r * 6, dpr); ctx.fillRect(st.x - 0.5 * dpr, st.y - st.r * 3, dpr, st.r * 6); }
      }
      if (shootRate && Math.random() < shootRate && shooters.length < 1) {
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
  starField($("#sky"), () => ({ w: innerWidth, h: innerHeight }), { density: 8000, max: 200, shootRate: 0.0025 });
  const skyBand = $(".band--sky");
  if (skyBand) {
    const c = document.createElement("canvas"); c.className = "band-stars"; c.setAttribute("aria-hidden", "true");
    skyBand.prepend(c);
    starField(c, () => ({ w: skyBand.clientWidth, h: skyBand.clientHeight }), { density: 5000, max: 220, yMax: 1, shootRate: 0.004 });
  }

  /* ---------- campfire embers (canvas) ---------- */
  const fire = $(".scene-art"), emberCanvas = $("#emberCanvas");
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
      if (Math.random() < 0.08) embers.push({ x: W / 2 + (Math.random() - 0.5) * 30, y: H / 2 + 40, vx: (Math.random() - 0.5) * 0.4, vy: -(0.5 + Math.random() * 0.5), r: 6 + Math.random() * 8, life: 1, smoke: true });
      embers = embers.filter((e) => e.life > 0 && e.y > 0);
      for (const e of embers) {
        if (e.smoke) {
          e.x += e.vx + Math.sin(e.y / 22) * 0.4; e.y += e.vy; e.life -= 0.006; e.r += 0.12;
          ctx.globalAlpha = Math.max(0, e.life) * 0.12; ctx.fillStyle = "#cfd3e6"; ctx.shadowBlur = 0;
          ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();
          continue;
        }
        e.x += e.vx + Math.sin(e.y / 18) * 0.6; e.y += e.vy; e.life -= 0.012; e.vy *= 0.995;
        ctx.globalAlpha = Math.max(0, e.life);
        ctx.fillStyle = `hsl(${e.hue}, 100%, ${55 + (1 - e.life) * 20}%)`;
        ctx.shadowBlur = 10; ctx.shadowColor = "rgba(255,140,50,.9)";
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r * Math.max(0, e.life), 0, Math.PI * 2); ctx.fill();
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
  function partyRain() {
    toast("Secret unlocked. Happy birthday, AJ.");
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
    html.dispatchEvent(new Event("quest:motionchange"));
    toast(userReduce ? "Animations toned down." : "Full sparkle restored.");
  });
})();
