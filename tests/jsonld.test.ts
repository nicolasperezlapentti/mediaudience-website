/**
 * Grafo JSON-LD de dos capas (fact-book §1.3) y su gate de salida sobre todo el sitio.
 * Construye el fixture una vez y adultera copias de su dist/ para ver fallar cada regla.
 */
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FIXTURE } from './ayuda/sitio.ts';

const DIST = join(mkdtempSync(join(tmpdir(), 'ma-jsonld-')), 'dist');
const env = { ...process.env, MA_CONTENIDO: FIXTURE, MA_DIST: DIST };
const SITIO = 'https://mediaudience.com';
const ID_EC = `${SITIO}/mercados/pais-uno/#organization-ec`;

before(() => {
  const r = spawnSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build'], { env, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

const grafo = (dir: string, ruta: string) => {
  const html = readFileSync(join(dir, ruta, 'index.html'), 'utf8');
  return JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1])['@graph'] as Record<string, unknown>[];
};

function salida(dir: string) {
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import { verificarSalida } from './src/lib/gates/salida.ts'; import { cargarSitio } from './src/lib/sitio.ts';
    console.log(JSON.stringify(verificarSalida(${JSON.stringify(dir)}, cargarSitio()).filter((p) => p.gate === 'json-ld')));`], { env, encoding: 'utf8' });
  return JSON.parse(r.stdout) as { mensaje: string; archivo: string }[];
}

function adulterar(ruta: string, cambio: (html: string) => string) {
  const dir = join(mkdtempSync(join(tmpdir(), 'ma-jsonld-')), 'dist');
  cpSync(DIST, dir, { recursive: true });
  const f = join(dir, ruta, 'index.html');
  writeFileSync(f, cambio(readFileSync(f, 'utf8')));
  return dir;
}

test('el nodo local se define solo en su página país y en la T1', () => {
  const ids = (ruta: string) => grafo(DIST, ruta).map((n) => n['@id']);
  assert.ok(ids('/mercados/pais-uno/').includes(ID_EC));
  assert.ok(ids('/nosotros/').includes(ID_EC));
  assert.ok(!ids('/').includes(ID_EC), 'la home no lo define');
  assert.ok(!ids('/soluciones/producto-a/').includes(ID_EC));
  const marcaHome = grafo(DIST, '/').find((n) => n['@id'] === `${SITIO}/#organization`)!;
  assert.deepEqual(marcaHome.subOrganization, [{ '@id': ID_EC }], 'pero la marca lo referencia en todas');
  assert.deepEqual(marcaHome.foundingLocation, { '@type': 'Country', name: 'País Dos' });
});

test('el sujeto de la página país es su nodo local; el de la home y la T1, la marca', () => {
  const about = (ruta: string) => (grafo(DIST, ruta).find((n) => String(n['@id']).endsWith('#webpage'))!.about as { '@id': string })['@id'];
  assert.equal(about('/mercados/pais-uno/'), ID_EC);
  assert.equal(about('/'), `${SITIO}/#organization`);
  assert.equal(about('/nosotros/'), `${SITIO}/#organization`);
});

test('el dist sin adulterar pasa el gate de JSON-LD', () => {
  assert.deepEqual(salida(DIST), []);
});

test('gate · un nodo local fuera de su página o de la T1 rompe el build', () => {
  const nodoEc = JSON.stringify(grafo(DIST, '/mercados/pais-uno/').find((n) => n['@id'] === ID_EC));
  const dir = adulterar('soluciones/producto-a', (h) => h.replace('"@graph":[', `"@graph":[${nodoEc.replace(/</g, '\\u003c')},`));
  assert.ok(salida(dir).some((p) => /va solo en su página país y en la T1/.test(p.mensaje)));
});

test('gate · una referencia @id que no existe en el sitio rompe el build', () => {
  const dir = adulterar('nosotros', (h) => h.replace('"isPartOf":{"@id":"https://mediaudience.com/#website"}', '"isPartOf":{"@id":"https://mediaudience.com/#no-existe"}'));
  assert.ok(salida(dir).some((p) => /no está definido en ningún grafo del sitio/.test(p.mensaje)));
});

test('gate · subOrganization sin parentOrganization recíproco rompe el build', () => {
  const dir = adulterar('mercados/pais-uno', (h) => h.replace('"parentOrganization":{"@id":"https://mediaudience.com/#organization"}', '"parentOrganization":{"@id":"https://mediaudience.com/#otra"}'));
  const p = salida(dir).map((x) => x.mensaje).join('\n');
  assert.match(p, /no está definido con parentOrganization/);
});

test('gate · la marca-entidad distinta entre páginas rompe el build', () => {
  const dir = adulterar('contacto', (h) => h.replace('"name":"Mediaudience","url":"https://mediaudience.com/","description":"', '"name":"Mediaudience","url":"https://mediaudience.com/","description":"Otra. '));
  assert.ok(salida(dir).some((p) => /no es idéntica en todas las páginas/.test(p.mensaje)));
});
