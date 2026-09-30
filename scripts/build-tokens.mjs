#!/usr/bin/env node
/**
 * build-tokens.mjs — genera design/tokens.css desde design/tokens.json
 *
 * tokens.json es la ÚNICA fuente de verdad. tokens.css es un artefacto generado
 * y NO se edita a mano: cualquier cambio manual se pierde en el siguiente build.
 *
 * Uso:  node scripts/build-tokens.mjs
 * CI:   node scripts/build-tokens.mjs --check   (falla si tokens.css está desactualizado)
 *
 * Emite dos capas de nombres:
 *   --ma-*   nombres canónicos derivados de tokens.json  (usar en código nuevo)
 *   --mau-*  alias heredados de la skill mediaudience-design (compatibilidad)
 *
 * NOTA sobre `ink`: en tokens.css v1.0 `--mau-ink` era el fondo #0A0E17, mientras que
 * el fuente de la home usaba `--ink` para #04121A (texto sobre acento). Ese nombre
 * queda deprecado. Usar --ma-background y --ma-on-accent.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(root, 'design/tokens.json');
const OUT = resolve(root, 'design/tokens.css');

const t = JSON.parse(readFileSync(SRC, 'utf8'));
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/_/g, '-').toLowerCase();

const lines = [];
const decl = (name, value) => lines.push(`  --ma-${name}: ${value};`);

/* ---------- color ---------- */
const SKIP_COLOR = new Set(['chart', 'gradient', 'form', 'oklch', 'contrastNotes']);
lines.push('  /* ---- color ---- */');
for (const [k, v] of Object.entries(t.color)) {
  if (SKIP_COLOR.has(k)) continue;
  decl(kebab(k), v);
}

lines.push('', '  /* ---- color: chart ---- */');
for (const [k, v] of Object.entries(t.color.chart)) decl(`chart-${kebab(k)}`, v);

lines.push('', '  /* ---- color: form ---- */');
for (const [k, v] of Object.entries(t.color.form ?? {})) decl(`form-${kebab(k)}`, v);

lines.push('', '  /* ---- gradients ---- */');
for (const [k, v] of Object.entries(t.color.gradient)) decl(`gradient-${kebab(k)}`, v);

/* ---------- typography ---------- */
lines.push('', '  /* ---- type: families ---- */');
decl('font-display', t.typography.fontStackPrimary);
decl('font-body', t.typography.fontStackSecondary);
decl('font-mono', t.typography.fontStackMono);

lines.push('', '  /* ---- type: weights ---- */');
for (const w of ['regular', 'medium', 'semibold', 'bold']) {
  decl(`weight-${w}`, t.typography.weights[w]);
}

lines.push('', '  /* ---- type: scale ---- */');
for (const [name, s] of Object.entries(t.typography.scale)) {
  const n = kebab(name);
  decl(`${n}-size`, s.size);
  decl(`${n}-line-height`, s.lineHeight);
  decl(`${n}-weight`, s.weight);
  decl(`${n}-letter-spacing`, s.letterSpacing);
  if (s.sizeMd) decl(`${n}-size-md`, s.sizeMd);
  if (s.sizeSm) decl(`${n}-size-sm`, s.sizeSm);
}

/* ---------- scalars ---------- */
const flat = (group, prefix, skip = []) => {
  lines.push('', `  /* ---- ${prefix} ---- */`);
  for (const [k, v] of Object.entries(group)) {
    if (skip.includes(k) || typeof v === 'object') continue;
    decl(`${prefix}-${kebab(k)}`, v);
  }
};

flat(t.spacing, 'space');
flat(t.radius, 'radius');
flat(t.shadow, 'shadow', ['notes']);
flat(t.layout, 'layout');
flat(t.border, 'border');
flat(t.opacity, 'opacity');
flat(t.motion.duration, 'duration');
flat(t.motion.easing, 'ease');
flat(t.icon.size, 'icon');
decl('icon-stroke-width', t.icon.strokeWidth);

/* ---------- alias heredados ---------- */
const LEGACY = {
  'mau-ink': 'background',
  'mau-ink-deep': 'background-alt',
  'mau-surf': 'surface',
  'mau-surf-2': 'surface-raised',
  'mau-dim': 'text-tertiary',
  'mau-muted': 'text-muted',
  'mau-text': 'text',
  'mau-white': 'white',
  'mau-signal': 'primary',
  'mau-data': 'secondary',
  'mau-on-acc': 'on-accent',
  'mau-pos': 'success',
  'mau-warn': 'warning',
  'mau-neg': 'error',
  'mau-line': 'border',
  'mau-line-2': 'border-subtle',
  'mau-fd': 'font-display',
  'mau-fb': 'font-body',
  'mau-fm': 'font-mono',
  'mau-r': 'radius-default',
  'mau-r-app': 'radius-app-frame',
  'mau-gap': 'space-grid-gap',
  'mau-gap-l': 'space-section-gap',
  'mau-pad': 'space-content-padding',
  'mau-ease': 'ease-base',
  'mau-dur': 'duration-base',
};

const kf = t.motion.keyframes ?? {};
const keyframes = [
  kf.mauPulse && `@keyframes mau-pulse { ${kf.mauPulse} }`,
  kf.mauRise && `@keyframes mau-rise  { ${kf.mauRise} }`,
  kf.mauBar && `@keyframes mau-bar   { ${kf.mauBar} }`,
].filter(Boolean).join('\n');

const fontsNote = t.typography.fontSourceSelfHosted
  ? '/* Fuentes auto-hospedadas vía @fontsource. */'
  : `/* PENDIENTE: fuentes desde Google Fonts, no auto-hospedadas.
   Para SSR/SSG instalar @fontsource/space-grotesk, @fontsource/ibm-plex-sans,
   @fontsource/jetbrains-mono, importarlas en el layout base (subset latin,
   font-display: swap) y poner typography.fontSourceSelfHosted = true.
   Un @import de terceros bloquea el render en cada página. */`;

const css = `/* ============================================================
   Mediaudience — Signal · tokens.css
   GENERADO desde design/tokens.json v${t.$meta.version}
   NO EDITAR A MANO. Ejecutar: node scripts/build-tokens.mjs
   ============================================================ */

${fontsNote}

:root {
${lines.join('\n')}

  /* ---- alias heredados de la skill mediaudience-design ----
     Se conservan para no romper dashboards existentes.
     En código nuevo usar los nombres --ma-*. */
${Object.entries(LEGACY).map(([a, c]) => `  --${a}: var(--ma-${c});`).join('\n')}
}

${keyframes}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

if (process.argv.includes('--check')) {
  const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (current !== css) {
    console.error('✗ design/tokens.css está desactualizado respecto de tokens.json.');
    console.error('  Ejecutá: node scripts/build-tokens.mjs');
    process.exit(1);
  }
  console.log('✓ tokens.css al día.');
} else {
  writeFileSync(OUT, css, 'utf8');
  console.log(`✓ design/tokens.css generado desde tokens.json v${t.$meta.version}`);
}
