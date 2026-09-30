# Mediaudience — Signal Design System

**Mediaudience** is a multilatina AdTech company: an SSP and digital media representation business,
**Peruvian in origin**, operating as a local company in **Peru, Mexico, Ecuador and Chile**. It
sells programmatic media to CMOs, media directors and agencies. The product surface is a
performance console — campaign delivery, reach, VTR/CTR/CPM, audience segments.

**Channels and products** (only these — see *Out of scope* below):

- Connected TV
- Mobile Push — **three distinct products**, never presented as one: Premium with Claro, Premium
  Video (geofenced), and Programmatic. Each has its own inventory, targeting and metrics; their
  figures are never summed or averaged together.
- Programmatic display and video (DV360)
- Cross-channel retargeting, CTV + Mobile
- SSP and media representation

**Signal** is the visual identity: dark telemetry. The screen reads like an instrument panel —
ink-blue canvas, thin hairlines, a single blue accent used as a signal indicator, and figures set
large in a technical face. Deliberately not "SaaS friendly": no soft shadows, no pastel gradients,
no rounded pill everything.

---

## Scope of this skill

This skill covers **client-facing dashboards (Campaign Console), decks and social assets**.

It does **not** cover the marketing website. The website has its own reference material in the site
repo — `design/referencia/navegacion.html` (header and footer) and `design/referencia/bloques.html`
(content blocks B-01 to B-11, forms, mobile) — governed by `PLANTILLAS.md`. Both share this token
system, but the website has its own layout, content rules and machine-readability requirements that
do not apply here.

---

## Out of scope — do not produce

These have appeared in earlier versions of this file and propagated into work products. They are
not part of Mediaudience's offering as documented in the fact-book:

- **Retail Media** — not a Mediaudience channel. Do not list it, define it, or build for it.
- **In-Game / Mobile Gaming** — blocked pending internal confirmation (D-07).
- **ONE by SQREEM / audience intelligence** — blocked pending confirmation (D-16).
- **Siprocal partnership** — blocked pending confirmation (D-15).
- **"+20 years of experience"** — contradicts the founding date. Retired.
- **"CTR 99.97%"** and **"Viewability 100%"** — statistical artifacts. Never reproduce.

If a request calls for any of these, say it is not confirmed rather than inventing it.

---

## Index

| File | What it is |
|---|---|
| `SKILL.md` | Entry point + the non-negotiable rules |
| `tokens.css` | All CSS custom properties, fonts, keyframes — **generated, do not hand-edit** |
| `dashboard-patterns.md` | Layout grid, component recipes, data-viz and copy rules for dashboards |
| `dashboard-reference.html` | Working reference dashboard — **copy this to start a new client** |
| `logotype.md` | Logotype + Beacon isotipo construction and misuse |

`tokens.css` is derived from `design/tokens.json` in the site repo by `scripts/build-tokens.mjs`.
Edit the JSON and regenerate; hand edits are lost on the next build.

---

## Visual foundations

**Color.** Ink `#0A0E17` is the world; `#121828` cards sit on it separated by a 1px
`rgba(255,255,255,.09)` hairline — never by shadow. Usage ratio is **70 ink / 20 surfaces /
10 accent**.

The accent is **Signal Blue `#58B0FF`** — an indicator, not a decoration: active nav, the one KPI
that matters, live dots, highlighted bars, section eyebrows. Hover `#70C0FF`, active `#3496EF`,
disabled `#234566`, tints at `rgba(88,176,255,.06–.10)`. When the accent is used as a fill, text on
it is `#040B17` — never white body text on the accent.

`#47D6CF` is the **second data series only**. `#68D7A1` is **success/positive** — a distinct
semantic role, no longer the same value as the second series. `#E4665B` is failure/decline.

> The accent was cyan `#2AD5E5` until tokens v1.2.0. If you encounter `#2AD5E5`, `#4FD9DE`,
> `#4FD1E3` or `#3FDDB0` in older material, they are all retired — the last three were never
> correct at all.

**Accessibility.** `#565E76` measures 2.99:1 against the ink background and fails WCAG AA. It is
for hairlines and disabled states only. Any small text that must actually be read — placeholders,
axis ticks, tertiary copy — uses `#7782A3` (5.06:1).

**Type.** Space Grotesk (500/600, `letter-spacing:-.02em` to `-.03em`) for display and every KPI
figure. IBM Plex Sans 400 for prose, `line-height:1.5–1.6`, secondary color. JetBrains Mono for all
metadata: labels, axis ticks, dates, channel names, table headers — always uppercase,
`letter-spacing:.12em–.2em`, 9–11px. Scale: Display 56–64 / H1 34–38 / H2 22–24 / Body 15–16 /
Mono 10–13. KPI figures 26px (in-grid) to 40px (hero).

**Layout.** 12px grid gap inside a dashboard, 16px between sections, 24px content padding, 72px
section padding in documents. Dense over airy. Sidebar 180–220px. Everything left-aligned; numbers
may right-align in tables.

