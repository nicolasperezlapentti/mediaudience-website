/**
 * Cada gate de PLANTILLAS.md §5 tiene al menos un caso que DEBE fallar. Si alguno de estos
 * tests pasa sin que el gate reporte el problema, el gate dejó de funcionar.
 *
 * Todos parten del fixture válido (cero incumplimientos) y le aplican una sola mutación.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { editar, escribir, FIXTURE, problemas, publicadas, sitioTemporal } from './ayuda/sitio.ts';
import type { Problema } from '../src/lib/problemas.ts';

function hay(lista: Problema[], esperado: { gate?: string; archivo?: string; seccion?: string; mensaje?: RegExp }) {
  const ok = lista.some(
    (p) =>
      (!esperado.gate || p.gate.startsWith(esperado.gate)) &&
      (!esperado.archivo || p.archivo.includes(esperado.archivo)) &&
      (!esperado.seccion || p.seccion === esperado.seccion) &&
      (!esperado.mensaje || esperado.mensaje.test(p.mensaje)),
  );
  assert.ok(ok, `no se reportó ${JSON.stringify(esperado, (_k, v) => (v instanceof RegExp ? String(v) : v))}.\nReportado:\n${JSON.stringify(lista, null, 2)}`);
}

test('el fixture válido no tiene incumplimientos', () => {
  assert.deepEqual(problemas(FIXTURE), []);
});

/* ---------------- gate 1 ---------------- */

test('gate 1 · una página blocked con archivo no se genera ni entra en sitemap.xml, llms.txt ni menús', () => {
  const dir = sitioTemporal();
  escribir(dir, 'paginas/soluciones/producto-b.md', '---\ntitle: "B"\nmetaDescription: "B"\nstatus: "blocked"\ntemplate: "T2"\nschemaType: "Service"\nlastUpdated: "2026-09-01"\n---\n\n# B\n');
  assert.deepEqual(problemas(dir), []);
  const r = publicadas(dir);
  assert.ok(!r.rutas.includes('/soluciones/producto-b/'));
  assert.ok(!r.nav.some((h) => h.startsWith('/soluciones/producto-b/')), 'el menú no lista la página blocked');
  assert.ok(!r.nav.some((h) => h.startsWith('/mercados/pais-dos/')), 'el menú no lista el mercado blocked');
  assert.ok(!r.sitemapXml.includes('/soluciones/producto-b/'));
  assert.ok(!r.llms.includes('/soluciones/producto-b/'));
  assert.ok(r.nav.includes('/soluciones/producto-a/#alcance'), 'los destinos ready sí se listan');
});

test('gate 1 · una página ready sin archivo rompe el build', () => {
  const dir = sitioTemporal((d) => editar(d, 'sitemap.json', (t) => t.replace('"slug": "/soluciones/producto-c/", "title": "Producto C", "type": "pilar", "status": "draft"', '"slug": "/soluciones/producto-c/", "title": "Producto C", "type": "pilar", "status": "ready"')));
  hay(problemas(dir), { gate: 'gate 1', seccion: '/soluciones/producto-c/', mensaje: /no existe su archivo/ });
});

test('gate 1 · un archivo cuya URL no está en sitemap.json rompe el build', () => {
  const dir = sitioTemporal((d) => escribir(d, 'paginas/huerfana.md', '---\ntitle: "x"\n---\n# x\n'));
  hay(problemas(dir), { gate: 'gate 1', archivo: 'huerfana.md', mensaje: /no existe en sitemap\.json/ });
});

test('gate 1 · status del front matter distinto del de sitemap.json rompe el build', () => {
  const dir = sitioTemporal((d) => editar(d, 'paginas/soluciones/producto-a.md', (t) => t.replace('status: "ready"', 'status: "draft"')));
  hay(problemas(dir), { gate: 'gate 1', archivo: 'producto-a.md', mensaje: /distinto del de sitemap\.json/ });
});

/* ---------------- gate 2 ---------------- */

test('gate 2 · sección obligatoria vacía rompe el build, con archivo y sección', () => {
  const dir = sitioTemporal((d) =>
    editar(d, 'paginas/soluciones/producto-a.md', (t) => t.replace('## Qué lo diferencia\n\nTexto de prueba.', '## Qué lo diferencia\n\n<!-- BLOQUEADO D-02: sin dato en el fact-book -->')),
  );
  hay(problemas(dir), { gate: 'gate 2', archivo: 'paginas/soluciones/producto-a.md', seccion: 'Qué lo diferencia', mensaje: /vacía/ });
});

