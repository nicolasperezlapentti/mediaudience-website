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
 *   - el token de homónimo se convierte en un nodo propio, contado por sección;
 *   - un párrafo, ítem de lista o fila que cita una duda que bloquea la publicación
 *     (dudas.json → bloqueaPublicacion, abierta) se oculta entero; un encabezado que queda
 *     sin contenido debajo también;
 *   - un párrafo suelto «Según datos de la compañía[, corte AAAA-MM].» es la línea de
 *     encuadre B-02;
 *   - un párrafo «Tabla: …» justo antes de una tabla es su <caption>; una tabla sin caption es
 *     un error. Las tablas de «Tabla comparativa» son B-07; las demás, el estilo base (B-03).
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { toString } from 'mdast-util-to-string';
import { toHast } from 'mdast-util-to-hast';
import { toHtml } from 'hast-util-to-html';
import type { Heading, Parent, Root, RootContent, Table } from 'mdast';
import type { Handler, Options as OpcionesHast } from 'mdast-util-to-hast';
import { formatoMes } from './formato.ts';
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
  /** Bloques ocultos por una duda que bloquea la publicación: «D-24: Sin montos mínimos…». */
  ocultos: string[];
}

export interface OpcionesParseo {
  /** true si la duda está abierta y bloquea la publicación de lo que la cita. */
  bloquea?: (id: string) => boolean;
}

interface NodoHomonimo {
  type: 'homonimo';
  value: string;
}

/** B-02 · línea de encuadre. `value` es el texto visible, para mdast-util-to-string. */
interface NodoEncuadre {
  type: 'encuadre';
  fuente: string;
  corte: string | null;
  value: string;
}

