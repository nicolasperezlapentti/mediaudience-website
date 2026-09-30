# Inventario de plantillas y bloques — Sitio Mediaudience

**Versión:** 1.2 (mapa de URLs + migración del one-pager) · **Deriva de:** `Arquitectura-GEO-AEO-Mediaudience-v2.md` + `factbook-mediaudience.md` v1.2
**Regla heredada, no negociable:** si un dato no está en el fact-book, no se publica.

---

## 0. Cómo se usa este documento

Tres audiencias, tres usos:

| Quién | Qué toma de acá |
|---|---|
| **Claude Design** | la lista de bloques faltantes (§2) y los ejemplares a maquetar (§3) |
| **Claude Code** | las plantillas (§4) como componentes de Astro y las reglas de gate (§5) |
| **Redacción de contenido** | las secciones obligatorias por plantilla, para escribir los `.md` de `/content/` |

**Regla de oro del diseño:** no se diseñan páginas, se diseñan **bloques**. Una página es una secuencia de bloques definida por su plantilla. Si un bloque no tiene dato, la sección **no se renderiza** — no se rellena con placeholder.

---

## 1. Navegación: facetas sobre URLs canónicas

Los cuatro ejes del header (**Objetivos · Productos · Canales · Herramientas**) son **facetas de navegación**, no jerarquías de contenido. Los cuatro apuntan al mismo conjunto de URLs canónicas desde ángulos distintos.

**Regla:** una solución = una URL canónica. Nunca una URL por faceta.

### 1.1 URLs canónicas de solución

Un solo árbol `/soluciones/`. Los hijos cuelgan de su hub, para que la jerarquía se lea en la URL.
Slugs con el nombre completo del producto normalizado.

| URL canónica | Estado | Bloqueo |
|---|---|---|
| `/soluciones/` (hub) | publicable | — |
| `/soluciones/ssp/` | publicable | — |
| `/soluciones/representacion-de-medios/` | publicable | — |
| `/soluciones/connected-tv/` | publicable | — |
| `/soluciones/mobile-push/` (hub de 3 productos) | publicable | — |
| `/soluciones/mobile-push/premium-claro/` | publicable | — |
| `/soluciones/mobile-push/premium-video/` | publicable | — |
| `/soluciones/mobile-push/programatico/` | publicable | — |
| `/soluciones/programmatic/` (DV360) | publicable | — |
| `/soluciones/retargeting-ctv-mobile/` | publicable | — |
| `/soluciones/inteligencia-de-audiencias/` (ONE by SQREEM) | **bloqueada** | D-16 |
| `/soluciones/mobile-gaming/` | **bloqueada** | D-07 |
| `/partners/siprocal/` | **bloqueada** | D-15 |

**No existen** y no deben aparecer en nav, footer, glosario ni enlazado interno:

- **Retail Media** — no está en el fact-book. Apareció en la hoja de bloques porque el `README.md`
  de la skill `mediaudience-design` lo listaba como canal. Ese README debe corregirse.
- **In-Game** — es Mobile Gaming, bloqueado por D-07.

### 1.2 Mapa de facetas → URL canónica

Las cuatro facetas navegan **el mismo conjunto de URLs**. Ninguna tiene espacio de URLs propio.
Objetivos y Herramientas apuntan a **fragmentos** de las páginas canónicas, no a páginas nuevas.

