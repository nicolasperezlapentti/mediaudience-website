/**
 * Plantillas T1–T6 de PLANTILLAS.md §4, más `home`, `contacto` y `utilitaria`, que el
 * documento no cubre. Cada plantilla declara su lista cerrada de H2, en orden de render:
 *
 *   OBL   obligatoria. Ausente o vacía → el build falla (gate 2).
 *   OPC   opcional. Ausente o vacía → no se renderiza.
 *   GATE  condicionada a dudas D-XX. Con alguna abierta → no se renderiza (gate 3).
 *         Con todas cerradas, se comporta como OPC.
 *
 * Un H2 que no figure en la lista de su plantilla rompe el build. Los H3 son libres.
 * Las seis secciones de FORMATO-CONTENIDO.md son comunes a todas las plantillas; cada
 * plantilla suma las suyas y puede endurecer el estado de las comunes.
 *
 * `generado` lista bloques que la plantilla arma desde datos (sitemap.json, entidad.json),
 * no desde el Markdown, y que por lo tanto no se pueden omitir ni rellenar a mano.
 */

import { MARCA } from './marca.ts';

export type Estado = 'OBL' | 'OPC' | 'GATE';

export interface DefSeccion {
  nombre: string;
  estado: Estado;
  gate?: readonly string[];
  bloque?: string;
  /** false: la sección no lleva H2 visible (el answer target va pegado al H1; el CTA es un enlace). */
  titulo?: boolean;
  /** Admite el token de homónimo. 'requerido': debe contenerlo exactamente una vez. */
  homonimo?: 'permitido' | 'requerido';
}

export interface DefPlantilla {
  nombre: string;
  secciones: readonly DefSeccion[];
  generado?: readonly string[];
  /** La plantilla entera depende de estas dudas: una página ready con alguna abierta rompe el build. */
  gatePlantilla?: readonly string[];
}

const RESPUESTA: DefSeccion = { nombre: 'Respuesta directa', estado: 'OBL', bloque: 'B-01', titulo: false };
const DATOS: DefSeccion = { nombre: 'Datos clave', estado: 'OPC', bloque: 'B-02' };
const DESARROLLO: DefSeccion = { nombre: 'Desarrollo', estado: 'OPC' };
const PRUEBA: DefSeccion = { nombre: 'Prueba / caso relacionado', estado: 'GATE', gate: ['D-13'], bloque: 'B-06' };
const FAQ: DefSeccion = { nombre: 'FAQ', estado: 'OPC', bloque: 'B-05' };
const CTA: DefSeccion = { nombre: 'CTA de cierre', estado: 'OPC', titulo: false };

const obl = (s: DefSeccion): DefSeccion => ({ ...s, estado: 'OBL' });

