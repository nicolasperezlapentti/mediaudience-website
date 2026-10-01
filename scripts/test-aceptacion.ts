#!/usr/bin/env node
/**
 * Test de aceptación (README.md, «Criterio de aceptación por página»):
 *
 *   curl https://mediaudience.com/{ruta} sin ejecutar JavaScript devuelve H1, cuerpo,
 *   answer target y JSON-LD completos.
 *
 * Construye el sitio, lo sirve desde dist/ con un servidor estático y pide cada ruta ready
 * con un fetch pelado —ningún navegador, ningún JavaScript—. Compara lo que llega contra el
 * contenido fuente: el H1, el texto exacto del answer target, cada sección visible y el
 * grafo JSON-LD. Sale con código 1 si una sola ruta falla.
 *
 * Uso:
 *   node scripts/test-aceptacion.ts                                build + servidor local
 *   node scripts/test-aceptacion.ts --sin-build                    usa el dist/ existente
 *   node scripts/test-aceptacion.ts --base https://mediaudience.com  contra el sitio desplegado
 *
 * MA_CONTENIDO y MA_DIST eligen árbol de contenido y directorio de salida (fixtures).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname, join, resolve } from 'node:path';
import { toString } from 'mdast-util-to-string';
import { parse } from 'node-html-parser';
import { ID_MARCA } from '../src/lib/jsonld.ts';
import { SITIO } from '../src/lib/marca.ts';
import { answerTarget, normalizarEspacios, parsearCta } from '../src/lib/markdown.ts';
import { cargarSitio, type PaginaPublicada } from '../src/lib/sitio.ts';
import { construirTrio } from '../src/lib/trio.ts';

const args = process.argv.slice(2);
const baseArg = args.includes('--base') ? args[args.indexOf('--base') + 1] : null;
const dist = resolve(process.env.MA_DIST ?? 'dist');

if (!baseArg && !args.includes('--sin-build')) {
  console.log('▸ astro build');
  const r = spawnSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build'], { stdio: 'inherit', env: process.env });
  if (r.status !== 0) {
    console.error('\n✗ El build falló: el test de aceptación no llega a pedir ninguna ruta.');
    process.exit(1);
  }
}

const TIPOS: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

function servir(): Promise<{ base: string; cerrar: () => void }> {
  const servidor = createServer((req, res) => {
    const camino = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    let archivo = join(dist, camino);
    if (existsSync(archivo) && statSync(archivo).isDirectory()) archivo = join(archivo, 'index.html');
    if (!archivo.startsWith(dist) || !existsSync(archivo)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'Content-Type': TIPOS[extname(archivo)] ?? 'application/octet-stream' }).end(readFileSync(archivo));
  });
  return new Promise((ok) =>
    servidor.listen(0, '127.0.0.1', () => {
      const { port } = servidor.address() as AddressInfo;
      ok({ base: `http://127.0.0.1:${port}`, cerrar: () => servidor.close() });
    }),
  );
}

/** Para comparar texto de Markdown con texto de HTML sin depender de espacios ni saltos. */
const compacto = (s: string) => s.replace(/\s+/g, '');