| Faceta | Ítem del menú | Anchor | Destino |
|---|---|---|---|
| Objetivos | Alcance y awareness | «Connected TV de Mediaudience» | `/soluciones/connected-tv/#alcance` |
| Objetivos | Consideración | «Display y video programático» | `/soluciones/programmatic/#consideracion` |
| Objetivos | Conversión | «Mobile Push Programático» | `/soluciones/mobile-push/programatico/#conversion` |
| Objetivos | Visitas a tienda | «Push Premium Video georreferenciado» | `/soluciones/mobile-push/premium-video/#visitas-a-tienda` |
| Productos | SSP | «SSP de Mediaudience» | `/soluciones/ssp/` |
| Productos | Representación de medios | «Representación de medios digitales» | `/soluciones/representacion-de-medios/` |
| Productos | Mobile Push Premium con Claro | «Push Premium con first-party data de Claro» | `/soluciones/mobile-push/premium-claro/` |
| Productos | Mobile Push Premium Video | «Push Premium Video georreferenciado» | `/soluciones/mobile-push/premium-video/` |
| Productos | Mobile Push Programático | «Mobile Push Programático de Mediaudience» | `/soluciones/mobile-push/programatico/` |
| Canales | Connected TV | «CTV e inventario premium de streaming» | `/soluciones/connected-tv/` |
| Canales | Mobile Push | «Mobile Push de Mediaudience» | `/soluciones/mobile-push/` |
| Canales | Display y video programático | «Programmatic sobre DV360» | `/soluciones/programmatic/` |
| Herramientas | Consola de campañas | «Consola de campañas de Mediaudience» | `/soluciones/ssp/#consola` |
| Herramientas | Segmentos de audiencia | «Segmentos de audiencia» | `/soluciones/ssp/#segmentos` |
| Herramientas | Medición y reportes | «Medición y reportes» | `/soluciones/representacion-de-medios/#medicion` |

Que `/soluciones/connected-tv/` reciba enlaces desde varias facetas con anchors distintos **suma**:
refuerza el tema sin fragmentar autoridad. Lo que nunca se hace es darle URL propia a una faceta.

### 1.3 Header final

```
Objetivos ▾ · Productos ▾ · Canales ▾ · Herramientas ▾ · Nosotros ▾ · Recursos ▾ · [Agenda una demo]
```

- **Nosotros ▾** → `/nosotros/` · `/nosotros/socios/` · `/contacto/`
- **Recursos ▾** → explicadores · panorama por mercado · comparativas · glosario
- **Sin ítem Resultados/Casos** hasta liberar D-13.
- **Sin selector de mercado** hasta que haya más de una página país publicable (hoy solo Ecuador).

### 1.4 Footer final

Cinco columnas + bloque de entidad + barra legal.

```
Objetivos | Productos | Canales | Herramientas | Compañía
                                                 ├ Nosotros
                                                 ├ Socios
                                                 ├ Recursos
                                                 └ Contacto
─────────────────────────────────────────────────────────────
BLOQUE DE ENTIDAD (texto real, en las ~25 páginas)
  Mediaudience, compañía multilatina de AdTech: SSP y representación
  de medios digitales en Perú, México, Ecuador y Chile.
  Mediaudience S.A.S. · [domicilio] · [contacto]
─────────────────────────────────────────────────────────────
Términos · Privacidad · Cookies · © Mediaudience
```

El bloque de entidad usa el **descriptor de una línea** (liberado en el fact-book). La razón social aparece **una sola vez por activo**, acá. Nunca abre párrafo ni va en `<title>`.

---

---

## 1.5 Migración del one-pager a sitio multipágina

La home aprobada es un one-pager: siete secciones en una sola URL, navegadas por anclas
(`#objetivos`, `#productos`, `#canales`, `#herramientas`, `#nosotros`, `#resultados`, `#contacto`).
El sitio pasa a multipágina. Reparto **confirmado**:

| Sección del one-pager | Destino | Qué queda en la home |
|---|---|---|
| `#nosotros` | **Migra entera** a `/nosotros/` (T1) | Bloque breve de entidad: descriptor de una línea, 2–3 frases, enlace a `/nosotros/` |
| `#contacto` | **Migra** a `/contacto/` | El CTA «Agenda una demo» del header, que ya cubre la conversión |
| `#resultados` | **Se retira** | Nada. Vuelve cuando D-13 libere |
| `#objetivos` | **Resumen** | Tarjetas enlazando a las URLs canónicas de §1.2 |
| `#productos` | **Resumen** | Ídem |
| `#canales` | **Resumen** | Ídem |
| `#herramientas` | **Resumen** | Ídem |

