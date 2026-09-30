import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import type { Problema } from '../../src/lib/problemas.ts';

export const FIXTURE = 'tests/fixtures/sitio-valido';

/** Copia el fixture válido a un directorio temporal y aplica una mutación. */
export function sitioTemporal(mutar?: (dir: string) => void): string {
  const dir = mkdtempSync(join(tmpdir(), 'ma-gates-'));
  cpSync(FIXTURE, dir, { recursive: true });
  mutar?.(dir);
  return dir;
}

export function editar(dir: string, relativo: string, fn: (texto: string) => string): void {
  const p = join(dir, relativo);
  writeFileSync(p, fn(readFileSync(p, 'utf8')));
}

export function escribir(dir: string, relativo: string, texto: string): void {
  const p = join(dir, relativo);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, texto);
}

function ejecutar<T>(modo: string, env: Record<string, string>): T {
  const r = spawnSync(process.execPath, ['tests/ayuda/ejecutar.ts', modo], { env: { ...process.env, ...env }, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr);
  return JSON.parse(r.stdout) as T;
}

export const problemas = (contenido: string, env: Record<string, string> = {}) =>
  ejecutar<Problema[]>('fuente', { MA_CONTENIDO: contenido, ...env });

export const publicadas = (contenido: string) =>
  ejecutar<{ rutas: string[]; visibles: Record<string, string[]>; nav: string[]; sitemapXml: string; llms: string }>('publicadas', {
    MA_CONTENIDO: contenido,
  });
