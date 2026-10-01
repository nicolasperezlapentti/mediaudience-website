/**
 * Header y footer se derivan de sitemap.json → navegacion. Ninguna plantilla escribe un href.
 *
 * Las cuatro facetas (Objetivos · Productos · Canales · Herramientas) apuntan al mismo
 * conjunto de URLs canónicas; Objetivos y Herramientas, a fragmentos de esas páginas
 * (PLANTILLAS §1.2). En el header se agrupan en el mega-menú «Soluciones», una columna por
 * faceta (design/referencia/navegacion.html); en el footer son columnas propias.
 *
 * Un ítem se muestra solo si su destino está ready; un grupo sin ítems visibles no se muestra.
 * El texto del enlace es el anchor descriptivo de §1.2; el nombre del ítem va como etiqueta
 * aparte, y solo cuando el anchor no lo contiene ya.
 */
import type { ItemNavDatos } from './datos.ts';
import { GATES, type Problema } from './problemas.ts';
import type { Sitio } from './sitio.ts';

export interface ItemNav extends ItemNavDatos {
  ruta: string;
  fragmento: string | null;
  /** Etiqueta a mostrar además del anchor, o null si el anchor ya la dice. */
  etiqueta: string | null;
}

export interface GrupoNav {
  clave: string;
  label: string;
  items: ItemNav[];
}

export type EntradaHeader =
  | { tipo: 'mega'; clave: string; label: string; columnas: GrupoNav[]; nota: string; todas: ItemNav | null; rutas: string[] }
  | { tipo: 'dropdown'; clave: string; label: string; grupo: GrupoNav; rutas: string[] };

export interface Navegacion {
  inicio: string | null;
  header: EntradaHeader[];
  cta: ItemNav | null;
  footer: GrupoNav[];
  contacto: ItemNav | null;
  mercados: GrupoNav | null;
  legal: GrupoNav | null;
}

/** Textos de enlace que no dicen nada (PLANTILLAS §5.8). */
export const ANCLAS_VACIAS = /^(ver m[aá]s|leer m[aá]s|saber m[aá]s|m[aá]s informaci[oó]n|clic aqu[ií]|click aqu[ií]|haz clic( aqu[ií])?|hac[eé] clic( aqu[ií])?|aqu[ií]|ac[aá]|enlace|link|click here|read more|here)$/i;

export function partirHref(href: string): { ruta: string; fragmento: string | null } {
  const [ruta, fragmento] = href.split('#');
  return { ruta, fragmento: fragmento ?? null };
}

const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

function item(datos: ItemNavDatos): ItemNav {
  const etiqueta = normalizar(datos.anchor).includes(normalizar(datos.label)) ? null : datos.label;
  return { ...datos, ...partirHref(datos.href), etiqueta };
}

export function construirNavegacion(sitio: Sitio): Navegacion {
  const { navegacion } = sitio.sitemap;
  const publicado = (i: ItemNav) => sitio.publicadas.has(i.ruta);
  const grupo = (clave: string, label?: string): GrupoNav | null => {
    const g = navegacion.grupos[clave];
    if (!g) return null;
    const items = g.items.map(item).filter(publicado);
    return items.length ? { clave, label: label ?? g.label, items } : null;
  };
  const siPublicado = (datos: ItemNavDatos) => {
    const i = item(datos);
    return publicado(i) ? i : null;
  };

  const header = navegacion.header.flatMap((e): EntradaHeader[] => {
    if (e.tipo === 'mega') {
      const columnas = e.columnas.flatMap((c) => grupo(c.grupo, c.label) ?? []);
      if (!columnas.length) return [];
      const todas = siPublicado(e.todas);
      const rutas = [...columnas.flatMap((c) => c.items.map((i) => i.ruta)), ...(todas ? [todas.ruta] : [])];
      return [{ tipo: 'mega', clave: e.label, label: e.label, columnas, nota: e.nota, todas, rutas }];
    }
    const g = grupo(e.grupo);
    return g ? [{ tipo: 'dropdown', clave: g.clave, label: g.label, grupo: g, rutas: g.items.map((i) => i.ruta) }] : [];
  });

  return {
    inicio: sitio.publicadas.has('/') ? '/' : null,
    header,
    cta: siPublicado(navegacion.headerCta),
    footer: navegacion.footer.flatMap((c) => grupo(c) ?? []),
    contacto: siPublicado(navegacion.footerContacto),
    mercados: grupo(navegacion.footerMercados),
    legal: grupo(navegacion.footerLegal),
  };
}

