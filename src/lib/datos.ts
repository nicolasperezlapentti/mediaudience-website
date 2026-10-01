/**
 * Carga y valida los tres archivos de datos de content/: sitemap.json, dudas.json y entidad.json.
 * Un archivo que no cumple su schema rompe el build antes de mirar ninguna página.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'astro/zod';
import { CONTENIDO } from './entorno.ts';

export const idDuda = z.string().regex(/^D-\d{2}$/, { error: 'formato de duda inválido (esperado D-NN)' });
export const slugCanonico = z
  .string()
  .regex(/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)*$/, { error: 'slug no canónico: minúsculas, sin acentos, con barra final' });

export const STATUS = ['ready', 'partial', 'blocked', 'draft'] as const;
export type Status = (typeof STATUS)[number];

/* ---------------- sitemap.json ---------------- */

export interface PaginaSitemap {
  slug: string;
  title: string;
  type: 'pilar' | 'cluster' | 'local' | 'utilitaria';
  phase?: number | string | null;
  status: Status;
  blockedBy?: string[];
  notes?: string;
  nav?: { label: string };
  children: PaginaSitemap[];
}

const paginaSitemap: z.ZodType<PaginaSitemap> = z.lazy(() =>
  z.strictObject({
    slug: slugCanonico,
    title: z.string().min(1),
    type: z.enum(['pilar', 'cluster', 'local', 'utilitaria']),
    phase: z.union([z.number(), z.string(), z.null()]).optional(),
    status: z.enum(STATUS),
    blockedBy: z.array(idDuda).optional(),
    notes: z.string().optional(),
    nav: z.strictObject({ label: z.string().min(1) }).optional(),
    children: z.array(paginaSitemap),
  }),
);

const itemNav = z.strictObject({
  label: z.string().min(1),
  anchor: z.string().min(1),
  href: z.string().min(1),
});
export type ItemNavDatos = z.infer<typeof itemNav>;

/** Header (PLANTILLAS §1.3): un mega-menú con las cuatro facetas como columnas, y desplegables. */
const entradaHeader = z.discriminatedUnion('tipo', [
  z.strictObject({
    tipo: z.literal('mega'),
    label: z.string().min(1),
    columnas: z.array(z.strictObject({ grupo: z.string(), label: z.string().min(1) })).min(1),
    nota: z.string().min(1),
    todas: itemNav,
  }),
  z.strictObject({ tipo: z.literal('dropdown'), grupo: z.string() }),
]);
export type EntradaHeaderDatos = z.infer<typeof entradaHeader>;

const sitemapSchema = z.strictObject({
  meta: z.record(z.string(), z.unknown()),
  pages: z.array(paginaSitemap),
  navegacion: z.strictObject({
    notes: z.string().optional(),
    grupos: z.record(z.string(), z.strictObject({ label: z.string().min(1), items: z.array(itemNav) })),
    header: z.array(entradaHeader),
    headerCta: itemNav,
    footer: z.array(z.string()),
    footerContacto: itemNav,
    footerMercados: z.string(),
    footerLegal: z.string(),
  }),
});
export type Sitemap = z.infer<typeof sitemapSchema>;

/* ---------------- dudas.json ---------------- */

const dudasSchema = z.strictObject({
  meta: z.record(z.string(), z.unknown()),
  dudas: z.record(
    idDuda,
    z.strictObject({
      estado: z.enum(['abierta', 'cerrada']),
      titulo: z.string().min(1),
      cerradaEl: z.iso.date().optional(),
      /** Abierta, oculta cada bloque (párrafo, ítem, fila) que la cita: el dato no se puede publicar todavía. */
      bloqueaPublicacion: z.boolean().optional(),
    }),
  ),
});
export type Dudas = z.infer<typeof dudasSchema>['dudas'];

/* ---------------- entidad.json ---------------- */

const direccion = z.strictObject({
  streetAddress: z.string(),
  addressLocality: z.string(),
  addressRegion: z.string(),
  addressCountry: z.string().length(2),
});

const entidadSchema = z.strictObject({
  meta: z.record(z.string(), z.unknown()),
  /**
   * La marca-entidad NO admite foundingDate ni address: el objeto es estricto y no los declara.
   * La fecha de fundación del grupo está pendiente (D-01); la de Ecuador es de una sociedad local.
   */
  marca: z.strictObject({
    description: z.string().min(1),
    foundingLocation: z.strictObject({ name: z.string(), addressCountry: z.string().length(2) }),
    areaServed: z.array(z.string().length(2)),
    knowsAbout: z.array(z.string()),
    sameAs: z.array(z.url()),
  }),
  mercados: z.array(
    z.strictObject({
      codigo: z.string().length(2),
      pais: z.string(),
      slug: slugCanonico,
      legalName: z.string().optional(),
      foundingDate: z.iso.date().optional(),
      address: direccion.optional(),
      identificacionFiscal: z.strictObject({ tipo: z.enum(['RUC', 'RFC', 'RUT']), valor: z.string().min(1) }).optional(),
      /** B-10 · contacto comercial del mercado. Institucional, nunca un correo personal (PLANTILLAS §1.5). */
      contacto: z
        .strictObject({
          correo: z.email().optional(),
          telefono: z.string().regex(/^\+\d[\d ]{6,}$/, { error: 'teléfono en formato internacional: +593 4 …' }).optional(),
          oficina: z.string().min(1).optional(),
          horario: z.strictObject({ texto: z.string().min(1), zona: z.string().regex(/^(GMT|UTC)[+-]\d{1,2}$/, { error: 'zona horaria explícita: GMT-5' }) }).optional(),
          bloqueadoPor: z.array(idDuda).default([]),
        })
        .optional(),
      ciiu: z.string().min(1).optional(),
      bloqueadoPor: z.array(idDuda),
    }),
  ),
  llms: z.strictObject({ resumen: z.string().min(1) }),
});
export type Entidad = z.infer<typeof entidadSchema>;

/* ---------------- carga ---------------- */

function leerJson<T>(nombre: string, schema: z.ZodType<T>): T {
  const ruta = resolve(CONTENIDO, nombre);
  let crudo: unknown;
  try {
    crudo = JSON.parse(readFileSync(ruta, 'utf8'));
  } catch (e) {
    throw new Error(`No se pudo leer ${ruta}: ${(e as Error).message}`);
  }
  const r = schema.safeParse(crudo);
  if (!r.success) {
    throw new Error(`${ruta} no cumple su schema:\n${z.prettifyError(r.error)}`);
  }
  return r.data;
}

export const cargarSitemap = (): Sitemap => leerJson('sitemap.json', sitemapSchema);
export const cargarDudas = (): Dudas => leerJson('dudas.json', dudasSchema).dudas;
export const cargarEntidad = (): Entidad => leerJson('entidad.json', entidadSchema);

/** Todas las páginas del árbol, en orden de documento. */
export function aplanar(paginas: readonly PaginaSitemap[], padre: string | null = null): (PaginaSitemap & { padre: string | null })[] {
  return paginas.flatMap((p) => [{ ...p, padre }, ...aplanar(p.children, p.slug)]);
}

export function estaAbierta(dudas: Dudas, id: string): boolean {
  return dudas[id]?.estado !== 'cerrada';
}

export function bloqueaPublicacion(dudas: Dudas, id: string): boolean {
  return Boolean(dudas[id]?.bloqueaPublicacion) && estaAbierta(dudas, id);
}
