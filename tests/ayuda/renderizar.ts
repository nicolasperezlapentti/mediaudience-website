/**
 * Renderiza un componente .astro con el Container API de Astro, dentro del grafo de módulos
 * de Vite del proyecto, e imprime el HTML. Para probar componentes que ninguna página usa
 * todavía (B-06 hasta que D-13 libere T5).
 *   node tests/ayuda/renderizar.ts <ruta del componente> '<props en JSON>'
 */
import { getViteConfig } from 'astro/config';
import { createServer } from 'vite';

const [componente, props = '{}'] = process.argv.slice(2);
const config = await getViteConfig({ logLevel: 'silent' }, { logLevel: 'silent' })({ command: 'serve', mode: 'test' });
const vite = await createServer({ ...config, logLevel: 'silent', server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' });
try {
  const { experimental_AstroContainer } = (await vite.ssrLoadModule('astro/container')) as typeof import('astro/container');
  const mod = await vite.ssrLoadModule(componente);
  const container = await experimental_AstroContainer.create();
  process.stdout.write(await container.renderToString(mod.default, { props: JSON.parse(props) }));
} catch (e) {
  process.stderr.write(String((e as Error).message ?? e));
  process.exitCode = 1;
} finally {
  await vite.close();
}
