/* =====================================================
   TANGOJAM V6 — "FÜR DICH" · Visitor-first Engine
   ===================================================== */
(function () {
  "use strict";

  var raf = requestAnimationFrame;
  var $ = function (s, p) { return (p || document).querySelector(s); };
  var $$ = function (s, p) { return [].slice.call((p || document).querySelectorAll(s)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, lo, hi) { return Math.min(Math.max(v, lo), hi); };

  /* ══════════════════════════
     1. LOADER
     ══════════════════════════ */
  var loader = $("#loader");
  var loaderN = $(".loader-n");
  var loaderFill = $(".loader-fill");

  function runLoader() {
    var start = performance.now();
    var dur = 1800;
    function tick(now) {
      var t = clamp((now - start) / dur, 0, 1);
      var e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      var v = Math.round(e * 100);
      loaderN.textContent = v;
      loaderFill.style.width = v + "%";
      if (t < 1) raf(tick);
      else {
        setTimeout(function () {
          loader.classList.add("done");
          document.body.classList.add("ready");
        }, 250);
      }
    }
    raf(tick);
  }
  if (document.readyState === "complete") runLoader();
  else window.addEventListener("load", runLoader);

  /* ══════════════════════════
     2. CURSOR
     ══════════════════════════ */
  var cur = $("#cur");
  var curD = $(".cur-d");
  var curR = $(".cur-r");
  var mx = -100, my = -100, cx2 = -100, cy2 = -100;

  if (window.matchMedia("(pointer:fine)").matches && cur) {
    document.addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; });
    (function cl() {
      cx2 = lerp(cx2, mx, 0.13);
      cy2 = lerp(cy2, my, 0.13);
      curD.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
      curR.style.transform = "translate(" + cx2 + "px," + cy2 + "px)";
      raf(cl);
    })();
    document.addEventListener("mouseover", function (e) {
      var h = e.target.closest("[data-h]");
      cur.classList.toggle("hov", !!h);
    });
  }

  /* ══════════════════════════
     3. SCROLL — Progress, Header, Nav
     ══════════════════════════ */
  var prog = $("#prog");
  var hdr = $("#hdr");
  var secs = $$("section[id]");
  var navLinks = $$(".nav a");

  function onScroll() {
    var y = window.pageYOffset;
    var dH = document.documentElement.scrollHeight - window.innerHeight;

    // Progress
    if (prog && dH > 0) prog.style.width = (y / dH * 100) + "%";

    // Header
    hdr.classList.toggle("pinned", y > 50);

    // Active nav
    var sp = y + window.innerHeight * 0.35;
    for (var i = secs.length - 1; i >= 0; i--) {
      if (secs[i].offsetTop <= sp) {
        var id = secs[i].id;
        navLinks.forEach(function (l) {
          l.classList.toggle("on", l.getAttribute("href") === "#" + id);
        });
        break;
      }
    }
  }

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) { raf(function () { onScroll(); ticking = false; }); ticking = true; }
  }, { passive: true });

  /* ══════════════════════════
     4. REVEALS
     ══════════════════════════ */
  var revObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add("vis"); });
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

  $$(".anim, .anim-reveal").forEach(function (el) { revObs.observe(el); });

  /* ══════════════════════════
     5. BURGER
     ══════════════════════════ */
  var burger = $("#burger");
  var mobMenu = $("#mob-menu");
  if (burger && mobMenu) {
    burger.addEventListener("click", function () {
      var o = burger.classList.toggle("open");
      burger.setAttribute("aria-expanded", o);
      mobMenu.classList.toggle("open", o);
      document.body.style.overflow = o ? "hidden" : "";
    });
    $$("a", mobMenu).forEach(function (a) {
      a.addEventListener("click", function () {
        burger.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
        mobMenu.classList.remove("open");
        document.body.style.overflow = "";
      });
    });
  }

  /* ══════════════════════════
     6. SMOOTH ANCHOR
     ══════════════════════════ */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href").slice(1);
      var tgt = document.getElementById(id);
      if (!tgt) return;
      e.preventDefault();
      window.scrollTo({ top: tgt.offsetTop - 70, behavior: "smooth" });
    });
  });

  /* ══════════════════════════
     7. EVENTS — The core feature
     ══════════════════════════ */
  var evList = $("#ev-list");
  var evData = [];
  var curFilter = "all";

  var MONTHS_SHORT = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  var WDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

  function parseDate(str) { return new Date(str + "T12:00:00"); }

  function fmtFull(str) {
    var d = parseDate(str);
    return d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  function renderEvents(filter) {
    if (!evList) return;
    var now = new Date().toISOString().slice(0, 10);
    var list = evData.filter(function (ev) {
      if (ev.date < now) return false;
      return filter === "all" || ev.category === filter;
    });
    evList.innerHTML = "";
    if (!list.length) {
      evList.innerHTML = '<p style="color:var(--mut);text-align:center;padding:2rem">Keine Termine in dieser Kategorie.</p>';
      return;
    }
    list.forEach(function (ev) {
      var d = parseDate(ev.date);
      var el = document.createElement("a");
      el.className = "ev-item";
      el.setAttribute("data-h", "");
      if (ev.url) { el.href = ev.url; el.target = "_blank"; el.rel = "noopener"; }

      var catCls = "cat-" + ev.category;
      var catLbl = ev.category === "konzert" ? "Konzert" : ev.category === "milonga" ? "Milonga" : "DJ-Set";

      el.innerHTML =
        '<div class="ev-item-date">' +
          '<span class="ev-item-day">' + d.getDate() + '</span>' +
          '<span class="ev-item-month">' + MONTHS_SHORT[d.getMonth()] + '</span>' +
          '<span class="ev-item-wday">' + WDAYS[d.getDay()] + '</span>' +
        '</div>' +
        '<div class="ev-item-body">' +
          '<div class="ev-item-title">' + ev.title + '</div>' +
          '<div class="ev-item-venue">' + (ev.venue ? ev.venue + " · " : "") + ev.city + '</div>' +
          '<span class="ev-item-cat ' + catCls + '">' + catLbl + '</span>' +
        '</div>';
      evList.appendChild(el);
    });
  }

  /* Hero: next event teaser */
  function showNextEvent() {
    var heroNext = $("#hero-next-event");
    if (!heroNext || !evData.length) return;
    var now = new Date().toISOString().slice(0, 10);
    var next = evData.find(function (ev) { return ev.date >= now; });
    if (next) {
      heroNext.textContent = fmtFull(next.date) + " — " + next.title;
    } else {
      heroNext.textContent = "Keine anstehenden Termine.";
    }
  }

  if (evList) {
    fetch(evList.getAttribute("data-src"))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        evData = d;
        renderEvents(curFilter);
        showNextEvent();
        showNextMilonga();
      })
      .catch(function () {
        evList.innerHTML = '<p style="color:var(--mut)">Fehler beim Laden.</p>';
      });
  }

  $$(".ev-tab").forEach(function (btn) {
    btn.addEventListener("click", function () {
      $$(".ev-tab").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      curFilter = btn.getAttribute("data-filter");
      renderEvents(curFilter);
    });
  });

  /* ══════════════════════════
     8. MILONGA — Next date + Countdown
     ══════════════════════════ */
  var miloDates = [
    "2026-01-15", "2026-02-19", "2026-03-19",
    "2026-04-16", "2026-05-21", "2026-06-18", "2026-07-16"
  ];

  function showNextMilonga() {
    var mnDate = $("#mn-date");
    var mnCountdown = $("#mn-countdown");
    if (!mnDate) return;

    var now = new Date();
    var today = now.toISOString().slice(0, 10);
    var nextDate = miloDates.find(function (d) { return d >= today; });

    if (!nextDate) {
      mnDate.textContent = "Nächste Saison wird angekündigt";
      return;
    }

    var d = parseDate(nextDate);
    mnDate.textContent = d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });

    // Countdown
    var diff = d.getTime() - now.getTime();
    var days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days === 0) {
      mnCountdown.textContent = "Heute!";
      mnCountdown.style.color = "var(--acc)";
    } else if (days === 1) {
      mnCountdown.textContent = "Morgen!";
    } else if (days > 0) {
      mnCountdown.textContent = "In " + days + " Tagen";
    }

    // Highlight in date list
    var dateSpans = $$(".milo-dates span");
    dateSpans.forEach(function (span) {
      // Compare text content: "Do, 19. Mär" etc.
      var dd = d.getDate();
      var shortMonth = MONTHS_SHORT[d.getMonth()];
      if (span.textContent.indexOf(dd + ". " + shortMonth) !== -1) {
        span.classList.add("next");
      }
    });
  }

  /* ══════════════════════════
     9. MAGNETIC CTAs
     ══════════════════════════ */
  $$(".cta").forEach(function (btn) {
    btn.addEventListener("mousemove", function (e) {
      var r = btn.getBoundingClientRect();
      var x = e.clientX - r.left - r.width / 2;
      var y = e.clientY - r.top - r.height / 2;
      btn.style.transform = "translate(" + (x * 0.1) + "px," + (y * 0.1) + "px)";
    });
    btn.addEventListener("mouseleave", function () {
      btn.style.transform = "";
    });
  });

  /* ══════════════════════════
     10. ENSEMBLE CARD TILT
     ══════════════════════════ */
  $$(".ens").forEach(function (card) {
    card.addEventListener("mousemove", function (e) {
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5;
      var y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = "translateY(-3px) perspective(700px) rotateX(" + (-y * 3) + "deg) rotateY(" + (x * 3) + "deg)";
    });
    card.addEventListener("mouseleave", function () { card.style.transform = ""; });
  });

  /* ══════════════════════════
     11. BOOKING CARD GLOW
     ══════════════════════════ */
  $$(".book-card").forEach(function (card) {
    card.addEventListener("mousemove", function (e) {
      var r = card.getBoundingClientRect();
      var x = e.clientX - r.left;
      var y = e.clientY - r.top;
      card.style.boxShadow = "0 20px 50px rgba(0,0,0,.08), inset 0 0 120px rgba(196,90,60," + (0.03) + ")";
    });
    card.addEventListener("mouseleave", function () { card.style.boxShadow = ""; });
  });

  /* ══════════════════════════
     12. YEAR
     ══════════════════════════ */
  var yr = $("#yr");
  if (yr) yr.textContent = new Date().getFullYear();

  /* INIT */
  onScroll();

})();
