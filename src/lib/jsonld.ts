/**
 * Grafo JSON-LD (Arquitectura §5). Va en el HTML de servidor de cada página, nunca por JS.
 *
 * Dos capas:
 *   1. marca-entidad  #organization     — sin foundingDate ni address (D-01).
 *   2. un Organization por mercado       — #organization-{cc}, con legalName, foundingDate y
 *      address de la sociedad local. Solo se emite cuando el mercado tiene los tres datos y
 *      ninguna de sus dudas está abierta. Hoy: Ecuador.
 * parentOrganization / subOrganization son recíprocos por construcción, y el gate de salida
 * lo verifica en el HTML generado.
 */
import { MARCA, SITIO } from './marca.ts';
import { estaAbierta } from './datos.ts';
import { answerTarget, parsearFaq } from './markdown.ts';
import type { PaginaPublicada, Sitio } from './sitio.ts';

type Nodo = Record<string, unknown>;

export const ID_MARCA = `${SITIO}/#organization`;
export const ID_WEBSITE = `${SITIO}/#website`;
export const idMercado = (codigo: string) => `${SITIO}/#organization-${codigo.toLowerCase()}`;

export function nodosOrganizacion(sitio: Sitio): { marca: Nodo; locales: Nodo[] } {
  const { marca, mercados } = sitio.entidad;

  const locales = mercados
    .filter((m) => m.legalName && m.foundingDate && m.address && !m.bloqueadoPor.some((d) => estaAbierta(sitio.dudas, d)))
    .map((m) => ({
      '@type': 'Organization',
      '@id': idMercado(m.codigo),
      name: `${MARCA} ${m.pais}`,
      legalName: m.legalName,
      foundingDate: m.foundingDate,
      address: { '@type': 'PostalAddress', ...m.address },
      areaServed: m.codigo,
      ...(sitio.publicadas.has(m.slug) ? { url: `${SITIO}${m.slug}` } : {}),
      parentOrganization: { '@id': ID_MARCA },
    }));

  const nodoMarca: Nodo = {
    '@type': 'Organization',
    '@id': ID_MARCA,
    name: MARCA,
    url: `${SITIO}/`,
    description: marca.description,
    foundingLocation: {
      '@type': 'Place',
      name: marca.foundingLocation.name,
      address: { '@type': 'PostalAddress', addressCountry: marca.foundingLocation.addressCountry },
    },
    areaServed: marca.areaServed,
    knowsAbout: marca.knowsAbout,
    ...(marca.sameAs.length ? { sameAs: marca.sameAs } : {}),
    ...(locales.length ? { subOrganization: locales.map((l) => ({ '@id': l['@id'] })) } : {}),
  };

  return { marca: nodoMarca, locales };
}

const TIPO_PAGINA: Partial<Record<string, string>> = {
  T1: 'AboutPage',
  T6: 'CollectionPage',
  contacto: 'ContactPage',
};

function migas(sitio: Sitio, pagina: PaginaPublicada): Nodo {
  const cadena: PaginaPublicada[] = [];
  for (let ruta: string | null = pagina.ruta; ruta; ruta = sitio.entradas.get(ruta)?.padre ?? null) {
    const p = sitio.publicadas.get(ruta);
    if (p) cadena.unshift(p);
  }
  const inicio = sitio.publicadas.get('/');
  if (inicio && cadena[0] !== inicio) cadena.unshift(inicio);
  return {
    '@type': 'BreadcrumbList',
    '@id': `${SITIO}${pagina.ruta}#breadcrumb`,
    itemListElement: cadena.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.sitemap.nav?.label ?? p.sitemap.title,
      item: `${SITIO}${p.ruta}`,
    })),
  };
}

export function grafoPagina(sitio: Sitio, pagina: PaginaPublicada): Nodo {
  const url = `${SITIO}${pagina.ruta}`;
  const fm = pagina.frontmatter as { title: string; metaDescription: string; lastUpdated: string; schemaType: string };
  const { marca, locales } = nodosOrganizacion(sitio);
  const respuesta = pagina.visibles.find((v) => v.def.nombre === 'Respuesta directa');
  const faq = pagina.visibles.find((v) => v.def.nombre === 'FAQ');
  const local = sitio.entidad.mercados.find((m) => m.slug === pagina.ruta);

  const nodos: Nodo[] = [
    { '@type': 'WebSite', '@id': ID_WEBSITE, url: `${SITIO}/`, name: MARCA, inLanguage: 'es', publisher: { '@id': ID_MARCA } },
    marca,
    ...locales,
    {
      '@type': TIPO_PAGINA[pagina.plantilla] ?? 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: fm.title,
      description: fm.metaDescription,
      inLanguage: 'es',
      dateModified: fm.lastUpdated,
      isPartOf: { '@id': ID_WEBSITE },
      about: { '@id': local && locales.some((l) => l['@id'] === idMercado(local.codigo)) ? idMercado(local.codigo) : ID_MARCA },
      breadcrumb: { '@id': `${url}#breadcrumb` },
    },
    migas(sitio, pagina),
  ];

  if (fm.schemaType === 'Service') {
    nodos.push({
      '@type': 'Service',
      '@id': `${url}#service`,
      name: pagina.documento.h1,
      description: respuesta ? answerTarget(respuesta.seccion)?.texto : fm.metaDescription,
      provider: { '@id': ID_MARCA },
      url,
    });
  }

  if (fm.schemaType === 'Article') {
    nodos.push({
      '@type': 'Article',
      '@id': `${url}#article`,
      headline: pagina.documento.h1,
      dateModified: fm.lastUpdated,
      inLanguage: 'es',
      author: { '@id': ID_MARCA },
      publisher: { '@id': ID_MARCA },
      mainEntityOfPage: { '@id': `${url}#webpage` },
    });
  }

  if (faq) {
    nodos.push({
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: parsearFaq(faq.seccion).pares.map((p) => ({
        '@type': 'Question',
        name: p.pregunta,
        acceptedAnswer: { '@type': 'Answer', text: p.respuesta },
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': nodos };
}

/** Serializado seguro para <script type="application/ld+json">: sin «<» literal. */
export function serializarJsonLd(grafo: Nodo): string {
  return JSON.stringify(grafo).replace(/</g, '\\u003c');
}