test('gate 2 · sección obligatoria ausente rompe el build', () => {
  const dir = sitioTemporal((d) => editar(d, 'paginas/mercados/pais-uno.md', (t) => t.replace(/## Contacto local[\s\S]*$/, '')));
  hay(problemas(dir), { gate: 'gate 2', archivo: 'pais-uno.md', seccion: 'Contacto local', mensaje: /ausente/ });
});

test('gate 2 · un H2 fuera de la plantilla rompe el build', () => {
  const dir = sitioTemporal((d) => editar(d, 'paginas/soluciones/producto-a.md', (t) => t.replace('## FAQ', '## Beneficios\n\nTexto.\n\n## FAQ')));
  hay(problemas(dir), { archivo: 'producto-a.md', mensaje: /H2 no permitido en T2: «Beneficios»/ });
});

test('gate 2 · T1 sin test de homónimo en el FAQ rompe el build', () => {
  const dir = sitioTemporal((d) => editar(d, 'paginas/nosotros.md', (t) => t.replace('"{{homonimo}}"', '"otra cosa"')));
  hay(problemas(dir), { gate: 'gate 2', archivo: 'nosotros.md', seccion: 'FAQ', mensaje: /test de homónimo/ });
});

/* ---------------- gate 3 ---------------- */

test('gate 3 · una sección con su duda abierta no se renderiza; al cerrarla, sí', () => {
  const abierta = publicadas(FIXTURE);
  assert.ok(!abierta.visibles['/nosotros/'].includes('Partnership con Siprocal'));
  assert.ok(!abierta.visibles['/'].includes('Prueba / caso relacionado'));
  assert.ok(!abierta.visibles['/mercados/pais-uno/'].includes('Socio local'));
  assert.ok(abierta.visibles['/contacto/'].includes('Formulario'), 'gate de front matter con duda cerrada: visible');

  const dir = sitioTemporal((d) => editar(d, 'dudas.json', (t) => t.replace('"D-15": { "estado": "abierta"', '"D-15": { "estado": "cerrada"')));
  assert.ok(publicadas(dir).visibles['/nosotros/'].includes('Partnership con Siprocal'));
});

test('gate 3 · una duda citada que no existe en dudas.json rompe el build', () => {
  const dir = sitioTemporal((d) => editar(d, 'paginas/soluciones/producto-a.md', (t) => t.replace('Texto de prueba.', 'Texto de prueba *(según datos de la compañía — D-99)*.')));
  hay(problemas(dir), { gate: 'gate 3', archivo: 'producto-a.md', mensaje: /D-99 no existe/ });
});

test('gate 3 · no se puede condicionar una sección obligatoria desde el front matter', () => {
  const dir = sitioTemporal((d) => editar(d, 'paginas/soluciones/producto-a.md', (t) => t.replace('lastUpdated: "2026-09-01"', 'lastUpdated: "2026-09-01"\ngates:\n  "Qué lo diferencia": ["D-02"]')));
  hay(problemas(dir), { gate: 'gate 3', archivo: 'producto-a.md', mensaje: /es OBL/ });
});

test('gate 3 · una plantilla bloqueada entera (T5 por D-13) no admite páginas ready', () => {
  const dir = sitioTemporal((d) => editar(d, 'paginas/soluciones/producto-a.md', (t) => t.replace('template: "T2"', 'template: "T5"')));
  hay(problemas(dir), { gate: 'gate 3', archivo: 'producto-a.md', mensaje: /bloqueada entera por D-13/ });
});

/* ---------------- gate 4 ---------------- */

test('gate 4 · enlace interno a una página que no está ready rompe el build', () => {
  const dir = sitioTemporal((d) => editar(d, 'paginas/soluciones/producto-a.md', (t) => t.replace('Texto de prueba sin enlace mientras el explicador no exista.', 'Ver el [Producto B de prueba](/soluciones/producto-b/).')));
  hay(problemas(dir), { gate: 'gate 4', archivo: 'producto-a.md', seccion: 'Explicador relacionado', mensaje: /está «blocked»/ });
});

test('gate 4 · enlace a un fragmento inexistente rompe el build', () => {
  const dir = sitioTemporal((d) => editar(d, 'paginas/mercados/pais-uno.md', (t) => t.replace('(/soluciones/producto-a/)', '(/soluciones/producto-a/#no-existe)')));
  hay(problemas(dir), { gate: 'gate 4', archivo: 'pais-uno.md', mensaje: /#no-existe no existe/ });
});

test('gate 4 · un ítem de navegación a un fragmento inexistente rompe el build', () => {
  const dir = sitioTemporal((d) => editar(d, 'sitemap.json', (t) => t.replace('/soluciones/producto-a/#alcance', '/soluciones/producto-a/#conversion')));
  hay(problemas(dir), { gate: 'gate 4', archivo: 'sitemap.json', mensaje: /#conversion no existe/ });
});

test('gate 4 · un ancla sola como destino de navegación rompe el build', () => {
  const dir = sitioTemporal((d) => editar(d, 'sitemap.json', (t) => t.replace('"href": "/nosotros/"', '"href": "#nosotros"')));
  hay(problemas(dir), { archivo: 'sitemap.json', mensaje: /ancla sola/ });
});

test('gate 4 · un anchor «ver más» rompe el build', () => {
  const dir = sitioTemporal((d) => editar(d, 'paginas/mercados/pais-uno.md', (t) => t.replace('[Producto A de prueba]', '[ver más]')));
  hay(problemas(dir), { gate: 'gate 4', archivo: 'pais-uno.md', mensaje: /no describe el destino/ });
});

/* ---------------- gate 5 ---------------- */

for (const grafia of ['Media Audience', 'MediaAudience', 'media audience', 'Media-Audience']) {
  test(`gate 5 · «${grafia}» en el contenido rompe el build`, () => {
    const dir = sitioTemporal((d) => editar(d, 'paginas/soluciones/producto-a.md', (t) => t.replace('Texto de prueba.', `Texto de ${grafia}.`)));
    hay(problemas(dir), { gate: 'gate 5', archivo: 'producto-a.md', mensaje: /una sola palabra/ });
  });
}

test('gate 5 · una grafía prohibida en sitemap.json también rompe el build', () => {
  const dir = sitioTemporal((d) => editar(d, 'sitemap.json', (t) => t.replace('"title": "Producto C"', '"title": "Producto C de MediaAudience"')));
  hay(problemas(dir), { gate: 'gate 5', archivo: 'sitemap.json' });
});

test('gate 5 · Retail Media e In-Game no pueden aparecer en ninguna parte', () => {
  const dir = sitioTemporal((d) => editar(d, 'paginas/soluciones/index.md', (t) => t.replace('publicadas del fixture.', 'publicadas del fixture, incluido Retail Media e In-Game.')));
  hay(problemas(dir), { gate: 'gate 5', mensaje: /Retail Media no está en el fact-book/ });
  hay(problemas(dir), { gate: 'gate 5', mensaje: /In-Game es Mobile Gaming/ });
});

test('gate 5 · el token de homónimo fuera del FAQ de T1/home rompe el build', () => {
  const dir = sitioTemporal((d) => editar(d, 'paginas/soluciones/producto-a.md', (t) => t.replace('Texto de prueba.', 'No es {{homonimo}}.')));
  hay(problemas(dir), { gate: 'gate 5', archivo: 'producto-a.md', mensaje: /solo se admite en el FAQ/ });
});

test('gate 5 · la marca escrita a mano en una plantilla rompe el build', () => {
  const src = mkdtempSync(join(tmpdir(), 'ma-src-'));
  escribir(src, 'components/Logo.astro', '<span>Mediaudience</span>\n');
  hay(problemas(FIXTURE, { MA_SRC: src }), { gate: 'gate 5', archivo: 'Logo.astro', mensaje: /sale de src\/lib\/marca\.ts/ });
});

/* ---------------- tokens y enlaces en plantillas ---------------- */

test('tokens · un color, tamaño o duración escritos a mano rompen el build', () => {
  const src = mkdtempSync(join(tmpdir(), 'ma-src-'));
  escribir(src, 'components/Card.astro', '<div class="c"></div>\n<style>\n  .c { color: #FFFFFF; padding: 16px; transition: opacity 220ms; }\n  .d { color: var(--ma-text); padding: var(--ma-space-lg); margin: 0; }\n</style>\n');
  const lista = problemas(FIXTURE, { MA_SRC: src }).filter((p) => p.gate === 'tokens');
  assert.equal(lista.length, 3, JSON.stringify(lista, null, 2));
});

test('tokens · los alias --mau-* no se usan en código nuevo', () => {
  const src = mkdtempSync(join(tmpdir(), 'ma-src-'));
  escribir(src, 'components/Card.astro', '<style>.c { color: var(--mau-text); }</style>\n');
  hay(problemas(FIXTURE, { MA_SRC: src }), { gate: 'tokens', mensaje: /--mau-/ });
});

test('gate 4 · un href escrito a mano en una plantilla rompe el build', () => {
  const src = mkdtempSync(join(tmpdir(), 'ma-src-'));
  escribir(src, 'components/Nav.astro', '<a href="/soluciones/">Soluciones</a>\n');
  hay(problemas(FIXTURE, { MA_SRC: src }), { gate: 'gate 4', archivo: 'Nav.astro', mensaje: /escrito a mano/ });
});

/* ---------------- JSON-LD ---------------- */

test('json-ld · foundingDate en la marca-entidad rompe el build (D-01)', () => {
  const dir = sitioTemporal((d) => editar(d, 'entidad.json', (t) => t.replace('"description": "Entidad de prueba del andamiaje.",', '"description": "Entidad de prueba del andamiaje.",\n    "foundingDate": "2022-01-10",')));
  hay(problemas(dir), { archivo: 'content/', mensaje: /foundingDate/ });
});

/* ---------------- de punta a punta ---------------- */

test('astro build falla con la lista de incumplimientos', { timeout: 120_000 }, () => {
  const dir = sitioTemporal((d) => editar(d, 'paginas/soluciones/producto-a.md', (t) => t.replace('## Qué lo diferencia\n\nTexto de prueba.', '## Qué lo diferencia\n')));
  const r = spawnSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build'], {
    env: { ...process.env, MA_CONTENIDO: dir, MA_DIST: join(dir, 'dist') },
    encoding: 'utf8',
  });
  assert.notEqual(r.status, 0, 'el build tenía que fallar');
  assert.match(r.stdout + r.stderr, /producto-a\.md → «Qué lo diferencia»: sección obligatoria vacía/);
});
