/**
 * Lectura de content/paginas/. La URL canónica se deriva del nombre de archivo, sin mapeos:
 *
 *   content/paginas/index.md                              → /
 *   content/paginas/nosotros.md                           → /nosotros/
 *   content/paginas/soluciones/index.md                   → /soluciones/
 *   content/paginas/soluciones/mobile-push/premium-claro.md → /soluciones/mobile-push/premium-claro/
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { PAGINAS, RAIZ } from './entorno.ts';
import { answerTarget, parsearCta, parsearDocumento, parsearFaq, type Documento } from './markdown.ts';

const SEGMENTO = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function listarArchivos(dir: string = PAGINAS): string[] {
  let entradas;
  try {
    entradas = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entradas
    .flatMap((e) => {
      const ruta = join(dir, e.name);
      if (e.isDirectory()) return listarArchivos(ruta);
      return e.isFile() && e.name.endsWith('.md') ? [ruta] : [];
    })
    .sort();
}

/** Ruta relativa a content/paginas/ → URL canónica. Lanza si un segmento no es canónico. */
export function rutaDeArchivo(relativo: string): string {
  const segmentos = relativo.split(sep).join('/').replace(/\.md$/, '').split('/');
  if (segmentos.at(-1) === 'index') segmentos.pop();
  for (const s of segmentos) {
    if (!SEGMENTO.test(s)) {
      throw new Error(`segmento «${s}» no canónico: solo minúsculas, dígitos y guiones, sin acentos`);
    }
  }
  return segmentos.length ? `/${segmentos.join('/')}/` : '/';
}

export interface PaginaLeida {
  /** Ruta relativa a la raíz del repo, para mensajes de error. */
  archivo: string;
  ruta: string;
  frontmatter: Record<string, unknown>;
  cuerpo: string;
  documento: Documento;
  /** Objeto que valida el schema de Zod de la colección. */
  datos: Record<string, unknown>;
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function leerPagina(absoluto: string): PaginaLeida {
  const archivo = relative(RAIZ, absoluto).split(sep).join('/');
  const ruta = rutaDeArchivo(relative(PAGINAS, absoluto));
  const fuente = readFileSync(absoluto, 'utf8');
  const m = fuente.match(FRONTMATTER);
  if (!m) throw new Error(`${archivo}: falta el front matter YAML entre ---`);
  const frontmatter = (parseYaml(m[1]) ?? {}) as Record<string, unknown>;
  const cuerpo = fuente.slice(m[0].length);
  const documento = parsearDocumento(cuerpo);
  return {
    archivo,
    ruta,
    frontmatter,
    cuerpo,
    documento,
    datos: { ...frontmatter, origen: { archivo, ruta }, estructura: resumirDocumento(documento) },
  };
}

/** Bloques con formato fijo (FORMATO-CONTENIDO.md): si no lo cumplen, el render no los puede armar. */
function erroresDeFormato(d: Documento): string[] {
  const errores: string[] = [];
  const buscar = (nombre: string) => d.secciones.find((s) => s.nombre === nombre && !s.vacia);
  const respuesta = buscar('Respuesta directa');
  if (respuesta && !answerTarget(respuesta)) {
    errores.push('«Respuesta directa»: el answer target (primer bloque) tiene que ser un párrafo');
  }
  const faq = buscar('FAQ');
  if (faq) for (const e of parsearFaq(faq).errores) errores.push(`«FAQ»: ${e}`);
  const cta = buscar('CTA de cierre');
  if (cta && !parsearCta(cta)) errores.push('«CTA de cierre»: formato esperado «Texto del llamado → [destino](/ruta/)»');
  return errores;
}

/** Lo que ve el schema: nombre, vacía o no, ids, enlaces y homónimos de cada sección. */
export function resumirDocumento(d: Documento) {
  return {
    h1: d.h1,
    h1Cantidad: d.h1Cantidad,
    errores: [...d.errores, ...erroresDeFormato(d)],
    dudasCitadas: d.dudasCitadas,
    secciones: Object.fromEntries(
      d.secciones.map((s) => [s.nombre, { id: s.id, vacia: s.vacia, ids: s.ids, enlaces: s.enlaces, homonimos: s.homonimos }]),
    ),
  };
}
