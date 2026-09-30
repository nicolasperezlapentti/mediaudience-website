/**
 * Conecta los gates al build de Astro. `astro build` falla —con la lista completa— si:
 *   1. design/tokens.css está desactualizado respecto de tokens.json;
 *   2. la fuente incumple algún gate (antes de generar nada);
 *   3. el HTML generado incumple algún gate (después de generar).
 * No hay modo advertencia: un incumplimiento es un build fallido.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { verificarFuente } from '../lib/gates/fuente.ts';
import { verificarSalida } from '../lib/gates/salida.ts';
import { ErrorDeGates } from '../lib/problemas.ts';
import { cargarSitio } from '../lib/sitio.ts';

export default function gates(): AstroIntegration {
  return {
    name: 'gates-de-build',
    hooks: {
      'astro:config:setup': ({ command, logger }) => {
        if (command !== 'build') return;
        try {
          execFileSync(process.execPath, ['scripts/build-tokens.mjs', '--check'], { stdio: 'pipe' });
        } catch (e) {
          throw new Error(String((e as { stderr?: Buffer }).stderr ?? e));
        }
        const problemas = verificarFuente();
        if (problemas.length) throw new ErrorDeGates(problemas);
        logger.info('✓ tokens.css al día · gates de fuente OK');
      },
      'astro:build:done': ({ dir, logger }) => {
        const problemas = verificarSalida(fileURLToPath(dir), cargarSitio({ refrescar: true }));
        if (problemas.length) throw new ErrorDeGates(problemas);
        logger.info('✓ gates de salida OK');
      },
    },
  };
}
