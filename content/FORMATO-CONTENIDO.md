# Formato de contenido — guía

Cada página del sitio es un `.md` en `content/paginas/` con front matter YAML + body estructurado. El front matter espeja los campos de `sitemap.json` (no dupliques lógica, solo copy).

El build hace cumplir todo lo que sigue: si un archivo no lo respeta, **el build falla** y dice qué archivo y qué sección. No hay modo advertencia.

## Por qué esta estructura (no es Markdown genérico)

La Arquitectura GEO/AEO exige contenido **extraíble**: un motor de IA (o buscador) debe poder citar una frase sin ambigüedad, y los datos duros deben ser localizables sin tener que interpretar párrafos de marketing. Por eso el body sigue convenciones fijas, no prosa libre:

- **Respuesta directa arriba** — lo primero que aparece responde la pregunta implícita de la página, en 1-2 frases, sin rodeos. Su primer párrafo es el *answer target*.
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

[1-2 frases que responden la pregunta implícita de la página. El primer bloque tiene que ser un párrafo: es el answer target.]

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
| `T1` Entidad | Mediaudience en la región (OBL) · Origen y modelo (OBL) · Posicionamiento (OBL) · Partnership con Siprocal (GATE D-15) · Equipo · FAQ obligatorio con test de homónimo |
| `T2` Pilar | Cómo funciona (OBL) · Qué lo diferencia (OBL) · Disponibilidad por mercado (OBL) · Explicador relacionado (OBL) · CTA obligatorio |
| `T2-hub` | Los tres productos (OBL) · Disponibilidad por mercado (OBL) · Explicador relacionado (OBL) · CTA obligatorio |
| `T3` País | Soluciones disponibles (OBL) · Información legal (OBL) · Socio local (GATE D-31) · Contacto local (OBL) |
| `T4` Explicador | Desarrollo obligatorio · Tabla comparativa · Pilar relacionado (OBL) · Glosario relacionado |
| `T4-glosario` | Términos (OBL) |
| `T5` Caso | Toda la plantilla bloqueada por D-13 |
| `T6` Hub | La grilla de hijos se genera desde `sitemap.json` |
| `contacto` | Contacto por mercado · Formulario |
| `utilitaria` | Desarrollo obligatorio |

Dentro de cada sección, los `###` son libres. Para que un `###` sea destino estable de un fragmento del menú, se le da id explícito: `### Alcance y awareness {#alcance}`.

## Reglas de contenido (heredadas del fact-book)

- Toda cifra o claim factual debe existir en el fact-book. Si no está, no se escribe — se deja la sección fuera y la página no pasa a `ready`.
- Marca siempre como **"Mediaudience"**, una sola palabra. Cualquier otra grafía rompe el build.
- **Test de homónimo.** La consulta genérica que se desambigua no se escribe literal: se escribe el token `{{homonimo}}`, y solo en el FAQ de `T1` (obligatorio, una vez) y de `home` (opcional).
- Nunca "+20 años" ni antigüedad relativa sin año base (ver Arquitectura §1.5).
- Anchors de enlaces internos: descriptivos con marca + tema, nunca «ver más» ni «clic aquí».
- Enlaces internos con ruta absoluta y barra final (`/soluciones/connected-tv/`). Enlazar una página que no esté `ready` rompe el build.
- **Códigos D-XX.** Pueden ir en la atribución de una cifra — `*(según datos de la compañía — D-05)*` — y en comentarios `<!-- … -->`. El build los quita del texto visible («según datos de la compañía» se conserva). Un D-XX suelto en la prosa rompe el build.
- **Tablas.** Una fila con «pendiente» no se muestra; una tabla sin filas desaparece.
- Formato numérico es-EC: coma decimal, punto de miles → `9,3%` · `1.305.200` · `USD 14,5`.
- Sin HTML crudo: solo Markdown. Los comentarios HTML son notas editoriales y no se publican.
