# Sitio web de Mediaudience

Reconstrucción del sitio de **Mediaudience**, compañía multilatina de AdTech: SSP y representación
de medios digitales, de origen peruano, con operación local en Perú, México, Ecuador y Chile.

---

## Por qué existe este repo

El sitio anterior tiene dos problemas, y el rediseño está construido alrededor de resolverlos.

**1. Es invisible para las máquinas.** Renderiza en cliente sin SSR: un `curl` devuelve un cuerpo
vacío. Ni los buscadores ni los sistemas de IA que hoy usan los compradores para investigar
proveedores pueden leer una sola frase del contenido.

**2. La marca colisiona con un concepto genérico.** «Mediaudience» y «media audience» se confunden
en búsqueda y en recuperación por IA. La respuesta es estructural: una sola grafía, una entidad
canónica declarada en `/nosotros/`, y schema `Organization` consistente en todo el sitio.

De ahí salen las dos reglas que no se negocian:

> **Todo contenido significativo sale en el HTML de servidor.** Nada de texto inyectado por
> JavaScript de cliente, nada de texto dentro de imágenes.
>
> **La marca es `Mediaudience`, una sola palabra, siempre.** Nunca «Media Audience» ni
> «MediaAudience», en ningún activo.

---

## Estructura

```
content/
  paginas/            Un .md por página; la ruta del archivo es la URL canónica
  sitemap.json        Páginas, status y navegación (fuente de verdad del contenido)
  dudas.json          Registro de dudas D-XX y su estado (fact-book §11)
  entidad.json        Datos del grafo JSON-LD de dos capas
design/
  tokens.json         ← ÚNICA fuente de verdad visual
  tokens.css          ← GENERADO. No editar a mano.
  GUIA-DE-USO.md
  referencia/         Especificación visual de Claude Design (no es código a portar)
scripts/
  build-tokens.mjs    Genera tokens.css desde tokens.json
  test-aceptacion.ts  curl sin JavaScript contra cada ruta ready
  fase0.ts            robots.txt para desplegar antes que el sitio nuevo
src/
  content.config.ts   Colección `paginas` (solo páginas ready, schema por plantilla)
  lib/                Marca, plantillas, schemas, parser de secciones, JSON-LD, navegación, Fase 0
  lib/gates/          Gates de build: fuente.ts (antes de generar) y salida.ts (sobre dist/)
  integraciones/      Conecta tokens --check y los gates a `astro build`
  layouts/Base.astro  <html lang="es">, metadatos, fuentes, slots de JSON-LD, header y footer
  pages/              [...ruta].astro + robots.txt, sitemap.xml, llms.txt
tests/                Un caso que debe fallar por gate + fixture de sitio válido
.claude/skills/       Skills de proyecto para Claude Code
PLANTILLAS.md         Plantillas, bloques, mapa de URLs y gates de build
```

## Comandos

```bash
npm run build             # tokens --check + gates de fuente + build + gates de salida
npm test                  # un caso que debe fallar por cada gate (node:test)
npm run test:aceptacion   # build + curl sin JavaScript contra cada ruta ready
npm run test:fixtures     # lo mismo contra tests/fixtures/sitio-valido
npm run fase0             # dist-fase0/robots.txt para el hosting actual
```

`astro build` falla con la lista completa de incumplimientos, archivo por archivo y sección
por sección. No hay modo advertencia.

---

## Fuentes de verdad

Cuando dos documentos se contradicen, este es el orden:

| Tema | Manda |
|---|---|
| Hechos de la empresa, cifras, claims | `factbook-mediaudience.md` |
| Arquitectura, plantillas, URLs, gates | `PLANTILLAS.md` |
| Qué páginas existen y su estado | `content/sitemap.json` |
| Color, tipografía, espaciado | `design/tokens.json` |
| Formato de los `.md` de contenido | `content/FORMATO-CONTENIDO.md` |

**Si un dato no está en el fact-book, no se publica.** No se infiere, no se completa con algo
plausible, no se rellena para que una plantilla no quede con un hueco.

---

## Tokens: cómo se trabaja el color

`design/tokens.json` es la única fuente. `design/tokens.css` se genera:

