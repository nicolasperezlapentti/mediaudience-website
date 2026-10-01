/**
 * Gates sobre la fuente: corren antes de que Astro lea una sola página, recorren TODO el
 * contenido y devuelven la lista completa de incumplimientos. El build falla si no está vacía.
 *
 *   gate 1  status: ready ↔ archivo, páginas huérfanas, coherencia con sitemap.json
 *   gate 2  secciones OBL ausentes o vacías (schema de Zod de la plantilla)
 *   gate 3  dudas D-XX inexistentes, gates mal declarados, plantillas bloqueadas enteras
 *   gate 4  enlaces internos a páginas no ready, fragmentos inexistentes, anchors vacíos
 *   gate 5  grafías prohibidas de la marca, términos fuera del portafolio, marca fuera de marca.ts
 *   tokens  valores de color, tamaño, espaciado o duración escritos a mano en src/
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { z } from 'astro/zod';
import { CONTENIDO, PAGINAS, RAIZ, SRC } from '../entorno.ts';
import { listarArchivos, leerPagina, type PaginaLeida } from '../contenido.ts';
import { aplanar, cargarSitemap, estaAbierta, type PaginaSitemap } from '../datos.ts';
import { esquemaPagina } from '../esquemas.ts';
import { GRAFIA_PROHIBIDA, MENCION_MARCA, SITIO, TERMINOS_PROHIBIDOS } from '../marca.ts';
import { parsearCta } from '../markdown.ts';
import { ANCLAS_VACIAS, partirHref, validarNavegacion } from '../navegacion.ts';
import { GATES, type Problema } from '../problemas.ts';
import { cargarSitio, paginaEntidad, type Sitio } from '../sitio.ts';
import { sociedadesLocales } from '../sociedades.ts';
import { resolverReferencias } from '../glosario.ts';
import { construirTrio } from '../trio.ts';

const rel = (abs: string) => relative(RAIZ, abs).split(sep).join('/');

/* ---------------- gate 1 · sitemap.json ↔ archivos ---------------- */

function verificarSitemap(paginas: readonly PaginaSitemap[]): Problema[] {
  const archivo = 'content/sitemap.json';
  const problemas: Problema[] = [];
  const add = (seccion: string, mensaje: string, gate: string = GATES.g1) => problemas.push({ gate, archivo, seccion, mensaje });
  const vistos = new Set<string>();

  for (const p of aplanar(paginas)) {
    if (vistos.has(p.slug)) add(p.slug, 'slug duplicado');
    vistos.add(p.slug);
    if (p.padre && !p.slug.startsWith(p.padre)) add(p.slug, `cuelga de ${p.padre} pero su URL no: los hijos cuelgan de su hub`);
    const bloqueos = p.blockedBy ?? [];
    if ((p.status === 'blocked' || p.status === 'partial') && !bloqueos.length) {
      add(p.slug, `status «${p.status}» sin blockedBy: nombrá la duda D-XX que lo bloquea`, GATES.g3);
    }
    if ((p.status === 'ready' || p.status === 'draft') && bloqueos.length) {
      add(p.slug, `status «${p.status}» con blockedBy ${bloqueos.join(', ')}: si una duda lo bloquea, es blocked`, GATES.g3);
    }
  }
  return problemas;
}

