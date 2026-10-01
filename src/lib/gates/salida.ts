/**
 * Gates sobre el HTML generado (dist/). Verifican lo que realmente se publica, incluido lo
 * que ninguna plantilla debería haber producido: una página no ready, un enlace escrito a
 * mano, una grafía prohibida que entró por una constante, un código D-XX filtrado.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { parse, type HTMLElement } from 'node-html-parser';
import { BOTS_IA } from '../fase0.ts';
import { ID_MARCA } from '../jsonld.ts';
import { GRAFIA_PROHIBIDA, SITIO, TERMINOS_PROHIBIDOS } from '../marca.ts';
import { GATES, type Problema } from '../problemas.ts';
import type { Sitio } from '../sitio.ts';

type Nodo = Record<string, unknown>;

function htmlDe(dir: string): Map<string, string> {
  const rutas = new Map<string, string>();
  const recorrer = (d: string) => {
    for (const n of readdirSync(d)) {
      const abs = join(d, n);
      if (statSync(abs).isDirectory()) recorrer(abs);
      else if (n.endsWith('.html')) {
        const r = relative(dir, abs).split(sep).join('/');
        const ruta = r === 'index.html' ? '/' : r.endsWith('/index.html') ? `/${r.slice(0, -'index.html'.length)}` : `/${r}`;
        rutas.set(ruta, abs);
      }
    }
  };
  recorrer(dir);
  return rutas;
}

/** Recorre el JSON-LD y devuelve [ruta dentro del grafo, valor] de cada string. */
function strings(valor: unknown, camino: string[] = []): [string[], string][] {
  if (typeof valor === 'string') return [[camino, valor]];
  if (Array.isArray(valor)) return valor.flatMap((v, i) => strings(v, [...camino, String(i)]));
  if (valor && typeof valor === 'object') return Object.entries(valor).flatMap(([k, v]) => strings(v, [...camino, k]));
  return [];
}

