# Nombre del Proyecto

Estructura del repositorio para desarrollo del website con Claude Code.

## Estructura

```
/content/          → Contenido de páginas (exportado de Claude Chat)
/design/            → Tokens y referencias de diseño (exportado de Claude Design)
/.claude/skills/     → Skills disponibles para Claude Code durante el desarrollo
/src/                → Código fuente del sitio
```

## Flujo de trabajo

1. **Content** se redacta y aprueba en Claude Chat, luego se exporta aquí como `.md`.
2. **Design** se explora en Claude Design, los tokens/decisiones finales se exportan aquí.
3. **Skills** migrados desde Claude Chat o ya existentes en Claude Code viven en `.claude/skills/`.
4. **Claude Code** trabaja sobre este repo, consumiendo `content/` y `design/` como fuente de verdad, aplicando los skills disponibles, y genera el código en `src/`.

## Cómo actualizar contenido

Cuando el contenido cambie en Claude Chat, re-exporta el `.md` correspondiente a `content/` y haz commit — el historial de Git funciona como changelog.
