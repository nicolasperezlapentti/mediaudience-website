import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aHtml, parsearCta, parsearDocumento, parsearFaq, quitarCodigosDuda } from '../src/lib/markdown.ts';

const seccion = (doc: ReturnType<typeof parsearDocumento>, nombre: string) => doc.secciones.find((s) => s.nombre === nombre)!;

test('los códigos D-XX no llegan al texto visible', () => {
  assert.equal(quitarCodigosDuda('(según datos de la compañía — D-05)'), '(según datos de la compañía)');
  assert.equal(quitarCodigosDuda('(sin fecha de corte — D-06)'), '(sin fecha de corte)');
  assert.equal(quitarCodigosDuda('sin fecha de corte (D-06).'), 'sin fecha de corte.');
  const doc = parsearDocumento('# T\n\n## Datos clave\n\n- 4 millones *(D-06)*\n- 3,5 millones *(según datos de la compañía — D-05)*\n');
  const html = aHtml(seccion(doc, 'Datos clave').nodos);
  assert.doesNotMatch(html, /D-\d\d/);
  assert.match(html, /<li>4 millones<\/li>/);
  assert.match(html, /<em>\(según datos de la compañía\)<\/em>/);
  assert.deepEqual(doc.dudasCitadas, ['D-05', 'D-06']);
});

test('los comentarios HTML son notas editoriales: se quitan y una sección con solo comentarios está vacía', () => {
  const doc = parsearDocumento('# T\n\n## Prueba / caso relacionado\n\n<!-- BLOQUEADO D-13: sin derechos de uso -->\n');
  assert.equal(seccion(doc, 'Prueba / caso relacionado').vacia, true);
  assert.deepEqual(doc.dudasCitadas, ['D-13']);
  assert.deepEqual(doc.errores, []);
});

test('HTML crudo que no sea comentario es un error', () => {
  const doc = parsearDocumento('# T\n\n## Desarrollo\n\n<div>texto inyectado</div>\n');
  assert.match(doc.errores.join(), /HTML crudo no permitido/);
});

test('las filas «pendiente» no se muestran (B-03); una tabla sin filas desaparece', () => {
  const md = '# T\n\n## Tabla\n\n| A | B |\n|---|---|\n| Perú | *(pendiente — D-30)* |\n| Ecuador | Mediaudience S.A.S. |\n\n## Vacía\n\n| A | B |\n|---|---|\n| Chile | *(pendiente — D-29)* |\n';
  const doc = parsearDocumento(md);
  const html = aHtml(seccion(doc, 'Tabla').nodos);
  assert.doesNotMatch(html, /Perú|pendiente/);
  assert.match(html, /Ecuador/);
  assert.equal(seccion(doc, 'Vacía').vacia, true);
});

test('contenido antes del primer H2 y H1 repetidos son errores', () => {
  const doc = parsearDocumento('# Uno\n\nTexto suelto.\n\n## Desarrollo\n\nx\n\n# Dos\n');
  assert.equal(doc.h1Cantidad, 2);
  assert.match(doc.errores.join('|'), /fuera de sección/);
  assert.match(doc.errores.join('|'), /un solo H1|uno solo/);
});

test('ids de encabezado: derivados sin acentos, o explícitos con {#id}', () => {
  const doc = parsearDocumento('# T\n\n## Cómo funciona\n\n### Segmentación contextual\n\ny\n\n### Alcance y awareness {#alcance}\n\nz\n');
  assert.deepEqual(seccion(doc, 'Cómo funciona').ids, ['como-funciona', 'segmentacion-contextual', 'alcance']);
  assert.match(aHtml(seccion(doc, 'Cómo funciona').nodos), /<h3 id="alcance">Alcance y awareness<\/h3>/);
});

test('el token de homónimo se renderiza marcado y se cuenta', () => {
  const doc = parsearDocumento('# T\n\n## FAQ\n\n**¿Es lo mismo que "{{homonimo}}"?**\nNo.\n');
  const faq = seccion(doc, 'FAQ');
  assert.equal(faq.homonimos, 1);
  assert.match(aHtml(faq.nodos), /<span data-homonimo="" lang="en">media audience<\/span>/);
  assert.deepEqual(parsearFaq(faq).pares.map((p) => p.pregunta), ['¿Es lo mismo que "media audience"?']);
});

test('FAQ y CTA con formato fijo', () => {
  const doc = parsearDocumento('# T\n\n## FAQ\n\n**¿Una?**\nRespuesta.\n\nPárrafo suelto.\n\n## CTA de cierre\n\nConversemos sobre tu campaña → [/contacto/](/contacto/)\n');
  const faq = parsearFaq(seccion(doc, 'FAQ'));
  assert.equal(faq.pares.length, 1);
  assert.match(faq.errores.join(), /no es una pregunta en negrita/);
  assert.deepEqual(parsearCta(seccion(doc, 'CTA de cierre')), { texto: 'Conversemos sobre tu campaña', href: '/contacto/' });
});
