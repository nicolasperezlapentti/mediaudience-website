/**
 * Modelo de render de una página publicada: lo que la ruta de Astro vuelca al HTML.
 * Andamiaje de Fase A: marcado semántico sin componentes visuales. En Fase B cada sección
 * pasa a su bloque (B-01…B-11) sin cambiar este contrato.
 */
import type { RootContent } from 'mdast';
import { DESCRIPTOR, SITIO, tituloDocumento } from './marca.ts';
import { aHtml, answerTarget, parsearCta } from './markdown.ts';
import { grafoPagina, serializarJsonLd } from './jsonld.ts';
import { hijosPublicados, paginaEntidad, type Sitio } from './sitio.ts';

export interface EnlaceGenerado {
  href: string;
  texto: string;
  descripcion?: string;
}

export interface SeccionRender {
  id: string;
  titulo: string | null;
  html: string;
}

export interface ModeloPagina {
  titulo: string;
  descripcion: string;
  canonica: string;
  h1: string;
  answerTargetHtml: string;
  secciones: SeccionRender[];
  entidad: { descriptor: string | null; enlace: EnlaceGenerado } | null;
  hijos: EnlaceGenerado[];
  jsonld: string;
}

export function modeloPagina(sitio: Sitio, ruta: string): ModeloPagina {
  const pagina = sitio.publicadas.get(ruta);
  if (!pagina) throw new Error(`modeloPagina: ${ruta} no está publicada`);
  const fm = pagina.frontmatter as { title: string; metaDescription: string };

  let answerTargetHtml = '';
  const secciones: SeccionRender[] = [];
  for (const { def, seccion } of pagina.visibles) {
    let nodos: RootContent[] = seccion.nodos;
    if (def.nombre === 'Respuesta directa') {
      const at = answerTarget(seccion);
      if (at) {
        // El <p> lo pone la ruta, con data-answer-target: acá va solo su contenido.
        answerTargetHtml = aHtml([at.nodo]).replace(/^<p>|<\/p>$/g, '');
        nodos = nodos.slice(1);
      }
    }
    let html = aHtml(nodos);
    if (def.nombre === 'CTA de cierre') {
      const cta = parsearCta(seccion);
      if (cta) {
        html = aHtml([{ type: 'paragraph', children: [{ type: 'link', url: cta.href, children: [{ type: 'text', value: cta.texto }] }] }]);
      }
    }
    if (!html) continue;
    secciones.push({ id: seccion.id, titulo: def.titulo === false ? null : def.nombre, html });
  }

  const t1 = paginaEntidad(sitio);
  const enlaceT1 = t1 && t1.ruta !== ruta ? { href: t1.ruta, texto: (t1.frontmatter as { title: string }).title } : null;
  const entidad =
    enlaceT1 && pagina.plantilla === 'home'
      ? { descriptor: DESCRIPTOR, enlace: enlaceT1 }
      : enlaceT1 && (pagina.plantilla === 'T3' || pagina.plantilla === 'T6')
        ? { descriptor: null, enlace: enlaceT1 }
        : null;

  const hijos =
    pagina.plantilla === 'T6'
      ? hijosPublicados(sitio, ruta).map((h) => {
          const f = h.frontmatter as { title: string; metaDescription: string };
          return { href: h.ruta, texto: f.title, descripcion: f.metaDescription };
        })
      : [];

  return {
    titulo: tituloDocumento(fm.title),
    descripcion: fm.metaDescription,
    canonica: `${SITIO}${ruta}`,
    h1: pagina.documento.h1 ?? fm.title,
    answerTargetHtml,
    secciones,
    entidad,
    hijos,
    jsonld: serializarJsonLd(grafoPagina(sitio, pagina)),
  };
}
