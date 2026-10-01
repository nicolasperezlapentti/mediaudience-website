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

/** «2022-01-10» → «10 de enero de 2022». Se interpreta en UTC: una fecha, no un instante. */
export function formatoFechaLarga(iso: string): string {
  const fecha = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(fecha.getTime())) throw new RangeError(`formatoFechaLarga: «${iso}» no es una fecha AAAA-MM-DD`);
  return new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(fecha);
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** «2025-03» → «marzo 2025». Fecha de corte (B-02) y mes de un KPI (B-06). */
export function formatoMes(aaaaMm: string): string {
  const m = aaaaMm.match(/^(\d{4})-(\d{2})$/);
  const mes = m ? Number(m[2]) : 0;
  if (!m || mes < 1 || mes > 12) throw new RangeError(`formatoMes: «${aaaaMm}» no es un mes AAAA-MM`);
  return `${MESES[mes - 1]} ${m[1]}`;
}
