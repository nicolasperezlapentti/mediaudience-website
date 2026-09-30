/**
 * Markdown → documento estructurado por secciones (H2).
 *
 * El árbol se limpia ANTES de validar, para que los gates vean exactamente lo que se va a
 * publicar:
 *   - los comentarios HTML son notas editoriales: se eliminan (sus D-XX se registran);
 *   - HTML crudo que no sea comentario → error: el contenido es Markdown, no marcado;
 *   - los códigos D-XX se quitan del texto visible: «(según datos de la compañía — D-05)»
 *     queda «(según datos de la compañía)»; «(D-06)» desaparece;
 *   - las filas de tabla con «pendiente» no se muestran (B-03); una tabla sin filas desaparece;
 *   - el token de homónimo se convierte en un nodo propio, contado por sección.
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { toString } from 'mdast-util-to-string';
import { toHast } from 'mdast-util-to-hast';
import { toHtml } from 'hast-util-to-html';
import type { Heading, Parent, Root, RootContent, Table } from 'mdast';
import type { Handler, Options as OpcionesHast } from 'mdast-util-to-hast';
import { HOMONIMO, TOKEN_HOMONIMO } from './marca.ts';

export const RE_DUDA = /\bD-\d{2}\b/g;

export interface Enlace {
  url: string;
  texto: string;
}

export interface Seccion {
  nombre: string;
  id: string;
  nodos: RootContent[];
  vacia: boolean;
  /** ids de encabezado disponibles como fragmento dentro de la sección (incluye el de la sección). */
  ids: string[];
  enlaces: Enlace[];
  homonimos: number;
}

export interface Documento {
  h1: string | null;
  h1Cantidad: number;
  secciones: Seccion[];
  dudasCitadas: string[];
  errores: string[];
}

interface NodoHomonimo {
  type: 'homonimo';
  value: string;
}

const parser = unified().use(remarkParse).use(remarkGfm);

export function slug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function quitarCodigosDuda(texto: string): string {
  return texto
    .replace(/\s*[—–-]\s*D-\d{2}(?:\s*[,y]\s*D-\d{2})*/g, '')
    .replace(/\s*\(\s*D-\d{2}(?:\s*,\s*D-\d{2})*\s*\)/g, '');
}

const esComentario = (html: string) => /^\s*<!--[\s\S]*?-->\s*$/.test(html);
const FILA_PENDIENTE = /\bpendiente\b/i;

function limpiar(padre: Parent, errores: string[], dudas: Set<string>): void {
  const salida: RootContent[] = [];
  for (const hijo of padre.children as RootContent[]) {
    if (hijo.type === 'html') {
      for (const m of hijo.value.matchAll(RE_DUDA)) dudas.add(m[0]);
      if (!esComentario(hijo.value)) errores.push(`HTML crudo no permitido: «${hijo.value.trim().slice(0, 60)}»`);
      continue;
    }

    if (hijo.type === 'text') {
      for (const m of hijo.value.matchAll(RE_DUDA)) dudas.add(m[0]);
      const valor = quitarCodigosDuda(hijo.value);
      const partes = valor.split(TOKEN_HOMONIMO);
      partes.forEach((parte, i) => {
        if (i > 0) salida.push({ type: 'homonimo', value: HOMONIMO } as unknown as RootContent);
        if (parte) salida.push({ ...hijo, value: parte });
      });
      continue;
    }

    if (hijo.type === 'table') {
      const tabla = hijo as Table;
      const [cabecera, ...filas] = tabla.children;
      const visibles = filas.filter((f) => !FILA_PENDIENTE.test(toString(f)));
      if (visibles.length === 0) continue;
      tabla.children = [cabecera, ...visibles];
    }

    if ('children' in hijo) {
      limpiar(hijo as Parent, errores, dudas);
      const vacio = (hijo as Parent).children.length === 0 || /^[\s()]*$/.test(toString(hijo));
      if (vacio && (hijo.type === 'emphasis' || hijo.type === 'strong' || hijo.type === 'paragraph')) continue;
    }

    salida.push(hijo);
  }

  // Un código quitado puede dejar «(2024) :» — se recorta el espacio antes de puntuación.
  for (let i = 0; i < salida.length - 1; i++) {
    const a = salida[i];
    const b = salida[i + 1];
    if (a.type === 'text' && b.type === 'text' && /^[:;,.]/.test(b.value)) a.value = a.value.replace(/\s+$/, '');
  }
  const ultimo = salida.at(-1);
  if (ultimo?.type === 'text' && padre.type === 'paragraph') ultimo.value = ultimo.value.replace(/\s+$/, '');

  padre.children = salida as Parent['children'];
}