export interface EjeHome {
  clave: string;
  numero: string;
  label: string;
  items: ItemNav[];
}

/**
 * Resúmenes de los cuatro ejes en la home (PLANTILLAS §1.5): las columnas del mega-menú, con
 * el nombre de cada grupo («Objetivos», no «Por objetivo») y solo los ítems con destino ready.
 * Un eje sin ítems no aparece. La numeración es la del orden del mega-menú.
 */
export function ejesHome(sitio: Sitio): { titulo: string; nota: string; ejes: EjeHome[] } | null {
  const mega = sitio.sitemap.navegacion.header.find((e) => e.tipo === 'mega');
  if (!mega || mega.tipo !== 'mega') return null;
  const ejes = mega.columnas.flatMap((c, i): EjeHome[] => {
    const g = sitio.sitemap.navegacion.grupos[c.grupo];
    const items = (g?.items ?? []).map(item).filter((x) => sitio.publicadas.has(x.ruta));
    return items.length ? [{ clave: c.grupo, numero: String(i + 1).padStart(2, '0'), label: g.label, items }] : [];
  });
  return ejes.length ? { titulo: mega.label, nota: mega.nota, ejes } : null;
}

/**
 * La entrada del header que corresponde a la página actual: la que contiene su ruta, o —en
 * el mega— cualquier página bajo la ruta de «todas» (una solución que no figura en el menú).
 */
export function entradaActual(nav: Navegacion, actual: string): string | null {
  for (const e of nav.header) if (e.rutas.includes(actual)) return e.clave;
  for (const e of nav.header) if (e.tipo === 'mega' && e.todas && actual.startsWith(e.todas.ruta)) return e.clave;
  return null;
}

/**
 * Valida los datos de navegación completos (no solo lo visible): un destino que no existe en
 * sitemap.json, un ancla sola como destino, un anchor vacío de sentido o un fragmento que no
 * existe en una página ready rompen el build.
 */
export function validarNavegacion(sitio: Sitio): Problema[] {
  const { navegacion } = sitio.sitemap;
  const archivo = 'content/sitemap.json';
  const problemas: Problema[] = [];
  const add = (seccion: string, mensaje: string, gate: string = GATES.navegacion) => problemas.push({ gate, archivo, seccion, mensaje });

  const referidos = [
    ...navegacion.header.flatMap((e) => (e.tipo === 'mega' ? e.columnas.map((c) => c.grupo) : [e.grupo])),
    ...navegacion.footer,
    navegacion.footerMercados,
    navegacion.footerLegal,
  ];
  for (const clave of referidos) if (!navegacion.grupos[clave]) add(`navegacion.${clave}`, 'grupo inexistente en navegacion.grupos');

  const todos: [string, ItemNavDatos][] = [
    ...Object.values(navegacion.grupos).flatMap((g) => g.items.map((i): [string, ItemNavDatos] => [`${g.label} › ${i.label}`, i])),
    ...navegacion.header.flatMap((e): [string, ItemNavDatos][] => (e.tipo === 'mega' ? [[`${e.label} › ${e.todas.label}`, e.todas]] : [])),
    ['headerCta', navegacion.headerCta],
    ['footerContacto', navegacion.footerContacto],
  ];
  for (const [donde, datos] of todos) {
    const { ruta, fragmento } = partirHref(datos.href);
    if (!ruta) {
      add(donde, `«${datos.href}» es un ancla sola: la navegación apunta a URLs, nunca a #secciones`);
      continue;
    }
    if (ANCLAS_VACIAS.test(datos.anchor.trim())) add(donde, `anchor «${datos.anchor}» no describe el destino`);
    const status = sitio.estados.get(ruta);
    if (!status) {
      add(donde, `${ruta} no existe en sitemap.json`, GATES.g4);
      continue;
    }
    const destino = sitio.publicadas.get(ruta);
    if (destino && fragmento && !destino.ids.has(fragmento)) {
      add(donde, `el fragmento #${fragmento} no existe en ${ruta} (${destino.archivo}); fragmentos disponibles: ${[...destino.ids].map((i) => `#${i}`).join(' ')}`, GATES.g4);
    }
  }
  return problemas;
}