**Por qué `#nosotros` migra en vez de quedarse.** `/nosotros/` es el pilar de entidad: es la página
que fija a Mediaudience como entidad distinta del genérico «media audience», la que responde si es
una empresa o varias, y la que carga el grafo JSON-LD de dos capas. Una sección dentro de un scroll
no puede ser citada como fuente canónica ni tener su propio `<title>`, su answer target o su FAQ.

**Consecuencia a cubrir:** al migrar, la home queda sin respuesta a «quiénes son estos». Necesita un
bloque corto de entidad —el descriptor liberado del fact-book, enlace a `/nosotros/`— o la portada
pierde el encuadre. No es una sección completa: son tres frases y un enlace.

**Dos correcciones pendientes en la home**, ya diagnosticadas:

1. **El H1 actual, «Conectamos marcas con audiencias reales», se reemplaza.** Es un eslogan genérico
   donde la arquitectura pide el descriptor de entidad, y pone «audiencias» a dos palabras de la
   marca en el H1 de la página más importante: refuerza exactamente el homónimo que el proyecto
   busca romper.
2. **El `mailto:` a un correo personal se reemplaza** por el contacto institucional del footer.

**Reglas de build derivadas:**

- Ninguna ancla `#seccion` sobrevive como destino de navegación. Header y footer enlazan URLs.
- Los fragmentos de §1.2 (`/soluciones/connected-tv/#alcance`) sí son válidos: son anclas **dentro**
  de una página canónica, no sustitutos de una página.
- La home no se genera hasta que exista `/nosotros/`, o sus enlaces apuntarían a un 404.

---

## 2. Bloques faltantes (lo que hay que diseñar)

La home ya resolvió: hero, cards de solución, contadores de stat, tira de logos, CTA. Los siguientes **no existen** y son los que cargan el peso GEO.

| # | Bloque | Plantillas | Notas de implementación |
|---|---|---|---|
| B-01 | **Answer target** | todas | Primera oración del cuerpo, autocontenida. Visualmente destacada pero `<p>` real, nunca imagen ni inyección JS. |
| B-02 | **Encuadre DECLARADO** | casi todos los claims | Línea de atribución: «según datos de la compañía, corte [fecha]». Discreta, no debe leerse como disclaimer defensivo. |
| B-03 | **Tabla de sociedades locales** | T1 | `<table>` real. Columnas: mercado · razón social · ciudad · enlace a página país. Filas sin datos **no se muestran**. |
| B-04 | **Bloque legal** | T3 | Razón social, ID fiscal, domicilio, fecha de constitución. |
| B-05 | **FAQ semántico** | T1, T2, T4 | Acordeón abierto por defecto o texto plano. Contenido en HTML de servidor + `FAQPage` JSON-LD. |
| B-06 | **KPI en texto** | T5 | Números absolutos, denominador explícito (CPE→envíos, programático→impresiones), país y fecha. **Nunca captura de imagen.** |
| B-07 | **Tabla comparativa** | T4 | `<table>` con criterios objetivos. |
| B-08 | **Entrada de glosario** | T4-glosario | Término + definición de 1–2 frases + enlace al pilar. Ancla propia por término. |
| B-09 | **Selector de 3 productos push** | T2-hub | Debe dejar claro que son **tres universos distintos**, con CTR y ventanas de disparo propias. |
| B-10 | **Bloque de contacto local** | T3 | Contacto del mercado, no el genérico. |
| B-11 | **Estado vacío / sección ausente** | todas | No es un bloque visible: es la especificación de que la sección desaparece si falta el dato. |

---

## 3. Ejemplares a maquetar en Claude Design

Cuatro sesiones, no veinticinco. En este orden:

