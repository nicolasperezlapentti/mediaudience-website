# Sitemap — Mediaudience

Fuente: `Arquitectura-GEO-AEO-Mediaudience-v2.md`, alineada al Fact-Book v1.2 (5-ago-2026).
Este documento es la versión legible del `sitemap.json` (fuente de verdad que consume Claude Code). Se regenera desde el JSON — no editar directamente contenido estructural aquí, solo para revisión/aprobación.

`[P]` pilar · `[C]` clúster · `[L]` nodo local · ✅ listo para publicar · 🟡 parcial · ⛔ bloqueado

```
/                                          [P] Home ✅
│
├── /nosotros/                             [P] Marca-entidad ✅
│   └── /nosotros/socios/                  [C] Socios del grupo ⛔ D-18
│
├── /soluciones/                           [P] Hub de soluciones ✅
│   ├── /soluciones/connected-tv/          [P] Connected TV ✅
│   ├── /soluciones/mobile-push/           [P] Hub Mobile Push ✅
│   │   ├── premium-claro/                 [C] Push Premium Claro ✅
│   │   ├── premium-video/                 [C] Push Premium Video ✅
│   │   └── programatico/                  [C] Push Programático ✅
│   ├── /soluciones/programmatic/          [P] Programmatic (DV360) ✅
│   ├── /soluciones/one-by-sqreem/         [P] ONE by SQREEM ⛔ D-16
│   ├── /soluciones/retargeting-ctv-mobile/[C] Retargeting cruzado ✅
│   └── /soluciones/mobile-gaming/         ⛔ D-07 — no construible
│
├── /partners/siprocal/                    [C] Siprocal 🟡 D-15
│
├── /casos/                                [P] Hub de casos ⛔ D-13 (todos bloqueados)
│   └── raspaditas · tia · movistar · disney · directv · citymall ·
│       chevrolet · scotiabank · bet593 · la-ganga · apuesta-total
│
├── /recursos/                             [P] Hub editorial ✅
│   ├── que-es-ctv/                        [C] ✅
│   ├── que-es-push/                       [C] ✅
│   ├── publicidad-sin-cookies/            [C] ✅
│   ├── inteligencia-de-audiencias-ia/     [C] 🟡 D-16
│   ├── publicidad-programatica-peru/      [P] ✅
│   ├── publicidad-programatica-ecuador/   [P] ✅
│   ├── glosario-adtech/                   [C] ✅
│   └── comparativas/                      [C] ✅
│       ├── ctv-ecuador/                   [C] ✅
│       └── ctv-peru/                      [C] ✅
│
├── /peru/                                 [L] ⛔ D-01, D-30
├── /mexico/                               [L] ⛔ D-29, D-30
├── /ecuador/                              [L] ✅ (única con datos completos)
├── /chile/                                [L] ⛔ D-29, D-30
│   (/colombia/ fuera del árbol → D-04)
│
├── /contacto/                             [C] ✅
└── /legal/privacidad/                     — utilitaria ✅
```

## Regla de publicación

Si un dato no está en el fact-book, no se publica. Las páginas marcadas ⛔ no se construyen hasta que la duda referenciada (D-XX) se resuelva con el cliente.

## Fases de ejecución

| Fase | Contenido |
|---|---|
| 0 | `robots.txt`, `sitemap.xml`, `llms.txt` — sin dependencias del cliente |
| 1 | Entidad: SSR/SSG, `/nosotros/`, grafo JSON-LD de dos capas, Wikidata |
| 1b | Sociedades locales (`/peru/`, `/mexico/`, `/ecuador/`, `/chile/`) — hoy solo Ecuador cumple |
| 2 | Pilares de solución, `/partners/siprocal/`, casos (al liberar D-13) |
| 3 | `/recursos/` y señales de autoridad de terceros |
