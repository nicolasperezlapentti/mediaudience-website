/**
 * Formato numérico canónico es-EC (PLANTILLAS §5.7): coma decimal, punto de miles.
 *   formatoNumero(1305200)   → «1.305.200»
 *   formatoPorcentaje(9.3)   → «9,3%»
 *   formatoUSD(14.5)         → «USD 14,5»
 *
 * useGrouping: 'always' agrupa también los números de cuatro cifras («1.234»): la regla por
 * defecto del español no los agrupa y la regla del sitio es punto de miles siempre.
 * Los tests de tests/formato.test.ts fijan la salida: si el ICU del runtime cambia, fallan.
 */

const LOCALE = 'es-EC';

export interface OpcionesDecimales {
  /** Decimales mínimos. Por defecto 0: 14,5 y no 14,50. */
  min?: number;
  /** Decimales máximos. Por defecto 2. */
  max?: number;
}

export function formatoNumero(valor: number, { min = 0, max = 2 }: OpcionesDecimales = {}): string {
  if (!Number.isFinite(valor)) throw new RangeError(`formatoNumero: ${valor} no es un número finito`);
  return new Intl.NumberFormat(LOCALE, {
    useGrouping: 'always',
    minimumFractionDigits: min,
    maximumFractionDigits: Math.max(min, max),
  }).format(valor);
}

/** Recibe el porcentaje ya expresado en puntos (9.3, no 0.093). Sin espacio antes del signo. */
export function formatoPorcentaje(puntos: number, { min = 0, max = 1 }: OpcionesDecimales = {}): string {
  return `${formatoNumero(puntos, { min, max })}%`;
}

export function formatoUSD(valor: number, opciones: OpcionesDecimales = {}): string {
  return `USD ${formatoNumero(valor, opciones)}`;
}