1. **Header + footer + hoja de bloques B-01 a B-11** ← empezar acá
2. **`/nosotros/`** (T1) — la página más importante para GEO
3. **`/ecuador/`** (T3) — la única página país publicable hoy
4. **`/soluciones/connected-tv/`** (T2) — el pilar con más contenido disponible
5. **`/recursos/que-es-ctv/`** (T4) — explicador tipo

T5 (caso) y T6 (hub) se derivan de los anteriores sin volver a Design.

---

## 4. Plantillas

Leyenda de estado: **OBL** obligatoria · **OPC** opcional · **GATE** condicionada a un D-XX.

### T1 — Entidad
**URLs:** `/nosotros/` · `/nosotros/socios/`

| Orden | Sección | Estado | Bloque |
|---|---|---|---|
| 1 | H1 «Qué es Mediaudience» | OBL | — |
| 2 | Answer target de entidad | OBL | B-01 |
| 3 | Bloque de estructura «Mediaudience en la región» | OBL | B-03 |
| 4 | Origen peruano y modelo multilatina | OBL | — |
| 5 | Posicionamiento SSP | OBL | B-02 |
| 6 | Partnership con Siprocal | GATE D-15 | B-02 |
| 7 | Equipo y socios (enlace) | OPC | — |
| 8 | FAQ de entidad, incluido el **test de homónimo** | OBL | B-05 |

**Answer target (liberado):** «Mediaudience es una compañía multilatina de tecnología publicitaria (AdTech) y representación de medios digitales, de origen peruano, que opera como empresa local en Perú, México, Ecuador y Chile.»

**JSON-LD:** grafo de dos capas completo — marca-entidad + un nodo `Organization` por mercado, con `parentOrganization`/`subOrganization` recíprocos. `foundingDate` **nunca** en la marca-entidad (D-01).

---

### T2 — Pilar de solución
**URLs:** las nueve de §1.1, más `/partners/siprocal/` como variante.

| Orden | Sección | Estado | Bloque |
|---|---|---|---|
| 1 | H1 con nombre de producto normalizado | OBL | — |
| 2 | Answer target del producto | OBL | B-01 |
| 3 | Cómo funciona | OBL | — |
| 4 | Qué lo diferencia | OBL | B-02 |
| 5 | Disponibilidad por mercado | OBL | — |
| 6 | Casos relacionados | GATE D-13 | B-06 |
| 7 | Enlace al explicador de `/recursos/` | OBL | — |
| 8 | FAQ del producto | OPC | B-05 |
| 9 | CTA demo | OBL | — |

**Sección 5 — atención:** Push Premium depende de Claro y está declarado **solo para Ecuador**. No asumir disponibilidad en MX/CL (D-06, D-29).

**Variante hub (`/soluciones/mobile-push/`):** sustituye 3–4 por B-09, el selector de tres productos, y enlaza recíprocamente a cada uno.

---

### T3 — Página país
**URLs:** `/mercados/peru/` · `/mercados/mexico/` · `/mercados/ecuador/` · `/mercados/chile/`
**Hub:** `/mercados/` — página de consolidación multilatina (ver T6)

| Orden | Sección | Estado | Bloque |
|---|---|---|---|
| 1 | H1 descriptor de operación local | OBL | — |
| 2 | Answer target local | OBL | B-01 |
| 3 | Productos disponibles en ese mercado | OBL | — |
| 4 | Datos locales con fuente | OPC | B-02 |
| 5 | Bloque legal | OBL | B-04 |
| 6 | Socio local | GATE D-31 | — |
| 7 | Contacto local | OBL | B-10 |
| 8 | Enlace a `/nosotros/` (entidad única) | OBL | — |

**Patrón de H1:** «Mediaudience [PAÍS] es la operación local de Mediaudience, compañía multilatina de AdTech de origen peruano, en [PAÍS]. Con sociedad constituida en [CIUDAD], ofrece [productos disponibles] a agencias y anunciantes locales, con contratación y facturación en el país.»

