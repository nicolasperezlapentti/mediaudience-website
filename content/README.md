# Content

| Archivo | Qué es |
|---|---|
| `paginas/` | Un `.md` por página. La ruta del archivo es la URL canónica. |
| `sitemap.json` | Qué páginas existen, su status y la navegación (header y footer). Fuente de verdad. |
| `dudas.json` | Registro de dudas D-XX del fact-book §11 y su estado. Los gates leen de acá. |
| `entidad.json` | Datos del grafo JSON-LD de dos capas (marca-entidad + sociedades locales). |
| `sitemap.md` | Versión legible de `sitemap.json`, para revisión. |
| `FORMATO-CONTENIDO.md` | Cómo se escribe cada `.md`: front matter, secciones por plantilla, reglas. |

## Convención de nombres

`paginas/soluciones/mobile-push/premium-claro.md` → `/soluciones/mobile-push/premium-claro/`

`paginas/index.md` es la home; una página con hijos es `index.md` dentro de su carpeta.

## Cambiar el estado de una página o de una duda

- Publicar una página: escribir su `.md` y pasar su `status` a `ready` en `sitemap.json` **y** en el front matter.
- Cerrar una duda con el cliente: `"estado": "cerrada"` y `"cerradaEl"` en `dudas.json`. Las secciones que dependían de ella empiezan a renderizarse en el siguiente build.
