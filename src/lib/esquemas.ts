/**
 * Schemas de Zod de la colección `paginas`, uno por plantilla (PLANTILLAS.md §4).
 *
 * Cada schema declara su lista cerrada de secciones H2 a partir de src/lib/plantillas.ts:
 *   - OBL → campo requerido y no vacío; si falta o está vacío, el build falla (gate 2);
 *   - OPC y GATE → campo opcional; GATE lleva sus dudas en .meta() y se oculta en el render (gate 3);
 *   - cualquier H2 fuera de la lista → el objeto es estricto y el build falla.
 *
 * El front matter sigue content/FORMATO-CONTENIDO.md, más `template` (obligatorio) y `gates`
 * (opcional: condiciona secciones OPC de una página puntual a dudas D-XX).
 */
import { z } from 'astro/zod';
import { aplanar, cargarDudas, cargarSitemap, idDuda, slugCanonico, STATUS, type Dudas, type Sitemap } from './datos.ts';
import { defSeccion, IDS_PLANTILLA, PLANTILLAS, type DefSeccion, type IdPlantilla } from './plantillas.ts';
import { GATES } from './problemas.ts';

const enlace = z.object({ url: z.string(), texto: z.string() });

const resumenSeccion = {
  id: z.string(),
  vacia: z.boolean(),
  ids: z.array(z.string()),
  enlaces: z.array(enlace),
  homonimos: z.number(),
};

function esquemaSeccion(def: DefSeccion) {
  const meta = { estado: def.estado, gate: def.gate ?? [], bloque: def.bloque ?? null };
  if (def.estado === 'OBL') {
    return z
      .object(resumenSeccion, {
        error: (iss) => (iss.input === undefined ? 'sección obligatoria ausente' : undefined),
      })
      .refine((s) => !s.vacia, { error: 'sección obligatoria vacía' })
      .meta(meta);
  }
  return z.object(resumenSeccion).optional().meta(meta);
}

function esquemaSecciones(id: IdPlantilla) {
  const defs = PLANTILLAS[id].secciones as readonly DefSeccion[];
  const permitidos = defs.map((d) => `«${d.nombre}»`).join(', ');
  return z.strictObject(Object.fromEntries(defs.map((d) => [d.nombre, esquemaSeccion(d)])), {
    error: (iss) =>
      iss.code === 'unrecognized_keys'
        ? `H2 no permitido en ${id}: ${iss.keys.map((k) => `«${k}»`).join(', ')}. Permitidos: ${permitidos}`
        : undefined,
  });
}

const frontmatter = {
  slug: slugCanonico.optional(),
  title: z.string().min(1),
  metaDescription: z.string().min(1, { error: 'metaDescription vacía' }),
  status: z.enum(STATUS),
  blockedBy: z.array(idDuda).default([]),
  schemaType: z.enum(['Organization', 'Service', 'ContactPage', 'Article', 'WebPage', 'CollectionPage']),
  lastUpdated: z.iso.date({ error: 'lastUpdated debe ser una fecha AAAA-MM-DD' }),
  gates: z.record(z.string(), z.array(idDuda).min(1)).default({}),
};

function esquemaPlantilla<T extends IdPlantilla>(id: T) {
  return z.strictObject({
    ...frontmatter,
    template: z.literal(id),
    origen: z.object({ archivo: z.string(), ruta: slugCanonico }),
    estructura: z.object({
      h1: z.string({ error: 'falta el H1 (# Título) al inicio del cuerpo' }),
      h1Cantidad: z.number(),
      errores: z.array(z.string()),
      dudasCitadas: z.array(z.string()),
      secciones: esquemaSecciones(id),
    }),
  });
}

export const T1 = esquemaPlantilla('T1');
export const T2 = esquemaPlantilla('T2');
export const T2_HUB = esquemaPlantilla('T2-hub');
export const T3 = esquemaPlantilla('T3');
export const T4 = esquemaPlantilla('T4');
export const T4_GLOSARIO = esquemaPlantilla('T4-glosario');
export const T5 = esquemaPlantilla('T5');
export const T6 = esquemaPlantilla('T6');
export const HOME = esquemaPlantilla('home');
export const CONTACTO = esquemaPlantilla('contacto');
export const UTILITARIA = esquemaPlantilla('utilitaria');

let cache: { sitemap: Sitemap; dudas: Dudas } | null = null;
function contexto() {
  cache ??= { sitemap: cargarSitemap(), dudas: cargarDudas() };
  return cache;
}

