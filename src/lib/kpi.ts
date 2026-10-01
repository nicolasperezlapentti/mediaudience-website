/**
 * B-06 · KPI en texto (PLANTILLAS §2, T5 · design/referencia/bloques.html).
 *
 * Las reglas viven acá, no en el componente, para que se puedan probar y para que ningún KPI
 * llegue al HTML sin ellas:
 *   - cifra como texto con su valor máquina (<data value>), en formato es-EC;
 *   - números absolutos y denominador explícito: «35.769 clics sobre 384.615 envíos»;
 *   - siempre mercado y mes; siempre línea B-02 debajo, con la misma fecha de corte;
 *   - una sola cifra en acento por fila.
 * Un KPI que no cumple lanza un error y el build falla. Hoy ninguna página los usa: los casos
 * (T5) y la franja de casos de T2 están bloqueados por D-13.
 */
import { formatoMes, formatoNumero } from './formato.ts';

export interface CifraAbsoluta {
  /** Número absoluto, nunca abreviado: 384615, no «384,6K». */
  valor: number;
  /** Qué se cuenta, en plural: «envíos», «impresiones», «clics», «descargas». */
  unidad: string;
}

export interface DatosKpi {
  /** «CTR», «CPA», «VTR». */
  metrica: string;
  /** Producto normalizado del portafolio: «Push Premium Video georreferenciado». */
  producto: string;
  /** Opcional: «campaña de una telco líder de la región». */
  contexto?: string;
  /** El valor de la métrica. Para %, en puntos: 9.3, no 0.093. */
  valor: number;
  unidad: '%' | 'USD' | null;
  decimales?: number;
  /** Lo que se midió sobre el denominador, cuando es un conteo: 35.769 clics. */
  numerador?: CifraAbsoluta;
  /** Sin numerador, cómo se lee la relación: «costo por adquisición». */
  lectura?: string;
  /** Sobre qué se mide. Obligatorio. */
  denominador: CifraAbsoluta;
  /** País o mercado: «Ecuador». */
  mercado: string;
  /** Mes del dato, AAAA-MM. Es también el corte de la línea B-02. */
  fecha: string;
  /** Fuente de la línea B-02: «datos de la compañía». */
  fuente: string;
  /** La cifra en acento: una por fila como máximo. */
  acento?: boolean;
}

export interface ValorMostrado {
  maquina: string;
  texto: string;
}

export interface ModeloKpi {
  etiqueta: string;
  cifra: ValorMostrado;
  unidad: '%' | 'USD' | null;
  acento: boolean;
  numerador: (ValorMostrado & { unidad: string }) | null;
  lectura: string | null;
  denominador: ValorMostrado & { unidad: string };
  mercado: string;
  fecha: { maquina: string; texto: string };
  fuente: string;
}

const absoluto = (c: CifraAbsoluta, campo: string, errores: string[]) => {
  if (!Number.isInteger(c.valor) || c.valor <= 0) errores.push(`${campo}: número absoluto entero y positivo (${c.valor})`);
  if (!c.unidad.trim()) errores.push(`${campo}: falta la unidad («envíos», «impresiones»…)`);
  return { maquina: String(c.valor), texto: formatoNumero(c.valor, { max: 0 }), unidad: c.unidad };
};

export function modeloKpi(k: DatosKpi): ModeloKpi {
  const errores: string[] = [];
  for (const campo of ['metrica', 'producto', 'mercado', 'fuente'] as const) {
    if (!k[campo]?.trim()) errores.push(`falta ${campo}`);
  }
  if (!Number.isFinite(k.valor)) errores.push(`valor no numérico (${k.valor})`);
  let fecha = { maquina: k.fecha, texto: '' };
  try {
    fecha = { maquina: k.fecha, texto: formatoMes(k.fecha) };
  } catch {
    errores.push(`fecha «${k.fecha}»: el mes del dato es obligatorio, AAAA-MM`);
  }
  if (!k.denominador) errores.push('falta el denominador: un KPI sin base no se publica');
  if (!k.numerador && !k.lectura?.trim()) errores.push('sin numerador, hace falta la lectura de la relación («costo por adquisición»)');
  const denominador = k.denominador ? absoluto(k.denominador, 'denominador', errores) : { maquina: '', texto: '', unidad: '' };
  const numerador = k.numerador ? absoluto(k.numerador, 'numerador', errores) : null;

  if (errores.length) throw new Error(`B-06 · KPI «${k.metrica ?? '?'} · ${k.producto ?? '?'}»: ${errores.join('; ')}`);

  const decimales = k.decimales ?? (k.unidad === '%' ? 1 : 2);
  // <data value> lleva el valor máquina: un porcentaje como fracción (9,3% → 0.093).
  const maquina = k.unidad === '%' ? String(Number((k.valor / 100).toFixed(decimales + 2))) : String(k.valor);
  return {
    etiqueta: [k.metrica, k.producto, k.contexto].filter(Boolean).join(' · '),
    cifra: { maquina, texto: formatoNumero(k.valor, { max: decimales }) },
    unidad: k.unidad,
    acento: Boolean(k.acento),
    numerador,
    lectura: k.lectura?.trim() || null,
    denominador,
    mercado: k.mercado,
    fecha,
    fuente: k.fuente,
  };
}

/** Una fila de KPI admite una sola cifra en acento. */
export function validarFila(kpis: readonly DatosKpi[]): void {
  const acentos = kpis.filter((k) => k.acento).length;
  if (acentos > 1) throw new Error(`B-06 · fila de KPI con ${acentos} cifras en acento: va una sola por fila`);
}
