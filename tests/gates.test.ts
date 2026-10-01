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
  const dir = sitioTemporal((d) => editar(d, 'paginas/mercados/pais-uno.md', (t) => t.replace(/## Soluciones disponibles[\s\S]*?(?=## Socio local)/, '')));
  hay(problemas(dir), { gate: 'gate 2', archivo: 'pais-uno.md', seccion: 'Soluciones disponibles', mensaje: /ausente/ });
});

test('gate 2 · un H2 fuera de la plantilla rompe el build', () => {
  const dir = sitioTemporal((d) => editar(d, 'paginas/soluciones/producto-a.md', (t) => t.replace('## FAQ', '## Beneficios\n\nTexto.\n\n## FAQ')));
  hay(problemas(dir), { archivo: 'producto-a.md', mensaje: /H2 no permitido en T2: «Beneficios»/ });
});

test('gate 2 · T1 sin test de homónimo en el FAQ rompe el build', () => {
  const dir = sitioTemporal((d) => editar(d, 'paginas/nosotros.md', (t) => t.replace('"{{homonimo}}"', '"otra cosa"')));
  hay(problemas(dir), { gate: 'gate 2', archivo: 'nosotros.md', seccion: 'FAQ', mensaje: /test de homónimo/ });
});

test('B-01 · un answer target con más de una oración rompe el build', () => {
  const dir = sitioTemporal((d) => editar(d, 'paginas/soluciones/producto-a.md', (t) => t.replace('con CTR de 9,3%.', 'con CTR de 9,3%. Y hace otra cosa.')));
  hay(problemas(dir), { archivo: 'producto-a.md', mensaje: /una sola oración \(B-01\) y tiene 2/ });
});

test('B-02 · una atribución en itálica rompe el build', () => {
  const dir = sitioTemporal((d) => editar(d, 'paginas/soluciones/producto-a.md', (t) => t.replace('- 1.305.200 impresiones de prueba (D-02)', '- 1.305.200 impresiones de prueba *(según datos de la compañía — D-02)*')));
  hay(problemas(dir), { archivo: 'producto-a.md', mensaje: /atribución en itálica/ });
});

test('una duda que bloquea la publicación oculta el ítem que la cita; al cerrarla, aparece', () => {
  const abierta = sitioTemporal();
  const r = publicadas(abierta);
  assert.ok(r.visibles['/soluciones/producto-a/'].includes('Datos clave'));
  const html = (dir: string) => spawnSync(process.execPath, ['--input-type=module', '-e', `
    import { cargarSitio } from './src/lib/sitio.ts'; import { modeloPagina } from './src/lib/render.ts';
    console.log(modeloPagina(cargarSitio(), '/soluciones/producto-a/').secciones.map((s) => s.html).join(''));`], { env: { ...process.env, MA_CONTENIDO: dir }, encoding: 'utf8' }).stdout;
  assert.doesNotMatch(html(abierta), /sin licencia/);
  const cerrada = sitioTemporal((d) => editar(d, 'dudas.json', (t) => t.replace('"D-40": { "estado": "abierta"', '"D-40": { "estado": "cerrada"')));
  assert.match(html(cerrada), /Dato de prueba sin licencia de publicación/);
});

test('B-03 · la tabla de sociedades locales no se escribe en el Markdown', () => {
  const dir = sitioTemporal((d) => editar(d, 'paginas/nosotros.md', (t) => t.replace('Texto de prueba sobre la estructura regional.', 'Texto.\n\n| Mercado | Razón social |\n|---|---|\n| País Uno | Sociedad de Prueba S.A.S. |')));
  hay(problemas(dir), { archivo: 'nosotros.md', mensaje: /se genera desde content\/entidad\.json/ });
});

test('B-03 · una fila por mercado publicable, con la misma regla que el JSON-LD', () => {
  const salida = (dir: string) => JSON.parse(spawnSync(process.execPath, ['--input-type=module', '-e', `
    import { cargarSitio } from './src/lib/sitio.ts'; import { modeloPagina } from './src/lib/render.ts';
    const m = modeloPagina(cargarSitio(), '/nosotros/');
    const grafo = JSON.parse(m.jsonld)['@graph'];
    console.log(JSON.stringify({ filas: m.secciones.flatMap((s) => s.sociedades ?? []).map((f) => [f.codigo, f.legalName, f.ciudad, f.pagina?.href ?? null]), nodos: grafo.filter((n) => n.parentOrganization).map((n) => n.legalName) }));`], { env: { ...process.env, MA_CONTENIDO: dir }, encoding: 'utf8' }).stdout);
  const hoy = salida(FIXTURE);
  assert.deepEqual(hoy.filas, [['EC', 'Sociedad de Prueba S.A.S.', 'Ciudad Uno, Región Uno', '/mercados/pais-uno/']]);
  assert.deepEqual(hoy.nodos, ['Sociedad de Prueba S.A.S.']);
  const sinDatos = sitioTemporal((d) => editar(d, 'entidad.json', (t) => t.replace('"bloqueadoPor": []', '"bloqueadoPor": ["D-01"]')));
  assert.deepEqual(salida(sinDatos), { filas: [], nodos: [] }, 'con su duda abierta, el mercado sale de la tabla y del grafo a la vez');
});

test('B-04 · «Información legal» no se escribe en una página país: se genera', () => {
  const dir = sitioTemporal((d) => editar(d, 'paginas/mercados/pais-uno.md', (t) => t.replace('## Contacto local', '## Información legal\n\nRazón social de prueba.\n\n## Contacto local')));
  hay(problemas(dir), { archivo: 'pais-uno.md', mensaje: /«Información legal» no se escribe: el bloque legal \(B-04\) se genera desde content\/entidad\.json/ });
});

test('B-04 · una página país ready sin su sociedad publicable rompe el build', () => {
  const dir = sitioTemporal((d) => editar(d, 'entidad.json', (t) => t.replace('"legalName": "Sociedad de Prueba S.A.S.", ', '')));
  hay(problemas(dir), { gate: 'gate 2', archivo: 'pais-uno.md', mensaje: /T3 exige la sociedad local publicable/ });
});

test('B-07 · una tabla sin caption rompe el build', () => {
  const dir = sitioTemporal((d) => editar(d, 'paginas/soluciones/producto-a.md', (t) => t.replace('Tabla: Parámetros de prueba.\n\n', '')));
  hay(problemas(dir), { archivo: 'producto-a.md', mensaje: /tabla sin caption/ });
});

test('B-08 · una definición de más de dos oraciones rompe el build', () => {
  const dir = sitioTemporal((d) => editar(d, 'paginas/recursos/glosario-de-prueba.md', (t) => t.replace('Solo existe para las pruebas.', 'Solo existe para las pruebas. Y para nada más.')));
  hay(problemas(dir), { archivo: 'glosario-de-prueba.md', mensaje: /una o dos oraciones y tiene 3/ });
});

test('B-08 · una definición que abre con «Es cuando…» rompe el build', () => {
  const dir = sitioTemporal((d) => editar(d, 'paginas/recursos/glosario-de-prueba.md', (t) => t.replace('Término sintético que prueba', 'Es cuando se prueba')));
  hay(problemas(dir), { archivo: 'glosario-de-prueba.md', mensaje: /empieza por el concepto/ });
});

test('B-08 · «Glosario relacionado» solo admite referencias a términos existentes del glosario', () => {
  const aOtra = sitioTemporal((d) => editar(d, 'paginas/recursos/explicador-de-prueba.md', (t) => t.replace('(/recursos/glosario-de-prueba/#formato-a)', '(/soluciones/producto-a/#alcance)')));
  hay(problemas(aOtra), { gate: 'gate 4', archivo: 'explicador-de-prueba.md', mensaje: /no apunta a una página de glosario/ });
  const sinTermino = sitioTemporal((d) => editar(d, 'paginas/recursos/explicador-de-prueba.md', (t) => t.replace('#formato-a)', '#no-existe)')));
  hay(problemas(sinTermino), { gate: 'gate 4', archivo: 'explicador-de-prueba.md', mensaje: /no tiene el término #no-existe/ });
  const texto = sitioTemporal((d) => editar(d, 'paginas/recursos/explicador-de-prueba.md', (t) => t.replace('- [Formato A]', 'Un párrafo.\n\n- [Formato A]')));
  hay(problemas(texto), { archivo: 'explicador-de-prueba.md', mensaje: /solo admite una lista de enlaces/ });
});

test('B-08 · el índice lista solo las letras con términos, en orden español', () => {
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import { cargarSitio } from './src/lib/sitio.ts'; import { gruposPorLetra } from './src/lib/glosario.ts';
    console.log(JSON.stringify(gruposPorLetra(cargarSitio().publicadas.get('/recursos/glosario-de-prueba/')).map((g) => [g.letra, g.id, g.terminos.map((t) => t.id)])));`], { env: { ...process.env, MA_CONTENIDO: FIXTURE }, encoding: 'utf8' });
  assert.deepEqual(JSON.parse(r.stdout), [['F', 'letra-f', ['formato-a']], ['M', 'letra-m', ['metrica-b']], ['Ñ', 'letra-enie', ['nandu-de-prueba']]]);
});

test('B-09 · cada fila del selector enlaza a una hija publicada del hub, y están todas', () => {
  const ajena = sitioTemporal((d) => editar(d, 'paginas/soluciones/familia/index.md', (t) => t.replace('[Dos](/soluciones/familia/dos/)', '[Dos](/soluciones/producto-a/)')));
  hay(problemas(ajena), { gate: 'gate 2', archivo: 'familia/index.md', seccion: 'Los tres productos', mensaje: /tiene que enlazar a una página hija publicada/ });
  hay(problemas(ajena), { gate: 'gate 2', archivo: 'familia/index.md', mensaje: /falta la fila del producto \/soluciones\/familia\/dos\// });
});

test('B-09 · las cards salen de la tabla y de las páginas hijas; una celda «—» no se muestra', () => {
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import { cargarSitio } from './src/lib/sitio.ts'; import { modeloPagina } from './src/lib/render.ts';
    const s = modeloPagina(cargarSitio(), '/soluciones/familia/').secciones.find((x) => x.trio);
    console.log(JSON.stringify(s.trio.productos));`], { env: { ...process.env, MA_CONTENIDO: FIXTURE }, encoding: 'utf8' });
  assert.deepEqual(JSON.parse(r.stdout), [
    { id: 'uno', nombre: 'Producto Uno de prueba', descripcion: 'Producto Uno: descripción sintética del fixture.', href: '/soluciones/familia/uno/', datos: [{ rotulo: 'Universo', valor: '1 millón' }, { rotulo: 'Ventana', valor: 'Lunes a viernes' }] },
    { id: 'dos', nombre: 'Producto Dos de prueba', descripcion: 'Producto Dos: descripción sintética del fixture.', href: '/soluciones/familia/dos/', datos: [{ rotulo: 'Ventana', valor: 'Lunes a domingo' }] },
  ]);
});

test('B-10 · una página país sin contacto publicable rompe el build', () => {
  const sin = sitioTemporal((d) => editar(d, 'entidad.json', (t) => t.replace(/"contacto": \{[^}]*\{[^}]*\} \},/, '')));
  hay(problemas(sin), { gate: 'gate 2', archivo: 'pais-uno.md', seccion: 'Contacto local (B-10)', mensaje: /exige el contacto comercial/ });
  const bloqueado = sitioTemporal((d) => editar(d, 'entidad.json', (t) => t.replace('"contacto": { "correo"', '"contacto": { "bloqueadoPor": ["D-31"], "correo"')));
  hay(problemas(bloqueado), { gate: 'gate 2', archivo: 'pais-uno.md', mensaje: /exige el contacto comercial/ });
});