export function verificarSalida(dir: string, sitio: Sitio): Problema[] {
  const problemas: Problema[] = [];
  const add = (gate: string, archivo: string, mensaje: string) => problemas.push({ gate, archivo, mensaje });
  const paginas = htmlDe(dir);
  const fuente = (ruta: string) => sitio.publicadas.get(ruta)?.archivo ?? `dist${ruta}index.html`;

  /* gate 1: se genera exactamente el conjunto ready */
  for (const ruta of paginas.keys()) {
    if (!sitio.publicadas.has(ruta)) {
      const status = sitio.estados.get(ruta);
      add(GATES.g1, `dist${ruta}`, status ? `se generó una página con status «${status}»` : 'se generó una página que no existe en sitemap.json');
    }
  }
  for (const ruta of sitio.publicadas.keys()) if (!paginas.has(ruta)) add(GATES.g1, fuente(ruta), `está ready y no se generó ${ruta}`);

  /* Fase 0 */
  const leer = (n: string) => (existsSync(join(dir, n)) ? readFileSync(join(dir, n), 'utf8') : null);
  const esperadas = new Set([...sitio.publicadas.keys()].map((r) => `${SITIO}${r}`));

  const sitemapXml = leer('sitemap.xml');
  if (sitemapXml === null) add(GATES.g1, 'dist/sitemap.xml', 'no se generó');
  else {
    const locs = new Set([...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
    for (const l of locs) if (!esperadas.has(l)) add(GATES.g1, 'dist/sitemap.xml', `incluye ${l}, que no está ready`);
    for (const e of esperadas) if (!locs.has(e)) add(GATES.g1, 'dist/sitemap.xml', `falta ${e}`);
    if (/<lastmod>(?!\d{4}-\d{2}-\d{2}<)/.test(sitemapXml)) add(GATES.g1, 'dist/sitemap.xml', 'lastmod con formato inválido');
  }

  const llms = leer('llms.txt');
  if (llms === null) add(GATES.g1, 'dist/llms.txt', 'no se generó');
  else {
    for (const m of llms.matchAll(/https:\/\/[^\s)]+/g)) if (!esperadas.has(m[0])) add(GATES.g1, 'dist/llms.txt', `incluye ${m[0]}, que no está ready`);
  }

  const robots = leer('robots.txt');
  if (robots === null) add(GATES.g1, 'dist/robots.txt', 'no se generó');
  else {
    if (/crawl-delay/i.test(robots)) add(GATES.g1, 'dist/robots.txt', 'contiene Crawl-delay');
    if (!robots.includes(`Sitemap: ${SITIO}/sitemap.xml`)) add(GATES.g1, 'dist/robots.txt', 'falta la línea Sitemap');
    for (const bot of BOTS_IA) if (!new RegExp(`^User-agent: ${bot}$`, 'm').test(robots)) add(GATES.g1, 'dist/robots.txt', `no permite explícitamente a ${bot}`);
  }

  /* ids por ruta, para validar fragmentos */
  const dom = new Map<string, HTMLElement>();
  const ids = new Map<string, Set<string>>();
  for (const [ruta, abs] of paginas) {
    const raiz = parse(readFileSync(abs, 'utf8'));
    dom.set(ruta, raiz);
    ids.set(ruta, new Set(raiz.querySelectorAll('[id]').map((e) => e.getAttribute('id')!)));
  }

  const grafos = new Map<string, Nodo[]>();
  for (const [ruta, abs] of paginas) {
    const html = readFileSync(abs, 'utf8');
    const raiz = dom.get(ruta)!;
    const archivo = fuente(ruta);

    if (raiz.querySelectorAll('h1').length !== 1) add(GATES.estructura, archivo, `${raiz.querySelectorAll('h1').length} elementos <h1>; debe haber uno`);
    if (!raiz.querySelector('[data-answer-target]')) add(GATES.estructura, archivo, 'no tiene answer target en el HTML');
    if (/<astro-island|client:(load|idle|visible|media|only)/.test(html)) add(GATES.estructura, archivo, 'hidratación de cliente: el contenido va en el HTML de servidor');
    if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(html)) add(GATES.tokens, archivo, 'carga fuentes de Google: bloquean el render; van auto-hospedadas');
    const canonica = raiz.querySelector('link[rel="canonical"]')?.getAttribute('href');
    if (canonica !== `${SITIO}${ruta}`) add(GATES.estructura, archivo, `canonical «${canonica}» ≠ ${SITIO}${ruta}`);

    /* tablas reales (B-03, B-07): caption, thead/tbody y encabezados con scope */
    for (const t of raiz.querySelectorAll('table')) {
      const donde = t.querySelector('caption')?.text.trim() || t.querySelector('th')?.text.trim() || 'tabla';
      if (!t.querySelector('caption')) add(GATES.estructura, archivo, `tabla «${donde}» sin <caption>`);
      if (!t.querySelector('thead th[scope="col"]')) add(GATES.estructura, archivo, `tabla «${donde}» sin encabezados th[scope=col]`);
      if (t.querySelectorAll('tbody tr').some((tr) => !tr.querySelector('th[scope="row"]'))) add(GATES.estructura, archivo, `tabla «${donde}»: cada fila abre con th[scope=row]`);
    }

    /* gate 4 */
    for (const a of raiz.querySelectorAll('a[href]')) {
      const href = a.getAttribute('href')!;
      const enNav = a.closest('header, nav, footer') !== null;
      if (href.startsWith('#')) {
        if (enNav) add(GATES.g4, archivo, `${href} en header/nav/footer: la navegación apunta a URLs, nunca a #secciones`);
        else if (!ids.get(ruta)!.has(href.slice(1))) add(GATES.g4, archivo, `el fragmento ${href} no existe en la página`);
        continue;
      }
      let destino = href;
      if (href.startsWith(`${SITIO}/`)) destino = href.slice(SITIO.length);
      else if (!href.startsWith('/') || href.startsWith('//')) continue;
      const [camino, fragmento] = destino.split('#');
      if (paginas.has(camino)) {
        if (fragmento && !ids.get(camino)!.has(fragmento)) add(GATES.g4, archivo, `enlaza a ${destino}: el fragmento no existe`);
      } else if (!existsSync(join(dir, camino))) {
        const status = sitio.estados.get(camino);
        add(GATES.g4, archivo, `enlaza a ${camino}, ${status ? `que está «${status}»` : 'que no se generó'}`);
      }
    }

    /* gate 5 y D-XX: todo el HTML salvo el JSON-LD y el marcador de homónimo */
    const homonimos = raiz.querySelectorAll('[data-homonimo]');
    const visible = html
      .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')
      .replace(/<span[^>]*data-homonimo[^>]*>[^<]*<\/span>/g, '');
    for (const m of visible.matchAll(GRAFIA_PROHIBIDA)) add(GATES.g5, archivo, `«${m[0]}» en el HTML generado`);
    for (const { patron, motivo } of TERMINOS_PROHIBIDOS) for (const m of visible.matchAll(patron)) add(GATES.g5, archivo, `«${m[0]}» en el HTML generado: ${motivo}`);
    for (const m of visible.matchAll(/\bD-\d{2}\b/g)) add(GATES.g3, archivo, `código interno ${m[0]} visible en el HTML`);

    /* JSON-LD de la página: parsea, tiene marca y nodo de página, sin D-XX ni grafías prohibidas */
    const bloques = raiz.querySelectorAll('script[type="application/ld+json"]');
    if (!bloques.length) add(GATES.jsonld, archivo, 'no tiene bloque JSON-LD');
    for (const b of bloques) {
      let grafo: { '@graph'?: Nodo[] };
      try {
        grafo = JSON.parse(b.textContent);
      } catch (e) {
        add(GATES.jsonld, archivo, `JSON-LD inválido: ${(e as Error).message}`);
        continue;
      }
      const nodos = grafo['@graph'] ?? [];
      grafos.set(ruta, nodos);
      const marca = nodos.find((n) => n['@id'] === ID_MARCA);
      if (!marca) add(GATES.jsonld, archivo, 'falta el nodo de la marca-entidad');
      else {
        for (const campo of ['foundingDate', 'address']) {
          if (campo in marca) add(GATES.jsonld, archivo, `la marca-entidad tiene ${campo}: va solo en el nodo local (D-01)`);
        }
      }
      if (!nodos.some((n) => (n['@id'] as string)?.endsWith('#webpage') && n.url === `${SITIO}${ruta}`)) {
        add(GATES.jsonld, archivo, 'falta el nodo de la página con su URL canónica');
      }
      for (const [camino, texto] of strings(grafo)) {
        for (const m of texto.matchAll(/\bD-\d{2}\b/g)) add(GATES.g3, archivo, `código interno ${m[0]} en el JSON-LD (${camino.join('.')})`);
        if (!texto.match(GRAFIA_PROHIBIDA)) continue;
        const enPregunta = camino.at(-1) === 'name' && (nodos[Number(camino[1])]?.['@type'] === 'FAQPage');
        if (!(enPregunta && homonimos.length === 1)) add(GATES.g5, archivo, `grafía prohibida en el JSON-LD (${camino.join('.')})`);
      }
    }
  }

  problemas.push(...verificarGrafoDelSitio(grafos, sitio));
  return problemas;
}

