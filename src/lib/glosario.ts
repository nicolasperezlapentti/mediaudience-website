/**
 * B-08 · glosario. Las definiciones viven en las páginas T4-glosario («Términos»); un
 * explicador T4 las referencia desde «Glosario relacionado» y el build trae la definición:
 * una sola fuente por término.
 */
import { aHtml, parsearReferenciasGlosario, parsearTerminos, type Termino } from './markdown.ts';
import { partirHref } from './navegacion.ts';
import type { PaginaPublicada, Sitio } from './sitio.ts';

export interface TerminoRender {
  id: string;
  termino: string;
  expansion: string | null;
  definicionHtml: string;
  enlace: { href: string; texto: string } | null;
}

export interface GrupoLetra {
  letra: string;
  id: string;
  terminos: TerminoRender[];
}

const idLetra = (letra: string) => `letra-${letra === 'Ñ' ? 'enie' : letra === '#' ? 'numeros' : letra.toLowerCase()}`;

const aRender = (t: Termino): TerminoRender => ({
  id: t.id,
  termino: t.termino,
  expansion: t.expansion,
  definicionHtml: aHtml(t.definicionNodos),
  enlace: t.enlace,
});

export function terminosDe(pagina: PaginaPublicada): Termino[] {
  const s = pagina.visibles.find((v) => v.def.nombre === 'Términos');
  return s ? parsearTerminos(s.seccion).terminos : [];
}

/** Agrupado por letra en orden alfabético español (la Ñ después de la N). Solo letras con términos. */
export function gruposPorLetra(pagina: PaginaPublicada): GrupoLetra[] {
  const orden = new Intl.Collator('es', { sensitivity: 'base' });
  const terminos = [...terminosDe(pagina)].sort((a, b) => orden.compare(a.termino, b.termino));
  const grupos = new Map<string, GrupoLetra>();
  for (const t of terminos) {
    const g = grupos.get(t.letra) ?? { letra: t.letra, id: idLetra(t.letra), terminos: [] };
    g.terminos.push(aRender(t));
    grupos.set(t.letra, g);
  }
  return [...grupos.values()].sort((a, b) => orden.compare(a.letra, b.letra));
}

export interface ReferenciaResuelta {
  termino: TerminoRender;
  /** La entrada en el glosario: «/recursos/glosario-adtech/#ctr». */
  href: string;
  glosario: string;
}

/** Resuelve cada referencia de «Glosario relacionado». Devuelve también las que no resuelven. */
export function resolverReferencias(sitio: Sitio, pagina: PaginaPublicada): { resueltas: ReferenciaResuelta[]; errores: string[] } {
  const s = pagina.visibles.find((v) => v.def.nombre === 'Glosario relacionado');
  if (!s) return { resueltas: [], errores: [] };
  const resueltas: ReferenciaResuelta[] = [];
  const errores: string[] = [];
  for (const r of parsearReferenciasGlosario(s.seccion).referencias) {
    const { ruta, fragmento } = partirHref(r.href);
    const destino = sitio.publicadas.get(ruta);
    if (!destino || destino.plantilla !== 'T4-glosario') {
      errores.push(`«${r.href}» no apunta a una página de glosario publicada (T4-glosario)`);
      continue;
    }
    const t = fragmento ? terminosDe(destino).find((x) => x.id === fragmento) : undefined;
    if (!t) {
      errores.push(`«${r.href}»: el glosario no tiene el término #${fragmento ?? '(sin ancla)'}`);
      continue;
    }
    resueltas.push({ termino: aRender(t), href: r.href, glosario: (destino.frontmatter as { title: string }).title });
  }
  return { resueltas, errores };
}
