/**
 * Único archivo del repo de código que escribe la marca.
 *
 * El gate 5 hace cumplir dos cosas:
 *   - ningún archivo de src/ salvo este contiene el nombre de la marca en ninguna grafía;
 *   - ningún contenido, plantilla ni HTML generado contiene una grafía prohibida.
 *
 * La marca es una sola palabra, siempre. Ver README.md § «Por qué existe este repo».
 */

export const MARCA = 'Mediaudience';

export const SITIO = 'https://mediaudience.com';

/** Descriptor de una línea, liberado en el fact-book (§1.2). */
export const DESCRIPTOR =
  `${MARCA}, compañía multilatina de AdTech: SSP y representación de medios digitales en Perú, México, Ecuador y Chile.`;

/**
 * Test de homónimo (T1). La consulta literal que se busca desambiguar solo puede aparecer
 * a través de este token, y solo en el FAQ de las plantillas que lo admiten. El contenido
 * nunca escribe la cadena: escribe el token.
 */
export const HOMONIMO = 'media audience';
export const TOKEN_HOMONIMO = '{{homonimo}}';

/** «Media Audience», «MediaAudience», «media audience», «Media-Audience»… */
export const GRAFIA_PROHIBIDA = /media[\s _-]*audience/gi;

/** Términos que no existen en el portafolio y no deben aparecer en ninguna parte. */
export const TERMINOS_PROHIBIDOS: readonly { patron: RegExp; motivo: string; soloSalida?: boolean }[] = [
  { patron: /\bretail[\s-]*media\b/gi, motivo: 'Retail Media no está en el fact-book' },
  { patron: /\bin[\s-]?game\b/gi, motivo: 'In-Game es Mobile Gaming, bloqueado por D-07' },
  { patron: /\bmobile[\s-]*gaming\b/gi, motivo: 'Mobile Gaming está bloqueado por D-07', soloSalida: true },
];

/** Cualquier mención de la marca, para verificar que solo este archivo la escribe. */
export const MENCION_MARCA = /mediaudience/gi;

export function tituloDocumento(titulo: string): string {
  return titulo.includes(MARCA) ? titulo : `${titulo} · ${MARCA}`;
}

/**
 * Logotipo en tipografía viva (GUIA-DE-USO §1): «medi» + «a» en acento + «udience», en
 * minúscula. Se deriva de MARCA para que ningún componente escriba el nombre.
 */
const minuscula = MARCA.toLowerCase();
export const WORDMARK = { antes: minuscula.slice(0, 4), acento: minuscula.slice(4, 5), despues: minuscula.slice(5) } as const;
if (WORDMARK.acento !== 'a') throw new Error('marca.ts: el wordmark resalta la «a» central de la marca');
