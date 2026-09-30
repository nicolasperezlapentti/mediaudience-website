# Cómo usar el skill `mediaudience-design`

## 1. Instalarlo

**En Claude Code** — descomprime la carpeta dentro de:
- `~/.claude/skills/mediaudience-design/` (disponible en todos tus proyectos), o
- `<tu-repo>/.claude/skills/mediaudience-design/` (solo ese repo, y se comparte por git con el equipo).

Debe quedar así:
```
.claude/skills/mediaudience-design/
  SKILL.md
  README.md
  tokens.css
  dashboard-patterns.md
  dashboard-reference.html
  logotype.md
  USAGE.md
```
Reinicia Claude Code. Verifica con `/skills` — debe aparecer `mediaudience-design`.

**En Claude.ai (web/desktop)** — Settings → Capabilities → Skills → *Upload skill* y sube el zip.

**En un proyecto de diseño** — sube la carpeta al proyecto; el agente la lee sola cuando el trabajo es de Mediaudience.

## 2. Invocarlo

No hace falta nombrarlo: se activa cuando pides algo de Mediaudience. Igual, puedes forzarlo:

> Usa el skill mediaudience-design y armá el dashboard de campaña para Cliente X.

## 3. Qué pedir (y qué datos dar)

El skill construye mejor si le das estos cuatro datos:

1. **Cliente** — nombre tal como debe aparecer en el topbar.
2. **Canales** — CTV, Mobile Push, Programmatic, In-Game, Retail Media.
3. **KPIs y el KPI héroe** — cuál es el número por el que ese cliente juzga la campaña (ese va en cian).
4. **Tipo de vista** — consola en vivo o reporte mensual cerrado.

Ejemplos de pedidos que funcionan bien:

> Dashboard para Banco Pichincha: CTV + Programmatic, KPI héroe VTR, vista de reporte mensual octubre.

> Agrega una pestaña de Audiencias al console de Cliente X con desglose por segmento y edad.

> Pasá este dashboard a reporte imprimible para enviar al cliente.

> Necesito una slide de resultados con los KPIs de este dashboard, en marca.

## 4. Cómo trabajar con el resultado

- El punto de partida siempre es `dashboard-reference.html`: se copia y se cambian cliente, nav, KPIs, datos. **No se rediseña el shell** — el chrome (topbar, sidebar, KPI row, chart, tabla) es la marca.
- Para código de producción: copia `tokens.css` al proyecto y usa las variables (`var(--mau-signal)`, `var(--mau-surf)`…), nunca hex sueltos.
- Los datos del reference son de muestra. Si tienes datos reales (CSV/export de la plataforma), adjúntalos y pide que los cargue.

## 5. Reglas que el skill va a defender

Si pides algo que las rompe, te lo va a advertir:
- Fondo oscuro siempre (`#0A0E17`). No hay tema claro para dashboards.
- El cian es señal, no decoración: máximo 10% de la pantalla, un solo KPI en cian por fila.
- Labels en JetBrains Mono, MAYÚSCULAS, con tracking. Cifras en Space Grotesk. Prosa en IBM Plex Sans.
- Radio 6px (12px solo en el marco exterior). Sin sombras entre cards. Sin emoji, sin Title Case, sin signos de exclamación.
- El logotipo es `medi{a}udience` con la `a` en acento — nunca rotado, re-trackeado, en degradado ni en otra tipografía.

## 6. Pendientes conocidos

- Las tipografías se cargan desde Google Fonts. Para producción, auto-hospedarlas y cambiar el `@import` de `tokens.css` por reglas `@font-face`.
- No hay assets vectoriales del logo: el logotipo se compone en tipografía viva y el isotipo Beacon en CSS. Si consigues los SVG, ponlos en `assets/` y actualiza `logotype.md`.
- Iconos: se usa Lucide vía CDN (`stroke-width: 1.5`) como sustituto — no es un set propio de la marca.
