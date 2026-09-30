// @ts-check
import { defineConfig } from 'astro/config';
import gates from './src/integraciones/gates.ts';
import { SITIO } from './src/lib/marca.ts';

// Salida estática: cada página es HTML completo generado en el build. Cero hidratación para
// contenido (README.md, «Todo contenido significativo sale en el HTML de servidor»).
export default defineConfig({
  site: SITIO,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  outDir: process.env.MA_DIST ?? './dist',
  integrations: [gates()],
  devToolbar: { enabled: false },
});
