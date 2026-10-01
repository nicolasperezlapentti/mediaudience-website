/**
 * Modelo de render de una página publicada: lo que la ruta de Astro vuelca al HTML.
 * Andamiaje de Fase A: marcado semántico sin componentes visuales. En Fase B cada sección
 * pasa a su bloque (B-01…B-11) sin cambiar este contrato.
 */
import type { RootContent } from 'mdast';
import { SITIO, tituloDocumento } from './marca.ts';
import { ejesHome } from './navegacion.ts';
import { aHtml, aHtmlEnLinea, answerTarget, parsearCta, parsearFaq } from './markdown.ts';
import { grafoPagina, serializarJsonLd } from './jsonld.ts';
import { hijosPublicados, paginaEntidad, type Sitio } from './sitio.ts';
import { sociedadesLocales, type SociedadLocal } from './sociedades.ts';
import { gruposPorLetra, resolverReferencias, type GrupoLetra, type ReferenciaResuelta } from './glosario.ts';
import { construirTrio, type Trio } from './trio.ts';
import { PLANTILLAS, type DefSeccion } from './plantillas.ts';

export interface EnlaceGenerado {
  href: string;
  texto: string;
  descripcion?: string;
}

export interface SeccionRender {
  id: string;
  titulo: string | null;
  html: string;
  /** B-03: filas generadas desde entidad.json, al final de la sección que declara el bloque. */
  sociedades?: SociedadLocal[];
  /** B-08: el glosario agrupado por letra (Términos) o las cards de «Glosario relacionado». Reemplazan a `html`. */
  glosario?: { ruta: string; grupos: GrupoLetra[] };
  glosarioRelacionado?: ReferenciaResuelta[];
  /** B-10: contacto local generado desde entidad.json; `html` es su introducción. */
  contacto?: SociedadLocal;
  /** B-09: el selector de productos del hub, armado desde su tabla. Reemplaza a `html`. */
  trio?: Trio & { ruta: string };
  /** B-05: pares pregunta/respuesta ya renderizados. Si está, reemplaza a `html`. */
  faq?: { variante: 'acordeon' | 'lista'; items: { preguntaHtml: string; respuestaHtml: string }[] };
}

export interface Cabecera {
  /** id de la sección «Respuesta directa», para que siga siendo destino de fragmento. */
  id: string;
  /** Etiquetas de navegación desde la sección raíz hasta la página: «Mercados · Ecuador». */
  eyebrow: string[];
  h1: string;
  /** B-01: primer párrafo de «Respuesta directa», una sola oración. */
  answerTargetHtml: string;
  /** El resto de «Respuesta directa». */
  continuacionHtml: string;
}

export interface ModeloPagina {
  titulo: string;
  descripcion: string;
  canonica: string;
  cabecera: Cabecera;
  secciones: SeccionRender[];
  /** Enlace a la entidad única (home, T3, T6). En la home lleva el answer target de la página T1. */
  entidad: { textoHtml: string | null; enlace: EnlaceGenerado } | null;
  hijos: EnlaceGenerado[];
  /** Home: «Datos clave» va en el hero; los cuatro ejes, como resúmenes (PLANTILLAS §1.5). */
  home: { datosClave: SeccionRender | null; ejes: ReturnType<typeof ejesHome> } | null;
  /** B-04: la sociedad local de una página país, al pie. */
  legal: SociedadLocal | null;
  jsonld: string;
}

/** Etiquetas de navegación de la cadena de ancestros, sin la home. Texto, no enlaces. */
function eyebrow(sitio: Sitio, ruta: string): string[] {
  const cadena: string[] = [];
  for (let r: string | null = ruta; r && r !== '/'; r = sitio.entradas.get(r)?.padre ?? null) {
    const e = sitio.entradas.get(r);
    if (e) cadena.unshift(e.nav?.label ?? e.title);
  }
  return cadena;
}