function verificarArchivos(sitio: Sitio, leidas: PaginaLeida[]): Problema[] {
  const problemas: Problema[] = [];
  const porRuta = new Map<string, PaginaLeida[]>();
  for (const l of leidas) porRuta.set(l.ruta, [...(porRuta.get(l.ruta) ?? []), l]);

  for (const [ruta, lista] of porRuta) {
    if (lista.length > 1) {
      problemas.push({ gate: GATES.g1, archivo: lista.map((l) => l.archivo).join(' y '), mensaje: `dos archivos derivan la misma URL ${ruta}` });
    }
    const l = lista[0];
    const entrada = sitio.entradas.get(ruta);
    if (!entrada) {
      problemas.push({ gate: GATES.g1, archivo: l.archivo, mensaje: `deriva la URL ${ruta}, que no existe en sitemap.json` });
    } else if (entrada.status !== 'ready' && l.frontmatter.status !== entrada.status) {
      problemas.push({ gate: GATES.g1, archivo: l.archivo, mensaje: `status «${String(l.frontmatter.status)}» distinto del de sitemap.json («${entrada.status}»)` });
    }
  }

  for (const [slug, entrada] of sitio.entradas) {
    if (entrada.status === 'ready' && !porRuta.has(slug)) {
      problemas.push({
        gate: GATES.g1,
        archivo: 'content/sitemap.json',
        seccion: slug,
        mensaje: `está ready pero no existe su archivo (content/paginas${slug === '/' ? '/index' : slug.slice(0, -1)}.md o …/index.md). Escribilo o cambiá su status a draft`,
      });
    }
  }

  const sociedades = new Set(sociedadesLocales(sitio).map((s) => s.slug));
  const conContacto = new Set(sociedadesLocales(sitio).filter((s) => s.contacto).map((s) => s.slug));
  for (const p of sitio.publicadas.values()) {
    if (p.plantilla === 'T3' && sociedades.has(p.ruta) && !conContacto.has(p.ruta)) {
      problemas.push({
        gate: GATES.g2,
        archivo: p.archivo,
        seccion: 'Contacto local (B-10)',
        mensaje: `T3 exige el contacto comercial del mercado en content/entidad.json (correo institucional o teléfono, sin dudas abiertas) para ${p.ruta}`,
      });
    }
    if (p.plantilla === 'T3' && !sociedades.has(p.ruta)) {
      problemas.push({
        gate: GATES.g2,
        archivo: p.archivo,
        seccion: 'Información legal (B-04)',
        mensaje: `T3 exige la sociedad local publicable en content/entidad.json (slug ${p.ruta}: razón social, fecha de constitución y domicilio, sin dudas abiertas)`,
      });
    }
  }

  if (sitio.publicadas.has('/') && !paginaEntidad(sitio)) {
    problemas.push({ gate: GATES.g1, archivo: 'content/sitemap.json', seccion: '/', mensaje: 'la home no se genera sin una página T1 (entidad) publicada: su bloque de entidad enlazaría a un 404' });
  }
  return problemas;
}

/* ---------------- gate 2 y 3 · schema de Zod de cada página publicada ---------------- */

function problemaDeIssue(archivo: string, issue: z.core.$ZodIssue): Problema {
  const [raiz, sub, nombre] = issue.path.map(String);
  const params = (issue as { params?: { gate?: string } }).params;
  if (raiz === 'estructura' && sub === 'secciones' && nombre) {
    return { gate: params?.gate ?? GATES.g2, archivo, seccion: nombre, mensaje: issue.message };
  }
  return { gate: params?.gate ?? GATES.estructura, archivo, seccion: issue.path.length ? issue.path.join('.') : undefined, mensaje: issue.message };
}

function verificarEsquemas(sitio: Sitio, leidas: PaginaLeida[]): Problema[] {
  return leidas
    .filter((l) => sitio.entradas.get(l.ruta)?.status === 'ready')
    .flatMap((l) => {
      const r = esquemaPagina.safeParse(l.datos);
      return r.success ? [] : r.error.issues.map((i) => problemaDeIssue(l.archivo, i));
    });
}

/* ---------------- gate 4 · enlaces del contenido publicado ---------------- */

export function verificarEnlaces(sitio: Sitio): Problema[] {
  const problemas: Problema[] = [];
  for (const pagina of sitio.publicadas.values()) {
    for (const { def, seccion } of pagina.visibles) {
      const add = (mensaje: string) => problemas.push({ gate: GATES.g4, archivo: pagina.archivo, seccion: def.nombre, mensaje });
      const esCta = def.nombre === 'CTA de cierre';
      if (esCta) {
        const cta = parsearCta(seccion);
        if (cta && ANCLAS_VACIAS.test(cta.texto)) add(`el llamado «${cta.texto}» no describe el destino`);
      }

      if (def.bloque === 'B-09') {
        for (const e of construirTrio(sitio, pagina, seccion).errores) problemas.push({ gate: GATES.g2, archivo: pagina.archivo, seccion: def.nombre, mensaje: e });
      }

      if (def.nombre === 'Glosario relacionado') {
        for (const e of resolverReferencias(sitio, pagina).errores) add(e);
      }

      for (const { url, texto } of seccion.enlaces) {
        if (/^(mailto|tel):/.test(url)) continue;
        if (!esCta && ANCLAS_VACIAS.test(texto)) add(`anchor «${texto}» no describe el destino (${url})`);

        let destino = url;
        if (/^https?:\/\//.test(url)) {
          if (!url.startsWith(`${SITIO}/`)) continue; // externo
          destino = url.slice(SITIO.length);
        }
        if (destino.startsWith('#')) {
          if (!pagina.ids.has(destino.slice(1))) add(`el fragmento ${destino} no existe en esta página`);
          continue;
        }
        if (!destino.startsWith('/')) {
          add(`enlace relativo «${url}»: los enlaces internos van con ruta absoluta (/soluciones/…/)`);
          continue;
        }
        const { ruta, fragmento } = partirHref(destino);
        if (!ruta.endsWith('/')) {
          add(`«${url}» sin barra final: la URL canónica termina en /`);
          continue;
        }
        const status = sitio.estados.get(ruta);
        if (!status) add(`enlaza a ${ruta}, que no existe en sitemap.json`);
        else if (status !== 'ready') add(`enlaza a ${ruta}, que está «${status}»`);
        else if (fragmento && !sitio.publicadas.get(ruta)?.ids.has(fragmento)) add(`el fragmento #${fragmento} no existe en ${ruta}`);
      }
    }
  }
  return problemas;
}