const ENCUADRE = /^Según (datos de [^,.;]{1,60}?)(?:, corte (\d{4})-(\d{2}))?\.$/;
const ATRIBUCION_EN_ITALICA = /^\(\s*(según|datos? de|sin fecha)/i;
const BLOQUES_GATEABLES = new Set(['paragraph', 'listItem', 'tableRow']);

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

interface Contexto {
  errores: string[];
  dudas: Set<string>;
  ocultos: string[];
  bloquea: (id: string) => boolean;
}

function limpiar(padre: Parent, ctx: Contexto): void {
  const { errores, dudas } = ctx;
  const salida: RootContent[] = [];
  for (const hijo of padre.children as RootContent[]) {
    if (BLOQUES_GATEABLES.has(hijo.type)) {
      const citadas = [...toString(hijo).matchAll(RE_DUDA)].map((m) => m[0]);
      for (const d of citadas) dudas.add(d);
      const bloqueante = citadas.find(ctx.bloquea);
      if (bloqueante) {
        ctx.ocultos.push(`${bloqueante}: ${quitarCodigosDuda(toString(hijo)).trim().slice(0, 70)}`);
        continue;
      }
    }

    if (hijo.type === 'emphasis' && ATRIBUCION_EN_ITALICA.test(toString(hijo).trim())) {
      errores.push(`atribución en itálica «${toString(hijo).trim().slice(0, 50)}»: va sin itálica y, si vale para todo el bloque, como línea B-02 «Según datos de la compañía.» debajo`);
    }

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
      limpiar(hijo as Parent, ctx);
      const vacio = (hijo as Parent).children.length === 0 || /^[\s()]*$/.test(toString(hijo));
      if (vacio && ['emphasis', 'strong', 'paragraph', 'list', 'listItem', 'blockquote'].includes(hijo.type)) continue;
      if (hijo.type === 'table' && (hijo as Table).children.length <= 1) continue;
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

/** B-02: un párrafo de texto plano que dice solo «Según datos de …[, corte AAAA-MM].». */
function encuadre(nodo: RootContent, errores: string[]): NodoEncuadre | null {
  if (nodo.type !== 'paragraph' || !nodo.children.every((c) => c.type === 'text')) return null;
  const m = toString(nodo).trim().match(ENCUADRE);
  if (!m) return null;
  const [, fuente, anio, mes] = m;
  let corte: string | null = null;
  if (anio) {
    corte = `${anio}-${mes}`;
    const n = Number(mes);
    if (n < 1 || n > 12) errores.push(`B-02: corte ${corte} con mes inválido`);
    else if (corte > new Date().toISOString().slice(0, 7)) errores.push(`B-02: corte ${corte} en el futuro`);
  }
  const fecha = corte && !errores.some((e) => e.includes(corte!)) ? `, corte ${formatoMes(corte)}` : '';
  return { type: 'encuadre', fuente, corte, value: `Según ${fuente}${fecha}` };
}

interface DatosTabla {
  caption?: string;
  variante?: 'comparativa';
}

const LEYENDA = /^Tabla:\s*(.+?)\.?$/;

function leyenda(nodo: RootContent | undefined): string | null {
  if (nodo?.type !== 'paragraph' || !nodo.children.every((c) => c.type === 'text')) return null;
  return toString(nodo).trim().match(LEYENDA)?.[1] ?? null;
}

/** Une cada «Tabla: …» con la tabla que sigue. Sin tabla debajo, o tabla sin leyenda: error. */
function conLeyendas(nodos: RootContent[], errores: string[]): RootContent[] {
  const salida: RootContent[] = [];
  nodos.forEach((n, i) => {
    const texto = leyenda(n);
    if (texto !== null) {
      if (nodos[i + 1]?.type !== 'table') errores.push(`«Tabla: ${texto}» sin una tabla justo debajo`);
      return;
    }
    if (n.type === 'table') {
      const caption = leyenda(nodos[i - 1]);
      if (caption) n.data = { ...n.data, caption } as Table['data'];
      else errores.push(`tabla sin caption («${toString(n.children[0]).trim().slice(0, 50)}»): escribí «Tabla: …» en el párrafo justo antes`);
    }
    salida.push(n);
  });
  return salida;
}

/** Un encabezado sin contenido hasta el siguiente de igual o mayor nivel se quita (B-11). */
function sinEncabezadosHuerfanos(nodos: RootContent[]): RootContent[] {
  return nodos.filter((n, i) => {
    if (n.type !== 'heading') return true;
    const siguiente = nodos.slice(i + 1).find((m) => m.type !== 'heading' || m.depth <= n.depth);
    return siguiente !== undefined && siguiente.type !== 'heading';
  });
}

export function parsearDocumento(markdown: string, opciones: OpcionesParseo = {}): Documento {
  const arbol = parser.parse(markdown) as Root;
  const errores: string[] = [];
  const dudas = new Set<string>();
  const ocultos: string[] = [];
  limpiar(arbol, { errores, dudas, ocultos, bloquea: opciones.bloquea ?? (() => false) });
  arbol.children = conLeyendas(
    arbol.children.map((n) => (encuadre(n, errores) as unknown as RootContent) ?? n),
    errores,
  ) as Root['children'];

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
    s.nodos = sinEncabezadosHuerfanos(s.nodos);
    s.vacia = s.nodos.length === 0;
    if (s.nombre === 'Tabla comparativa') {
      for (const n of s.nodos) if (n.type === 'table') n.data = { ...n.data, variante: 'comparativa' } as Table['data'];
    }
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

  return { h1, h1Cantidad, secciones, dudasCitadas: [...dudas].sort(), errores, ocultos };
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
  /** Contenido de la pregunta (sin el <strong>), para el <h3> del acordeón. */
  preguntaNodos: RootContent[];
  /** La respuesta como párrafos, con sus enlaces. */
  respuestaNodos: RootContent[];
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
    // El salto de línea entre pregunta y respuesta llega como texto inicial: se descarta.
    const [primero, ...demas] = resto;
    const inicio = primero?.type === 'text' ? [{ ...primero, value: primero.value.replace(/^\s+/, '') }] : primero ? [primero] : [];
    const respuestaEnLinea = [...inicio, ...demas].filter((c) => c.type !== 'text' || c.value !== '');
    let respuesta = normalizarEspacios(toString({ type: 'paragraph', children: respuestaEnLinea }));
    const nodosPar: RootContent[] = [nodo];
    let respuestaNodos: RootContent[] = respuesta ? [{ type: 'paragraph', children: respuestaEnLinea } as RootContent] : [];
    const siguiente = nodos[i + 1];
    if (!respuesta && siguiente?.type === 'paragraph' && siguiente.children[0]?.type !== 'strong') {
      respuesta = normalizarEspacios(toString(siguiente));
      respuestaNodos = [siguiente];
      nodosPar.push(siguiente);
      i++;
    }
    const textoPregunta = normalizarEspacios(toString(pregunta));
    const preguntaNodos = pregunta.type === 'strong' ? (pregunta.children as RootContent[]) : [];
    if (!respuesta) errores.push(`pregunta sin respuesta: «${textoPregunta}»`);
    else pares.push({ pregunta: textoPregunta, respuesta, nodos: nodosPar, preguntaNodos, respuestaNodos });
  }
  return { pares, errores };
}

/* ---------------- B-08 · glosario ---------------- */

export interface Termino {
  /** Ancla propia: `{#ctr}` explícito o derivado del término. */
  id: string;
  termino: string;
  expansion: string | null;
  definicionNodos: RootContent[];
  definicion: string;
  /** Enlace descriptivo a la página que aplica el término: último párrafo, si es solo un enlace. */
  enlace: { href: string; texto: string } | null;
  /** Letra del índice: sin acentos, salvo la Ñ. */
  letra: string;
}

const ARRANQUE_VAGO = /^(es|son)\s+(cuando|lo que|donde|aquello)\b/i;

export function letraDe(termino: string): string {
  const primera = termino.trim().charAt(0).toUpperCase();
  if (primera === 'Ñ') return 'Ñ';
  const base = primera.normalize('NFD').replace(/\p{Diacritic}/gu, '');
  return /[A-Z]/.test(base) ? base : '#';
}

const soloEnlace = (n: RootContent | undefined) =>
  n?.type === 'paragraph' && n.children.filter((c) => c.type !== 'text' || c.value.trim()).length === 1 && n.children.some((c) => c.type === 'link');

/**
 * «Términos» (T4-glosario): cada H3 es un término —`### CTR · tasa de clics {#ctr}`—, seguido
 * de su definición (una o dos oraciones, que empiezan por el concepto) y, opcionalmente, de un
 * párrafo que es solo un enlace a la página de la marca que aplica el término.
 */
export function parsearTerminos(seccion: Seccion): { terminos: Termino[]; errores: string[] } {
  const terminos: Termino[] = [];
  const errores: string[] = [];
  let actual: { h: Heading; nodos: RootContent[] } | null = null;
  const cerrar = () => {
    if (!actual) return;
    const titulo = toString(actual.h).trim();
    const [termino, ...resto] = titulo.split(' · ');
    const expansion = resto.join(' · ').trim() || null;
    const id = String((actual.h.data?.hProperties as { id?: string } | undefined)?.id ?? slug(termino));
    let nodos = actual.nodos;
    let enlace: Termino['enlace'] = null;
    const ultimo = nodos.at(-1);
    if (nodos.length > 1 && soloEnlace(ultimo) && ultimo?.type === 'paragraph') {
      const a = ultimo.children.find((c) => c.type === 'link');
      if (a?.type === 'link') enlace = { href: a.url, texto: toString(a).trim() };
      nodos = nodos.slice(0, -1);
    }
    const definicion = normalizarEspacios(nodos.map((n) => toString(n)).join(' '));
    if (!definicion) errores.push(`término «${termino}» sin definición`);
    else {
      const n = partirOraciones(definicion).length;
      if (n > 2) errores.push(`término «${termino}»: la definición va en una o dos oraciones y tiene ${n}`);
      if (ARRANQUE_VAGO.test(definicion)) errores.push(`término «${termino}»: la definición empieza por el concepto, no por «${definicion.split(/\s+/).slice(0, 2).join(' ')}…»`);
    }
    if (nodos.some((n) => n.type !== 'paragraph')) errores.push(`término «${termino}»: la definición son párrafos`);
    terminos.push({ id, termino: termino.trim(), expansion, definicionNodos: nodos, definicion, enlace, letra: letraDe(termino) });
  };
  for (const n of seccion.nodos) {
    if (n.type === 'heading' && n.depth === 3) {
      cerrar();
      actual = { h: n, nodos: [] };
    } else if (!actual) {
      errores.push(`contenido antes del primer término: «${toString(n).trim().slice(0, 50)}». Cada término abre con un H3`);
    } else if (n.type === 'heading') {
      errores.push(`término «${toString(actual.h).trim()}»: dentro de un término no van subtítulos`);
    } else {
      actual.nodos.push(n);
    }
  }
  cerrar();
  const vistos = new Set<string>();
  for (const t of terminos) {
    if (vistos.has(t.termino.toLowerCase())) errores.push(`término duplicado: «${t.termino}»`);
    vistos.add(t.termino.toLowerCase());
  }
  return { terminos, errores };
}

/** «Glosario relacionado» (T4): una lista cuyos ítems son solo enlaces a términos del glosario. */
export function parsearReferenciasGlosario(seccion: Seccion): { referencias: { href: string; texto: string }[]; errores: string[] } {
  const errores: string[] = [];
  const referencias: { href: string; texto: string }[] = [];
  for (const n of seccion.nodos) {
    if (n.type !== 'list') {
      errores.push(`solo admite una lista de enlaces a términos del glosario; sobra «${toString(n).trim().slice(0, 50)}»`);
      continue;
    }
    for (const item of n.children) {
      const [p] = item.children;
      const a = p?.type === 'paragraph' && item.children.length === 1 && soloEnlace(p) ? p.children.find((c) => c.type === 'link') : undefined;
      if (a?.type === 'link') referencias.push({ href: a.url, texto: toString(a).trim() });
      else errores.push(`cada ítem es solo un enlace a un término del glosario: «${toString(item).trim().slice(0, 50)}»`);
    }
  }
  return { referencias, errores };
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

/**
 * Oraciones de un texto. Corta en «. », «? » o «! » seguido de mayúscula, salvo después de
 * una abreviatura (S.A.S., Av., p. ej.…). B-01: el answer target es una sola oración.
 */
const ABREVIATURA = /(?:\b(?:S\.A\.S|S\.A\.C|S\.A|Av|Sr|Sra|Dr|Dra|Ing|Lic|etc|No|Nro|Ej)|\bp\. ej)$/;
const FIN_DE_ORACION = /[.?!](?:[*_)»"]*)\s+(?=[¿¡«"(*_]*[A-ZÁÉÍÓÚÑ])/g;

export function partirOraciones(texto: string): string[] {
  const oraciones: string[] = [];
  let desde = 0;
  for (const m of texto.matchAll(FIN_DE_ORACION)) {
    const antes = texto.slice(desde, m.index);
    if (ABREVIATURA.test(antes)) continue;
    const fin = m.index + m[0].trimEnd().length;
    oraciones.push(texto.slice(desde, fin).trim());
    desde = m.index + m[0].length;
  }
  const resto = texto.slice(desde).trim();
  if (resto) oraciones.push(resto);
  return oraciones;
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

const encuadreHast: Handler = (_estado, nodo) => {
  const { fuente, corte, value } = nodo as unknown as NodoEncuadre;
  return {
    type: 'element',
    tagName: 'p',
    properties: { className: ['framing'] },
    children: corte
      ? [
          { type: 'text', value: `Según ${fuente}, corte ` },
          { type: 'element', tagName: 'time', properties: { dateTime: corte }, children: [{ type: 'text', value: formatoMes(corte) }] },
        ]
      : [{ type: 'text', value }],
  };
};

/**
 * Contenido en línea (el interior de un <p>, un <h3>, un <summary>) sin el envoltorio de
 * bloque. aHtml() sobre nodos en línea sueltos intercala saltos de línea entre ellos, que se
 * ven como espacios dentro de comillas o alrededor del marcador de homónimo.
 */
export function aHtmlEnLinea(nodos: readonly RootContent[]): string {
  return aHtml([{ type: 'paragraph', children: [...nodos] } as RootContent]).replace(/^<p>|<\/p>$/g, '');
}

/**
 * Tablas (B-03 · B-07): <caption>, <thead> con th[scope=col], primera celda de cada fila como
 * th[scope=row], data-label en cada celda para el apilado móvil, dentro de .table-wrap.
 */
const tablaHast: Handler = (estado, nodo) => {
  const t = nodo as unknown as Table & { data?: DatosTabla };
  const [cabecera, ...filas] = t.children;
  const rotulos = cabecera.children.map((c) => toString(c).trim());
  const el = (tagName: string, properties: Record<string, unknown>, children: unknown[]) => ({ type: 'element', tagName, properties, children });
  const celdas = (fila: Table['children'][number], cabeza: boolean) =>
    fila.children.map((c, i) =>
      cabeza
        ? el('th', { scope: 'col' }, estado.all(c))
        : el(i === 0 ? 'th' : 'td', i === 0 ? { scope: 'row', dataLabel: rotulos[0] } : { dataLabel: rotulos[i] }, estado.all(c)),
    );
  const comparativa = t.data?.variante === 'comparativa';
  const caption = t.data?.caption;
  const tabla = el('table', { className: ['table', comparativa ? 'table--compare' : 'table--stack'] }, [
    ...(caption ? [el('caption', {}, [{ type: 'text', value: caption }])] : []),
    el('thead', {}, [el('tr', {}, celdas(cabecera, true))]),
    el('tbody', {}, filas.map((f) => el('tr', {}, celdas(f, false)))),
  ]);
  if (!comparativa) return el('div', { className: ['table-wrap'] }, [tabla]) as ReturnType<Handler>;
  // B-07 se desplaza en horizontal: la leyenda visible queda fuera del área que desplaza, y el
  // <caption> real sigue dentro de la tabla, solo para lectores de pantalla.
  return el('div', { className: ['table-wrap', 'table-wrap--compare'] }, [
    ...(caption ? [el('p', { className: ['table-leyenda'], ariaHidden: 'true' }, [{ type: 'text', value: caption }])] : []),
    el('div', { className: ['table-scroll'] }, [tabla]),
  ]) as ReturnType<Handler>;
};

export function aHtml(nodos: readonly RootContent[]): string {
  const handlers = { homonimo, encuadre: encuadreHast, table: tablaHast } as unknown as NonNullable<OpcionesHast['handlers']>;
  return toHtml(toHast({ type: 'root', children: [...nodos] } as Root, { handlers }));
}