/**
 * Verificaciones sobre la unión de los grafos de todas las páginas (fact-book §1.3):
 *   - la marca-entidad es la misma en todas las páginas;
 *   - subOrganization ↔ parentOrganization recíprocos;
 *   - toda referencia { "@id" } apunta a un nodo definido en algún grafo del sitio;
 *   - un nodo local se define solo en su página país y en la página T1.
 */
function verificarGrafoDelSitio(grafos: Map<string, Nodo[]>, sitio: Sitio): Problema[] {
  const problemas: Problema[] = [];
  const add = (mensaje: string, archivo = 'dist (JSON-LD del sitio)') => problemas.push({ gate: GATES.jsonld, archivo, mensaje });
  const fuente = (ruta: string) => sitio.publicadas.get(ruta)?.archivo ?? `dist${ruta}`;

  const definidos = new Map<string, { nodo: Nodo; rutas: string[] }>();
  for (const [ruta, nodos] of grafos) {
    for (const n of nodos) {
      const id = n['@id'] as string | undefined;
      if (!id) continue;
      const d = definidos.get(id) ?? { nodo: n, rutas: [] };
      d.rutas.push(ruta);
      definidos.set(id, d);
    }
  }

  const marcas = [...grafos].map(([ruta, nodos]) => [ruta, JSON.stringify(nodos.find((n) => n['@id'] === ID_MARCA) ?? null)] as const);
  const canonica = marcas[0]?.[1];
  for (const [ruta, m] of marcas) if (m !== canonica) add('la marca-entidad no es idéntica en todas las páginas', fuente(ruta));

  const marca = definidos.get(ID_MARCA)?.nodo;
  const subs = new Set(((marca?.subOrganization ?? []) as Nodo[]).map((s) => s['@id'] as string));
  const conPadre = [...definidos].filter(([, d]) => (d.nodo.parentOrganization as Nodo | undefined)?.['@id'] === ID_MARCA).map(([id]) => id);
  for (const id of subs) if (!conPadre.includes(id)) add(`subOrganization ${id} no está definido con parentOrganization → la marca`);
  for (const id of conPadre) if (!subs.has(id)) add(`${id} declara parentOrganization pero la marca no lo lista en subOrganization`);

  const referencias = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.flatMap(referencias);
    if (v && typeof v === 'object') {
      const o = v as Nodo;
      if (Object.keys(o).length === 1 && typeof o['@id'] === 'string') return [o['@id'] as string];
      return Object.values(o).flatMap(referencias);
    }
    return [];
  };
  for (const [ruta, nodos] of grafos) {
    for (const id of new Set(nodos.flatMap((n) => Object.values(n).flatMap(referencias)))) {
      if (!definidos.has(id)) add(`referencia a ${id}, que no está definido en ningún grafo del sitio`, fuente(ruta));
    }
  }

  for (const id of conPadre) {
    for (const ruta of definidos.get(id)!.rutas) {
      const p = sitio.publicadas.get(ruta);
      const propio = (definidos.get(id)!.nodo.url as string | undefined) === `${SITIO}${ruta}` || id.startsWith(`${SITIO}${ruta}#`);
      if (p?.plantilla !== 'T1' && !propio) add(`el nodo local ${id} se define en ${ruta}: va solo en su página país y en la T1`, fuente(ruta));
    }
  }
  return problemas;
}
