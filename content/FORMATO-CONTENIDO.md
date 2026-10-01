# Formato de contenido — guía

Cada página del sitio es un `.md` en `content/paginas/` con front matter YAML + body estructurado. El front matter espeja los campos de `sitemap.json` (no dupliques lógica, solo copy).

El build hace cumplir todo lo que sigue: si un archivo no lo respeta, **el build falla** y dice qué archivo y qué sección. No hay modo advertencia.

## Por qué esta estructura (no es Markdown genérico)

La Arquitectura GEO/AEO exige contenido **extraíble**: un motor de IA (o buscador) debe poder citar una frase sin ambigüedad, y los datos duros deben ser localizables sin tener que interpretar párrafos de marketing. Por eso el body sigue convenciones fijas, no prosa libre:

- **Respuesta directa arriba** — lo primero que aparece responde la pregunta implícita de la página, sin rodeos. Su primer párrafo es el *answer target* (B-01): **una sola oración**, que se entienda sin el título, con la marca como sujeto («Mediaudience es…»). Lo que sigue va en párrafos aparte.
- **Datos en bloques separados** (`## Datos clave`), no mezclados dentro de párrafos — así se mapean a un componente de cifras destacadas, y un motor puede citarlos sueltos.
- **Headers = componentes**. Cada `##` se vuelve una sección/componente predecible en el código. Cada plantilla tiene su lista cerrada de H2; no se inventan otros.
- **FAQ al final cuando aplica** — formato pregunta/respuesta directo, sin relleno, porque alimenta tanto `FAQPage` schema como las consultas de AEO.

## Dónde va cada archivo

La URL canónica se deriva del nombre de archivo. No hay mapeo manual:

| Archivo | URL |
|---|---|
| `content/paginas/index.md` | `/` |
| `content/paginas/nosotros.md` | `/nosotros/` |
| `content/paginas/soluciones/index.md` | `/soluciones/` |
| `content/paginas/soluciones/mobile-push/premium-claro.md` | `/soluciones/mobile-push/premium-claro/` |

Segmentos en minúsculas, sin acentos, con guiones. Una página con hijos usa `index.md` dentro de su carpeta. La URL tiene que existir en `sitemap.json`, y su `status` ahí manda: solo las `ready` se generan.

## Plantilla estándar

```markdown
---
slug: "/soluciones/connected-tv/"   # opcional; si está, tiene que coincidir con la ruta del archivo
title: "Connected TV"
metaDescription: "…"                  # obligatoria, no vacía
status: "ready"                      # debe coincidir con sitemap.json
template: "T2"                       # home | T1 | T2 | T2-hub | T3 | T4 | T4-glosario | T5 | T6 | contacto | utilitaria
blockedBy: []                        # D-XX que afectan secciones de la página (informativo)
schemaType: "Service"                # Organization | Service | ContactPage | Article | WebPage | CollectionPage
lastUpdated: "2026-08-26"            # es el lastmod de sitemap.xml: actualizarla al cambiar el contenido
gates:                               # opcional: condiciona secciones OPC de esta página a dudas D-XX
  "Contacto por mercado": ["D-18"]
---

# H1 de la página (uno solo)

## Respuesta directa

[Una oración que responde la pregunta implícita de la página: es el answer target. El build falla si tiene más de una.]

[Opcional: uno o más párrafos que continúan la respuesta.]

## Datos clave

- [Cifra o hecho verificable, con unidad y contexto — ej. "3,5 millones de usuarios únicos de TV"]

## …secciones de la plantilla…

## Prueba / caso relacionado

[Condicionada a D-13: no se renderiza mientras siga abierta.]

## FAQ

**[Pregunta tal como la haría un comprador]**
[Respuesta directa, 1-3 frases.]

## CTA de cierre

[Texto del llamado a la acción] → [/destino/](/destino/)
```

## Secciones por plantilla

Seis secciones son comunes a todas: `Respuesta directa` (obligatoria) · `Datos clave` · `Desarrollo` · `Prueba / caso relacionado` (gate D-13) · `FAQ` · `CTA de cierre`. Cada plantilla suma las suyas. La lista completa y el estado de cada una viven en `src/lib/plantillas.ts`:

- **OBL** — obligatoria. Ausente o vacía → el build falla. Es deliberado: la defensa contra rellenar huecos con contenido que no está en el fact-book. Si falta el dato, la página no es `ready`.
- **OPC** — opcional. Si no hace falta, se omite el header entero.
- **GATE** — condicionada a una duda D-XX. Mientras siga abierta, no se renderiza: ni placeholder, ni «próximamente».

