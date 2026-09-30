import { resolve } from 'node:path';

/**
 * Rutas del proyecto. Se resuelven desde el directorio de trabajo (el build y los scripts
 * corren desde la raíz), no desde import.meta.url: en el build, este módulo termina
 * empaquetado dentro de dist/ y la URL del módulo deja de apuntar a src/.
 *
 * MA_CONTENIDO permite construir contra otro árbol de contenido (fixtures de test).
 * MA_SRC permite correr los gates de plantilla contra otro árbol de código (tests).
 */
export const RAIZ = process.cwd();
export const CONTENIDO = resolve(RAIZ, process.env.MA_CONTENIDO ?? 'content');
export const PAGINAS = resolve(CONTENIDO, 'paginas');
export const SRC = resolve(RAIZ, process.env.MA_SRC ?? 'src');
