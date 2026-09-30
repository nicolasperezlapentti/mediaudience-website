/**
 * Fase 0 técnica (Arquitectura §6, D-26): robots.txt, sitemap.xml y llms.txt.
 * Funciones puras: las usan los endpoints de src/pages/ y scripts/fase0.ts.
 */
import { MARCA, SITIO } from './marca.ts';
import type { IdPlantilla } from './plantillas.ts';
import type { PaginaPublicada, Sitio } from './sitio.ts';

/** Crawlers de IA que se permiten explícitamente (Arquitectura §6). */
export const BOTS_IA = ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'anthropic-ai', 'PerplexityBot', 'Google-Extended', 'CCBot'] as const;
export const BOTS_BUSCADORES = ['Googlebot', 'Bingbot', 'DuckDuckBot', 'Applebot', 'YandexBot'] as const;

/**
 * Reemplaza al robots.txt autogenerado por el panel de hosting: sin Crawl-delay (frenaba a
 * todos los crawlers), con línea Sitemap y con permiso explícito para cada bot.
 */
export function robotsTxt(): string {
  const grupo = (agente: string) => `User-agent: ${agente}\nAllow: /\n`;
  return [
    `# robots.txt · ${MARCA}`,
    '# Generado en el build desde src/lib/fase0.ts. No editar en el servidor.',
    '',
    '# Buscadores',
    ...BOTS_BUSCADORES.map(grupo),
    '# Sistemas de IA',
    ...BOTS_IA.map(grupo),
    '# Resto',
    grupo('*'),
    `Sitemap: ${SITIO}/sitemap.xml`,
    '',
  ].join('\n');
}

const escaparXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Solo páginas ready. lastmod = lastUpdated del front matter: la fecha editorial declarada. */
export function sitemapXml(sitio: Sitio): string {
  const urls = [...sitio.publicadas.values()].map((p) => {
    const lastmod = (p.frontmatter as { lastUpdated: string }).lastUpdated;
    return `  <url>\n    <loc>${escaparXml(`${SITIO}${p.ruta}`)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

/** Grupo de llms.txt según la plantilla (esqueleto de Arquitectura §6). */
function grupoLlms(p: PaginaPublicada): string | null {
  const porPlantilla: Partial<Record<IdPlantilla, string>> = {
    T1: 'Entidad',
    T2: 'Soluciones',
    'T2-hub': 'Soluciones',
    T3: 'Operaciones locales',
    T4: 'Recursos citables',
    'T4-glosario': 'Recursos citables',
    T5: 'Casos',
  };
  if (p.plantilla === 'T6') {
    if (p.ruta.startsWith('/soluciones/')) return 'Soluciones';
    if (p.ruta.startsWith('/recursos/')) return 'Recursos citables';
    if (p.ruta.startsWith('/casos/')) return 'Casos';
    return null;
  }
  if (p.ruta.startsWith('/partners/')) return 'Entidad';
  return porPlantilla[p.plantilla] ?? null;
}

const ORDEN_LLMS = ['Entidad', 'Soluciones', 'Operaciones locales', 'Recursos citables', 'Casos'];

/** Solo páginas ready. Formato de llmstxt.org: `- [Título](url): descripción`. */
export function llmsTxt(sitio: Sitio): string {
  const grupos = new Map<string, PaginaPublicada[]>(ORDEN_LLMS.map((g) => [g, []]));
  for (const p of sitio.publicadas.values()) {
    const g = grupoLlms(p);
    if (g) grupos.get(g)!.push(p);
  }
  const lineas = [`# ${MARCA}`, '', `> ${sitio.entidad.llms.resumen}`, ''];
  for (const [nombre, paginas] of grupos) {
    if (!paginas.length) continue;
    lineas.push(`## ${nombre}`, '');
    for (const p of paginas) {
      const fm = p.frontmatter as { title: string; metaDescription: string };
      lineas.push(`- [${fm.title}](${SITIO}${p.ruta}): ${fm.metaDescription}`);
    }
    lineas.push('');
  }
  return lineas.join('\n');
}
