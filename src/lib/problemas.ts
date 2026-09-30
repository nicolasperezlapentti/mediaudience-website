/** Un incumplimiento de gate. El build junta todos y falla una sola vez con la lista completa. */
export interface Problema {
  gate: string;
  archivo: string;
  seccion?: string;
  mensaje: string;
}

export const GATES = {
  estructura: 'estructura',
  g1: 'gate 1 · status',
  g2: 'gate 2 · sección obligatoria',
  g3: 'gate 3 · sección con gate',
  g4: 'gate 4 · enlaces',
  g5: 'gate 5 · marca',
  tokens: 'tokens',
  jsonld: 'json-ld',
  navegacion: 'navegación',
} as const;

export function formatearProblemas(problemas: readonly Problema[]): string {
  const porGate = new Map<string, Problema[]>();
  for (const p of problemas) {
    const lista = porGate.get(p.gate) ?? [];
    lista.push(p);
    porGate.set(p.gate, lista);
  }
  const lineas: string[] = [`✗ ${problemas.length} incumplimiento(s) de gates de build:`];
  for (const [gate, lista] of porGate) {
    lineas.push('', `  [${gate}]`);
    for (const p of lista) {
      const donde = p.seccion ? `${p.archivo} → «${p.seccion}»` : p.archivo;
      lineas.push(`    ${donde}: ${p.mensaje}`);
    }
  }
  return lineas.join('\n');
}

export class ErrorDeGates extends Error {
  readonly problemas: readonly Problema[];

  constructor(problemas: readonly Problema[]) {
    super(formatearProblemas(problemas));
    this.name = 'ErrorDeGates';
    this.problemas = problemas;
  }
}
