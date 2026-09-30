/**
 * Modelo del sitio publicado: qué páginas se generan y qué secciones de cada una se ven.
 * Lo usan la ruta de Astro, los endpoints de Fase 0, los gates y el test de aceptación,
 * para que todos razonen sobre exactamente el mismo conjunto.
 */
import { aplanar, cargarDudas, cargarEntidad, cargarSitemap, estaAbierta, type Dudas, type Entidad, type PaginaSitemap, type Sitemap, type Status } from './datos.ts';
import { listarArchivos, leerPagina, type PaginaLeida } from './contenido.ts';
import { PLANTILLAS, type DefSeccion, type IdPlantilla } from './plantillas.ts';
import type { Documento, Seccion } from './markdown.ts';

export interface SeccionVisible {
  def: DefSeccion;
  seccion: Seccion;
}

export interface PaginaPublicada {
  ruta: string;
  archivo: string;
  plantilla: IdPlantilla;
  frontmatter: Record<string, unknown>;
  cuerpo: string;
  documento: Documento;
  visibles: SeccionVisible[];
  /** Fragmentos que existen en el HTML generado: los ids de las secciones visibles. */
  ids: Set<string>;
  sitemap: PaginaSitemap & { padre: string | null };
}

export interface Sitio {
  sitemap: Sitemap;
  dudas: Dudas;
  entidad: Entidad;
  estados: Map<string, Status>;
  entradas: Map<string, PaginaSitemap & { padre: string | null }>;
  /** Todas las páginas con archivo, publicadas o no. */
  leidas: PaginaLeida[];
  /** Solo las que se generan: status ready en sitemap.json y con archivo. */
  publicadas: Map<string, PaginaPublicada>;
}

/**
 * Gate 3: una sección se ve si existe, no está vacía y ninguna de sus dudas (las de la
 * plantilla y las que agregue el front matter) sigue abierta. Sin placeholder: no se ve y ya.
 */
export function seccionesVisibles(
  plantilla: IdPlantilla,
  documento: Documento,
  gatesPagina: Record<string, string[]>,
  dudas: Dudas,
): SeccionVisible[] {
  const visibles: SeccionVisible[] = [];
  for (const def of PLANTILLAS[plantilla].secciones as readonly DefSeccion[]) {
    const seccion = documento.secciones.find((s) => s.nombre === def.nombre);
    if (!seccion || seccion.vacia) continue;
    const gates = [...(def.gate ?? []), ...(gatesPagina[def.nombre] ?? [])];
    if (gates.some((d) => estaAbierta(dudas, d))) continue;
    visibles.push({ def, seccion });
  }
  return visibles;
}

let cache: Sitio | null = null;

export function cargarSitio({ refrescar = false } = {}): Sitio {
  if (cache && !refrescar) return cache;
  const sitemap = cargarSitemap();
  const dudas = cargarDudas();
  const entidad = cargarEntidad();
  const entradas = new Map(aplanar(sitemap.pages).map((p) => [p.slug, p]));
  const estados = new Map([...entradas].map(([slug, p]) => [slug, p.status]));
  const leidas = listarArchivos().map(leerPagina);

  // En el orden de sitemap.json, que es el orden editorial del sitio.
  const porRuta = new Map(leidas.map((l) => [l.ruta, l]));
  const publicadas = new Map<string, PaginaPublicada>();
  for (const entrada of entradas.values()) {
    const l = porRuta.get(entrada.slug);
    if (!l || entrada.status !== 'ready') continue;
    const plantilla = l.frontmatter.template as IdPlantilla;
    if (!PLANTILLAS[plantilla]) continue; // el schema ya lo reporta
    const gates = (l.frontmatter.gates ?? {}) as Record<string, string[]>;
    const visibles = seccionesVisibles(plantilla, l.documento, gates, dudas);
    publicadas.set(l.ruta, {
      ruta: l.ruta,
      archivo: l.archivo,
      plantilla,
      frontmatter: l.frontmatter,
      cuerpo: l.cuerpo,
      documento: l.documento,
      visibles,
      ids: new Set(visibles.flatMap((v) => v.seccion.ids)),
      sitemap: entrada,
    });
  }

  cache = { sitemap, dudas, entidad, estados, entradas, leidas, publicadas };
  return cache;
}

/** La página de entidad única (T1 publicada). Home, T3 y T6 enlazan a ella. */
export function paginaEntidad(sitio: Sitio): PaginaPublicada | undefined {
  return [...sitio.publicadas.values()].find((p) => p.plantilla === 'T1' && p.sitemap.padre === null);
}

/** Hijos publicados de una página, para la grilla de T6. */
export function hijosPublicados(sitio: Sitio, ruta: string): PaginaPublicada[] {
  const entrada = sitio.entradas.get(ruta);
  return (entrada?.children ?? []).flatMap((c) => {
    const p = sitio.publicadas.get(c.slug);
    return p ? [p] : [];
  });
}

export function urlAbsoluta(sitioUrl: string, ruta: string): string {
  return `${sitioUrl}${ruta}`;
}