export const PLANTILLAS = {
  home: {
    nombre: 'Home',
    secciones: [
      RESPUESTA,
      DATOS,
      DESARROLLO,
      { nombre: 'Soluciones', estado: 'OPC' },
      PRUEBA,
      { ...FAQ, homonimo: 'permitido' },
      obl(CTA),
    ],
    generado: ['bloque de entidad (descriptor + enlace a la página T1)', 'resúmenes de facetas (PLANTILLAS §1.5)'],
  },

  T1: {
    nombre: 'Entidad',
    secciones: [
      RESPUESTA,
      DATOS,
      { nombre: `${MARCA} en la región`, estado: 'OBL', bloque: 'B-03' },
      { nombre: 'Origen y modelo', estado: 'OBL' },
      { nombre: 'Posicionamiento', estado: 'OBL', bloque: 'B-02' },
      { nombre: 'Partnership con Siprocal', estado: 'GATE', gate: ['D-15'], bloque: 'B-02' },
      DESARROLLO,
      { nombre: 'Equipo', estado: 'OPC' },
      PRUEBA,
      { ...obl(FAQ), homonimo: 'requerido' },
      CTA,
    ],
    generado: ['grafo JSON-LD de dos capas completo'],
  },

  T2: {
    nombre: 'Pilar de solución',
    secciones: [
      RESPUESTA,
      DATOS,
      { nombre: 'Cómo funciona', estado: 'OBL' },
      { nombre: 'Qué lo diferencia', estado: 'OBL', bloque: 'B-02' },
      { nombre: 'Disponibilidad por mercado', estado: 'OBL' },
      DESARROLLO,
      PRUEBA,
      { nombre: 'Explicador relacionado', estado: 'OBL' },
      FAQ,
      obl(CTA),
    ],
  },

  'T2-hub': {
    nombre: 'Pilar de solución · hub',
    secciones: [
      RESPUESTA,
      DATOS,
      { nombre: 'Los tres productos', estado: 'OBL', bloque: 'B-09' },
      { nombre: 'Disponibilidad por mercado', estado: 'OBL' },
      DESARROLLO,
      PRUEBA,
      { nombre: 'Explicador relacionado', estado: 'OBL' },
      FAQ,
      obl(CTA),
    ],
  },

  T3: {
    nombre: 'Página país',
    secciones: [
      RESPUESTA,
      DATOS,
      { nombre: 'Soluciones disponibles', estado: 'OBL' },
      { nombre: 'Información legal', estado: 'OBL', bloque: 'B-04' },
      { nombre: 'Socio local', estado: 'GATE', gate: ['D-31'] },
      { nombre: 'Contacto local', estado: 'OBL', bloque: 'B-10' },
      DESARROLLO,
      FAQ,
      CTA,
    ],
    generado: ['enlace a la entidad única (página T1)'],
  },

  T4: {
    nombre: 'Explicador / recurso',
    secciones: [
      RESPUESTA,
      DATOS,
      obl(DESARROLLO),
      { nombre: 'Tabla comparativa', estado: 'OPC', bloque: 'B-07' },
      { nombre: 'Pilar relacionado', estado: 'OBL' },
      { nombre: 'Glosario relacionado', estado: 'OPC', bloque: 'B-08' },
      FAQ,
      CTA,
    ],
  },

  'T4-glosario': {
    nombre: 'Explicador / recurso · glosario',
    secciones: [RESPUESTA, { nombre: 'Términos', estado: 'OBL', bloque: 'B-08' }, FAQ, CTA],
  },

  T5: {
    nombre: 'Caso',
    gatePlantilla: ['D-13'],
    secciones: [
      RESPUESTA,
      { nombre: 'Cliente y contexto', estado: 'OBL' },
      { nombre: 'Objetivo', estado: 'OBL' },
      { nombre: 'Segmentación aplicada', estado: 'OBL' },
      { nombre: 'Formato', estado: 'OBL' },
      { nombre: 'Resultado', estado: 'OBL', bloque: 'B-06' },
      { nombre: 'Cierre', estado: 'OBL' },
      { nombre: 'Producto relacionado', estado: 'OBL' },
      CTA,
    ],
  },

  T6: {
    nombre: 'Hub de índice',
    secciones: [RESPUESTA, DATOS, DESARROLLO, PRUEBA, FAQ, CTA],
    generado: ['grilla de hijos ready con su metaDescription', 'enlace a la entidad única (página T1)'],
  },

  contacto: {
    nombre: 'Contacto',
    secciones: [
      RESPUESTA,
      { nombre: 'Contacto por mercado', estado: 'OPC' },
      { nombre: 'Formulario', estado: 'OPC' },
      FAQ,
      CTA,
    ],
  },

  utilitaria: {
    nombre: 'Utilitaria',
    secciones: [RESPUESTA, obl(DESARROLLO), FAQ],
  },
} as const satisfies Record<string, DefPlantilla>;

export type IdPlantilla = keyof typeof PLANTILLAS;
export const IDS_PLANTILLA = Object.keys(PLANTILLAS) as [IdPlantilla, ...IdPlantilla[]];

export function defSeccion(plantilla: IdPlantilla, nombre: string): DefSeccion | undefined {
  return (PLANTILLAS[plantilla].secciones as readonly DefSeccion[]).find((s) => s.nombre === nombre);
}