/* ---------------- gate 5 · marca ---------------- */

function listarRecursivo(dir: string, extensiones: RegExp): string[] {
  let entradas: string[];
  try {
    entradas = readdirSync(dir);
  } catch {
    return [];
  }
  return entradas.flatMap((n) => {
    const ruta = join(dir, n);
    if (statSync(ruta).isDirectory()) return listarRecursivo(ruta, extensiones);
    return extensiones.test(n) ? [ruta] : [];
  });
}

const linea = (texto: string, indice: number) => texto.slice(0, indice).split('\n').length;

export function archivosDeContenido(): string[] {
  return [...listarArchivos(PAGINAS), ...listarRecursivo(CONTENIDO, /\.json$/).filter((f) => !f.startsWith(PAGINAS))];
}

export function archivosDePlantilla(): string[] {
  return [...listarRecursivo(SRC, /\.(astro|ts|tsx|js|mjs|css|md|mdx|json)$/), join(RAIZ, 'astro.config.mjs')];
}

export function verificarMarca(): Problema[] {
  const problemas: Problema[] = [];
  const marcaTs = join(SRC, 'lib', 'marca.ts');
  const escanear = (abs: string, esPlantilla: boolean) => {
    if (abs === marcaTs) return;
    let texto: string;
    try {
      texto = readFileSync(abs, 'utf8');
    } catch {
      return;
    }
    const archivo = rel(abs);
    for (const m of texto.matchAll(GRAFIA_PROHIBIDA)) {
      problemas.push({ gate: GATES.g5, archivo: `${archivo}:${linea(texto, m.index)}`, mensaje: `«${m[0]}»: la marca es una sola palabra` });
    }
    for (const { patron, motivo, soloSalida } of TERMINOS_PROHIBIDOS) {
      if (soloSalida) continue;
      for (const m of texto.matchAll(patron)) problemas.push({ gate: GATES.g5, archivo: `${archivo}:${linea(texto, m.index)}`, mensaje: `«${m[0]}»: ${motivo}` });
    }
    if (esPlantilla) {
      for (const m of texto.matchAll(MENCION_MARCA)) {
        problemas.push({ gate: GATES.g5, archivo: `${archivo}:${linea(texto, m.index)}`, mensaje: `«${m[0]}» escrito a mano: la marca sale de src/lib/marca.ts` });
      }
    }
  };
  for (const f of archivosDeContenido()) escanear(f, false);
  for (const f of archivosDePlantilla()) escanear(f, true);
  return problemas;
}

/* ---------------- tokens y enlaces hardcodeados en plantillas ---------------- */

