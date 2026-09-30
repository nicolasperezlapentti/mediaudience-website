/**
 * Colección `paginas`: un .md de content/paginas/ por página, validado con el schema de su
 * plantilla (src/lib/esquemas.ts).
 *
 * Gate 1 en la capa de datos: solo entran las páginas con status ready en sitemap.json.
 * Una página blocked, partial o draft no existe para Astro, así que ninguna plantilla la
 * puede listar, enlazar ni generar.
 */
import { defineCollection } from 'astro:content';
import type { Loader } from 'astro/loaders';
import { PAGINAS } from './lib/entorno.ts';
import { esquemaPagina } from './lib/esquemas.ts';
import { cargarSitio } from './lib/sitio.ts';

const paginasReady: Loader = {
  name: 'paginas-ready',
  load: async ({ store, parseData, generateDigest, watcher }) => {
    const cargar = async () => {
      store.clear();
      const sitio = cargarSitio({ refrescar: true });
      for (const l of sitio.leidas) {
        if (!sitio.publicadas.has(l.ruta)) continue;
        const data = await parseData({ id: l.ruta, data: l.datos, filePath: l.archivo });
        store.set({ id: l.ruta, data, body: l.cuerpo, filePath: l.archivo, digest: generateDigest(l.cuerpo + JSON.stringify(l.datos)) });
      }
    };
    await cargar();
    watcher?.add(PAGINAS);
    watcher?.on('change', (f) => f.startsWith(PAGINAS) && cargar());
  },
};

export const collections = {
  paginas: defineCollection({ loader: paginasReady, schema: esquemaPagina }),
};
