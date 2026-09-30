# Client dashboards — patterns

The dashboard is called **Campaign Console**. One shell, many clients. Copy `dashboard-reference.html`, then change: client name in the topbar badge, nav sections, KPI set, chart data, table rows. Everything else stays.

## Shell anatomy

```
┌ frame  border 1px --mau-line · radius 12px · overflow hidden · bg #06090F
│ ┌ topbar  h≈58 · bg --mau-surf · border-bottom hairline
│ │  logotype (18px)          [● EN VIVO] [01–31 OCT 2024] [CLIENTE] (avatar)
│ ├ body  grid-template-columns: 200px 1fr
│ │ ┌ sidebar bg --mau-surf · border-right hairline · items 11px mono
│ │ │  MONO GROUP LABEL
│ │ │  ▌Overview        ← active: border-left 2px cyan + rgba(cyan,.06)
│ │ │   Connected TV
│ │ └
│ │ ┌ main  padding 24 · display grid · gap 12
│ │ │  [KPI][KPI][KPI][KPI]      4 equal cards, one figure in cyan
│ │ │  [ delivery chart 2fr ][ share panel 1fr ]
│ │ │  [ channel table full width ]
│ │ └
└
```

## Component recipes

**KPI card.** `bg --mau-surf · 1px --mau-line · r 6 · padding 16–22`. Mono label 9–10px, `.12em` tracking, muted. Figure Space Grotesk 600, 26px in a 4-up row / 40px as hero, `-.02em`. Delta line: mono 10px, `--mau-pos` or `--mau-neg`, always with period (`▲ 18% vs. sep`). **Exactly one** KPI per row gets the cyan figure — the one the client is judged on.

**Chart card.** Same shell, padding 20. Mono caption at top (`DELIVERY · ÚLTIMOS 14 DÍAS`). Bars: `flex:1`, `gap:6`, `border-radius:3px 3px 0 0`, inert bars `--mau-surf-2`, highlighted bars `--mau-signal`, second series `--mau-data`. Baseline is a hairline, no y-axis line, no gridlines inside bar charts (gridlines only behind line/area). Bars animate `mau-rise` with 40ms stagger. Axis ticks mono 9–10px `--mau-dim`.

**Share / breakdown panel.** Horizontal rows: mono label left, mono value right, then a 4px track `--mau-surf-2` with a `--mau-signal` fill animating `mau-bar`. Max 5 rows, then "OTROS".

**Table.** Header row mono 9–10px uppercase muted with a bottom hairline; body rows 12–13px, hairline `--mau-line-2` between rows, row hover `--mau-surf-2`. Channel name in Space Grotesk 500; all numerics in JetBrains Mono, right-aligned, tabular. Deltas colored. No zebra striping, no cell borders.

**Status pill.** `bg rgba(cyan,.10) · 1px rgba(cyan,.35) · r 4 · mono 9–10px · uppercase · cyan text · padding 4px 8px`. Negative state swaps to `--mau-neg` at the same alphas. Pills are for status only — never for navigation.

**Live indicator.** 6px cyan dot with `animation: mau-pulse 1.8s ease-in-out infinite` + `EN VIVO` in cyan mono. Use once per screen, in the topbar.

**Filter / date control.** Ghost by default: transparent fill, 1px `--mau-line`, mono 11px muted, hover fill `--mau-surf-2`. The primary action of a screen (export, agendar) is the only solid cyan button, with `#04121A` text.

**Empty state.** The 28px cross-hatch grid panel + one mono line, muted, uppercase: `SIN DATOS EN ESTE RANGO`. No illustration.

## Data-viz rules

- Max two series per chart. Series 1 `--mau-signal`, series 2 `--mau-data`, context/inert `--mau-surf-2`.
- Never use accent color for more than the highlighted subset. A chart where every bar is cyan is wrong.
- No pie charts. Composition is a stacked horizontal bar or the share panel above.
- Funnels are centered stacked bars narrowing 100% → 78% → 56%, the converting step filled cyan with ink text.
- Geo data: a table or bar list beats a map unless the map is the point; if mapped, land `--mau-surf-2`, values in cyan alpha steps, hairline borders.
- Sparklines: 1.5px stroke cyan, no fill, no dots except the last point.

## Density & responsive

Design at 1440 wide; the grid drops 4-up KPIs → 2-up under 1100px, sidebar collapses to a 56px icon rail under 900px. Minimum touch target 44px on tablet views. Never below 9px for mono labels, 12px for body.

## Do not

- Light backgrounds, glassmorphism, or gradient cards.
- Cyan card fills behind paragraphs.
- Shadows between cards, or radius above 6px inside the UI.
- Inventing new accent hues for extra series — use surface steps or cyan alpha.
- Title Case, emoji, or exclamation marks in labels.