const VALOR_PROHIBIDO: [RegExp, string][] = [
  [/#[0-9a-f]{3,8}\b/i, 'color hexadecimal'],
  [/\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color-mix)\(/i, 'función de color'],
  [/\b(?:white|black|red|blue|green|gray|grey|silver|navy|orange|yellow|purple|pink)\b/i, 'color con nombre'],
  [/(?<![\w.-])-?\d*\.?\d+(?:px|rem|em|ch|ex|vh|vw|vmin|vmax|svh|dvh|lvh|pt|pc|cm|mm|in)\b/i, 'longitud'],
  [/(?<![\w.-])\d*\.?\d+m?s\b/i, 'duración'],
];

function cssDe(archivo: string, texto: string): string[] {
  if (archivo.endsWith('.css')) return [texto];
  const bloques = [...texto.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
  const inline = [...texto.matchAll(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/g)].map((m) => m[1] ?? m[2] ?? m[3]);
  return [...bloques, ...inline];
}

/**
 * var() no funciona dentro de @media: ahí los breakpoints se escriben literales, y solo se
 * admiten los de tokens.json → layout.breakpoints (sintaxis de rango: `(width < 900px)`).
 */
function breakpoints(): Set<string> {
  const tokens = JSON.parse(readFileSync(join(RAIZ, 'design', 'tokens.json'), 'utf8')) as { layout: { breakpoints: Record<string, string> } };
  return new Set(Object.values(tokens.layout.breakpoints));
}

export function verificarPlantillas(): Problema[] {
  const problemas: Problema[] = [];
  const permitidos = breakpoints();
  for (const abs of listarRecursivo(SRC, /\.(astro|css)$/)) {
    const texto = readFileSync(abs, 'utf8');
    const archivo = rel(abs);
    for (const css of cssDe(archivo, texto)) {
      const sinComentarios = css.replace(/\/\*[\s\S]*?\*\//g, '');
      for (const m of sinComentarios.matchAll(/@media([^{]+)\{/g)) {
        for (const valor of m[1].matchAll(/\d*\.?\d+[a-z]+/gi)) {
          if (!permitidos.has(valor[0])) {
            problemas.push({ gate: GATES.tokens, archivo, mensaje: `@media${m[1].trimEnd()}: ${valor[0]} no es un breakpoint de tokens.json (${[...permitidos].join(', ')})` });
          }
        }
      }
      const declaraciones = sinComentarios.replace(/@media[^{]+\{/g, '{');
      for (const m of declaraciones.matchAll(/([a-z-]+)\s*:\s*([^;{}]+)/gi)) {
        for (const [patron, tipo] of VALOR_PROHIBIDO) {
          const hallado = m[2].match(patron);
          if (hallado) {
            problemas.push({ gate: GATES.tokens, archivo, mensaje: `${m[1]}: «${m[2].trim()}» — ${tipo} escrito a mano (${hallado[0]}). Usá una custom property --ma-*` });
          }
        }
        if (/--mau-/.test(m[2])) problemas.push({ gate: GATES.tokens, archivo, mensaje: `${m[1]}: los alias --mau-* son de compatibilidad; en código nuevo, --ma-*` });
      }
    }
    if (archivo.endsWith('.astro')) {
      for (const m of texto.matchAll(/\bhref\s*=\s*["'`]([^"'`]*)["'`]/g)) {
        problemas.push({ gate: GATES.g4, archivo: `${archivo}:${linea(texto, m.index)}`, mensaje: `href="${m[1]}" escrito a mano: los enlaces se derivan de sitemap.json` });
      }
    }
  }
  return problemas;
}

/* ---------------- entrada ---------------- */

export function verificarFuente(): Problema[] {
  const problemas: Problema[] = [];

  let paginasSitemap: PaginaSitemap[];
  try {
    paginasSitemap = cargarSitemap().pages;
  } catch (e) {
    return [{ gate: GATES.estructura, archivo: 'content/sitemap.json', mensaje: (e as Error).message }];
  }
  problemas.push(...verificarSitemap(paginasSitemap));

  const leidas: PaginaLeida[] = [];
  for (const abs of listarArchivos()) {
    try {
      leidas.push(leerPagina(abs));
    } catch (e) {
      problemas.push({ gate: GATES.estructura, archivo: rel(abs), mensaje: (e as Error).message });
    }
  }

  let sitio: Sitio | null = null;
  if (problemas.every((p) => p.gate !== GATES.estructura)) {
    try {
      sitio = cargarSitio({ refrescar: true });
    } catch (e) {
      problemas.push({ gate: GATES.estructura, archivo: 'content/', mensaje: (e as Error).message });
    }
  }

  if (sitio) {
    problemas.push(...verificarArchivos(sitio, leidas));
    problemas.push(...verificarEsquemas(sitio, leidas));
    problemas.push(...verificarEnlaces(sitio));
    problemas.push(...validarNavegacion(sitio));
    for (const [slug, entrada] of sitio.entradas) {
      for (const d of entrada.blockedBy ?? []) {
        if (!sitio.dudas[d]) problemas.push({ gate: GATES.g3, archivo: 'content/sitemap.json', seccion: slug, mensaje: `${d} no existe en content/dudas.json` });
      }
      if (entrada.status === 'blocked' && (entrada.blockedBy ?? []).every((d) => !estaAbierta(sitio.dudas, d))) {
        problemas.push({ gate: GATES.g3, archivo: 'content/sitemap.json', seccion: slug, mensaje: `blocked por ${entrada.blockedBy?.join(', ')}, que ya están cerradas: revisá su status` });
      }
    }
  }

  problemas.push(...verificarMarca());
  problemas.push(...verificarPlantillas());
  return problemas;
}