**Gate de publicación:** sin razón social, domicilio, productos disponibles y contacto local, **la página no se publica**. Hoy solo Ecuador cumple (Mediaudience S.A.S., const. 10-01-2022). Perú → D-01. México y Chile → D-29, D-30. Colombia → D-04, en conflicto.

---

### T4 — Explicador / recurso
**URLs:** `/recursos/que-es-ctv/` · `/que-es-push/` · `/publicidad-sin-cookies/` · `/inteligencia-de-audiencias-ia/` (parcial, D-16) · `/recursos/publicidad-programatica-{peru|ecuador}/` · `/recursos/comparativas/*`

| Orden | Sección | Estado | Bloque |
|---|---|---|---|
| 1 | H1 en forma de la consulta | OBL | — |
| 2 | Answer target definicional | OBL | B-01 |
| 3 | Desarrollo con H2/H3 semánticos | OBL | — |
| 4 | Tabla comparativa | OPC | B-07 |
| 5 | Enlace al pilar comercial | OBL | — |
| 6 | Términos de glosario relacionados | OPC | B-08 |
| 7 | FAQ | OPC | B-05 |

**Notas:**
- `/que-es-push/` debe explicar **los tres productos**. Presentarlos como uno reproduce la confusión de cifras del media kit.
- `/inteligencia-de-audiencias-ia/` puede explicar el concepto **sin atribuir marcas de SQREEM** hasta D-16.
- El panorama de categoría se instancia **por mercado con sustancia** (Perú, Ecuador). No crear MX/CL hasta D-29.

**Variante glosario:** lista de B-08, cada término con ancla propia. Es el tejido de enlazado interno del sitio.

---

### T5 — Caso ⛔ **Toda la plantilla bloqueada por D-13**

| Orden | Sección | Estado |
|---|---|---|
| 1 | Cliente y contexto | OBL |
| 2 | Objetivo | OBL |
| 3 | Segmentación aplicada | OBL |
| 4 | Formato (producto normalizado) | OBL |
| 5 | Resultado con KPI en texto (B-06) | OBL |
| 6 | Línea de cierre citable | OBL |
| 7 | Enlace al producto correcto | OBL |

**Reglas:** KPI como texto HTML, nunca imagen · siempre país, fecha y duración · números absolutos, no abreviados · denominador explícito · una URL por caso.

**Correcciones ya diagnosticadas, aplicar al reescribir:** Apuesta Total (sesiones 348,1K; ratio recalculado ~26,7%; **retirar el CTR 99,97%**) · CityMall (12 días, no 5; CTR 5,88%) · Movistar/Prime Video (falta país y fecha) · BET593 y La Ganga son **Push Programático**, no Premium · Raspaditas/TIA: **no publicar «Viewability 100%»** sin verificación de tercero · Dove: sin métricas, **retirar**.

**Alternativa mientras D-13 no libere:** publicar por sector sin nombrar («una telco líder de la región»).

---

### T6 — Hub de índice
**URLs:** `/soluciones/` · `/recursos/` · `/mercados/` (ver nota) · `/casos/` (GATE D-13)

| Orden | Sección | Estado |
|---|---|---|
| 1 | H1 de categoría | OBL |
| 2 | Answer target de categoría (B-01) | OBL |
| 3 | Grilla de hijos con descripción de 1–2 frases | OBL |
| 4 | Enlace a la entidad | OBL |

Los hijos se generan desde `sitemap.json`. **Solo se listan los de `status: ready`.**

**Nota sobre `/mercados/`:** es la página que expresa la huella multilatina como una sola cosa, y por
eso importa para la consolidación de entidad. Pero hoy solo Ecuador es publicable (Perú → D-01,
México → D-29, Chile → D-30). Un hub con una entrada y tres ausencias resta en vez de sumar:
**publicarlo recién cuando haya al menos dos mercados listos.** Mientras tanto, los países
publicables se enlazan desde `/nosotros/` y desde el footer.

