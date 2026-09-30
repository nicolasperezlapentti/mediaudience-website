# Logotype & Beacon isotipo

## Logotype

Wordmark, always lowercase, one word: **mediaudience**, with the third letter `a` in the accent color.

```html
<span style="font-family:'Space Grotesk',sans-serif;font-weight:600;letter-spacing:-.02em;">
  medi<span style="color:var(--mau-signal);">a</span>udience
</span>
```

Variants:
- On ink / dark surfaces: text `--mau-text`, `a` in `--mau-signal`.
- On a cyan fill: text `#04121A`, `a` in `#FFFFFF`.
- On light/paper: text `#0A0E17`, `a` in `--mau-signal`.

Sizes: 17–18px in product chrome, 24–40px in documents, 56px+ on covers. Minimum clear space equals the cap height of the `m` on all sides. Minimum size 14px.

**Misuse — never:** gradient fills, rotation, altered tracking, another typeface, italics, outline/stroke, drop shadows, splitting into two words, capitalizing `M`, or coloring a different letter.

## Beacon isotipo

Concentric rings radiating from a solid core — broadcast/signal. Built from nested circles, drawn in CSS (no SVG asset exists yet):

```html
<div style="position:relative;width:74px;height:74px;display:flex;align-items:center;justify-content:center;">
  <div style="position:absolute;width:74px;height:74px;border-radius:50%;border:2px solid var(--mau-signal);opacity:.18;"></div>
  <div style="position:absolute;width:54px;height:54px;border-radius:50%;border:2px solid var(--mau-signal);opacity:.35;"></div>
  <div style="position:absolute;width:34px;height:34px;border-radius:50%;border:2px solid var(--mau-signal);opacity:.6;"></div>
  <div style="width:10px;height:10px;border-radius:50%;background:var(--mau-signal);"></div>
</div>
```

Ring opacities step outward (.6 → .35 → .18); stroke stays 2–3px regardless of size. On a cyan fill, invert to `rgba(4,18,26,.4/.7)` rings with an `#04121A` core.

The same construction is the brand's **live / loading motif**: animate the core with `mau-pulse`, or stagger the rings' opacity for a radar sweep. Used as favicon, app icon, avatar, and the loading state in the dashboard.