export function modeloPagina(sitio: Sitio, ruta: string): ModeloPagina {
  const pagina = sitio.publicadas.get(ruta);
  if (!pagina) throw new Error(`modeloPagina: ${ruta} no está publicada`);
  const fm = pagina.frontmatter as { title: string; metaDescription: string };

  const cabecera: Cabecera = {
    id: 'respuesta-directa',
    eyebrow: eyebrow(sitio, ruta),
    h1: pagina.documento.h1 ?? fm.title,
    answerTargetHtml: '',
    continuacionHtml: '',
  };
  const secciones: SeccionRender[] = [];
  for (const { def, seccion } of pagina.visibles) {
    const nodos: RootContent[] = seccion.nodos;
    if (def.nombre === 'Respuesta directa') {
      const at = answerTarget(seccion);
      cabecera.id = seccion.id;
      if (at) {
        // El <p> lo pone <AnswerTarget />, con data-answer-target: acá va solo su contenido.
        cabecera.answerTargetHtml = at.nodo.type === 'paragraph' ? aHtmlEnLinea(at.nodo.children as RootContent[]) : '';
        cabecera.continuacionHtml = aHtml(nodos.slice(1));
      }
      continue;
    }
    let html = aHtml(nodos);
    if (def.nombre === 'CTA de cierre') {
      const cta = parsearCta(seccion);
      if (cta) {
        html = aHtml([{ type: 'paragraph', children: [{ type: 'link', url: cta.href, children: [{ type: 'text', value: cta.texto }] }] }]);
      }
    }
    const sociedades = def.bloque === 'B-03' ? sociedadesLocales(sitio) : undefined;
    const faq =
      def.bloque === 'B-05'
        ? {
            variante: def.variante ?? 'acordeon',
            items: parsearFaq(seccion).pares.map((p) => ({ preguntaHtml: aHtmlEnLinea(p.preguntaNodos), respuestaHtml: aHtml(p.respuestaNodos) })),
          }
        : undefined;
    const glosario = def.bloque === 'B-08' && def.nombre === 'Términos' ? { ruta, grupos: gruposPorLetra(pagina) } : undefined;
    const glosarioRelacionado = def.nombre === 'Glosario relacionado' ? resolverReferencias(sitio, pagina).resueltas : undefined;
    const armado = def.bloque === 'B-09' ? construirTrio(sitio, pagina, seccion).trio : null;
    const trio = armado ? { ...armado, ruta } : undefined;
    if (!html && !sociedades?.length) continue;
    const titulo = def.titulo === false ? null : typeof def.titulo === 'string' ? def.titulo : def.nombre;
    secciones.push({ id: seccion.id, titulo, html, sociedades, faq, glosario, glosarioRelacionado, trio });
  }

  // B-10: el contacto local va en el lugar de «Contacto local» aunque su Markdown esté vacío.
  const local = pagina.plantilla === 'T3' ? sociedadesLocales(sitio).find((s) => s.slug === ruta && s.contacto) : undefined;
  if (local) {
    const orden = (PLANTILLAS.T3.secciones as readonly DefSeccion[]).map((d) => d.nombre);
    const existente = secciones.find((s) => s.id === 'contacto-local');
    if (existente) existente.contacto = local;
    else {
      const pos = orden.indexOf('Contacto local');
      const idx = secciones.findIndex((s) => {
        const nombre = pagina.visibles.find((v) => v.seccion.id === s.id)?.def.nombre;
        return nombre !== undefined && orden.indexOf(nombre) > pos;
      });
      secciones.splice(idx < 0 ? secciones.length : idx, 0, { id: 'contacto-local', titulo: null, html: '', contacto: local });
    }
  }

  const t1 = paginaEntidad(sitio);
  const enlaceT1 = t1 && t1.ruta !== ruta ? { href: t1.ruta, texto: (t1.frontmatter as { title: string }).title } : null;
  const respuestaT1 = t1?.visibles.find((v) => v.def.nombre === 'Respuesta directa');
  const atT1 = respuestaT1 ? answerTarget(respuestaT1.seccion) : null;
  const entidad =
    enlaceT1 && pagina.plantilla === 'home'
      ? { textoHtml: atT1?.nodo.type === 'paragraph' ? aHtmlEnLinea(atT1.nodo.children as RootContent[]) : null, enlace: enlaceT1 }
      : enlaceT1 && (pagina.plantilla === 'T3' || pagina.plantilla === 'T6')
        ? { textoHtml: null, enlace: enlaceT1 }
        : null;

  let home: ModeloPagina['home'] = null;
  if (pagina.plantilla === 'home') {
    const i = secciones.findIndex((s) => s.id === 'datos-clave');
    const datosClave = i >= 0 ? secciones.splice(i, 1)[0] : null;
    home = { datosClave, ejes: ejesHome(sitio) };
  }

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
    cabecera,
    secciones,
    entidad,
    hijos,
    home,
    legal: pagina.plantilla === 'T3' ? (sociedadesLocales(sitio).find((s) => s.slug === ruta) ?? null) : null,
    jsonld: serializarJsonLd(grafoPagina(sitio, pagina)),
  };
}
