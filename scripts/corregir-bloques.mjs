#!/usr/bin/env node
/**
 * corregir-bloques.mjs — alinea la hoja de bloques de Claude Design con PLANTILLAS.md v1.1
 *
 * Hace tres cosas:
 *   1. Reescribe las rutas a la arquitectura definitiva (/soluciones/ + /mercados/)
 *   2. Reporta las apariciones de Retail Media e In-Game, que NO están en el fact-book
 *   3. Verifica que no haya quedado nada del acento cian
 *
 * Uso:
 *   node scripts/corregir-bloques.mjs --dry design/referencia/bloques.html
 *   node scripts/corregir-bloques.mjs       design/referencia/bloques.html
 *
 * OJO: la eliminación de Retail Media e In-Game NO se automatiza. Son elementos de lista
 * completos (mega-menú, footer, glosario) y borrarlos con reemplazo de texto deja HTML roto.
 * El script te dice dónde están; los quitás a mano en el editor.
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';

const RUTAS = [
  // canales → soluciones
  ['/canales/connected-tv/',  '/soluciones/connected-tv/'],
  ['/canales/mobile-push/',   '/soluciones/mobile-push/'],
  ['/canales/programatica/',  '/soluciones/programmatic/'],

  // productos → soluciones, con los hijos colgando de su hub
  ['/productos/mobile-push-premium-claro/',  '/soluciones/mobile-push/premium-claro/'],
  ['/productos/mobile-push-premium-video/',  '/soluciones/mobile-push/premium-video/'],
  ['/productos/mobile-push-programatico/',   '/soluciones/mobile-push/programatico/'],
  ['/productos/ssp/',                        '/soluciones/ssp/'],
  ['/productos/representacion-de-medios/',   '/soluciones/representacion-de-medios/'],

  // recursos: slugs planos con forma de consulta
  ['/recursos/explicadores/ctr/',       '/recursos/que-es-el-ctr/'],
  ['/recursos/explicadores/cpa/',       '/recursos/que-es-el-cpa/'],
  ['/recursos/explicadores/vtr/',       '/recursos/que-es-el-vtr/'],
  ['/recursos/explicadores/ssp-y-dsp/', '/recursos/diferencia-ssp-dsp/'],
  ['/recursos/glosario/',               '/recursos/glosario-adtech/'],

  // /mercados/ se conserva: decisión tomada, es el hub de la huella multilatina
];

const REVISAR = [
  ['Retail Media',  'NO está en el fact-book — quitar del mega-menú, footer y glosario'],
  ['retail-media',  'ruta /canales/retail-media/ — eliminar'],
  ['In-Game',       'es Mobile Gaming, bloqueado por D-07 — quitar'],
  ['in-game',       'ruta /canales/in-game/ — eliminar'],
];

const CIAN = ['#2AD5E5', '#2DE6F7', '#00BBCB', '#4FD9DE', '#4FD1E3', '#3FDDB0', '#04121A',
              'oklch(0.80 0.13 205)'];

const dry = process.argv.includes('--dry');
const files = process.argv.slice(2).filter((a) => !a.startsWith('--'));

if (!files.length) {
  console.error('Pasá el archivo: node scripts/corregir-bloques.mjs [--dry] design/referencia/bloques.html');
  process.exit(1);
}

for (const file of files) {
  if (!existsSync(file)) { console.error(`✗ no existe: ${file}`); continue; }
  const original = readFileSync(file, 'utf8');
  let out = original;

  console.log(`\n${'='.repeat(64)}\n${file}\n${'='.repeat(64)}`);

  console.log('\n1 · RUTAS');
  let n = 0;
  for (const [from, to] of RUTAS) {
    const count = out.split(from).length - 1;
    if (!count) continue;
    out = out.split(from).join(to);
    console.log(`   ${String(count).padStart(3)} × ${from}  →  ${to}`);
    n += count;
  }
  console.log(n ? `   ${n} rutas reescritas.` : '   Sin cambios.');

  console.log('\n2 · A QUITAR A MANO');
  let pendientes = 0;
  for (const [term, nota] of REVISAR) {
    const count = (out.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    if (!count) continue;
    console.log(`   ${String(count).padStart(3)} × "${term}" — ${nota}`);
    pendientes += count;
  }
  console.log(pendientes
    ? `   ${pendientes} apariciones. El archivo NO queda listo hasta resolverlas.`
    : '   Limpio.');

  console.log('\n3 · ACENTO');
  let fugas = 0;
  for (const c of CIAN) {
    const count = out.split(c).length - 1;
    if (count) { console.log(`   ✗ ${count} × ${c}`); fugas += count; }
  }
  console.log(fugas ? `   ${fugas} valores del acento anterior.` : '   ✓ Sin rastros del cian.');

  if (!dry && n) {
    copyFileSync(file, file + '.bak');
    writeFileSync(file, out, 'utf8');
    console.log(`\n✓ Escrito. Respaldo en ${file}.bak`);
  } else if (dry) {
    console.log('\n[dry] No se escribió nada.');
  }
}

console.log('\nDespués de quitar Retail Media e In-Game, volvé a correr con --dry: los tres');
console.log('bloques tienen que dar limpio antes de mandar la Fase A a Claude Code.\n');
