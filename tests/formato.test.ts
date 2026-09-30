import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatoNumero, formatoPorcentaje, formatoUSD } from '../src/lib/formato.ts';

test('es-EC: los tres ejemplos de PLANTILLAS §5.7', () => {
  assert.equal(formatoPorcentaje(9.3), '9,3%');
  assert.equal(formatoNumero(1305200), '1.305.200');
  assert.equal(formatoUSD(14.5), 'USD 14,5');
});

test('es-EC: punto de miles también con cuatro cifras', () => {
  assert.equal(formatoNumero(1234), '1.234');
  assert.equal(formatoNumero(10000), '10.000');
});

test('es-EC: decimales', () => {
  assert.equal(formatoNumero(3.5), '3,5');
  assert.equal(formatoNumero(26.666, { max: 1 }), '26,7');
  assert.equal(formatoNumero(14.5, { min: 2 }), '14,50');
  assert.equal(formatoPorcentaje(5.88, { max: 2 }), '5,88%');
  assert.equal(formatoNumero(-3.25), '-3,25');
});

test('es-EC: rechaza valores no finitos', () => {
  assert.throws(() => formatoNumero(Number.NaN));
  assert.throws(() => formatoNumero(Number.POSITIVE_INFINITY));
});
