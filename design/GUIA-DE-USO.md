# Mediaudience — Guía de uso de marca (Signal)

Reglas de aplicación para el sitio web. Los valores viven en `tokens.json`; este archivo dice **cómo** usarlos. Toda regla aquí es obligatoria salvo que diga "preferido".

Compañía: Mediaudience, AdTech multilatina. Audiencia del sitio: CMOs, directores de medios, agencias. Canales de producto: Connected TV, Mobile Push, Programmatic Display/Video, In-Game, Retail Media.

**Principio rector:** la pantalla se lee como un panel de instrumentos. Fondo ink, hairlines finos, un solo acento cian usado como señal, y las cifras como protagonistas. No es "SaaS amigable": sin sombras suaves, sin degradados pastel, sin pills redondeadas por todas partes.

---

## 1. Logo

### Versiones

| Versión | Composición | Uso |
|---|---|---|
| Principal | `medi` + `a` en `color.primary` + `udience`, en Space Grotesk 600, `letter-spacing: -0.02em` (‑0.03em a 40px+) | Header, footer, cualquier fondo oscuro |
| Sobre color de marca | Texto `#04121A`, la `a` en `#FFFFFF` | Sobre relleno cian |
| Sobre fondo claro | Texto `#0A0E17`, la `a` en `color.primary` | Impresos, documentos, emails claros |
| Monocromo | Todo en `color.text`, la `a` diferenciada por opacidad (resto al 40%) | Fax, grabado, un solo color disponible |

Siempre en minúsculas y como una sola palabra. Se compone en tipografía viva, no hay SVG (ver §9).

### Área de respeto y tamaño

- Área de respeto: la altura de la `a` en los cuatro lados. Nada entra ahí, incluido el borde del contenedor.
- Tamaño mínimo digital: 14px de alto de caja tipográfica.
- Tamaños de referencia: 17–18px en chrome de app, 20–24px en header web, 24–40px en documentos, 52px+ en portadas/hero.

### Usos prohibidos

- Degradados o cualquier relleno que no sea color plano.
- Rotar, inclinar, curvar, aplicar perspectiva.
- Alterar el tracking (ni abrir ni cerrar).
- Cambiar la tipografía, usar itálica, condensada o outline.
- Sombra, glow, bisel, contorno.
- Separar en dos palabras, capitalizar la `M`, colorear otra letra distinta de la `a`.
- Colocarlo sobre fotografía sin una capa de contraste sólida detrás.
- Encerrarlo en una caja o pill.

### Isotipo Beacon

Anillos concéntricos que irradian desde un núcleo sólido (señal / broadcast). Usos: favicon, app icon, avatar, estado de carga, indicador "en vivo".

- Opacidades de anillo escalonadas hacia afuera: `.6` → `.35` → `.18`. Núcleo al 100%.
- Trazo 2–3px sin importar el tamaño (no escala proporcionalmente).
- Sobre relleno cian: anillos en `rgba(4,18,26,.4/.7)`, núcleo `#04121A`.
- Animación permitida: pulso del núcleo, o barrido tipo radar escalonando la opacidad de los anillos.
- No combinar isotipo + wordmark en lockup horizontal salvo en favicon/app icon donde va solo el isotipo.

---

## 2. Color

### Proporción

**70% `background` / 20% superficies (`surface`, `surfaceRaised`) / 10% acento.** El cian es un indicador, no una decoración. Si el acento excede ~10% del área visible, está mal.

### Dónde va el acento

Permitido: enlaces y su hover, ítem de navegación activo, el botón primario de la página (uno por vista), eyebrows de sección numeradas, la cifra de un KPI héroe, el punto "en vivo", las barras destacadas de un gráfico, la regla de 2px de selección, focus ring.

### Combinaciones permitidas