```bash
node scripts/build-tokens.mjs           # regenera tokens.css
node scripts/build-tokens.mjs --check   # falla si quedó desactualizado (para CI)
```

Editar `tokens.css` a mano no sirve: se pierde en la siguiente corrida. Si falta un valor, se
agrega al JSON.

Hay una copia de `tokens.css` en `.claude/skills/mediaudience-design/` para que la skill sea
autocontenida. Es el mismo archivo generado; al regenerar, se copia a los dos sitios.

**El acento es `#58B0FF`** (azul), desde tokens v1.2.0. Antes era cian `#2AD5E5`. Si aparecen
`#2AD5E5`, `#4FD9DE`, `#4FD1E3` o `#3FDDB0` en material viejo, están todos retirados — los tres
últimos nunca fueron correctos.

`#565E76` da 2,99:1 sobre el fondo y **falla WCAG AA**: solo para hairlines y estados
deshabilitados. Texto pequeño que deba leerse usa `#7782A3`.

---

## design/referencia/ es especificación, no código

Los tres archivos de `design/referencia/` vienen de Claude Design y sirven como **especificación
visual**. No se portan: se traducen a componentes de Astro leyendo los valores desde `tokens.json`.

| Archivo | Qué es |
|---|---|
| `navegacion.html` | Header y footer globales, con sus estados |
| `bloques.html` | Bloques B-01 a B-11, formularios, variantes móviles |
| `home-fuente-design.html` | Home aprobada (one-pager, pre-rediseño de nav). Ver la nota en el archivo. |

Si un valor de esos archivos no corresponde a ningún token, es una deriva: se corrige el token o se
corrige el archivo, nunca se hardcodea.

---

## Gates de build

Reglas que el build hace cumplir. No son recomendaciones editoriales, son condiciones de
compilación. El detalle está en `PLANTILLAS.md` §5.

1. Una página con `status: blocked` no se genera ni aparece en ningún menú, sitemap o `llms.txt`.
2. Una sección obligatoria vacía **rompe el build**, con el nombre del archivo y la sección. Es
   deliberado: es la defensa contra rellenar huecos con contenido inventado.
3. Una sección con gate D-XX abierto no se renderiza. Sin placeholder, sin «próximamente».
4. Un enlace interno a una URL que no esté `ready` rompe el build.
5. Cualquier aparición de «Media Audience», «MediaAudience» o «media audience» rompe el build.

**Criterio de aceptación por página:** `curl` sin ejecutar JavaScript devuelve H1, cuerpo, answer
target y JSON-LD completos. Si curl no ve el answer target, la página falla.

---

## Estado

**Cerrado:** sistema de tokens · referencia visual de header, footer y los 11 bloques · mapa de URLs
· migración del one-pager a multipágina · 11 páginas de contenido escritas.

**Siguiente:** scaffold de Astro (Fase A) → componentes desde la referencia (Fase B) →
`/nosotros/` → `/mercados/ecuador/` → pilares de solución.

**En paralelo, sin dependencias:** `robots.txt`, `sitemap.xml` y `llms.txt`. El `robots.txt` que
sirve hoy es el autogenerado por el panel de hosting, con `Crawl-delay: 10` y sin declarar sitemap;
`sitemap.xml` y `llms.txt` dan 404. Tres archivos, cero decisiones pendientes, y resuelven una parte
desproporcionada del problema de invisibilidad.

**Bloqueado por dudas abiertas con el cliente:** casos y resultados (D-13) · páginas de Perú (D-01),
México (D-29) y Chile (D-30) · Siprocal (D-15) · ONE by SQREEM (D-16) · Mobile Gaming (D-07) ·
el encuadre «empresa local» vs «partner local» (D-31), que afecta la redacción de todo el copy.

---

## Retirado

`demo-html/`, `mediaudience-demo.html` y el contenido estático que ocupaba `src/` fueron prototipos
para aprobar la dirección visual. Ya cumplieron: el sitio se reconstruye desde `design/referencia/`
como componentes de Astro. Se eliminaron del árbol de trabajo; siguen disponibles en el historial de
git si alguna vez hacen falta.

`src/` es ahora el directorio de código de Astro (Fase A: andamiaje, gates y archivos técnicos).