---

## 5. Gates de build (para Claude Code)

Reglas que el build debe hacer cumplir. No son recomendaciones editoriales: son condiciones de compilación.

1. **`status` manda.** Una página con `status: blocked` no se genera y no entra en `sitemap.xml`, `llms.txt` ni en ningún menú.
2. **Secciones OBL vacías rompen el build.** Si un `.md` de `/content/` declara una plantilla y le falta una sección obligatoria, el build falla con el nombre del archivo y la sección. Es la defensa contra rellenar huecos con contenido inventado.
3. **Secciones GATE.** Si el D-XX sigue abierto, la sección **no se renderiza**. No se muestra placeholder ni «próximamente».
4. **Sin enlaces a páginas no publicadas.** Header, footer, hubs y enlazado interno se generan desde `sitemap.json` filtrando por `status: ready`. Ningún enlace manual hardcodeado en una plantilla.
5. **Criterio de aceptación por página:** `curl https://mediaudience.com/{ruta}` sin ejecutar JS devuelve H1, cuerpo, answer target y JSON-LD completos. Si curl no ve el answer target, la página falla.
6. **Marca:** un único string de marca en archivo de constantes. `Mediaudience`, una sola palabra, siempre. Prohibido en todo activo: «Media Audience», «MediaAudience», «media audience».
7. **Formato numérico es-EC:** coma decimal, punto de miles → `9,3%` · `1.305.200` · `USD 14,5`.
8. **Un solo H1 por página.** Jerarquía H2/H3 semántica. Tablas como `<table>`. `alt` descriptivo en toda imagen. Anchors con marca + tema, nunca «clic aquí».

---

## 6. Secuencia de producción

| Paso | Qué | Herramienta | Depende de |
|---|---|---|---|
| 1 | Header, footer y hoja de bloques B-01…B-11 | Claude Design | — |
| 2 | Migrar de `/demo-html/` a Astro con los bloques como componentes | Claude Code | 1 |
| 3 | `/nosotros/` (T1) | Design → Code | 1, 2 |
| 4 | `/ecuador/` (T3) | Design → Code | 3 |
| 5 | Pilares de solución (T2) ×7 publicables | Code | 3 |
| 6 | Hubs (T6) | Code | 5 |
| 7 | Explicadores y glosario (T4) | Design → Code | 5 |
| 8 | Fase 0 técnica: `robots.txt`, `sitemap.xml`, `llms.txt` | Code | ejecutable **ya**, en paralelo (D-26) |
| 9 | Casos (T5) | — | **D-13** |
| 10 | Páginas país restantes | — | **D-01, D-29, D-30** |

**El paso 8 no espera a nadie.** Hoy el `robots.txt` autogenerado por HestiaCP lleva `Crawl-delay: 10` y no declara `Sitemap`; `sitemap.xml` y `llms.txt` dan 404. Son tres archivos, cero decisiones pendientes, y resuelven una parte desproporcionada del problema de invisibilidad.

---

## 7. Lo que sigue bloqueando la mayor parte de la producción

Una reunión con Mediaudience destraba casi todo:

| Duda | Qué destraba |
|---|---|
| **D-13** | toda la plantilla T5 y las franjas de casos en T2 y home |
| **D-01** | `/peru/` y el `foundingDate` de la marca-entidad |
| **D-29 / D-30** | `/mexico/` y `/chile/`, y el panorama de categoría de esos mercados |
| **D-15** | el claim de Siprocal en home, T1 y `/partners/siprocal/` |
| **D-16** | `/soluciones/inteligencia-de-audiencias/` (ONE by SQREEM) |
| **D-31** | el énfasis «empresa local» vs «partner local» — **afecta la redacción de todo el copy** |
| **D-07** | `/soluciones/mobile-gaming/` |

**D-31 conviene cerrarla antes de escribir la primera línea de copy nuevo.**