/** Admite `### Título {#id-explicito}` para fragmentos estables (PLANTILLAS §1.2). */
function idDeEncabezado(h: Heading): string | null {
  const ultimo = h.children.at(-1);
  if (ultimo?.type !== 'text') return null;
  const m = ultimo.value.match(/\s*\{#([a-z0-9]+(?:-[a-z0-9]+)*)\}\s*$/);
  if (!m) return null;
  ultimo.value = ultimo.value.slice(0, m.index);
  return m[1];
}

function recorrer(nodo: RootContent | Root, visita: (n: RootContent) => void): void {
  if (nodo.type !== 'root') visita(nodo);
  if ('children' in nodo) for (const h of nodo.children as RootContent[]) recorrer(h, visita);
}

export function parsearDocumento(markdown: string): Documento {
  const arbol = parser.parse(markdown) as Root;
  const errores: string[] = [];
  const dudas = new Set<string>();
  limpiar(arbol, errores, dudas);

  const usados = new Set<string>();
  const reservarId = (id: string, explicito: boolean): string => {
    if (!usados.has(id)) {
      usados.add(id);
      return id;
    }
    if (explicito) errores.push(`Fragmento duplicado: #${id}`);
    let n = 2;
    while (usados.has(`${id}-${n}`)) n++;
    usados.add(`${id}-${n}`);
    return `${id}-${n}`;
  };

  let h1: string | null = null;
  let h1Cantidad = 0;
  const secciones: Seccion[] = [];
  let actual: Seccion | null = null;

  for (const nodo of arbol.children) {
    if (nodo.type === 'heading' && nodo.depth === 1) {
      h1Cantidad++;
      h1 ??= toString(nodo).trim();
      if (actual) errores.push('El H1 va antes de la primera sección, y hay uno solo por página');
      continue;
    }
    if (nodo.type === 'heading' && nodo.depth === 2) {
      const explicito = idDeEncabezado(nodo);
      const nombre = toString(nodo).trim();
      if (explicito) errores.push(`El H2 «${nombre}» no admite id explícito: su id deriva del nombre de la sección`);
      if (secciones.some((s) => s.nombre === nombre)) errores.push(`H2 duplicado: «${nombre}»`);
      actual = { nombre, id: reservarId(slug(nombre), false), nodos: [], vacia: true, ids: [], enlaces: [], homonimos: 0 };
      actual.ids.push(actual.id);
      secciones.push(actual);
      continue;
    }
    if (!actual) {
      errores.push(`Contenido fuera de sección, antes del primer H2: «${toString(nodo).trim().slice(0, 60)}»`);
      continue;
    }
    actual.nodos.push(nodo);
  }

  for (const s of secciones) {
    s.vacia = s.nodos.length === 0;
    for (const nodo of s.nodos) {
      recorrer(nodo, (n) => {
        if (n.type === 'heading') {
          const explicito = idDeEncabezado(n);
          const id = reservarId(explicito ?? slug(toString(n)), explicito !== null);
          n.data = { ...n.data, hProperties: { ...n.data?.hProperties, id } };
          s.ids.push(id);
        }
        if (n.type === 'link') s.enlaces.push({ url: n.url, texto: toString(n).trim() });
        if ((n as unknown as NodoHomonimo).type === 'homonimo') s.homonimos++;
      });
    }
  }

  return { h1, h1Cantidad, secciones, dudasCitadas: [...dudas].sort(), errores };
}

/* ---------------- lectura de bloques con formato fijo ---------------- */

/** B-01: el primer nodo de «Respuesta directa» es el answer target y tiene que ser un párrafo. */
export function answerTarget(seccion: Seccion): { nodo: RootContent; texto: string } | null {
  const [primero] = seccion.nodos;
  if (primero?.type !== 'paragraph') return null;
  return { nodo: primero, texto: normalizarEspacios(toString(primero)) };
}

export interface ParFaq {
  pregunta: string;
  respuesta: string;
  nodos: RootContent[];
}

/** FAQ: cada par es un párrafo que abre con la pregunta en negrita, seguida de la respuesta. */
export function parsearFaq(seccion: Seccion): { pares: ParFaq[]; errores: string[] } {
  const pares: ParFaq[] = [];
  const errores: string[] = [];
  const nodos = seccion.nodos;
  for (let i = 0; i < nodos.length; i++) {
    const nodo = nodos[i];
    if (nodo.type !== 'paragraph' || nodo.children[0]?.type !== 'strong') {
      errores.push(`bloque que no es una pregunta en negrita: «${toString(nodo).trim().slice(0, 60)}»`);
      continue;
    }
    const [pregunta, ...resto] = nodo.children;
    let respuesta = normalizarEspacios(toString({ type: 'paragraph', children: resto }));
    const nodosPar: RootContent[] = [nodo];
    const siguiente = nodos[i + 1];
    if (!respuesta && siguiente?.type === 'paragraph' && siguiente.children[0]?.type !== 'strong') {
      respuesta = normalizarEspacios(toString(siguiente));
      nodosPar.push(siguiente);
      i++;
    }
    const textoPregunta = normalizarEspacios(toString(pregunta));
    if (!respuesta) errores.push(`pregunta sin respuesta: «${textoPregunta}»`);
    else pares.push({ pregunta: textoPregunta, respuesta, nodos: nodosPar });
  }
  return { pares, errores };
}

/** CTA de cierre (FORMATO-CONTENIDO.md): `Texto del llamado → [destino](/ruta/)`. */
export function parsearCta(seccion: Seccion): { texto: string; href: string } | null {
  if (seccion.nodos.length !== 1 || seccion.nodos[0].type !== 'paragraph') return null;
  const p = seccion.nodos[0];
  const enlace = p.children.find((c) => c.type === 'link');
  const texto = toString({ type: 'paragraph', children: p.children.filter((c) => c.type !== 'link') });
  const m = texto.match(/^([\s\S]+?)\s*→\s*$/);
  if (!enlace || enlace.type !== 'link' || !m) return null;
  return { texto: normalizarEspacios(m[1]), href: enlace.url };
}

export function normalizarEspacios(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim();
}

/* ---------------- render ---------------- */

const homonimo: Handler = (_estado, nodo) => ({
  type: 'element',
  tagName: 'span',
  properties: { dataHomonimo: '', lang: 'en' },
  children: [{ type: 'text', value: (nodo as unknown as NodoHomonimo).value }],
});

export function aHtml(nodos: readonly RootContent[]): string {
  const handlers = { homonimo } as unknown as NonNullable<OpcionesHast['handlers']>;
  return toHtml(toHast({ type: 'root', children: [...nodos] } as Root, { handlers }));
}

