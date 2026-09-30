/**
 * Header y footer se derivan de sitemap.json → navegacion. Ninguna plantilla escribe un href.
 *
 * Las cuatro facetas (Objetivos · Productos · Canales · Herramientas) apuntan al mismo
 * conjunto de URLs canónicas; Objetivos y Herramientas, a fragmentos de esas páginas
 * (PLANTILLAS §1.2). Un ítem se muestra solo si su destino está ready; un grupo sin ítems
 * visibles no se muestra.
 */
import type { ItemNavDatos } from './datos.ts';
import { GATES, type Problema } from './problemas.ts';
import type { Sitio } from './sitio.ts';

export interface ItemNav extends ItemNavDatos {
  ruta: string;
  fragmento: string | null;
}

export interface GrupoNav {
  clave: string;
  label: string;
  items: ItemNav[];
}

export interface Navegacion {
  header: GrupoNav[];
  cta: ItemNav | null;
  footer: GrupoNav[];
  mercados: GrupoNav | null;
  legal: GrupoNav | null;
}

/** Textos de enlace que no dicen nada (PLANTILLAS §5.8). */
export const ANCLAS_VACIAS = /^(ver m[aá]s|leer m[aá]s|saber m[aá]s|m[aá]s informaci[oó]n|clic aqu[ií]|click aqu[ií]|haz clic( aqu[ií])?|hac[eé] clic( aqu[ií])?|aqu[ií]|ac[aá]|enlace|link|click here|read more|here)$/i;

export function partirHref(href: string): { ruta: string; fragmento: string | null } {
  const [ruta, fragmento] = href.split('#');
  return { ruta, fragmento: fragmento ?? null };
}

const item = (datos: ItemNavDatos): ItemNav => ({ ...datos, ...partirHref(datos.href) });

export function construirNavegacion(sitio: Sitio): Navegacion {
  const { navegacion } = sitio.sitemap;
  const publicado = (i: ItemNav) => sitio.publicadas.has(i.ruta);
  const grupo = (clave: string): GrupoNav | null => {
    const g = navegacion.grupos[clave];
    if (!g) return null;
    const items = g.items.map(item).filter(publicado);
    return items.length ? { clave, label: g.label, items } : null;
  };
  const cta = item(navegacion.headerCta);
  return {
    header: navegacion.header.flatMap((c) => grupo(c) ?? []),
    cta: publicado(cta) ? cta : null,
    footer: navegacion.footer.flatMap((c) => grupo(c) ?? []),
    mercados: grupo(navegacion.footerMercados),
    legal: grupo(navegacion.footerLegal),
  };
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

  const referidos = [...navegacion.header, ...navegacion.footer, navegacion.footerMercados, navegacion.footerLegal];
  for (const clave of referidos) if (!navegacion.grupos[clave]) add(`navegacion.${clave}`, 'grupo inexistente en navegacion.grupos');

  const todos: [string, ItemNavDatos][] = [
    ...Object.values(navegacion.grupos).flatMap((g) => g.items.map((i): [string, ItemNavDatos] => [`${g.label} › ${i.label}`, i])),
    ['headerCta', navegacion.headerCta],
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