/** Reglas que cruzan la página con sitemap.json, dudas.json y su plantilla. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reglasCruzadas(p: Record<string, any>, ctx: z.RefinementCtx) {
  const plantilla = p?.template as IdPlantilla;
  const def = PLANTILLAS[plantilla];
  // Corre aunque la página ya tenga otros errores, para reportar todo de una vez.
  if (!def || !p.estructura || !p.origen) return;
  const { sitemap, dudas } = contexto();
  const add = (path: (string | number)[], message: string, gate: string = GATES.estructura) =>
    ctx.addIssue({ code: 'custom', path, message, params: { gate } });

  if (p.estructura.h1Cantidad !== 1) add(['estructura', 'h1'], `debe haber exactamente un H1; hay ${p.estructura.h1Cantidad}`);
  for (const e of p.estructura.errores as string[]) add(['estructura'], e);

  if (p.slug !== undefined && p.slug !== p.origen.ruta) {
    add(['slug'], `el slug «${p.slug}» no coincide con la ruta derivada del archivo «${p.origen.ruta}»`);
  }

  const entrada = aplanar(sitemap.pages).find((e) => e.slug === p.origen.ruta);
  if (!entrada) add(['origen'], `la ruta ${p.origen.ruta} no figura en sitemap.json`, GATES.g1);
  else if (entrada.status !== p.status) add(['status'], `status «${p.status}» distinto del de sitemap.json («${entrada.status}»)`, GATES.g1);

  const citadas = new Set<string>([
    ...(p.blockedBy as string[]),
    ...(p.estructura.dudasCitadas as string[]),
    ...Object.values(p.gates as Record<string, string[]>).flat(),
  ]);
  for (const d of citadas) if (!dudas[d]) add(['blockedBy'], `${d} no existe en content/dudas.json`, GATES.g3);

  for (const seccion of Object.keys(p.gates as Record<string, string[]>)) {
    const s = defSeccion(plantilla, seccion);
    if (!s) add(['gates', seccion], `la plantilla ${plantilla} no tiene la sección «${seccion}»`, GATES.g3);
    else if (s.estado !== 'OPC') {
      add(['gates', seccion], `solo se condicionan desde el front matter secciones OPC; «${seccion}» es ${s.estado}${s.estado === 'OBL' ? ' — si falta el dato, la página no es ready' : ' y ya tiene su gate en la plantilla'}`, GATES.g3);
    }
  }

  for (const [nombre, sec] of Object.entries(p.estructura.secciones as Record<string, { homonimos: number } | undefined>)) {
    if (!sec) continue;
    const s = defSeccion(plantilla, nombre);
    if (sec.homonimos > 0 && !s?.homonimo) {
      add(['estructura', 'secciones', nombre], 'el token {{homonimo}} solo se admite en el FAQ de las plantillas T1 y home', GATES.g5);
    }
    if (s?.homonimo && sec.homonimos > 1) add(['estructura', 'secciones', nombre], 'el token {{homonimo}} va una sola vez por página', GATES.g5);
  }
  for (const s of def.secciones as readonly DefSeccion[]) {
    const sec = (p.estructura.secciones as Record<string, { homonimos: number } | undefined>)[s.nombre];
    if (s.homonimo === 'requerido' && sec && sec.homonimos !== 1) {
      add(['estructura', 'secciones', s.nombre], `${plantilla} exige el test de homónimo: una pregunta con {{homonimo}}`, GATES.g2);
    }
  }

  const gatePlantilla = ('gatePlantilla' in def ? def.gatePlantilla : []) as readonly string[];
  const abiertas = gatePlantilla.filter((d) => dudas[d]?.estado !== 'cerrada');
  if (p.status === 'ready' && abiertas.length) {
    add(['template'], `la plantilla ${plantilla} está bloqueada entera por ${abiertas.join(', ')}; no puede haber páginas ready`, GATES.g3);
  }

  if (p.lastUpdated > new Date().toISOString().slice(0, 10)) add(['lastUpdated'], `lastUpdated ${p.lastUpdated} está en el futuro`);
}

export const esquemaPagina = z
  .discriminatedUnion('template', [T1, T2, T2_HUB, T3, T4, T4_GLOSARIO, T5, T6, HOME, CONTACTO, UTILITARIA], {
    error: (iss) =>
      iss.code === 'invalid_union' ? `template ausente o inválido; valores: ${IDS_PLANTILLA.join(', ')}` : undefined,
  })
  .superRefine(reglasCruzadas, { when: () => true });

export type DatosPagina = z.infer<typeof esquemaPagina>;
