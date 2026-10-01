import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aHtml, aHtmlEnLinea, parsearCta, parsearDocumento, parsearFaq, partirOraciones, quitarCodigosDuda } from '../src/lib/markdown.ts';

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

test('oraciones: corta en punto y mayúscula, no en abreviaturas ni cifras', () => {
  assert.deepEqual(partirOraciones('Mediaudience S.A.S. opera en Ecuador. Tiene sede en Av. Primera 212.'), [
    'Mediaudience S.A.S. opera en Ecuador.',
    'Tiene sede en Av. Primera 212.',
  ]);
  assert.deepEqual(partirOraciones('El total es 1.305.200 impresiones con CTR de 9,3%.'), ['El total es 1.305.200 impresiones con CTR de 9,3%.']);
  assert.deepEqual(partirOraciones('Texto *(según datos — D-05)*. ¿Otra? Sí.'), ['Texto *(según datos — D-05)*.', '¿Otra?', 'Sí.']);
});

test('B-02: párrafo suelto «Según datos de …[, corte AAAA-MM].» es la línea de encuadre', () => {
  const doc = parsearDocumento('# T\n\n## Datos clave\n\n- 4 millones (D-06)\n\nSegún datos de la compañía, corte 2025-03.\n\n## Desarrollo\n\nSegún datos de la compañía (D-06).\n\nSegún datos de la compañía alcanza un CTR de 1%, con ventana de lunes a domingo.\n');
  assert.equal(
    aHtml(seccion(doc, 'Datos clave').nodos).replace(/\n/g, ''),
    '<ul><li>4 millones</li></ul><p class="framing">Según datos de la compañía, corte <time datetime="2025-03">marzo 2025</time></p>',
  );
  const des = aHtml(seccion(doc, 'Desarrollo').nodos);
  assert.match(des, /<p class="framing">Según datos de la compañía<\/p>/);
  assert.match(des, /<p>Según datos de la compañía alcanza/, 'la prosa que empieza con «Según» no es encuadre');
});

test('B-02: corte en el futuro o con mes inválido es un error', () => {
  assert.match(parsearDocumento('# T\n\n## D\n\nSegún datos de la compañía, corte 2999-01.\n').errores.join(), /en el futuro/);
  assert.match(parsearDocumento('# T\n\n## D\n\nSegún datos de la compañía, corte 2025-13.\n').errores.join(), /mes inválido/);
});

test('B-02: una atribución en itálica es un error', () => {
  assert.match(parsearDocumento('# T\n\n## D\n\n- 4 millones *(según datos de la compañía — D-06)*\n').errores.join(), /atribución en itálica/);
});

test('dudas que bloquean la publicación: ocultan el bloque que las cita y el encabezado que queda vacío', () => {
  const md = '# T\n\n## Desarrollo\n\n### Contexto\n\nSegún una fuente (D-22):\n\n- 4,3 horas (D-22)\n- 56% (D-22)\n\n### Formato\n\nVideo.\n\n## FAQ\n\n**¿Hay mínimos?**\nNo (D-24).\n\n**¿Otra?**\nSí.\n';
  const doc = parsearDocumento(md, { bloquea: (id) => id === 'D-22' || id === 'D-24' });
  const html = aHtml(seccion(doc, 'Desarrollo').nodos);
  assert.doesNotMatch(html, /Contexto|4,3|fuente/);
  assert.match(html, /<h3 id="formato">Formato<\/h3>/);
  assert.deepEqual(parsearFaq(seccion(doc, 'FAQ')).pares.map((p) => p.pregunta), ['¿Otra?']);
  assert.equal(doc.ocultos.length, 4);
  assert.deepEqual(doc.dudasCitadas, ['D-22', 'D-24'], 'las dudas de los bloques ocultos se siguen validando');
});

test('B-05: la respuesta del FAQ conserva enlaces y la pregunta el homónimo', () => {
  const doc = parsearDocumento('# T\n\n## FAQ\n\n**¿Es lo mismo que "{{homonimo}}"?**\nNo. Ver [la entidad](/nosotros/).\n');
  const [par] = parsearFaq(seccion(doc, 'FAQ')).pares;
  assert.equal(aHtmlEnLinea(par.preguntaNodos), '¿Es lo mismo que "<span data-homonimo="" lang="en">media audience</span>"?');
  assert.equal(aHtml(par.respuestaNodos), '<p>No. Ver <a href="/nosotros/">la entidad</a>.</p>');
});

test('tablas: «Tabla: …» es el caption; th[scope] y data-label; comparativa en su sección', () => {
  const doc = parsearDocumento('# T\n\n## Desarrollo\n\nTabla: Ejes.\n\n| Eje | Detalle |\n|---|---|\n| Horario | Prime time |\n\n## Tabla comparativa\n\nTabla: Opciones.\n\n| Criterio | Uno | Dos |\n|---|---|---|\n| Qué es | A. | B. |\n');
  assert.deepEqual(doc.errores, []);
  const base = aHtml(seccion(doc, 'Desarrollo').nodos);
  assert.match(base, /<table class="table table--stack"><caption>Ejes<\/caption><thead><tr><th scope="col">Eje<\/th>/);
  assert.match(base, /<th scope="row" data-label="Eje">Horario<\/th><td data-label="Detalle">Prime time<\/td>/);
  assert.doesNotMatch(base, /Tabla:/, 'la leyenda no queda como párrafo');
  const comparativa = aHtml(seccion(doc, 'Tabla comparativa').nodos);
  assert.match(comparativa, /<p class="table-leyenda" aria-hidden="true">Opciones<\/p><div class="table-scroll"><table class="table table--compare"><caption>Opciones<\/caption>/);
});

test('tablas: sin caption, o «Tabla: …» sin tabla debajo, es un error', () => {
  assert.match(parsearDocumento('# T\n\n## D\n\n| A | B |\n|---|---|\n| 1 | 2 |\n').errores.join(), /tabla sin caption/);
  assert.match(parsearDocumento('# T\n\n## D\n\nTabla: Huérfana.\n\nTexto.\n').errores.join(), /sin una tabla justo debajo/);
});