**Backgrounds.** Two motifs only, both faint: (1) a repeating vertical hairline rule
`repeating-linear-gradient(90deg,var(--mau-line-2) 0 1px,transparent 1px 80px)` behind hero areas;
(2) a 28px data grid `linear-gradient` cross-hatch inside empty panels. Optional radial accent bloom
at 8–12% opacity from the top-right of a hero. No photography inside product UI.

**Borders, radius, shadow.** 1px hairlines everywhere. Radius 6px universally; 12px only on the
outer app frame. Inside the UI: zero shadows. A floating frame in a deck or mockup gets exactly
one: `0 40px 80px -40px #000`.

**Motion.** Fast and mechanical: 220ms, `cubic-bezier(.2,.7,.3,1)`. Bars grow from the baseline
(`mau-rise`), progress fills grow from the left (`mau-bar`), live dots pulse 1.8s. No bounce, no
spring, no parallax. Always respect `prefers-reduced-motion`.

**States.** Hover: fill lifts to `#1A2135`, text to `--mau-text`; on accent buttons, brightness
~1.08. Active/press: `transform: translateY(1px)`, no color change. Focus: 1px accent outline with
2px offset. Selected nav: `border-left:2px solid var(--ma-primary)` +
`background:rgba(88,176,255,.06)` — the left rule is the brand's selection signature.

**Transparency/blur.** Only two uses: accent tints at 6–10% alpha for selected/soft states, and a
`backdrop-filter: blur(12px)` on sticky topbars over scrolling data. Never frosted cards.

---

## Content fundamentals

Spanish (LATAM), formal-plural voice: "conectamos", "impactamos" — first-person plural for
Mediaudience, "tu marca / tu campaña" for the client. Never "usted". Confident and quantified,
never hyped: a claim is followed by a number. Sentences short. No exclamation marks, no emoji, ever.

**Brand spelling — non-negotiable.** `Mediaudience`, one word, always. Never "Media Audience" with
a space, never "MediaAudience". Writing it as two words hands the entity over to the generic
concept *media audience*, which is the company's central discoverability problem.

The logotype is set lowercase (`medi{a}udience`, the `a` in accent) — correct **as a logotype**.
But display text, document titles, headings, `schema:name` and the logo's `alt` attribute all use
`Mediaudience` capitalized. The lowercase rule governs the visual mark, not the word.

Labels and metadata in mono are **uppercase, abbreviated, technical**: `IMPRESIONES`, `VTR`,
`DELIVERY · ÚLTIMOS 14 DÍAS`, `01–31 OCT 2024`, `CTV · VTR`. The `·` middot is the standard
separator; use an en dash `–` for ranges. Titles in sentence case, never Title Case. Section
eyebrows are numbered: `05 — DATOS & KPIS`.

**Figures.** Number format is es-EC: **comma decimal, period thousands** — `9,3%`, `1.305.200`,
`USD 14,5`. Abbreviate at scale (`294K`, `192M`), one decimal on rates. Unit suffixes de-emphasized
in `--ma-text-muted` at half the figure size. Deltas always signed and paired with the comparison
period: `+18% vs. sep`.

**Every metric carries its denominator, market and date.** `9,3%` alone is not a result;
`35.769 clics sobre 384.615 envíos · CTR 9,3% · Ecuador, marzo 2025` is. Where a figure comes from
internal reporting, attribute it: *"según datos de la compañía, corte [fecha]"*.

---

## Iconography

The system is **glyph-light by design** — the brand's vocabulary is dots, hairlines, bars and the
pulsing live indicator, not an icon set. Where a UI icon is genuinely needed (nav, table actions,
filters), use **Lucide** at `stroke-width: 1.5`, 16px in dense UI / 20px in nav, colored
`currentColor` so it inherits muted/active states. Do not mix icon families, do not use filled
icons, do not use emoji or unicode symbols as icons. The only glyph characters allowed are `·`,
`–`, `→`, `✕` and delta arrows (`▲ ▼`).

The **Beacon** isotipo (concentric radial pulse) doubles as the loading/live motif — see
`logotype.md`. No other illustration style exists yet; if imagery is needed, use real screenshots or
ask for photography rather than drawing SVG scenes.

---

## Caveats

- **Fonts load from Google Fonts, not self-hosted.** For production, self-host Space Grotesk /
  IBM Plex Sans / JetBrains Mono via `@fontsource` (latin subset, `font-display: swap`) and set
  `typography.fontSourceSelfHosted` to true in `tokens.json`. A third-party `@import` blocks render
  on every page.
- **No logo binaries exist.** The logotype is rendered in live type and the Beacon mark in CSS
  circles. A favicon and an Open Graph image are still missing and are required for the website. If
  vector assets appear, put them in `assets/` and update `logotype.md`.
- **No light theme.** Reports meant for print use ink-on-paper (`#0A0E17` on `#E9EDF6`) with the
  same type and hairlines — not a re-tinted dark UI.
- **This file has been a source of error before.** Two claims that were wrong here — "base Ecuador"
  and Retail Media as a channel — propagated into generated work products before being caught.
  When something here contradicts `factbook-mediaudience.md`, the fact-book wins; correct this file
  rather than working around it.