async function verificarRuta(base: string, p: PaginaPublicada): Promise<string[]> {
  const fallas: string[] = [];
  const res = await fetch(`${base}${p.ruta}`, { headers: { 'User-Agent': 'test-aceptacion (sin JavaScript)' }, redirect: 'manual' });
  if (res.status !== 200) return [`HTTP ${res.status}`];
  if (!res.headers.get('content-type')?.includes('text/html')) fallas.push(`content-type ${res.headers.get('content-type')}`);
  const html = await res.text();
  const raiz = parse(html);

  // H1
  const h1s = raiz.querySelectorAll('h1');
  if (h1s.length !== 1) fallas.push(`H1: hay ${h1s.length}, debe haber uno`);
  else if (normalizarEspacios(h1s[0].text) !== p.documento.h1) fallas.push(`H1: «${normalizarEspacios(h1s[0].text)}» ≠ «${p.documento.h1}»`);

  // Answer target: el texto exacto del primer párrafo de «Respuesta directa»
  const esperado = p.visibles.find((v) => v.def.nombre === 'Respuesta directa');
  const at = esperado && answerTarget(esperado.seccion);
  const nodoAt = raiz.querySelector('[data-answer-target]');
  if (!at) fallas.push('answer target: la fuente no lo tiene');
  else if (!nodoAt) fallas.push('answer target: no está en el HTML');
  else if (normalizarEspacios(nodoAt.text) !== at.texto) fallas.push(`answer target: «${normalizarEspacios(nodoAt.text)}» ≠ «${at.texto}»`);

  // Cuerpo: cada sección visible llega con su título y su texto
  const cuerpo = compacto(raiz.querySelector('main')?.text ?? '');
  for (const { def, seccion } of p.visibles) {
    if (def.titulo !== false && !raiz.querySelector(`section#${seccion.id} > h2`)) fallas.push(`cuerpo: falta el H2 «${def.nombre}»`);
    const trio = def.bloque === 'B-09' ? construirTrio(sitio, p, seccion).trio : null;
    const texto =
      def.nombre === 'CTA de cierre'
        ? (parsearCta(seccion)?.texto ?? '')
        : trio
          ? trio.productos.map((x) => `${x.nombre} ${x.descripcion} ${x.datos.map((d) => `${d.rotulo} ${d.valor}`).join(' ')}`).join(' ')
        : seccion.nodos
            .slice(def.nombre === 'Respuesta directa' ? 1 : 0)
            // El caption de una tabla viene de su línea «Tabla: …»: en el HTML va antes de las celdas.
            .map((n) => `${(n.data as { caption?: string } | undefined)?.caption ?? ''} ${toString(n)}`)
            .join(' ');
    const muestra = compacto(texto).slice(0, 80);
    if (muestra && !cuerpo.includes(muestra)) fallas.push(`cuerpo: no llega el texto de «${def.nombre}» («${texto.trim().slice(0, 50)}…»)`);
  }

  // JSON-LD
  const bloques = raiz.querySelectorAll('script[type="application/ld+json"]');
  if (!bloques.length) fallas.push('JSON-LD: no hay bloque');
  for (const b of bloques) {
    try {
      const nodos = (JSON.parse(b.textContent)['@graph'] ?? []) as Record<string, unknown>[];
      if (!nodos.some((n) => n['@id'] === ID_MARCA)) fallas.push('JSON-LD: falta la marca-entidad');
      if (!nodos.some((n) => n.url === `${SITIO}${p.ruta}` && String(n['@id']).endsWith('#webpage'))) fallas.push('JSON-LD: falta el nodo de la página');
      const faq = p.visibles.some((v) => v.def.nombre === 'FAQ');
      const faqPage = nodos.find((n) => n['@type'] === 'FAQPage') as { mainEntity?: { name: string }[] } | undefined;
      if (faq && !faqPage) fallas.push('JSON-LD: hay FAQ visible y falta FAQPage');
      if (faqPage) {
        // Google exige que el FAQPage diga lo mismo que la página: se comparan pregunta por pregunta.
        const visibles = raiz.querySelectorAll('.faq__pregunta').map((h) => normalizarEspacios(h.text));
        const marcadas = (faqPage.mainEntity ?? []).map((q) => q.name);
        if (visibles.join('|') !== marcadas.join('|')) fallas.push(`FAQPage no coincide con las preguntas visibles: ${JSON.stringify({ visibles, marcadas })}`);
      }
    } catch (e) {
      fallas.push(`JSON-LD inválido: ${(e as Error).message}`);
    }
  }
  return fallas;
}

const sitio = cargarSitio();
const { base, cerrar } = baseArg ? { base: baseArg.replace(/\/$/, ''), cerrar: () => {} } : await servir();
let fallidas = 0;

console.log(`▸ Pidiendo ${sitio.publicadas.size} rutas a ${base} sin ejecutar JavaScript\n`);
for (const p of sitio.publicadas.values()) {
  const fallas = await verificarRuta(base, p);
  if (fallas.length) {
    fallidas++;
    console.log(`  ✗ ${p.ruta}  (${p.archivo})`);
    for (const f of fallas) console.log(`      ${f}`);
  } else {
    console.log(`  ✓ ${p.ruta}`);
  }
}

for (const archivo of ['/robots.txt', '/sitemap.xml', '/llms.txt']) {
  const res = await fetch(`${base}${archivo}`);
  if (res.status === 200) console.log(`  ✓ ${archivo}`);
  else {
    fallidas++;
    console.log(`  ✗ ${archivo}  HTTP ${res.status}`);
  }
}
cerrar();

if (fallidas) {
  console.error(`\n✗ ${fallidas} ruta(s) no cumplen el criterio de aceptación.`);
  process.exit(1);
}
console.log(`\n✓ Todas las rutas devuelven H1, cuerpo, answer target y JSON-LD en el HTML de servidor.`);
