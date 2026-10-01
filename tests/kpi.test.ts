/**
 * B-06 no tiene hoy ninguna página que lo ejercite (T5 y los casos de T2 están bloqueados por
 * D-13). Estos tests prueban sus reglas y su HTML con datos sintéticos.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { modeloKpi, validarFila, type DatosKpi } from '../src/lib/kpi.ts';

const base: DatosKpi = {
  metrica: 'CTR',
  producto: 'Producto de prueba',
  valor: 12.4,
  unidad: '%',
  numerador: { valor: 1240, unidad: 'clics' },
  denominador: { valor: 10000, unidad: 'envíos' },
  mercado: 'País de prueba',
  fecha: '2025-03',
  fuente: 'datos de la compañía',
  acento: true,
};

function renderizar(componente: string, props: unknown) {
  const r = spawnSync(process.execPath, ['tests/ayuda/renderizar.ts', componente, JSON.stringify(props)], { encoding: 'utf8' });
  return { html: r.stdout.replace(/ data-astro-cid-[a-z0-9]+/g, ''), error: r.stderr, status: r.status };
}

test('B-06: modelo con formato es-EC y valor máquina', () => {
  const m = modeloKpi({ ...base, numerador: { valor: 35769, unidad: 'clics' }, denominador: { valor: 1305200, unidad: 'envíos' } });
  assert.deepEqual(m.cifra, { maquina: '0.124', texto: '12,4' });
  assert.deepEqual(m.denominador, { maquina: '1305200', texto: '1.305.200', unidad: 'envíos' });
  assert.equal(m.fecha.texto, 'marzo 2025');
  assert.equal(m.etiqueta, 'CTR · Producto de prueba');
});

test('B-06: sin mercado, mes o denominador, el KPI no se publica', () => {
  assert.throws(() => modeloKpi({ ...base, mercado: '' }), /falta mercado/);
  assert.throws(() => modeloKpi({ ...base, fecha: '' }), /el mes del dato es obligatorio/);
  assert.throws(() => modeloKpi({ ...base, fecha: '2025' }), /AAAA-MM/);
  assert.throws(() => modeloKpi({ ...base, denominador: undefined as unknown as DatosKpi['denominador'] }), /falta el denominador/);
  assert.throws(() => modeloKpi({ ...base, numerador: undefined }), /hace falta la lectura/);
  assert.throws(() => modeloKpi({ ...base, denominador: { valor: 44.2, unidad: 'envíos' } }), /número absoluto/, 'nada de 44,2K');
});

test('B-06: una sola cifra en acento por fila', () => {
  assert.doesNotThrow(() => validarFila([base, { ...base, acento: false }]));
  assert.throws(() => validarFila([base, base]), /2 cifras en acento/);
});

test('B-06: la card es texto con <data>, <time> y la línea B-02 como figcaption', { timeout: 60_000 }, () => {
  const { html, status, error } = renderizar('/src/components/bloques/Kpi.astro', { kpi: base });
  assert.equal(status, 0, error);
  assert.match(html, /<figure class="kpi-card">/);
  assert.match(html, /<data value="0\.124">12,4<\/data><span class="kpi-card__unidad">%<\/span>/);
  assert.match(html, /<data value="1240">1\.240<\/data> <span class="kpi-card__palabra">clics sobre<\/span>/);
  assert.match(html, /<data value="10000">10\.000<\/data> <span class="kpi-card__palabra">envíos<\/span>/);
  assert.match(html, /País de prueba · <time datetime="2025-03">marzo 2025<\/time>/);
  assert.match(html, /<figcaption><p class="framing">Según datos de la compañía, corte <time datetime="2025-03">marzo 2025<\/time><\/p><\/figcaption>/);
  assert.match(html, /kpi-card__cifra--acento/);
  assert.doesNotMatch(html, /<img|<svg|<canvas/);
});

test('B-06: USD va antes de la cifra, y sin numerador se usa la lectura', { timeout: 60_000 }, () => {
  const { html, status, error } = renderizar('/src/components/bloques/Kpi.astro', {
    kpi: { ...base, metrica: 'CPA', valor: 14.5, unidad: 'USD', numerador: undefined, lectura: 'costo por adquisición', denominador: { valor: 1718, unidad: 'descargas' }, acento: false },
  });
  assert.equal(status, 0, error);
  assert.match(html, /<span class="kpi-card__unidad kpi-card__unidad--antes">USD<\/span><data value="14\.5">14,5<\/data>/);
  assert.match(html, /costo por adquisición sobre<\/span><data value="1718">1\.718<\/data>/);
});

test('B-06: un KPI incompleto hace fallar el render (y con él, el build)', { timeout: 60_000 }, () => {
  const { status, error } = renderizar('/src/components/bloques/Kpi.astro', { kpi: { ...base, mercado: '' } });
  assert.notEqual(status, 0);
  assert.match(error, /falta mercado/);
});

test('B-06: fila con dos acentos hace fallar el render', { timeout: 60_000 }, () => {
  const { status, error } = renderizar('/src/components/bloques/KpiFila.astro', { kpis: [base, base] });
  assert.notEqual(status, 0);
  assert.match(error, /2 cifras en acento/);
});

test('B-06: en línea, el mismo formato', { timeout: 60_000 }, () => {
  const { html, status, error } = renderizar('/src/components/bloques/KpiEnLinea.astro', { valor: 9.3, unidad: '%' });
  assert.equal(status, 0, error);
  assert.equal(html, '<span class="kpi-en-linea"><data value="0.093">9,3</data>%</span>');
});

test('B-11: una sección sin contenido no renderiza nada, ni el título', { timeout: 60_000 }, () => {
  const vacia = renderizar('/src/components/Seccion.astro', { id: 'x', titulo: 'Título' });
  assert.equal(vacia.status, 0, vacia.error);
  assert.equal(vacia.html.trim(), '');
});