| Plantilla | Secciones propias (además de las comunes) |
|---|---|
| `home` | Soluciones · CTA obligatorio · FAQ admite el test de homónimo |
| `T1` Entidad | Mediaudience en la región (OBL; la tabla de sociedades locales la genera el build desde `entidad.json`, no se escribe) · Origen y modelo (OBL) · Posicionamiento (OBL) · Partnership con Siprocal (GATE D-15) · Equipo · FAQ obligatorio con test de homónimo |
| `T2` Pilar | Cómo funciona (OBL) · Qué lo diferencia (OBL) · Disponibilidad por mercado (OBL) · Explicador relacionado (OBL) · CTA obligatorio |
| `T2-hub` | Los tres productos (OBL) · Disponibilidad por mercado (OBL) · Explicador relacionado (OBL) · CTA obligatorio |
| `T3` País | Soluciones disponibles (OBL) · Socio local (GATE D-31) · Contacto local (OBL). El bloque legal y el contacto local los genera el build desde `entidad.json`; «Contacto local» en el Markdown es solo su introducción (opcional) |
| `T4` Explicador | Desarrollo obligatorio · Tabla comparativa · Pilar relacionado (OBL) · Glosario relacionado |
| `T4-glosario` | Términos (OBL) |
| `T5` Caso | Toda la plantilla bloqueada por D-13 |
| `T6` Hub | La grilla de hijos se genera desde `sitemap.json` |
| `contacto` | Contacto por mercado · Formulario |
| `utilitaria` | Desarrollo obligatorio |

**Selector de productos (B-09).** En `## Los tres productos` (T2-hub) va una tabla con una fila por producto. La primera columna enlaza a la página hija del producto y las demás son sus datos (universo, CTR, ventana…). El build la convierte en cards: el nombre y la descripción salen del `title` y la `metaDescription` de cada página hija, y una celda `—` no se muestra. Las filas tienen que coincidir con las páginas hijas publicadas del hub, o el build falla.

**Glosario (B-08).** En `## Términos` (T4-glosario), cada término es un `### Término · expansión {#ancla}`, seguido de su definición (una o dos oraciones, que empiezan por el concepto; nunca «Es cuando…») y, opcional, de un párrafo que es solo un enlace a la página de la marca que aplica el término. El índice alfabético y el agrupado por letra los arma el build. En `## Glosario relacionado` (T4) va solo una lista de enlaces a términos del glosario (`- [CTR](/recursos/glosario-adtech/#ctr)`): la definición la trae el build desde el glosario.

Dentro de cada sección, los `###` son libres. Para que un `###` sea destino estable de un fragmento del menú, se le da id explícito: `### Alcance y awareness {#alcance}`.

## Reglas de contenido (heredadas del fact-book)

- Toda cifra o claim factual debe existir en el fact-book. Si no está, no se escribe — se deja la sección fuera y la página no pasa a `ready`.
- Marca siempre como **"Mediaudience"**, una sola palabra. Cualquier otra grafía rompe el build.
- **Test de homónimo.** La consulta genérica que se desambigua no se escribe literal: se escribe el token `{{homonimo}}`, y solo en el FAQ de `T1` (obligatorio, una vez) y de `home` (opcional).
- Nunca "+20 años" ni antigüedad relativa sin año base (ver Arquitectura §1.5).
- Anchors de enlaces internos: descriptivos con marca + tema, nunca «ver más» ni «clic aquí».
- Enlaces internos con ruta absoluta y barra final (`/soluciones/connected-tv/`). Enlazar una página que no esté `ready` rompe el build.
- **Atribución (B-02).** Va como párrafo propio justo debajo del dato o de la lista: `Según datos de la compañía.` o, con fecha de corte, `Según datos de la compañía, corte 2026-08.` Se renderiza como línea de encuadre. Nunca en itálica: `*(según datos…)*` rompe el build. Si un ítem tiene una fuente distinta del resto, la atribución queda en el ítem, entre paréntesis y sin itálica.
- **Códigos D-XX.** Cada cifra lleva la duda de la que depende entre paréntesis, `(D-05)`, o dentro de la atribución, `(según datos de la compañía — D-05)`. También pueden ir en comentarios `<!-- … -->`. El build los quita del texto visible. Un D-XX suelto en la prosa rompe el build.
- **Dudas que bloquean la publicación.** Si la duda citada tiene `bloqueaPublicacion` en `dudas.json` y sigue abierta, el párrafo, ítem o fila que la cita no se publica; un subtítulo que queda vacío, tampoco. El build lista lo que ocultó. Por eso cada ítem conserva su código aunque la atribución esté en la línea B-02.
- **Tablas.** Toda tabla lleva caption: un párrafo `Tabla: Especificaciones técnicas.` justo antes. Sin él, el build falla. La primera columna son los rótulos de fila. Dentro de `## Tabla comparativa` (T4), la tabla es B-07: criterios en filas, opciones en columnas, frases cortas terminadas en punto. Una fila con «pendiente» no se muestra; una tabla sin filas desaparece.
- Formato numérico es-EC: coma decimal, punto de miles → `9,3%` · `1.305.200` · `USD 14,5`.
- Sin HTML crudo: solo Markdown. Los comentarios HTML son notas editoriales y no se publican.