test('B-10 · contacto con los campos que existen, horario con zona y contactPoint en el JSON-LD', { timeout: 60_000 }, () => {
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import { cargarSitio } from './src/lib/sitio.ts'; import { modeloPagina } from './src/lib/render.ts';
    const m = modeloPagina(cargarSitio(), '/mercados/pais-uno/');
    const grafo = JSON.parse(m.jsonld)['@graph'];
    console.log(JSON.stringify({ ids: m.secciones.map((s) => s.id), contacto: m.secciones.find((s) => s.contacto)?.contacto.contacto, punto: grafo.find((n) => n.contactPoint)?.contactPoint }));`], { env: { ...process.env, MA_CONTENIDO: FIXTURE }, encoding: 'utf8' });
  const o = JSON.parse(r.stdout);
  assert.deepEqual(o.ids, ['soluciones-disponibles', 'contacto-local'], 'en el lugar de «Contacto local», antes del FAQ y el CTA');
  assert.deepEqual(o.contacto, { correo: 'comercial@ejemplo.com', telefono: '+000 0 000 0000', oficina: null, horario: { texto: 'Lunes a viernes, 09:00–18:00', zona: 'GMT-5' } });
  assert.deepEqual(o.punto, { '@type': 'ContactPoint', contactType: 'sales', areaServed: 'EC', availableLanguage: 'es', email: 'comercial@ejemplo.com', telephone: '+000 0 000 0000' });
  const html = spawnSync(process.execPath, ['tests/ayuda/renderizar.ts', '/src/components/bloques/ContactoLocal.astro', JSON.stringify({ sociedad: { codigo: 'EC', pais: 'País Uno', nombre: 'Marca País Uno', contacto: o.contacto }, introHtml: '<p>Intro.</p>' })], { env: { ...process.env, MA_CONTENIDO: FIXTURE }, encoding: 'utf8' }).stdout.replace(/ data-astro-cid-[a-z0-9]+/g, '');
  assert.match(html, /<dt>Teléfono<\/dt><dd><a href="tel:\+00000000000">\+000 0 000 0000<\/a><\/dd>/);
  assert.match(html, /Lunes a viernes, 09:00–18:00 \(GMT-5\)/);
  assert.doesNotMatch(html, /Oficina/, 'sin dato, el campo no aparece');
  assert.match(html, /class="btn btn--secundario" href="\/contacto\/"/);
});

test('home · «Soluciones» ya no se escribe: los ejes se generan desde la navegación', () => {
  const dir = sitioTemporal((d) => editar(d, 'paginas/index.md', (t) => t.replace('## FAQ', '## Soluciones\n\n- Texto.\n\n## FAQ')));
  hay(problemas(dir), { archivo: 'paginas/index.md', mensaje: /«Soluciones» no se escribe: los resúmenes de los cuatro ejes se generan/ });
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

test('tokens · en @media solo se admiten los breakpoints de tokens.json', () => {
  const src = mkdtempSync(join(tmpdir(), 'ma-src-'));
  escribir(src, 'components/Grid.astro', '<style>\n  @media (width < 900px) { .g { gap: var(--ma-space-sm); } }\n  @media (hover: hover) and (width >= 1100px) { .g { gap: var(--ma-space-md); } }\n  @media (max-width: 899px) { .g { gap: var(--ma-space-lg); } }\n</style>\n');
  const lista = problemas(FIXTURE, { MA_SRC: src }).filter((p) => p.gate === 'tokens');
  assert.equal(lista.length, 1, JSON.stringify(lista, null, 2));
  assert.match(lista[0].mensaje, /899px no es un breakpoint/);
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
