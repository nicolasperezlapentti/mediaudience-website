/**
 * Sociedades locales publicables (fact-book §1.3, capa 2). Única regla para dos salidas:
 * los nodos Organization por mercado del JSON-LD, la tabla B-03 de /nosotros/ y el bloque
 * legal B-04 de cada página país. Un mercado
 * entra cuando tiene razón social, fecha de constitución y domicilio en entidad.json, y
 * ninguna de sus dudas sigue abierta. Hoy: Ecuador.
 */
import { estaAbierta, type Entidad } from './datos.ts';
import { MARCA } from './marca.ts';
import type { Sitio } from './sitio.ts';

type Mercado = Entidad['mercados'][number];

export interface ContactoLocal {
  correo: string | null;
  telefono: string | null;
  oficina: string | null;
  horario: { texto: string; zona: string } | null;
}

function contactoPublicable(m: Mercado, sitio: Sitio): ContactoLocal | null {
  const c = m.contacto;
  if (!c || c.bloqueadoPor.some((d) => estaAbierta(sitio.dudas, d))) return null;
  const contacto = { correo: c.correo ?? null, telefono: c.telefono ?? null, oficina: c.oficina ?? null, horario: c.horario ?? null };
  return contacto.correo || contacto.telefono ? contacto : null;
}

export interface SociedadLocal {
  codigo: string;
  pais: string;
  /** Nombre de la operación local: MARCA + país. */
  nombre: string;
  legalName: string;
  foundingDate: string;
  address: NonNullable<Mercado['address']>;
  /** «Samborondón, Guayas». */
  ciudad: string;
  /** «Av. Primera 212, Samborondón, Guayas, Ecuador». */
  domicilio: string;
  identificacionFiscal: Mercado['identificacionFiscal'] | null;
  ciiu: string | null;
  slug: string;
  /** B-10 · contacto del mercado, solo si tiene algún dato y ninguna duda abierta. */
  contacto: ContactoLocal | null;
  /** Página del país, solo si está ready. */
  pagina: { href: string; texto: string } | null;
}

export function sociedadesLocales(sitio: Sitio): SociedadLocal[] {
  return sitio.entidad.mercados.flatMap((m): SociedadLocal[] => {
    if (!m.legalName || !m.foundingDate || !m.address) return [];
    if (m.bloqueadoPor.some((d) => estaAbierta(sitio.dudas, d))) return [];
    const nombre = `${MARCA} ${m.pais}`;
    return [
      {
        codigo: m.codigo,
        pais: m.pais,
        nombre,
        legalName: m.legalName,
        foundingDate: m.foundingDate,
        address: m.address,
        ciudad: `${m.address.addressLocality}, ${m.address.addressRegion}`,
        domicilio: `${m.address.streetAddress}, ${m.address.addressLocality}, ${m.address.addressRegion}, ${m.pais}`,
        identificacionFiscal: m.identificacionFiscal ?? null,
        ciiu: m.ciiu ?? null,
        slug: m.slug,
        contacto: contactoPublicable(m, sitio),
        pagina: sitio.publicadas.has(m.slug) ? { href: m.slug, texto: nombre } : null,
      },
    ];
  });
}
