/**
 * Corre los gates en un proceso aparte, para que cada test elija su árbol de contenido con
 * MA_CONTENIDO (las rutas se resuelven al importar src/lib/entorno.ts). Imprime JSON.
 *   fuente      → Problema[] de verificarFuente()
 *   publicadas  → rutas generadas, secciones visibles, navegación, sitemap.xml y llms.txt
 */
import { verificarFuente } from '../../src/lib/gates/fuente.ts';
import { llmsTxt, sitemapXml } from '../../src/lib/fase0.ts';
import { construirNavegacion } from '../../src/lib/navegacion.ts';
import { cargarSitio } from '../../src/lib/sitio.ts';

const modo = process.argv[2];
if (modo === 'fuente') {
  console.log(JSON.stringify(verificarFuente()));
} else if (modo === 'publicadas') {
  const sitio = cargarSitio();
  const nav = construirNavegacion(sitio);
  console.log(
    JSON.stringify({
      rutas: [...sitio.publicadas.keys()],
      visibles: Object.fromEntries([...sitio.publicadas].map(([r, p]) => [r, p.visibles.map((v) => v.def.nombre)])),
      nav: [
        ...nav.header.flatMap((e) => (e.tipo === 'mega' ? e.columnas : [e.grupo])),
        ...nav.footer,
        ...[nav.mercados ?? []].flat(),
      ].flatMap((g) => g.items.map((i) => i.href)),
      sitemapXml: sitemapXml(sitio),
      llms: llmsTxt(sitio),
    }),
  );
} else {
  throw new Error(`modo desconocido: ${modo}`);
}
