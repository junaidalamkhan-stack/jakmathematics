/* Teaching site for Dr. Junaid Alam Khan.
   All content lives in content/site.json and content/courses.json.
   This file only renders it; you should not need to edit it to add courses or lectures. */
(function () {
  "use strict";

  var PDFJS_VERSION = "3.11.174";
  var PDFJS_BASE = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/" + PDFJS_VERSION + "/";
  var NEW_DAYS = 14;

  var S = null;            // site.json
  var COURSES = [];        // all courses
  var ITEMS = [];          // flattened lectures (for latest + search)
  var state = { route: "", courseFilter: {} };

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  }
  function parseDate(d) { if (!d) return null; var t = new Date(d + (d.length === 10 ? "T00:00:00" : "")); return isNaN(t) ? null : t; }
  function fmtDate(d) {
    var t = parseDate(d); if (!t) return "";
    return t.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  function isNew(d) { var t = parseDate(d); return t && (Date.now() - t.getTime()) / 864e5 <= NEW_DAYS && Date.now() >= t.getTime() - 864e5; }
  function pad(n) { return n < 10 ? "0" + n : String(n); }
  function toast(msg) {
    var t = $("#toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, 2200);
  }

  /* ---------------- Icons ---------------- */
  var GLYPHS = {
    matrix: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 8H8v32h4M36 8h4v32h-4"/><g fill="currentColor" stroke="none"><circle cx="17" cy="16" r="2"/><circle cx="24" cy="16" r="2"/><circle cx="31" cy="16" r="2"/><circle cx="17" cy="24" r="2"/><circle cx="24" cy="24" r="2"/><circle cx="31" cy="24" r="2"/><circle cx="17" cy="32" r="2"/><circle cx="24" cy="32" r="2"/><circle cx="31" cy="32" r="2"/></g><path d="M14 13l20 22" stroke-opacity=".35"/></svg>',
    graph: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 34 22 12l16 8-6 18zM22 12l10 26M10 34l28-14"/><g fill="currentColor" stroke="none"><circle cx="10" cy="34" r="3.5"/><circle cx="22" cy="12" r="3.5"/><circle cx="38" cy="20" r="3.5"/><circle cx="32" cy="38" r="3.5"/></g></svg>',
    integral: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M30 7c-4-1-7 1-7.5 6l-2.5 22c-.5 5-3.5 7-7.5 6"/><path d="M28 30c3-8 6-12 12-12" stroke-opacity=".45"/><path d="M28 34h14" stroke-opacity=".45"/></svg>',
    group: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 7 39 16v16L24 41 9 32V16z"/><path d="M24 7v34M9 16l30 16M39 16 9 32" stroke-opacity=".35"/><path d="M33 9.5c3 1.5 5 3.5 6.5 6.5l1.5-3.5"/></svg>',
    topology: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><ellipse cx="24" cy="24" rx="17" ry="10"/><path d="M15 23c5 4 13 4 18 0M17 25c4-3 10-3 14 0"/></svg>',
    curve: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M40 8C30 12 20 20 12 24 20 28 30 36 40 40"/><path d="M6 24h36" stroke-opacity=".35"/><circle cx="12" cy="24" r="2.5" fill="currentColor" stroke="none"/></svg>',
    school: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 40 40 40 8 8z"/><path d="M14 40v-4M20 40v-4M26 40v-4M32 40v-4M8 34h4M8 28h4M8 22h4" stroke-opacity=".5"/><path d="M15 33h9L15 24z" stroke-opacity=".5"/></svg>',
    factor: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="20" height="20"/><rect x="28" y="8" width="12" height="20" stroke-opacity=".55"/><rect x="8" y="28" width="20" height="12" stroke-opacity=".55"/><rect x="28" y="28" width="12" height="12"/></svg>',
    axes: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 40h34M8 40V6M4 10l4-4 4 4M38 36l4 4-4 4" stroke-opacity=".55"/><path d="M12 34 40 12"/><circle cx="18" cy="29.3" r="2.5" fill="currentColor" stroke="none"/><circle cx="32" cy="18.3" r="2.5" fill="currentColor" stroke="none"/></svg>',
    arrow: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 12h20M29 8l4 4-4 4M12 15v18M8 29l4 4 4-4M36 15v18M32 29l4 4 4-4M15 36h18M29 32l4 4-4 4"/></svg>'
  };
  function glyph(name) { return GLYPHS[name] || GLYPHS.matrix; }
  var I = {
    github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>',
    scholar: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 1 9l11 6 9-4.91V17h2V9L12 3zm-6.5 9.6V16c0 1.66 2.91 3 6.5 3s6.5-1.34 6.5-3v-3.4L12 16.2l-6.5-3.6z"/></svg>',
    researchgate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="2.5" width="19" height="19" rx="3"/><text x="12" y="16.2" text-anchor="middle" font-family="Georgia, serif" font-size="10" font-weight="700" fill="currentColor" stroke="none">RG</text></svg>',
    ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>',
    medal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="15" r="6"/><path d="M8.5 10 6 3h4l2 5 2-5h4l-2.5 7"/><path d="m12 12 .9 1.9 2.1.3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1-1.5-1.4 2.1-.3z" fill="currentColor" stroke="none"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg>'
  };

  var TYPE_LABEL = { lecture: "Lecture", slides: "Slides", notes: "Notes", problems: "Problem set", solutions: "Solutions", other: "Resource" };

  /* ---------------- Data ---------------- */
  function loadJSON(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(url + " (" + r.status + ")");
      return r.json();
    });
  }
  function boot() {
    initTheme(); initChrome();
    var inline = window.__SITE_DATA__;
    var p = inline ? Promise.resolve([inline.site, inline.courses])
                   : Promise.all([loadJSON("content/site.json"), loadJSON("content/courses.json")]);
    p.then(function (res) {
      S = res[0]; COURSES = (res[1].courses || []).slice().sort(function (a, b) { return (a.order || 99) - (b.order || 99); });
      buildIndex(); renderFooter(); injectJSONLD();
      window.addEventListener("hashchange", route);
      route();
    }).catch(function (err) {
      $("#main").innerHTML = '<div class="wrap loading-shell"><h2>Course materials could not be loaded</h2><p class="muted" style="margin-top:1rem">' + esc(err.message) +
        '</p><p class="muted">If you opened this file directly from your computer, run a local web server instead (see README.md).</p></div>';
    });
  }
  function active() { return COURSES.filter(function (c) { return c.status === "active"; }); }
  function findCourse(id) { for (var i = 0; i < COURSES.length; i++) if (COURSES[i].id === id) return COURSES[i]; return null; }
  function filesOf(lec) {
    var f = [];
    if (lec.lecture) f.push({ type: "lecture", label: "Lecture", url: lec.lecture });
    if (lec.slides) f.push({ type: "slides", label: "Slides", url: lec.slides });
    if (lec.notes) f.push({ type: "notes", label: "Notes", url: lec.notes });
    (lec.extras || []).forEach(function (x) { if (x && x.url) f.push({ type: x.type || "other", label: x.label || TYPE_LABEL[x.type] || "Resource", url: x.url }); });
    return f;
  }
  function buildIndex() {
    ITEMS = [];
    active().forEach(function (c) {
      (c.lectures || []).forEach(function (l) {
        var files = filesOf(l);
        ITEMS.push({ course: c, lec: l, files: files, updated: l.updated || "" });
      });
    });
  }
  function courseStats(c) {
    var lecs = c.lectures || [], avail = 0, files = 0;
    lecs.forEach(function (l) { var f = filesOf(l).length; files += f; if (f || videosOf(l).length) avail++; });
    return { total: lecs.length, available: avail, files: files };
  }
  function lastUpdated() {
    var m = ""; ITEMS.forEach(function (i) { if ((i.files.length || videosOf(i.lec).length) && i.updated > m) m = i.updated; }); return m;
  }
  function yearsTeaching() {
    var start = 2011; (S.appointments || []).forEach(function (a) { var y = parseInt((a.period || "").replace(/.*?(\d{4}).*/, "$1"), 10); if (/Professor/.test(a.role) && y && y < start) start = y; });
    return new Date().getFullYear() - start;
  }

  /* ---------------- Chrome: theme, menu, keyboard ---------------- */
  function initTheme() {
    var saved = store("theme") || "system";
    applyTheme(saved);
    $("#themeBtn").addEventListener("click", function () {
      var cur = store("theme") || document.documentElement.getAttribute("data-theme") || "system";
      var next = cur === "system" ? "light" : cur === "light" ? "dark" : "system";
      store("theme", next); applyTheme(next); toast("Theme: " + next);
    });
  }
  function applyTheme(t) {
    var root = document.documentElement;
    if (t === "system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", t);
    root.setAttribute("data-theme-choice", t);
    $("#themeBtn").innerHTML = t === "light" ? I.sun : t === "dark" ? I.moon : I.auto;
  }
  function initChrome() {
    $("#searchBtn").addEventListener("click", openSearch);
    document.addEventListener("keydown", function (e) {
      var tag = (e.target.tagName || "").toLowerCase();
      var typing = tag === "input" || tag === "textarea" || tag === "select";
      if ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) { e.preventDefault(); openSearch(); }
      if (e.key === "Escape") { if (!$("#viewer").hidden) closeViewer(); else if (!$("#searchOverlay").hidden) closeSearch(); }
    });
    document.addEventListener("click", function (e) {
      var v = e.target.closest("[data-view]");
      if (v) { e.preventDefault(); openViewer(v.getAttribute("data-view"), v.getAttribute("data-title"), v.getAttribute("data-sub")); return; }
      var s = e.target.closest("[data-share]");
      if (s) { e.preventDefault(); copyText(location.href.split("#")[0] + "#" + s.getAttribute("data-share"), "Link copied"); return; }
      var c = e.target.closest("[data-copy]");
      if (c) { e.preventDefault(); copyText(c.getAttribute("data-copy"), "Copied"); }
    });
    initSearch(); initViewer();
  }
  function copyText(text, msg) {
    var done = function () { toast(msg); };
    try {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    } catch (e) { fallbackCopy(text); done(); }
  }
  function fallbackCopy(text) {
    var ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (e) {} ta.remove();
  }

  /* ---------------- Router ---------------- */
  function route() {
    var h = (location.hash || "#home").slice(1) || "home";
    if (h === "main") return;
    var view = h, focusLecture = null, m;
    if ((m = /^lecture-(.+)-(\d+)$/.exec(h))) {
      view = "course-" + m[1]; focusLecture = parseInt(m[2], 10);
      var cu = findCourse(m[1]);
      if (cu && (cu.units || []).length) {
        var lec = (cu.lectures || []).filter(function (l) { return l.number === focusLecture; })[0];
        var ui = lec ? unitIndex(cu, lec.topic) : -1;
        if (ui >= 0) view = "unit-" + cu.id + "-" + (ui + 1);
      }
    }
    var navKey = (view.indexOf("course-") === 0 || view.indexOf("unit-") === 0) ? "courses" : view;
    $$("#nav a").forEach(function (a) { if (a.getAttribute("data-route") === navKey) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    var cur = $('#nav a[aria-current="page"]'), nav = $("#nav");
    if (cur && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = Math.max(0, cur.offsetLeft - nav.offsetLeft - 24);
    var main = $("#main"), html;
    if (view === "home") html = pageHome();
    else if (view === "courses") html = pageCourses();
    else if (view.indexOf("course-") === 0) html = pageCourse(view.slice(7));
    else if ((m = /^unit-(.+)-(\d+)$/.exec(view))) html = pageUnit(m[1], parseInt(m[2], 10));
    else if (view === "teaching") html = pageTeaching();
    else if (view === "about") html = pageAbout();
    else if (view === "cv") html = pageCV();
    else if (view === "research") html = pageResearch();
    else if (view === "developer") html = pageDeveloper();
    else if (view === "contact") html = pageContact();
    else html = pageNotFound();
    var changed = state.route !== view;
    state.route = view;
    main.innerHTML = html;
    document.title = pageTitle(view);
    if (view === "home") drawMotif();
    if (view.indexOf("course-") === 0 && $("#lecList")) bindCourse(view.slice(7));
    if (view === "research") bindResearch();
    if (view === "developer") loadRepos();
    if (focusLecture != null) {
      var el = document.getElementById("lec-" + focusLecture);
      if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("flash"); }
    } else if (changed) { window.scrollTo(0, 0); }
  }
  function pageTitle(view) {
    var n = S.name, map = { home: "Mathematics Teaching", courses: "Courses", teaching: "Teaching", research: "Research", developer: "Developer", about: "About", cv: "CV", contact: "Contact" };
    if (view.indexOf("course-") === 0) { var c = findCourse(view.slice(7)); return (c ? c.title : "Course") + " · " + n; }
    var um = /^unit-(.+)-(\d+)$/.exec(view);
    if (um) { var cc = findCourse(um[1]), uu = cc && (cc.units || [])[+um[2] - 1]; return (uu ? uu.name : "Unit") + " · " + (cc ? cc.title : "") + " · " + n; }
    return (map[view] || "Not found") + " · " + n;
  }

  /* ---------------- Shared fragments ---------------- */
  function courseCard(c) {
    var st = courseStats(c);
    var count = st.available ? st.available + " of " + st.total + " posted" : "Coming soon";
    return '<a class="course-card" href="#course-' + esc(c.id) + '">' +
      '<span class="glyph" aria-hidden="true">' + glyph(c.icon) + '</span>' +
      '<div><span class="eyebrow">' + esc(c.level) + (c.term ? " · " + esc(c.term) : "") + '</span><h3>' + esc(c.title) + '</h3></div>' +
      '<p>' + esc(c.summary) + '</p>' +
      '<div class="course-meta"><span class="count">' + count + '</span><span class="go">View course →</span></div></a>';
  }
  // Google Drive links: preview in Drive's own viewer, download through Drive.
  function driveId(u) {
    var m = /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{20,})/.exec(u || "");
    return m ? m[1] : "";
  }
  function dlUrl(u) { var id = driveId(u); return id ? "https://drive.google.com/uc?export=download&id=" + id : u; }
  function openUrl(u) { var id = driveId(u); return id ? "https://drive.google.com/file/d/" + id + "/view" : u; }
  function fileButtons(item, compact) {
    var sub = item.course.title + " · Lecture " + item.lec.number;
    var files = compact ? item.files.slice(0, 1) : item.files;
    return files.map(function (f, i) {
      var cls = "btn " + (i === 0 ? "btn-primary" : "btn-ghost") + " btn-sm";
      var label = compact ? "View" : "View " + f.label.toLowerCase();
      var view = (/\.pdf($|\?)/i.test(f.url) || driveId(f.url))
        ? '<button type="button" class="' + cls + '" data-view="' + esc(f.url) + '" data-title="' + esc(item.lec.title + " — " + f.label) + '" data-sub="' + esc(sub) + '">' + I.eye + esc(label) + '</button>'
        : '<a class="' + cls + '" href="' + esc(f.url) + '" target="_blank" rel="noopener">' + I.eye + esc(f.label) + '</a>';
      var dl = compact
        ? '<a class="btn btn-ghost btn-sm" href="' + esc(dlUrl(f.url)) + '" download target="_blank" rel="noopener">' + I.down + 'Download</a>'
        : '<a class="btn btn-ghost btn-sm" href="' + esc(dlUrl(f.url)) + '" download target="_blank" rel="noopener" aria-label="Download ' + esc(f.label) + '" title="Download ' + esc(f.label) + '">' + I.down + '</a>';
      return view + dl;
    }).join("");
  }
  function videosOf(lec) {
    var v = [];
    if (lec.video) v.push({ label: "", url: lec.video });
    (lec.videos || []).forEach(function (x) { if (x && x.url) v.push({ label: x.label || "", url: x.url }); });
    return v;
  }
  function l_video(item) { return item.lec && videosOf(item.lec).length > 0; }
  function materialRow(item, opts) {
    opts = opts || {};
    var l = item.lec, has = item.files.length || !!l_video(item);
    var types = item.files.map(function (f) { return '<span class="chip">' + esc(TYPE_LABEL[f.type] || f.label) + '</span>'; }).join("");
    var sub = [];
    if (opts.showCourse) sub.push('<a href="#course-' + esc(item.course.id) + '">' + esc(item.course.title) + '</a>');
    if (has) sub.push(types);
    var vids = videosOf(l);
    if (vids.length) sub.push('<span class="chip chip-video">' + (vids.length > 1 ? vids.length + " videos" : "Video") + '</span>');
    if (has && l.updated) sub.push('<span class="mono">Updated ' + esc(fmtDate(l.updated)) + '</span>');
    if (has && isNew(l.updated)) sub.push('<span class="chip chip-new">New</span>');
    if (!has) sub.push('<span class="chip">Coming soon</span>');
    var vid = vids.map(function (v) {
      var txt = opts.compact ? (v.label || "Video") : (v.label ? "Watch · " + v.label : "Watch video");
      return '<a class="btn btn-video btn-sm" href="' + esc(v.url) + '" target="_blank" rel="noopener" aria-label="Watch lecture ' + l.number + (v.label ? " in " + esc(v.label) : "") + ' on YouTube">' + I.youtube + esc(txt) + '</a>';
    }).join("");
    var actions = has ? fileButtons(item, opts.compact) + vid + (opts.compact ? "" : '<button type="button" class="icon-btn" data-share="lecture-' + esc(item.course.id) + "-" + l.number + '" aria-label="Copy link to this lecture" title="Copy link">' + I.link + '</button>') : "";
    return '<li class="material' + (has ? "" : " pending") + '"' + (opts.showCourse ? "" : ' id="lec-' + l.number + '"') + '>' +
      '<div class="num">Lecture<b>' + pad(l.unitNumber || l.number) + '</b></div>' +
      '<div style="min-width:0"><h3>' + esc(l.title) + '</h3><div class="sub">' + sub.join("") + '</div>' +
      (l.summary && !opts.showCourse ? '<p class="summary">' + esc(l.summary) + '</p>' : "") + '</div>' +
      '<div class="actions">' + actions + '</div></li>';
  }

  /* ---------------- Pages ---------------- */
  function pageHome() {
    var feat = active().filter(function (c) { return c.featured; });
    var latest = ITEMS.filter(function (i) { return i.files.length && i.course.featured; }).sort(function (a, b) { return a.updated < b.updated ? 1 : a.updated > b.updated ? -1 : b.lec.number - a.lec.number; }).slice(0, 6);
    var teachAwards = (S.awards || []).filter(function (a) { return a.teaching; });
    var covering = COURSES.map(function (c) { return c.coveredBy; });
    var nCourses = cvCourses("Undergraduate").length + cvCourses("Graduate").length;
    var ann = S.announcement && S.announcement.show && S.announcement.text
      ? '<div class="announce"><div class="wrap"><span class="chip chip-accent">Notice</span><span>' + esc(S.announcement.text) + (S.announcement.link ? ' <a href="' + esc(S.announcement.link) + '">See courses</a>' : "") + '</span></div></div>' : "";
    var nameParts = S.name.replace(/^Dr\.\s*/, "");
    return '' +
    '<section class="hero"><canvas id="motif" aria-hidden="true"></canvas><div class="wrap hero-inner">' +
      '<div><p class="eyebrow">' + esc(S.department) + '</p>' +
      '<h1><span class="dr">Dr.</span> ' + esc(nameParts) + '</h1>' +
      '<p class="hero-role"><strong>' + esc(S.title) + '</strong><br>' + esc(S.institution) + '</p>' +
      ((S.aboutMe || []).length ? '<div class="about-me"><h2>About me</h2>' + S.aboutMe.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join("") + '</div>' : '<p class="hero-intro">' + esc(S.heroIntro) + '</p>') +
      '<div class="social" aria-label="Elsewhere">' + socialLinks("social-link") + '</div></div>' +
      '<aside class="hero-card" aria-label="Teaching at a glance">' + (S.photo ? '<div class="hero-id"><img class="portrait" src="' + esc(S.photo) + '" alt="Portrait of ' + esc(S.name) + '" width="250" height="344"><div><strong>' + esc(S.name) + '</strong><span>' + esc(S.title) + '</span><span>' + esc(S.institutionShort || S.institution) + '</span>' + '<a class="cv-link" href="#cv">' + I.eye + 'View CV</a>' + '</div></div>' : "") + '<dl>' +
        '<dt>' + yearsTeaching() + '</dt><dd>years teaching at IBA Karachi</dd>' +
        '<dt>' + nCourses + '</dt><dd>undergraduate and graduate courses taught</dd>' +
        '<dt>' + ITEMS.filter(function (i) { return i.files.length && i.course.featured; }).length + '</dt><dd>lectures with materials online</dd>' +
      '</dl><div class="hero-awards"><p class="eyebrow">Recognition</p><ul>' + (S.awards || []).slice().sort(function (x, y) { return (y.year || "").localeCompare(x.year || "") || (y.teaching ? 1 : 0) - (x.teaching ? 1 : 0); }).map(function (a) { return '<li class="award-line">' + I.medal + '<span><strong>' + esc(a.title) + '</strong>, ' + esc(a.year) + '<br><span class="muted">' + esc(a.body) + '</span></span></li>'; }).join("") + '</ul></div>' +
      '</aside></div></section>' + ann +
    '<section class="section"><div class="wrap"><div class="section-head"><div><h2>' + esc(S.coursesHeading || "Courses") + '</h2><p>' + esc(S.coursesIntro || "") + '</p></div><a class="link-arrow" href="#courses">All courses ' + I.arrow + '</a></div>' +
      '<div class="course-grid course-grid-fit">' + feat.map(courseCard).join("") + '</div></div></section>' +
    '';
  }
  var SOCIAL = [["github", "GitHub"], ["youtube", "YouTube · JAK Mathematics"], ["youtubeUrdu", "YouTube · Ms Khudaija Junaid"], ["linkedin", "LinkedIn"], ["scholar", "Google Scholar"], ["researchgate", "ResearchGate"]];
  function researchProfiles() {
    var L = S.links || {};
    var b = [["scholar", "Google Scholar profile"], ["researchgate", "ResearchGate profile"]].filter(function (x) { return L[x[0]]; });
    return b.length ? '<div class="hero-cta">' + b.map(function (x, i) { return '<a class="btn ' + (i ? "btn-ghost" : "btn-primary") + '" href="' + esc(L[x[0]]) + '" target="_blank" rel="noopener">' + I[x[0]] + x[1] + '</a>'; }).join("") + '</div>' : "";
  }
  function socialLinks(cls) {
    var L = S.links || {};
    return SOCIAL.filter(function (x) { return L[x[0]]; }).map(function (x) {
      return '<a class="' + cls + '" href="' + esc(L[x[0]]) + '" target="_blank" rel="noopener me" aria-label="' + x[1] + '">' + (I[x[0]] || I.youtube) + '<span>' + x[1] + '</span></a>';
    }).join("");
  }
  function awardRow(a) {
    return '<li class="award' + (a.teaching ? " teaching" : "") + '"><span class="yr">' + esc(a.year) + '</span><div><strong>' + esc(a.title) + '</strong><span>' + esc(a.body) + '</span></div></li>';
  }

  function pageCourses() {
    var act = active();
    var levels = ["All"].concat(uniq(act.map(function (c) { return c.level; })));
    var arch = COURSES.filter(function (c) { return c.status !== "active"; });
    return '<section class="page-head"><div class="wrap"><p class="eyebrow">Courses</p><h1>Course materials</h1><p>Choose a course to see its lectures, grouped by topic. Each lecture opens in the viewer and can be downloaded as a PDF.</p></div></section>' +
      '<section class="section"><div class="wrap">' +
      (levels.length > 2 ? '<div class="chips" style="margin-bottom:1.25rem" role="group" aria-label="Filter by level">' + levels.map(function (l, i) { return '<button class="filter-chip" type="button" data-level="' + esc(l) + '" aria-pressed="' + (i === 0) + '">' + esc(l) + '</button>'; }).join("") + '</div>' : "") +
      '<div class="course-grid" id="courseGrid">' + act.map(courseCard).join("") + '</div></div></section>' +
      '<section class="section"><div class="wrap"><div class="section-head"><div><h2>Also taught</h2><p>Other courses I have taught at IBA Karachi. Materials will appear here when a course is next offered.</p></div></div>' +
      catalogList(arch) + '</div></section>';
  }
  function catalogList(list) {
    var groups = {};
    list.forEach(function (c) { (groups[c.level] = groups[c.level] || []).push(c); });
    return Object.keys(groups).map(function (lv) {
      return '<h3 style="margin:1.25rem 0 .5rem">' + esc(lv) + '</h3><ul class="taught">' + groups[lv].map(function (c) {
        var target = c.coveredBy ? findCourse(c.coveredBy) : null;
        return '<li><span>' + esc(c.title) + '</span>' + (target && target.status === "active" ? '<a class="chip chip-accent" href="#course-' + esc(target.id) + '">See ' + esc(target.title) + '</a>' : '<span class="chip">Not this term</span>') + '</li>';
      }).join("") + '</ul>';
    }).join("");
  }
  // Courses as listed on the CV: drops combined pages (e.g. "Calculus") that stand in for others.
  function cvCourses(level) {
    var covering = COURSES.map(function (c) { return c.coveredBy; });
    return COURSES.filter(function (c) { return c.level === level && covering.indexOf(c.id) < 0; });
  }
  function cvName(c) { return c.cvTitle || c.title; }
  function uniq(a) { return a.filter(function (x, i) { return x && a.indexOf(x) === i; }); }

  function pageCourse(id) {
    var c = findCourse(id);
    if (!c) return pageNotFound();
    var st = courseStats(c);
    var topics = uniq((c.lectures || []).map(function (l) { return l.topic || "Lectures"; }));
    var types = uniq([].concat.apply([], (c.lectures || []).map(function (l) { return filesOf(l).map(function (f) { return f.type; }); })));
    var facts = [["Level", c.level], ["Offering", c.term], ["Prerequisites", c.prerequisites], ["Textbook", c.textbook], ["Materials", st.available + " of " + st.total + " lectures posted"]]
      .filter(function (f) { return f[1]; }).map(function (f) { return '<div><span>' + f[0] + '</span><span>' + esc(f[1]) + '</span></div>'; }).join("");
    return '<section class="course-hero"><div class="wrap"><div>' +
      '<nav class="crumbs" aria-label="Breadcrumb"><a href="#courses">Courses</a> / ' + esc(c.title) + '</nav>' +
      '<h1>' + esc(c.title) + '</h1>' + (c.description ? '<p class="lede">' + esc(c.description) + '</p>' : "") +
      (c.status !== "active" ? '<p style="margin-top:1rem"><span class="chip">Not offered this term</span></p>' : "") +
      '<div class="facts">' + facts + '</div>' +
      ((S.links || {}).youtube ? '<p class="unit-actions" style="margin-top:1rem"><a class="btn btn-ghost btn-sm" href="' + esc(S.links.youtube) + '" target="_blank" rel="noopener">' + I.youtube + 'JAK Mathematics on YouTube</a>' + (S.links.youtubeUrdu && (c.lectures || []).some(function (l) { return videosOf(l).some(function (v) { return v.label === "Urdu/Hindi"; }); }) ? '<a class="btn btn-ghost btn-sm" href="' + esc(S.links.youtubeUrdu) + '" target="_blank" rel="noopener">' + I.youtube + 'Ms Khudaija Junaid on YouTube (Urdu/Hindi)</a>' : "") + '</p>' : "") +
      '</div><span class="glyph" aria-hidden="true">' + glyph(c.icon) + '</span></div></section>' +
      ((c.units || []).length ? unitGrid(c) :
      '<section class="section" style="padding-top:2rem"><div class="wrap">' +
      '<div class="toolbar"><div class="field">' + I.search + '<label class="sr-only" for="lecFilter">Filter lectures</label><input class="input" id="lecFilter" type="search" placeholder="Filter lectures in ' + esc(c.title) + '…"></div>' +
      (types.length > 1 ? '<div class="chips" role="group" aria-label="Material type"><button class="filter-chip" type="button" data-type="all" aria-pressed="true">All</button>' + types.map(function (t) { return '<button class="filter-chip" type="button" data-type="' + esc(t) + '" aria-pressed="false">' + esc(TYPE_LABEL[t] || t) + '</button>'; }).join("") + '</div>' : "") +
      (topics.length > 1 ? '<label class="sr-only" for="topicSel">Topic</label><select class="select" id="topicSel"><option value="">All topics</option>' + topics.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join("") + '</select>' : "") +
      '<label style="display:flex;gap:.4rem;align-items:center;font-size:.875rem;color:var(--muted)"><input type="checkbox" id="availOnly"> Posted only</label>' +
      '</div><div id="lecList"></div></div></section>');
  }
  function unitIndex(c, name) {
    var u = c.units || [];
    for (var i = 0; i < u.length; i++) if (u[i].name === name) return i;
    return -1;
  }
  function unitLectures(c, u) {
    return (c.lectures || []).filter(function (l) { return (l.topic || "") === u.name; }).sort(function (a, b) { return a.number - b.number; });
  }
  // Units shown as compact cards, like the course cards; each opens its own page.
  function unitGrid(c) {
    return '<section class="section" style="padding-top:2rem"><div class="wrap"><div class="section-head"><div><h2>Units</h2><p>Open a unit for its booklet and video lectures.</p></div></div>' +
      '<div class="course-grid course-grid-fit">' + c.units.map(function (u, i) {
        var lecs = unitLectures(c, u), nv = 0, langs = [];
        lecs.forEach(function (l) { videosOf(l).forEach(function (v) { nv++; if (v.label && langs.indexOf(v.label) < 0) langs.push(v.label); }); });
        var meta = [u.booklet ? "Booklet" : "", lecs.length + (lecs.length === 1 ? " lecture" : " lectures"), langs.join(" & ")].filter(Boolean).join(" · ");
        return '<a class="course-card" href="#unit-' + esc(c.id) + '-' + (i + 1) + '">' +
          '<span class="glyph" aria-hidden="true">' + glyph(u.icon) + '</span>' +
          '<div><span class="eyebrow">Unit ' + (i + 1) + '</span><h3>' + esc(u.name) + '</h3></div>' +
          '<p>' + esc(u.summary || "") + '</p>' +
          '<div class="course-meta"><span class="count">' + esc(meta) + '</span><span class="go">Open unit →</span></div></a>';
      }).join("") + '</div></div></section>';
  }
  function pageUnit(cid, n) {
    var c = findCourse(cid), u = c && (c.units || [])[n - 1];
    if (!u) return pageNotFound();
    var lecs = unitLectures(c, u), total = c.units.length;
    var nav = '<div class="unit-nav">' +
      (n > 1 ? '<a class="btn btn-ghost btn-sm" href="#unit-' + esc(c.id) + '-' + (n - 1) + '">← ' + esc(c.units[n - 2].name) + '</a>' : '<span></span>') +
      (n < total ? '<a class="btn btn-ghost btn-sm" href="#unit-' + esc(c.id) + '-' + (n + 1) + '">' + esc(c.units[n].name) + ' →</a>' : '<span></span>') + '</div>';
    return '<section class="course-hero"><div class="wrap"><div>' +
      '<nav class="crumbs" aria-label="Breadcrumb"><a href="#courses">Courses</a> / <a href="#course-' + esc(c.id) + '">' + esc(c.title) + '</a> / ' + esc(u.name) + '</nav>' +
      '<p class="eyebrow">Unit ' + n + ' of ' + total + '</p><h1>' + esc(u.name) + '</h1>' + (u.summary ? '<p class="lede">' + esc(u.summary) + '</p>' : "") +
      '</div><span class="glyph" aria-hidden="true">' + glyph(u.icon) + '</span></div></section>' +
      '<section class="section" style="padding-top:2rem"><div class="wrap">' + unitBar(c, u.name, true) +
      '<ul class="material-list">' + lecs.map(function (l) { return materialRow({ course: c, lec: l, files: filesOf(l) }); }).join("") + '</ul>' + nav +
      '</div></section>';
  }
  // Unit-level resources: a booklet PDF and YouTube playlists shown above the unit's lectures.
  function unitBar(c, name, hideSummary) {
    var u = (c.units || []).filter(function (x) { return x.name === name; })[0];
    if (!u) return "";
    var b = "";
    if (u.booklet) {
      b += '<button type="button" class="btn btn-primary btn-sm" data-view="' + esc(u.booklet) + '" data-title="' + esc(name + " — Booklet") + '" data-sub="' + esc(c.title) + '">' + I.eye + 'View booklet</button>' +
        '<a class="btn btn-ghost btn-sm" href="' + esc(dlUrl(u.booklet)) + '" download target="_blank" rel="noopener">' + I.down + 'Download booklet</a>';
    }
    (u.playlists || []).forEach(function (pl) {
      if (pl && pl.url) b += '<a class="btn btn-video btn-sm" href="' + esc(pl.url) + '" target="_blank" rel="noopener">' + I.youtube + 'Playlist' + (pl.label ? " · " + esc(pl.label) : "") + '</a>';
    });
    return '<div class="unit-bar">' + (u.summary && !hideSummary ? '<p>' + esc(u.summary) + '</p>' : "") + (b ? '<div class="unit-actions">' + b + '</div>' : "") + '</div>';
  }
  function bindCourse(id) {
    var c = findCourse(id); if (!c) return;
    var f = state.courseFilter[id] || (state.courseFilter[id] = { q: "", type: "all", topic: "", avail: false });
    var q = $("#lecFilter"), sel = $("#topicSel"), av = $("#availOnly");
    q.value = f.q; if (sel) sel.value = f.topic; av.checked = f.avail;
    $$("[data-type]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-type") === f.type)); });
    function draw() {
      var ql = f.q.trim().toLowerCase();
      var items = (c.lectures || []).map(function (l) { return { course: c, lec: l, files: filesOf(l) }; }).filter(function (it) {
        if (f.avail && !it.files.length && !videosOf(it.lec).length) return false;
        if (f.topic && (it.lec.topic || "Lectures") !== f.topic) return false;
        if (f.type !== "all" && !it.files.some(function (x) { return x.type === f.type; })) return false;
        if (ql) { var hay = [it.lec.title, it.lec.topic, it.lec.summary, "lecture " + it.lec.number].join(" ").toLowerCase(); if (hay.indexOf(ql) < 0) return false; }
        return true;
      }).map(function (it) { if (f.type !== "all") it.files = it.files.filter(function (x) { return x.type === f.type; }); return it; })
        .sort(function (a, b) { return a.lec.number - b.lec.number; });
      var groups = [], gmap = {};
      items.forEach(function (it) { var t = it.lec.topic || "Lectures"; if (!gmap[t]) { gmap[t] = []; groups.push(t); } gmap[t].push(it); });
      $("#lecList").innerHTML = items.length ? groups.map(function (t) {
        return '<div class="topic-group"><h2>' + esc(t) + ' <span class="count">' + gmap[t].length + (gmap[t].length === 1 ? " lecture" : " lectures") + '</span></h2>' + unitBar(c, t) + '<ul class="material-list">' + gmap[t].map(function (it) { return materialRow(it); }).join("") + '</ul></div>';
      }).join("") : '<div class="empty">No lectures match these filters. <button class="btn btn-ghost btn-sm" type="button" id="clearFilters">Clear filters</button></div>';
      var cl = $("#clearFilters");
      if (cl) cl.addEventListener("click", function () { f.q = ""; f.type = "all"; f.topic = ""; f.avail = false; bindCourse(id); });
    }
    q.addEventListener("input", function () { f.q = q.value; draw(); });
    if (sel) sel.addEventListener("change", function () { f.topic = sel.value; draw(); });
    av.addEventListener("change", function () { f.avail = av.checked; draw(); });
    $$("[data-type]").forEach(function (b) {
      b.addEventListener("click", function () { f.type = b.getAttribute("data-type"); $$("[data-type]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); draw(); });
    });
    draw();
  }

  function pageTeaching() {
    var sv = S.supervision || {};
    var ug = cvCourses("Undergraduate"), gr = cvCourses("Graduate");
    function tlist(list) {
      return '<ul class="taught">' + list.map(function (c) {
        var target = c.status === "active" ? c : (c.coveredBy ? findCourse(c.coveredBy) : null);
        return '<li>' + (target && target.status === "active" ? '<a href="#course-' + esc(target.id) + '">' + esc(cvName(c)) + '</a><span class="chip chip-accent">Materials</span>' : '<span>' + esc(cvName(c)) + '</span>') + '</li>';
      }).join("") + '</ul>';
    }
    var syms = ["∀", "⇒", "∴"];
    return '<section class="page-head"><div class="wrap"><p class="eyebrow">Teaching</p><h1>Teaching</h1><p>' + esc(S.teachingSummary) + '</p></div></section>' +
      '<section class="section"><div class="wrap"><h2 style="margin-bottom:1.25rem">How the courses are taught</h2><div class="approach">' +
      (S.teachingApproach || []).map(function (a, i) { return '<div class="panel"><span class="sym" aria-hidden="true">' + syms[i % 3] + '</span><h3>' + esc(a.title) + '</h3><p>' + esc(a.text) + '</p></div>'; }).join("") +
      '</div></div></section>' +
      '<section class="section"><div class="wrap"><div class="section-head"><div><h2>Courses taught</h2><p>Courses marked “Materials” have a course page with lecture slides and notes.</p></div></div>' +
      '<div class="two-col"><div><h3 style="margin-bottom:.5rem">Undergraduate</h3>' + tlist(ug) + '</div><div><h3 style="margin-bottom:.5rem">Graduate</h3>' + tlist(gr) + '</div></div></div></section>' +
      '<section class="section"><div class="wrap"><div><h2>Recognition for teaching</h2><ul class="awards" style="margin-top:1rem">' + (S.awards || []).filter(function (a) { return a.teaching; }).map(awardRow).join("") + '</ul>' +
      '<h2 style="margin-top:2.5rem">Tools used in teaching</h2><ul class="plain-list" style="margin-top:.75rem">' + (S.technologies || []).map(function (t) { return '<li><span><span class="pub-title">' + esc(t.name) + '</span><br><span class="muted">' + esc(t.text) + '</span></span><span></span></li>'; }).join("") + '</ul></div>' +
      '</div></section>';
  }

  function timeline(list, roleKey, placeKey) {
    return '<ul class="timeline">' + list.map(function (e) {
      return '<li><span class="when">' + esc(e.period) + '</span><div><strong>' + esc(e[roleKey]) + '</strong>' + (e[placeKey] ? '<span class="where">' + esc(e[placeKey]) + '</span>' : "") +
        ((e.details || []).length ? '<ul>' + e.details.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join("") + '</ul>' : "") + '</div></li>';
    }).join("") + '</ul>';
  }
  function pageAbout() {
    var phd = (S.education || [])[0] || {};
    var r = S.research || {};
    return '<section class="page-head"><div class="wrap about-head">' + (S.photo ? '<img class="portrait portrait-lg" src="' + esc(S.photo) + '" alt="Portrait of ' + esc(S.name) + '" width="250" height="344">' : "") + '<div><p class="eyebrow">About</p><h1>' + esc(S.name) + '</h1><p>' + esc(S.title) + ', ' + esc(S.department) + ', ' + esc(S.institution) + '.</p></div></div></section>' +
      '<section class="section"><div class="wrap two-col"><div class="prose">' +
      (S.bio || []).map(function (p, i) { return '<p' + (i === 0 ? ' class="lead"' : "") + '>' + esc(p) + '</p>'; }).join("") +
      '<p class="muted" style="font-size:.9375rem"><strong style="color:var(--ink)">Research, briefly.</strong> ' + esc(r.summary || "") + ' <a href="#research">Research interests and papers</a> · <a href="#developer">Software</a></p>' +
      '</div><div><h2 style="font-size:1.5rem">Education</h2>' + timeline(S.education || [], "degree", "institution") +
      '<h2 style="font-size:1.5rem;margin-top:2rem">Academic appointments</h2>' + timeline(S.appointments || [], "role", "institution") + '</div></div></section>' +
      '<section class="section"><div class="wrap"><h2 style="margin-bottom:1rem">Academic leadership</h2>' + timeline(S.leadership || [], "role", "institution") + '</div></section>';
  }

  function pageCV() {
    var r = S.research || {};
    var sec = function (title, body) { return '<div class="cv-section"><h2>' + title + '</h2>' + body + '</div>'; };
    var pubs = (r.publications || []).map(function (p) {
      return '<li><span><span class="pub-title">' + esc(p.title) + '</span><br><span class="muted">' + esc(p.authors) + '. <em>' + esc(p.venue) + '</em>' +
        (p.doi ? ' · <a href="https://doi.org/' + esc(p.doi) + '" target="_blank" rel="noopener">doi:' + esc(p.doi) + '</a>' : "") + '</span></span><span class="yr">' + esc(p.year) + '</span></li>';
    }).join("");
    return '<section class="page-head"><div class="wrap"><p class="eyebrow">Curriculum vitae</p><h1>Curriculum Vitae</h1><p>' + (S.cvPdf ? 'A web summary of the CV. The complete document is available as a PDF.' : 'Education, appointments, awards and service.') + '</p>' +
      '<div class="hero-cta">' + (S.cvPdf ? '<button class="btn btn-primary" type="button" data-view="' + esc(S.cvPdf) + '" data-title="Curriculum Vitae" data-sub="' + esc(S.name) + '">' + I.eye + 'View PDF</button><a class="btn btn-ghost" href="' + esc(S.cvPdf) + '" download>' + I.down + 'Download PDF</a>' : "") + '</div></div></section>' +
      '<section class="section" style="padding-top:1rem"><div class="wrap">' +
      sec("Education", timeline(S.education || [], "degree", "institution")) +
      sec("Academic experience", timeline(S.appointments || [], "role", "institution")) +
      sec("Administrative experience", timeline(S.leadership || [], "role", "institution")) +
      sec("Awards and honours", '<ul class="awards" style="margin-top:.5rem">' + (S.awards || []).map(awardRow).join("") + '</ul>') +
      sec("Courses taught", '<div class="two-col" style="margin-top:.75rem"><div><h3 style="margin-bottom:.4rem">Undergraduate</h3><ul class="taught">' + cvCourses("Undergraduate").map(function (c) { return '<li>' + esc(cvName(c)) + '</li>'; }).join("") + '</ul></div><div><h3 style="margin-bottom:.4rem">Graduate</h3><ul class="taught">' + cvCourses("Graduate").map(function (c) { return '<li>' + esc(cvName(c)) + '</li>'; }).join("") + '</ul></div></div>') +
      sec("Institutional service", timeline(S.service || [], "role", "")) +
      sec("Software", '<ul class="plain-list" style="margin-top:.5rem">' + (r.software || []).map(function (x) { return '<li><span><span class="pub-title">' + esc(x.name) + ' · ' + esc(x.title) + '</span><br><span class="muted">' + esc(x.authors) + '. ' + esc(x.availability) + '</span></span><span></span></li>'; }).join("") + '</ul><p style="margin-top:.75rem"><a class="link-arrow" href="#developer">Details and links ' + I.arrow + '</a></p>') +
      sec("Research publications", '<p class="muted" style="margin-top:.75rem">' + (r.publications || []).length + ' journal articles, ' + esc(yearsSpan(r.publications)) + '. <a href="#research">See the full list on the Research page</a>.</p>') +
      '</div></section>';
  }

  function yearsSpan(pubs) {
    var ys = (pubs || []).map(function (p) { return parseInt(p.year, 10); }).filter(Boolean);
    return ys.length ? Math.min.apply(null, ys) + "–" + Math.max.apply(null, ys) : "";
  }
  function pubLink(p) {
    var u = p.doi ? "https://doi.org/" + p.doi : p.url;
    if (!u) return "";
    return ' · <a href="' + esc(u) + '" target="_blank" rel="noopener">' + (p.doi ? "doi:" + esc(p.doi) : "Article page") + '</a>';
  }

  /* Research: interests + filterable publication list */
  function thesisList(list) {
    return '<ul class="plain-list">' + list.map(function (x) { return '<li><span><span class="pub-title">' + esc(x.title) + '</span><br><span class="muted">' + esc(x.student) + '</span></span><span class="yr">' + esc(x.year) + '</span></li>'; }).join("") + '</ul>';
  }
  function supervisionSection() {
    var sv = S.supervision || {};
    var groups = [["Ph.D. theses", sv.phd || []], ["Master’s theses", sv.masters || []], ["Final-year projects", sv.undergraduate || []]];
    return '<section class="section"><div class="wrap"><div class="section-head"><div><h2>Supervision</h2><p>Research students I have supervised at IBA Karachi.</p></div></div>' +
      '<div class="stat-row">' + groups.map(function (g) { return '<div><b>' + g[1].length + '</b><span>' + g[0] + '</span></div>'; }).join("") + '</div>' +
      groups.map(function (g, i) { return g[1].length ? '<details class="fold"' + (i === 0 ? " open" : "") + '><summary>' + g[0] + ' (' + g[1].length + ')</summary><div class="fold-body">' + thesisList(g[1]) + '</div></details>' : ""; }).join("") +
      '</div></section>';
  }
  function pageResearch() {
    var r = S.research || {}, pubs = r.publications || [];
    var years = uniq(pubs.map(function (p) { return p.year; }));
    return '<section class="page-head"><div class="wrap"><p class="eyebrow">Research</p><h1>Research</h1><p>' + esc(r.summary || "") + '</p>' +
      '<div class="stat-row"><div><b>' + pubs.length + '</b><span>journal articles</span></div><div><b>' + (r.software || []).length + '</b><span>SINGULAR libraries</span></div><div><b>' + ((S.supervision || {}).phd || []).length + '</b><span>Ph.D. theses supervised</span></div></div>' + researchProfiles() + '</div></section>' +
      '<section class="section"><div class="wrap"><h2 style="margin-bottom:1.25rem">Research interests</h2><div class="approach">' +
      (r.interests || []).map(function (x) { return '<div class="panel"><h3>' + esc(x.title) + '</h3><p>' + esc(x.text) + '</p></div>'; }).join("") +
      '</div></div></section>' +
      '<section class="section"><div class="wrap"><div class="section-head"><div><h2>Research papers</h2><p>' + pubs.length + ' journal articles, ' + esc(yearsSpan(pubs)) + '. Links open the published version.</p></div></div>' +
      '<div class="toolbar"><div class="field">' + I.search + '<label class="sr-only" for="pubFilter">Filter papers</label><input class="input" id="pubFilter" type="search" placeholder="Filter by title, co-author or journal…"></div>' +
      '<label class="sr-only" for="pubYear">Year</label><select class="select" id="pubYear"><option value="">All years</option>' + years.map(function (y) { return '<option>' + esc(y) + '</option>'; }).join("") + '</select></div>' +
      '<ol class="pubs" id="pubList"></ol></div></section>' +
      '<section class="section"><div class="wrap"><div><h2>Software</h2><p class="muted" style="margin-top:.5rem">Algorithms from these papers are implemented as SINGULAR libraries.</p><p style="margin-top:1rem"><a class="btn btn-primary" href="#developer">Libraries and code ' + I.arrow + '</a></p></div>' +
      '</div></section>' + supervisionSection();
  }
  function bindResearch() {
    var pubs = (S.research || {}).publications || [], q = $("#pubFilter"), y = $("#pubYear");
    function draw() {
      var ql = q.value.trim().toLowerCase(), yv = y.value;
      var list = pubs.filter(function (p) {
        if (yv && p.year !== yv) return false;
        return !ql || [p.title, p.authors, p.venue, p.year].join(" ").toLowerCase().indexOf(ql) >= 0;
      });
      $("#pubList").innerHTML = list.length ? list.map(function (p) {
        return '<li><span class="yr">' + esc(p.year) + '</span><div><span class="pub-title">' + esc(p.title) + '</span><br><span class="muted">' + esc(p.authors) + '. <em>' + esc(p.venue) + '</em>' + pubLink(p) + '</span></div></li>';
      }).join("") : '<li class="empty" style="display:block">No papers match. Try another word or year.</li>';
    }
    q.addEventListener("input", draw); y.addEventListener("change", draw); draw();
  }

  /* Developer: SINGULAR libraries, GitHub repositories, links */
  function pageDeveloper() {
    var r = S.research || {}, L = S.links || {};
    var lib = function (x) {
      var actions = (x.repo ? '<a class="btn btn-primary btn-sm" href="' + esc(x.repo) + '" target="_blank" rel="noopener">' + I.github + 'Repository</a>' : "") +
        (x.url ? '<a class="btn btn-ghost btn-sm" href="' + esc(x.url) + '" target="_blank" rel="noopener">' + I.ext + 'SINGULAR manual</a>' : "");
      return '<article class="lib"><div class="lib-head"><code class="lib-name">' + esc(x.name) + '</code><span class="chip' + (x.repo ? "" : " chip-accent") + '">' + esc(x.availability) + '</span></div>' +
        '<h3>' + esc(x.title) + '</h3><p class="muted lib-plat">' + esc(x.platform) + ' · ' + esc(x.authors) + '</p><p>' + esc(x.text) + '</p>' +
        (actions ? '<div class="lib-actions">' + actions + '</div>' : "") + '</article>';
    };
    var std = (r.software || []).filter(function (x) { return !x.repo; }), gh = (r.software || []).filter(function (x) { return x.repo; });
    return '<section class="page-head"><div class="wrap"><p class="eyebrow">Developer</p><h1>Software &amp; code</h1><p>Libraries for the computer algebra system SINGULAR, written with my students and collaborators. Two ship with SINGULAR; the newer ones are open source on GitHub under GPL-3.0.</p>' +
      '<div class="hero-cta">' + (L.github ? '<a class="btn btn-primary" href="' + esc(L.github) + '" target="_blank" rel="noopener">' + I.github + 'GitHub profile</a>' : "") + '<a class="btn btn-ghost" href="https://www.singular.uni-kl.de/" target="_blank" rel="noopener">' + I.ext + 'SINGULAR website</a></div></div></section>' +
      '<section class="section"><div class="wrap"><div class="section-head"><div><h2>In the SINGULAR standard library</h2><p>Distributed with every SINGULAR installation. Load with <code>LIB "sagbigrob.lib";</code> and see the manual section shown.</p></div></div><div class="lib-grid">' + std.map(lib).join("") + '</div></div></section>' +
      '<section class="section"><div class="wrap"><div class="section-head"><div><h2>On GitHub</h2><p>Libraries for SINGULAR and SINGULAR:PLURAL (non-commutative G-algebras), with examples and tests.</p></div>' + (L.github ? '<a class="link-arrow" href="' + esc(L.github) + '" target="_blank" rel="noopener">All repositories ' + I.arrow + '</a>' : "") + '</div><div class="lib-grid">' + gh.map(lib).join("") + '</div>' +
      '<div id="moreRepos"></div></div></section>' +
      '<section class="section"><div class="wrap"><h2 style="margin-bottom:1rem">Links</h2><ul class="link-list">' +
      (S.devLinks || []).map(function (x) { return '<li><a href="' + esc(x.url) + '" target="_blank" rel="noopener"><span><strong>' + esc(x.title) + '</strong><span class="muted">' + esc(x.text) + '</span></span>' + I.ext + '</a></li>'; }).join("") +
      SOCIAL.filter(function (x) { return L[x[0]] && x[0] !== "github"; }).map(function (x) { return '<li><a href="' + esc(L[x[0]]) + '" target="_blank" rel="noopener"><span><strong>' + x[1] + '</strong><span class="muted">' + (x[0] === "youtube" ? "Lecture videos in English" : x[0] === "youtubeUrdu" ? "Lecture videos in Urdu/Hindi" : x[0] === "scholar" ? "Publications and citations" : x[0] === "researchgate" ? "Publications and research network" : "Professional profile") + '</span></span>' + I.ext + '</a></li>'; }).join("") +
      '</ul></div></section>';
  }
  // Lists any other public repositories live from GitHub; silently does nothing if unavailable.
  function loadRepos() {
    var L = S.links || {}, m = /github\.com\/([^\/?#]+)/.exec(L.github || "");
    if (!m || !window.fetch) return;
    var known = ((S.research || {}).software || []).map(function (x) { return (x.repo || "").toLowerCase().replace(/\/$/, ""); });
    fetch("https://api.github.com/users/" + m[1] + "/repos?per_page=100&sort=pushed").then(function (r) { return r.ok ? r.json() : []; }).then(function (repos) {
      var extra = (repos || []).filter(function (x) { return !x.fork && known.indexOf(String(x.html_url).toLowerCase()) < 0; });
      var box = $("#moreRepos"); if (!box || !extra.length) return;
      box.innerHTML = '<h3 style="margin:2rem 0 .75rem">More repositories</h3><ul class="link-list">' + extra.map(function (x) {
        return '<li><a href="' + esc(x.html_url) + '" target="_blank" rel="noopener"><span><strong>' + esc(x.name) + '</strong><span class="muted">' + esc(x.description || "") + (x.pushed_at ? " · updated " + esc(fmtDate(x.pushed_at.slice(0, 10))) : "") + '</span></span>' + I.ext + '</a></li>';
      }).join("") + '</ul>';
    }).catch(function () {});
  }

  function emailLine(addr, primary) {
    return '<div class="contact-line"><span class="addr">' + esc(addr) + '</span>' +
      '<button class="btn btn-ghost btn-sm" type="button" data-copy="' + esc(addr) + '">Copy</button>' +
      '<a class="btn ' + (primary ? "btn-primary" : "btn-ghost") + ' btn-sm" href="mailto:' + esc(addr) + '">Write email</a></div>';
  }
  function pageContact() {
    var L = S.links || {};
    return '<section class="page-head"><div class="wrap"><p class="eyebrow">Contact</p><h1>Contact</h1><p>' + esc(S.studentNote || "") + '</p></div></section>' +
      '<section class="section"><div class="wrap"><div class="panel contact-card">' +
      '<div><p class="eyebrow">Email</p>' + emailLine(S.email, true) + '</div>' +
      (S.emailAlt ? '<div><p class="eyebrow">Alternative email</p>' + emailLine(S.emailAlt, false) + '</div>' : "") +
      (L.iba ? '<div><p class="eyebrow">Official IBA profile</p><a class="link-arrow" href="' + esc(L.iba) + '" target="_blank" rel="noopener">Faculty profile at IBA Karachi ' + I.ext + '</a></div>' : "") +
      '<div><p class="eyebrow">Online</p><div class="social">' + socialLinks("social-link") + '</div></div></div>' +
      '</div></section>';
  }
  function pageNotFound() {
    return '<section class="page-head"><div class="wrap"><h1>Page not found</h1><p>This page does not exist or the course is no longer listed. <a href="#courses">Go to all courses</a>.</p></div></section>';
  }

  function renderFooter() {
    var lu = lastUpdated();
    $("#footer").innerHTML = '<div class="wrap"><div><strong>' + esc(S.name) + '</strong><br>' + esc(S.title) + '<br>' + esc(S.department) + ', ' + esc(S.institution) + '<br><span class="mono">' + esc(S.email) + '</span></div>' +
      '<div style="display:grid;gap:.6rem;align-content:start"><nav aria-label="Footer"><a href="#courses">Courses</a><a href="#teaching">Teaching</a><a href="#research">Research</a><a href="#developer">Developer</a><a href="#about">About</a><a href="#cv">CV</a><a href="#contact">Contact</a></nav>' +
      '<div class="social">' + socialLinks("social-link social-sm") + '</div>' + (lu ? '<span class="mono">Materials last updated ' + esc(fmtDate(lu)) + '</span>' : "") + '</div></div>';
    $$("[data-bind]").forEach(function (el) {
      var k = el.getAttribute("data-bind");
      if (k === "brandSub") el.textContent = "Mathematics · " + (S.institutionShort || S.institution);
      else if (S[k]) el.textContent = S[k];
    });
  }
  function injectJSONLD() {
    try {
      var s = document.createElement("script"); s.type = "application/ld+json";
      s.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "Person", name: S.name, jobTitle: S.title, email: "mailto:" + S.email,
        worksFor: { "@type": "CollegeOrUniversity", name: S.institution }, alumniOf: (S.education || []).map(function (e) { return { "@type": "CollegeOrUniversity", name: e.institution }; }) });
      document.head.appendChild(s);
    } catch (e) {}
  }

  /* ---------------- Hero motif: a faint graph and lattice ---------------- */
  function drawMotif() {
    var cv = $("#motif"); if (!cv) return;
    var ctx = cv.getContext("2d"), dpr = Math.min(window.devicePixelRatio || 1, 2);
    function paint() {
      var w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      var col = getComputedStyle(document.documentElement).getPropertyValue("--motif").trim() || "rgba(29,106,115,.16)";
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1;
      // square grid (graph paper) on the right half
      var g = 28, x0 = Math.floor(w * 0.52 / g) * g;
      ctx.globalAlpha = 0.45;
      for (var x = x0; x < w; x += g) { ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, h); ctx.stroke(); }
      for (var y = 0; y < h; y += g) { ctx.beginPath(); ctx.moveTo(x0, y + .5); ctx.lineTo(w, y + .5); ctx.stroke(); }
      ctx.globalAlpha = 1;
      // Petersen graph, drawn large and faint
      var cx = w * 0.8, cy = h * 0.42, R = Math.min(h * 0.36, w * 0.2), r = R * 0.48, outer = [], inner = [];
      for (var i = 0; i < 5; i++) {
        var a = -Math.PI / 2 + i * 2 * Math.PI / 5;
        outer.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); inner.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
      }
      ctx.lineWidth = 1.6;
      function line(p, q) { ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); }
      for (i = 0; i < 5; i++) { line(outer[i], outer[(i + 1) % 5]); line(outer[i], inner[i]); line(inner[i], inner[(i + 2) % 5]); }
      outer.concat(inner).forEach(function (p) { ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, Math.PI * 2); ctx.fill(); });
      // parabola y = x^2 on the grid
      ctx.lineWidth = 1.4; ctx.beginPath();
      var ox = w * 0.62, oy = h * 0.92, sc = g;
      for (var t = -2.2; t <= 2.2; t += 0.05) { var px = ox + t * sc, py = oy - t * t * sc * 0.9; if (t === -2.2) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
      ctx.stroke();
      ctx.font = "italic 16px 'STIX Two Text', serif"; ctx.globalAlpha = 0.9;
      ctx.fillText("det(A − λI) = 0", w * 0.56, h * 0.16);
      ctx.fillText("a^|G| = e", w * 0.9, h * 0.9);
      ctx.globalAlpha = 1;
    }
    paint();
    if (!drawMotif._bound) { drawMotif._bound = true; window.addEventListener("resize", function () { if ($("#motif")) paint(); });
      try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () { if ($("#motif")) paint(); }); } catch (e) {}
      new MutationObserver(function () { if ($("#motif")) paint(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if ($("#motif")) paint(); });
    }
  }

  /* ---------------- Search ---------------- */
  var sIdx = 0, sResults = [];
  function openSearch() { var o = $("#searchOverlay"); o.hidden = false; var inp = $("#searchInput"); inp.value = ""; runSearch(""); setTimeout(function () { inp.focus(); }, 10); }
  function closeSearch() { $("#searchOverlay").hidden = true; }
  function initSearch() {
    var inp = $("#searchInput"), o = $("#searchOverlay");
    inp.addEventListener("input", function () { runSearch(inp.value); });
    inp.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); sIdx = Math.min(sIdx + 1, sResults.length - 1); hi(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sIdx = Math.max(sIdx - 1, 0); hi(); }
      else if (e.key === "Enter") { var a = $$("#searchResults a")[sIdx]; if (a) { a.click(); } }
    });
    o.addEventListener("click", function (e) { if (e.target === o) closeSearch(); });
    $("#searchResults").addEventListener("click", function (e) { if (e.target.closest("a")) closeSearch(); });
    document.addEventListener("click", function (e) { if (e.target.closest("#homeSearch")) openSearch(); });
  }
  function hi() { $$("#searchResults a").forEach(function (a, i) { a.classList.toggle("active", i === sIdx); if (i === sIdx) a.scrollIntoView({ block: "nearest" }); }); }
  function runSearch(q) {
    var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    var pool = active().map(function (c) { return { kind: "Course", title: c.title, sub: c.summary, href: "#course-" + c.id, hay: [c.title, c.summary, c.description, c.level].join(" ") }; })
      .concat(ITEMS.map(function (i) { return { kind: i.files.length ? (TYPE_LABEL[i.files[0].type] || "Lecture") : videosOf(i.lec).length ? "Video" : "Soon", title: "Lecture " + pad(i.lec.number) + " — " + i.lec.title, sub: i.course.title + (i.lec.topic ? " · " + i.lec.topic : ""), href: "#lecture-" + i.course.id + "-" + i.lec.number, hay: [i.lec.title, i.lec.topic, i.lec.summary, i.course.title, "lecture " + i.lec.number].join(" "), has: i.files.length }; }));
    if (!terms.length) sResults = pool.filter(function (p) { return p.kind === "Course"; });
    else sResults = pool.filter(function (p) { var h = p.hay.toLowerCase(); return terms.every(function (t) { return h.indexOf(t) >= 0; }); })
      .sort(function (a, b) { return (b.kind === "Course") - (a.kind === "Course") || (b.has ? 1 : 0) - (a.has ? 1 : 0); }).slice(0, 30);
    sIdx = 0;
    $("#searchResults").innerHTML = sResults.length ? sResults.map(function (r, i) {
      return '<li><a href="' + r.href + '"' + (i === 0 ? ' class="active"' : "") + '><span class="r-title">' + esc(r.title) + '</span><span class="chip' + (r.kind === "Course" ? " chip-accent" : "") + '">' + esc(r.kind) + '</span><span class="r-sub">' + esc(r.sub) + '</span></a></li>';
    }).join("") : '<li class="none">Nothing matches “' + esc(q) + '”. Try a topic such as “eigenvalues”, “trees” or “Lagrange”.</li>';
  }

  /* ---------------- PDF viewer (PDF.js) ---------------- */
  var V = { doc: null, scale: 0, fit: true, url: "", pages: [], token: 0, observer: null };
  function loadScript(src) {
    return new Promise(function (res, rej) { var s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = function () { rej(new Error("Could not load " + src)); }; document.head.appendChild(s); });
  }
  var pdfReady = null;
  function ensurePdfJs() {
    if (!pdfReady) pdfReady = loadScript(PDFJS_BASE + "pdf.min.js").then(function () {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_BASE + "pdf.worker.min.js";
    });
    return pdfReady;
  }
  function openDoc(url) {
    return window.pdfjsLib.getDocument({ url: url }).promise.catch(function (err) {
      // Fall back to running PDF.js on the main thread if a web worker is not allowed.
      if (window.pdfjsWorker) throw err;
      return loadScript(PDFJS_BASE + "pdf.worker.min.js").then(function () { return window.pdfjsLib.getDocument({ url: url }).promise; });
    });
  }
  function initViewer() {
    $("#vClose").addEventListener("click", closeViewer);
    $("#vIn").addEventListener("click", function () { zoom(1.2); });
    $("#vOut").addEventListener("click", function () { zoom(1 / 1.2); });
    $("#vFit").addEventListener("click", function () { V.fit = true; layoutPages(); });
    $("#vPrev").addEventListener("click", function () { goPage(curPage() - 1); });
    $("#vNext").addEventListener("click", function () { goPage(curPage() + 1); });
    $("#vPages").addEventListener("scroll", updatePageLabel, { passive: true });
    document.addEventListener("keydown", function (e) {
      if ($("#viewer").hidden) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); goPage(curPage() + 1); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); goPage(curPage() - 1); }
    });
    window.addEventListener("resize", function () { if (!$("#viewer").hidden && V.fit) layoutPages(); });
  }
  var lastFocus = null;
  function openViewer(url, title, sub) {
    lastFocus = document.activeElement;
    V.url = url; V.fit = true; V.token++; var tok = V.token;
    $("#viewerTitle").textContent = title || "Document"; $("#viewerSub").textContent = sub || "";
    $("#vDownload").setAttribute("href", dlUrl(url)); $("#vOpen").setAttribute("href", openUrl(url));
    $("#vPage").textContent = "– / –";
    var pages = $("#vPages"); pages.innerHTML = '<div class="viewer-msg"><div class="spinner"></div><span>Loading document…</span></div>';
    $("#viewer").hidden = false; document.body.style.overflow = "hidden"; $("#vClose").focus();
    var did = driveId(url);
    $$("#vPrev, #vNext, #vIn, #vOut, #vFit, #vPage").forEach(function (b) { b.hidden = !!did; });
    if (did) {
      pages.innerHTML = '<iframe class="drive-frame" title="' + esc(title || "Document") + '" src="https://drive.google.com/file/d/' + did + '/preview" allow="autoplay" loading="eager"></iframe>' +
        '<p class="drive-note">Shown with Google Drive. If it does not appear, use <a href="' + esc(openUrl(url)) + '" target="_blank" rel="noopener">New tab</a>.</p>';
      return;
    }
    ensurePdfJs().then(function () { return openDoc(url); }).then(function (doc) {
      if (tok !== V.token) return;
      V.doc = doc; buildPages();
    }).catch(function (err) {
      if (tok !== V.token) return;
      pages.innerHTML = '<div class="viewer-msg"><strong>This document could not be shown here.</strong><span>' + esc(err && err.message || "") + '</span><span>Try opening it in a new tab or downloading it instead.</span>' +
        '<div class="hero-cta" style="justify-content:center"><a class="btn btn-primary" href="' + esc(url) + '" target="_blank" rel="noopener">Open in new tab</a><a class="btn btn-ghost" href="' + esc(url) + '" download>Download</a></div></div>';
    });
  }
  function closeViewer() {
    V.token++; $("#viewer").hidden = true; document.body.style.overflow = "";
    if (V.observer) V.observer.disconnect(); if (V.doc) { try { V.doc.destroy(); } catch (e) {} }
    V.doc = null; V.pages = []; $("#vPages").innerHTML = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function buildPages() {
    var box = $("#vPages"); box.innerHTML = ""; V.pages = [];
    var chain = Promise.resolve();
    var sizes = [];
    for (var i = 1; i <= V.doc.numPages; i++) (function (n) {
      chain = chain.then(function () { return V.doc.getPage(n).then(function (p) { sizes[n - 1] = p.getViewport({ scale: 1 }); }); });
    })(i);
    chain.then(function () {
      if (!V.doc) return;
      sizes.forEach(function (vp, i) {
        var d = document.createElement("div"); d.className = "page"; d.setAttribute("data-n", i + 1); d.setAttribute("aria-label", "Page " + (i + 1));
        box.appendChild(d); V.pages.push({ el: d, base: vp, rendered: 0 });
      });
      if (V.observer) V.observer.disconnect();
      V.observer = new IntersectionObserver(function (ents) { ents.forEach(function (e) { if (e.isIntersecting) renderPage(+e.target.getAttribute("data-n")); }); }, { root: box, rootMargin: "600px 0px" });
      V.pages.forEach(function (p) { V.observer.observe(p.el); });
      layoutPages();
    });
  }
  function fitScale() {
    var box = $("#vPages"), avail = box.clientWidth - 2 * Math.max(16, box.clientWidth * 0.02);
    var w = V.pages.length ? V.pages[0].base.width : 800;
    return Math.max(0.3, Math.min(avail / w, 2.5));
  }
  function layoutPages() {
    if (!V.pages.length) return;
    if (V.fit) V.scale = fitScale();
    V.pages.forEach(function (p) { p.el.style.width = Math.floor(p.base.width * V.scale) + "px"; p.el.style.height = Math.floor(p.base.height * V.scale) + "px"; p.rendered = 0; p.el.innerHTML = ""; });
    // render pages already in view
    var box = $("#vPages"), top = box.scrollTop, bot = top + box.clientHeight + 600;
    V.pages.forEach(function (p, i) { if (p.el.offsetTop < bot && p.el.offsetTop + p.el.offsetHeight > top - 600) renderPage(i + 1); });
    updatePageLabel();
  }
  function renderPage(n) {
    var p = V.pages[n - 1]; if (!p || p.rendered === V.scale || !V.doc) return;
    var scale = V.scale; p.rendered = scale;
    V.doc.getPage(n).then(function (page) {
      if (p.rendered !== scale) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2.5), vp = page.getViewport({ scale: scale * dpr });
      var c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height;
      c.style.width = Math.floor(p.base.width * scale) + "px"; c.style.height = Math.floor(p.base.height * scale) + "px";
      return page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise.then(function () {
        if (p.rendered !== scale) return; p.el.innerHTML = ""; p.el.appendChild(c);
      });
    });
  }
  function zoom(f) { if (!V.pages.length) return; var cp = curPage(); V.fit = false; V.scale = Math.max(0.3, Math.min(V.scale * f, 4)); layoutPages(); goPage(cp, true); }
  function curPage() {
    var box = $("#vPages"), mid = box.scrollTop + box.clientHeight * 0.35, n = 1;
    V.pages.forEach(function (p, i) { if (p.el.offsetTop <= mid) n = i + 1; });
    return n;
  }
  function goPage(n, instant) {
    if (!V.pages.length) return; n = Math.max(1, Math.min(n, V.pages.length));
    var box = $("#vPages"); box.scrollTo({ top: V.pages[n - 1].el.offsetTop - 16, behavior: instant ? "auto" : "smooth" });
    setTimeout(updatePageLabel, instant ? 0 : 350);
  }
  function updatePageLabel() { if (V.pages.length) $("#vPage").textContent = curPage() + " / " + V.pages.length; }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
