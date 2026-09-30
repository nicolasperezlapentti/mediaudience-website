---
name: mediaudience-design
description: Use this skill to generate well-branded interfaces and assets for Mediaudience — especially client-facing performance dashboards (Campaign Console), plus decks, web pages and social assets. Contains the Signal design system: colors, type, fonts, logotype rules, dashboard layout patterns, component recipes and ready-to-copy HTML/CSS.
user-invocable: true
---

Read `README.md` in this skill folder first, then `tokens.css` and `dashboard-patterns.md`.

**Default job: client dashboards.** When asked for a dashboard for a Mediaudience client, start from `dashboard-reference.html` — copy it, swap the client name, the nav sections and the metrics. Do not redesign the shell: the chrome (topbar, sidebar, KPI row, chart cards, table) is the brand.

Rules that are non-negotiable:
- Dark-first. `#0A0E17` canvas, `#121828` cards. Never a light dashboard.
- The accent (`--acc`, Signal Cyan) is ≤10% of the pixels: it marks the ACTIVE nav item, the hero KPI, the "live" dot, and the highlighted bars in a chart. Never a cyan card background behind body text.
- Numbers are the hero: Space Grotesk 600 for KPI figures, JetBrains Mono uppercase + wide tracking for every label, IBM Plex Sans for prose only.
- Radius 6px on everything except the outer app frame (12px). No shadows inside the UI; one deep shadow only under a floating frame/mockup.
- The logotype is always `medi<span>a</span>udience` with the `a` in accent (or white on accent). Never rotated, re-tracked, gradient, or set in another face.

If working on production code, copy `tokens.css` in and reference the custom properties. If producing a visual artifact, copy the reference file and edit it — output a static HTML file the user can open.

If invoked with no other guidance, ask which client the dashboard is for, which channels (CTV / Mobile Push / Programmatic / Gaming / Retail Media), which KPIs matter, and whether it is a live console or a monthly report view — then build.
