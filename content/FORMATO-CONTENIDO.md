# Formato de contenido — guía

Cada página del sitio es un `.md` con front matter YAML + body estructurado. El front matter espeja los campos de `sitemap.json` (no dupliques lógica, solo copy).

## Por qué esta estructura (no es Markdown genérico)

La Arquitectura GEO/AEO exige contenido **extraíble**: un motor de IA (o buscador) debe poder citar una frase sin ambigüedad, y los datos duros deben ser localizables sin tener que interpretar párrafos de marketing. Por eso el body sigue convenciones fijas, no prosa libre:

- **Respuesta directa arriba** — lo primero que aparece responde la pregunta implícita de la página, en 1-2 frases, sin rodeos.
- **Datos en bloques separados** (`## Datos clave`), no mezclados dentro de párrafos — así Claude Code puede mapearlos a un componente de stats/cifras destacadas, y un motor puede citarlos sueltos.
- **Headers = componentes**. Cada `##` se vuelve una sección/componente predecible en el código. No inventes headers nuevos por página; usa el set fijo de abajo.
- **FAQ al final cuando aplica** — formato pregunta/respuesta directo, sin relleno, porque alimenta tanto `FAQPage` schema como las consultas de AEO.

## Plantilla estándar

```markdown
---
slug: "/soluciones/connected-tv/"
title: "Connected TV"
metaDescription: ""
status: "ready"          # debe coincidir con sitemap.json
blockedBy: []              # lista de D-XX si status = blocked/partial
schemaType: "Service"      # Organization | Service | FAQPage | etc. — según corresponda
lastUpdated: "2026-08-26"
---

## Respuesta directa

[1-2 frases que responden la pregunta implícita de la página. Esto es lo que un motor cita primero. Sin adjetivos vacíos — solo el hecho.]

## Datos clave

- [Cifra o hecho verificable, con unidad y contexto — ej. "3.5M usuarios únicos en CTV"]
- [Otro dato duro]
- [Otro dato duro]

## Desarrollo

[Cuerpo explicativo normal — aquí sí cabe prosa de marketing/contexto, pero cada afirmación factual sigue debiendo existir en el fact-book.]

## Prueba / caso relacionado

[Opcional. Enlace a /casos/xxx/ si aplica, con el anchor descriptivo — nunca "clic aquí".]

## FAQ

**[Pregunta tal como la haría un comprador]**
[Respuesta directa, 1-3 frases.]

**[Otra pregunta]**
[Respuesta directa.]

## CTA de cierre

[Texto del llamado a la acción] → [destino]
```

## Reglas de contenido (heredadas del fact-book)

- Toda cifra o claim factual debe existir en el fact-book. Si no está, no se escribe — se deja el bloque vacío y `status: blocked` en el front matter.
- Marca siempre como **"Mediaudience"**, una sola palabra. Nunca "Media Audience".
- Nunca "+20 años" ni antigüedad relativa sin año base (ver Arquitectura §1.5).
- Anchors de enlaces internos: descriptivos con marca + tema, nunca "clic aquí".

## Headers permitidos (no inventar otros)

`## Respuesta directa` · `## Datos clave` · `## Desarrollo` · `## Prueba / caso relacionado` · `## FAQ` · `## CTA de cierre`

Si una página no necesita alguna sección (ej. una página local sin FAQ), simplemente se omite — no se deja vacía con el header puesto.
