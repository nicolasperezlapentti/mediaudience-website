/**
 * B-09 · selector de productos del hub (T2-hub, sección «Los tres productos»).
 *
 * La tabla que redacción escribe en esa sección es la fuente: cada fila es una card. La primera
 * celda enlaza a la página hija del producto; de ella salen el nombre (title) y la descripción
 * (metaDescription). Las demás columnas son los datos de la card; una celda «—» no se muestra.
 * Las filas tienen que coincidir con las páginas hijas publicadas del hub: ni una de más ni una
 * de menos.
 */
import type { RootContent, Table } from 'mdast';
import { toString } from 'mdast-util-to-string';
import { aHtml, normalizarEspacios, type Seccion } from './markdown.ts';
import { partirHref } from './navegacion.ts';
import type { PaginaPublicada, Sitio } from './sitio.ts';

export interface ProductoTrio {
  id: string;
  nombre: string;
  descripcion: string;
  href: string;
  datos: { rotulo: string; valor: string }[];
}

export interface Trio {
  leyenda: string;
  antesHtml: string;
  productos: ProductoTrio[];
  despuesHtml: string;
}

const SIN_DATO = /^(—|–|-|n\/d)?$/i;

export function construirTrio(sitio: Sitio, pagina: PaginaPublicada, seccion: Seccion): { trio: Trio | null; errores: string[] } {
  const errores: string[] = [];
  const indice = seccion.nodos.findIndex((n) => n.type === 'table');
  if (indice < 0 || seccion.nodos.filter((n) => n.type === 'table').length > 1) {
    return { trio: null, errores: ['lleva una sola tabla: una fila por producto, con el enlace a su página en la primera columna'] };
  }
  const tabla = seccion.nodos[indice] as Table & { data?: { caption?: string } };
  const [cabecera, ...filas] = tabla.children;
  const rotulos = cabecera.children.map((c) => normalizarEspacios(toString(c)));
  const hijos = (sitio.entradas.get(pagina.ruta)?.children ?? []).map((c) => c.slug).filter((s) => sitio.publicadas.has(s));

  const productos: ProductoTrio[] = [];
  for (const fila of filas) {
    const [primera, ...resto] = fila.children;
    const enlace = primera?.children.find((c) => c.type === 'link');
    const ruta = enlace?.type === 'link' ? partirHref(enlace.url).ruta : null;
    const hija = ruta ? sitio.publicadas.get(ruta) : undefined;
    if (!ruta || !hija || !hijos.includes(ruta)) {
      errores.push(`la fila «${normalizarEspacios(toString(primera ?? fila))}» tiene que enlazar a una página hija publicada de ${pagina.ruta}`);
      continue;
    }
    const fm = hija.frontmatter as { title: string; metaDescription: string };
    productos.push({
      id: ruta.split('/').filter(Boolean).at(-1)!,
      nombre: fm.title,
      descripcion: fm.metaDescription,
      href: ruta,
      datos: resto.flatMap((c, i) => {
        const valor = normalizarEspacios(toString(c));
        return SIN_DATO.test(valor) ? [] : [{ rotulo: rotulos[i + 1], valor }];
      }),
    });
  }
  const enTabla = new Set(productos.map((p) => p.href));
  for (const h of hijos) if (!enTabla.has(h)) errores.push(`falta la fila del producto ${h}: el selector muestra todos los productos publicados del hub`);

  const antes = seccion.nodos.slice(0, indice) as RootContent[];
  const despues = seccion.nodos.slice(indice + 1) as RootContent[];
  return {
    trio: { leyenda: tabla.data?.caption ?? '', antesHtml: aHtml(antes), productos, despuesHtml: aHtml(despues) },
    errores,
  };
}