| Fondo | Texto | Notas |
|---|---|---|
| `background` (#0A0E17) | `text` / `textMuted` / `primary` | Combinación base |
| `background` / `surface` | `textPlaceholder` (#7782A3) | Placeholders y ticks de eje. Mínimo accesible del sistema |
| `surface` (#121828) | `text` / `textMuted` / `primary` | Cards, separados por hairline de 1px, nunca por sombra |
| `backgroundAlt` (#06090F) | `text` / `textMuted` | Página detrás de un frame, wells de gráfico |
| `primary` (#2AD5E5) | `onPrimary` (#04121A) | Solo para botones, badges, bloques cortos de highlight |
| `#FFFFFF` / `#E9EDF6` | `textOnLight` (#0A0E17) | Solo impresos y superficies claras puntuales |

### Combinaciones a evitar

- Fondo cian con párrafos de texto encima. El cian solo lleva texto corto.
- Blanco puro (`#FFFFFF`) como texto de cuerpo sobre ink — el cuerpo es `text` (#E9EDF6) o `textMuted`.
- Cian sobre `surface` en tamaños de cuerpo largos: se reserva a labels, cifras y enlaces.
- Dos acentos juntos: `primary` y `secondary` no se tocan; `secondary` es exclusivamente la segunda serie de datos y estados de éxito.
- Cualquier fondo claro en la UI de producto. No hay tema claro.
- `error` como acento decorativo: solo indica caída, fallo o uso prohibido.
- Inventar hues nuevos para series extra de datos. Se usan pasos de superficie o alpha del cian.

### Superficies y separación

Todo se separa por hairline de 1px `border`. Overlays de rejilla y reglas tenues usan `borderSubtle`. Cero sombras dentro de la UI.

### Fondos gráficos

Dos motivos, siempre tenues, nunca simultáneos en el mismo bloque:

1. `gradient.scanlines` — reglas verticales cada 80px detrás de áreas hero.
2. `gradient.dataGrid` a 28–32px — cruz de rejilla dentro de paneles vacíos o empty states.

Opcional: `gradient.heroBloom` (bloom radial cian al 12%) desde el borde superior derecho de un hero. Nunca fotografía dentro de UI de producto.

---

## 3. Jerarquía tipográfica

Tres familias con roles cerrados. No se cruzan.

- **Space Grotesk** — display, títulos, cifras. Nunca párrafos.
- **IBM Plex Sans** — solo prosa.
- **JetBrains Mono** — solo metadatos: labels, eyebrows, ticks de eje, fechas, nombres de canal, headers de tabla, valores numéricos en tablas. Siempre MAYÚSCULAS con tracking de `.12em`–`.24em`.

| Elemento | Token | Familia |
|---|---|---|
| Hero de home | `scale.display` | Space Grotesk 600 |
| Título de página / sección mayor | `scale.h1` | Space Grotesk 600 |
| Subsección | `scale.h2` | Space Grotesk 500 |
| Título de card | `scale.h3` | Space Grotesk 600 |
| Eyebrow de sección (numerada: `01 — LOGOTIPO`) | `scale.eyebrow` en `primary` | JetBrains Mono |
| Cuerpo | `scale.body` en `textMuted` | IBM Plex Sans |
| Bajada / intro de sección | `scale.bodyLarge` en `textMuted` | IBM Plex Sans |
| Texto secundario, listas densas | `scale.small` | IBM Plex Sans |
| Label de KPI, header de tabla, filtros | `scale.label` en `textMuted` | JetBrains Mono |
| Cifra destacada / KPI héroe | `scale.kpi` | Space Grotesk 600 |
| KPI en grilla de 4 | `scale.kpiSmall` | Space Grotesk 600 |
| Dato inline, delta, tabla numérica | `scale.mono` | JetBrains Mono |
| Pie de foto, disclaimer, metadatos | `scale.caption` | JetBrains Mono |

Reglas:

- Prosa a `max-width: 620px` (`layout.maxWidthProse`). Nunca líneas de 100+ caracteres.
- Todo alineado a la izquierda. Números pueden alinearse a la derecha en tablas (tabular).
- Títulos en **sentence case**: "Los números son el héroe". Nunca Title Case.
- Un solo `display` por página, en el hero.
- Nunca por debajo de 9px en mono ni 12px en cuerpo. El mono de 9px (`scale.label`) se reserva a labels de una o dos palabras en mayúsculas; nunca para frases ni para información que el usuario deba leer con atención.
- `display` escala a `sizeMd` (3rem) bajo 900px y a `sizeSm` (2.25rem) bajo 640px. `h1` a 1.875rem y `kpi` a 2rem bajo 640px. Sin esos overrides el hero desborda en móvil.
- `text-wrap: pretty` en titulares.
- Español LATAM, primera persona plural para Mediaudience ("conectamos", "impactamos"), "tu marca / tu campaña" para el cliente. Nunca "usted".
- Sin emoji, sin signos de exclamación. Separador estándar `·`; rangos con guion medio `–`.
- Cifras: se abrevian en escala (`294K`, `192M`, `$6.2`), un decimal en tasas (`94.5%`), sufijos de unidad en `textMuted` a la mitad del tamaño de la cifra. Los deltas van firmados y con el período de comparación: `+18% vs. sep`.

---

## 4. Imágenes

- **Estilo fotográfico:** entornos reales de consumo de medios y de negocio — pantallas, salas, retail, dispositivos en uso. Documental, no stock corporativo posado. Luz baja y contrastada que conviva con el fondo ink.
- **Tratamiento:** desaturar parcialmente y virar hacia frío/azulado para integrar con el ink. Sin filtros vintage, sin viñeteo, sin duotono cian salvo en un bloque hero deliberado.
- **Overlay obligatorio** si va texto encima: capa `rgba(10,14,23,.72)` o degradado ink desde el borde donde apoya el texto.
- **Proporciones:** 16:9 (hero, thumbnails de video), 3:2 (cards de contenido), 1:1 (avatares, logos de partner), 21:9 (bandas full-bleed). Nada de recortes arbitrarios.
- **Bordes:** hairline `border` de 1px + `radius.md`. Sin sombra. Full-bleed sin borde ni radio.
- **Sin fotografía dentro de UI de producto.** Los mockups de plataforma se muestran como captura real dentro de un frame con `radius.appFrame` y `shadow.lg`.
- **Sin ilustración vectorial ni escenas dibujadas en SVG.** Si falta imagen: placeholder con el motivo `gradient.dataGrid` y una línea mono uppercase describiendo qué va ahí.
- Logos de partners: monocromo `textMuted`, altura óptica igualada, a color solo si el partner lo exige por contrato.

---

## 5. Iconografía

- Familia: **Lucide**, estilo outline. Una sola familia, sin mezclar.
- `stroke-width: 1.5`. Sin variación.
- Tamaños: 16px en UI densa (tablas, filtros), 20px en navegación y botones, 24px máximo en features. Nada más grande.
- Color `currentColor` para que herede muted / activo / acento del contenedor.
- Sin iconos rellenos, sin iconos duotono, sin iconos en círculo de color, sin emoji ni símbolos unicode como iconos.
- El sistema es **glyph-light por diseño**: el vocabulario propio son puntos, hairlines, barras y el indicador de "en vivo". Antes de agregar un icono, evaluar si un label mono resuelve mejor.
- Glifos permitidos como texto: `·` `–` `→` `✕` `▲` `▼`.

---

## 6. Componentes

### Botones

| Variante | Estilo | Cuándo |
|---|---|---|
| Primario | Relleno `primary`, texto `onPrimary`, `radius.md`, mono 11–13px | **Uno por vista.** La acción principal (agendar, contactar, exportar) |
| Secundario | Transparente, borde 1px `border`, texto `text` | Acción alternativa junto al primario |
| Ghost | Transparente, sin borde, texto `textMuted` | Filtros, controles de fecha, acciones terciarias |
| Enlace | Texto `primary`, sin subrayado; subrayado en hover | Inline en prosa |

- Hover: primario `primaryHover`; secundario/ghost rellenan a `surfaceHover` y el texto pasa a `text`.
- Active: `transform: translateY(1px)`, sin cambio de color.
- Focus: outline 1px `borderFocus` con `outline-offset: 2px`.
- Disabled: `primaryDisabled` / `textDisabled`, `cursor: not-allowed`, sin hover.
- Nunca full-width salvo en móvil (<640px). Nunca pill (`radius.full`) — los botones usan `radius.md`.
- Label en sentence case o mono uppercase, según el contexto del bloque; consistente dentro de una misma vista.

### Cards

- Base: `surface`, borde 1px `border`, `radius.md`, padding `spacing.xl` (16–24px). Sin sombra.
- Hover (solo si es clicable): fondo a `surfaceRaised`, borde a `borderStrong`. Sin elevar ni escalar.
- Variante numerada: número de orden en mono `textTertiary` arriba, título `h3`, cuerpo `small` en `textMuted`.
- Variante KPI: label mono, cifra `kpi`/`kpiSmall`, línea de delta mono con color semántico. **Una sola cifra en cian por fila.**
- Variante destacada: mismo card + regla superior o izquierda de 2px `primary`. No relleno cian.

### Tablas

- Header: mono 9–10px uppercase `textMuted`, `font-weight: 400`, hairline `border` abajo.
- Filas: 12–13px, separadas por `borderSubtle`. Hover de fila a `surfaceRaised`.
- Primera columna en Space Grotesk 500. Todas las numéricas en JetBrains Mono, alineadas a la derecha, tabular.
- Deltas con color semántico. Sin zebra striping, sin bordes de celda, sin sombras.

### Formularios

- Input: fondo `background` (más oscuro que el card que lo contiene), borde 1px `border`, `radius.md`, padding 12px 14px, texto `text` 15px IBM Plex Sans.
- Label sobre el campo, mono `label` en `textMuted`. Sin floating labels, sin placeholder como label.
- Placeholder en `textPlaceholder` (#7782A3). No usar `textTertiary`: falla WCAG AA (2.99:1) y el placeholder comunica información.
- Focus: borde `borderFocus`, sin glow ni sombra.
- Error: borde `error`, mensaje debajo en mono 10px `error`. Éxito: `success`, mismo patrón.
- Campos requeridos: `·` en `primary` después del label, no asterisco rojo.
- Un formulario por página como máximo. Máximo 5 campos visibles antes de justificar el resto.

### Navegación

- Header: fondo `surface`, hairline abajo. Sticky permitido con `backdrop-filter: blur(12px)`.
- Ítems mono 11–13px `textMuted`; activo en `text`.
- Firma de selección de la marca: `border-left: 2px solid primary` + `background: primarySubtle` en navegación vertical; en navegación horizontal, `border-bottom` de 2px.
- Footer: fondo `backgroundAlt`, hairline arriba, labels mono uppercase.

### Pills y badges

- Estado únicamente, nunca navegación: `primarySubtle` + borde `primaryBorder`, texto `primary`, mono 9–10px uppercase, `radius.sm`.
- Estado negativo con los mismos alphas sobre `error`.

### Indicador "en vivo"

Punto de 6px `primary` con pulso de 1800ms + `EN VIVO` en mono cian. Una sola vez por pantalla.

### Empty state

Panel con `gradient.dataGrid` + una línea mono uppercase `textMuted`: `SIN DATOS EN ESTE RANGO`. Sin ilustración, sin botón salvo que exista una acción real.

---

## 7. Motion

- Duración base **220ms**, easing `cubic-bezier(0.2, 0.7, 0.3, 1)`. Micro-feedback 120ms. Entradas de datos hasta 700ms.
- **Qué se anima:** barras crecen desde la base (`scaleY`, stagger de 40ms), fills de progreso crecen desde la izquierda (`scaleX`, stagger 60ms), fades y desplazamientos de ≤8px al entrar en viewport, cambios de color en hover, el pulso del indicador en vivo (1800ms infinito), el barrido del Beacon.
- **Qué no se anima:** el logo, layout (nada de reflow animado), scroll (sin parallax, sin scroll-jacking), números en count-up salvo en un único KPI héroe, nada con bounce, spring, overshoot ni rebote.
- Sin transiciones de página. Sin loaders tipo spinner: el estado de carga es el Beacon pulsando o un skeleton en `surfaceRaised`.
- Respetar `prefers-reduced-motion: reduce` → desactivar todo menos los cambios de color.

---

## 8. Layout y densidad

- Contenido a `layout.maxWidth` (1200px); grillas de datos hasta 1440px. Gutter 24px.
- Secciones con padding vertical `spacing.3xl` (72px) en desktop, 48px en tablet, 32px en móvil, separadas por hairline `border`.
- Gap de grilla 12px en bloques de datos, 16px entre secciones.
- Densa antes que airosa. El aire se logra con hairlines y jerarquía tipográfica, no con padding grande.
- Breakpoints: 640 / 900 / 1100 / 1440. Grillas de 4 columnas caen a 2 bajo 1100px y a 1 bajo 640px.
- Target táctil mínimo 44px en vistas móvil/tablet.
- Blur solo en dos casos: tints de acento al 6–10% para estados soft, y `backdrop-filter: blur(12px)` en headers sticky. Nunca cards frosted.

---

## 9. Pendientes / decisiones abiertas

Marcados como `null` en `tokens.json`:

- **Sin assets vectoriales de marca.** Wordmark en tipografía viva, isotipo Beacon en CSS. Si aparecen los SVG, reemplazar y actualizar esta sección.
- **Fuentes desde Google Fonts.** Para producción SSR/SSG: self-host WOFF2 (paquetes fontsource), subset latin, `font-display: swap`. Licencia OFL 1.1, sin costo.
- **Sin tema claro.** Piezas impresas usan ink sobre papel (`#0A0E17` sobre `#E9EDF6`) con la misma tipografía y hairlines — no un dark UI re-tintado.
- **Sin biblioteca fotográfica.** Hasta que exista, usar placeholders con el motivo de rejilla.
- **Escala de sombras inexistente por diseño.** `shadow.sm` y `shadow.md` son `none` a propósito; no rellenarlos.
- **`textTertiary` solo para deshabilitado.** Falla WCAG AA (2.99:1 sobre `background`). Es válido en texto deshabilitado, que está exento, pero cualquier otro uso va con `textPlaceholder`.

### Isotipo Beacon — construcción de referencia

```html
<div style="position:relative;width:74px;height:74px;display:flex;align-items:center;justify-content:center;">
  <div style="position:absolute;width:74px;height:74px;border-radius:50%;border:2px solid #2AD5E5;opacity:.18;"></div>
  <div style="position:absolute;width:54px;height:54px;border-radius:50%;border:2px solid #2AD5E5;opacity:.35;"></div>
  <div style="position:absolute;width:34px;height:34px;border-radius:50%;border:2px solid #2AD5E5;opacity:.6;"></div>
  <div style="width:10px;height:10px;border-radius:50%;background:#2AD5E5;"></div>
</div>
```

### Wordmark — construcción de referencia

```html
<span style="font-family:'Space Grotesk',sans-serif;font-weight:600;letter-spacing:-.02em;">
  medi<span style="color:#2AD5E5;">a</span>udience
</span>
```
