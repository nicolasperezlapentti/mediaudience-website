# Src — Sitio Mediaudience

Sitio estático (HTML + CSS + JS, sin build ni dependencias). Implementa el
sistema **Signal** definido en `design/tokens.json` y `design/GUIA-DE-USO.md`,
sobre el contenido aprobado en `content/`.

## Previsualizar

```bash
python3 -m http.server 4321 --directory src
```

## Estructura

```
src/
├── assets/
│   ├── style.css     ← sistema de diseño completo (tokens + componentes)
│   └── site.js       ← drawer móvil, índice de página, revelado, validación
├── index.html                                   /
├── nosotros/                                    /nosotros/
├── soluciones/                                  /soluciones/
│   ├── connected-tv/
│   ├── mobile-push/
│   │   ├── premium-claro/
│   │   ├── premium-video/
│   │   └── programatico/
│   ├── programmatic/
│   └── retargeting-ctv-mobile/
├── ecuador/                                     /ecuador/
└── contacto/                                    /contacto/
```

Doce páginas: exactamente las que tienen `status: ready` en `content/sitemap.json`.
El chrome (rail de navegación, footer) es idéntico en las doce; al cambiarlo hay
que replicarlo. Cuando se elija framework (Next.js, Astro, …), estas páginas son
la implementación de referencia del sistema: los componentes de `style.css`
mapean uno a uno a los componentes de la guía.

## Regla de contenido aplicada

**No hay placeholders de elementos inexistentes.** Concretamente, no se emite:

- Marcos de imagen vacíos ni con leyenda de "aquí va…" — no existe biblioteca fotográfica.
- Empty states decorativos donde no hay una acción real disponible.
- Enlaces (ni en nav, ni en footer) a páginas no construidas: `/casos/`,
  `/recursos/`, `/partners/`, `/soluciones/one-by-sqreem/`, `/soluciones/mobile-gaming/`,
  `/nosotros/socios/`, `/peru/`, `/mexico/`, `/chile/`, `/legal/privacidad/`.
- Filas ni celdas `(pendiente — D-XX)`. Las tablas de mercado de `nosotros.md` y
  `contacto.md` se sustituyeron por bloques que solo muestran dato verificado.
- Códigos internos de duda (`D-05`, `D-06`, …) ni notas de bloqueo en la interfaz.
  La atribución editorial *"Según datos de la compañía"* sí se conserva: la exige
  el fact-book y califica la cifra ante el lector.
- El indicador "en vivo" de la guía: no hay dato en tiempo real que lo justifique.

Cuando se desbloquee una duda con el cliente, se añade la sección o la página
correspondiente; nada queda "reservado" visualmente.

## Decisiones de diseño sobre la guía

| Decisión | Referencia en la guía |
|---|---|
| Rail vertical fijo de 200px en ≥1100px, topbar + drawer por debajo | §6 Navegación (firma `border-left: 2px primary` + `primarySubtle`) · `layout.sidebarWidth` |
| Índice de página en el rail, sección activa marcada con la misma firma | §6 Navegación · §8 densidad |
| Cifras clave en panel de hairlines (`.datastrip`) en vez de cards separadas | §2 separación por hairline, cero sombras · §8 densa antes que airosa |
| Una sola cifra en cian por fila de datos | §6 Cards, variante KPI |
| `scanlines` + `heroBloom` solo en el hero de home; páginas internas sin motivo | §2 Fondos gráficos |
| Barras de dato (`.meter`) solo donde hay cifra comparable real | §2 acento permitido en barras destacadas · §7 `scaleX`, stagger 60ms |
| Count-up en un único KPI del sitio (80 M en home) | §7 Motion |
| FAQ en dos columnas, sin acordeón | §7 (nada de layout animado) + contenido extraíble para AEO |
| `textPlaceholder` (#7782A3) en todo texto informativo secundario; `textTertiary` solo en `[disabled]` | §9 decisiones abiertas |
| Un botón primario por vista (cierre de página, o submit en `/contacto/`) | §6 Botones |

## Pendiente de definir fuera de este código

- **Endpoint del formulario** de `/contacto/` (`action` + `method`). Hoy valida
  en cliente y no envía.
- **Dominio**: los bloques JSON-LD usan IRIs relativas; al publicar hay que
  resolverlas contra el dominio real y añadir `canonical`, `og:*` y `sitemap.xml`.
- **Fuentes**: hoy vía Google Fonts. Para producción, self-host WOFF2 con
  `fontsource`, subset latin, `font-display: swap` (ver `tokens.json`).
