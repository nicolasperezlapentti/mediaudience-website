#!/usr/bin/env node
/**
 * Fase 0 sin esperar al build: escribe dist-fase0/robots.txt para subirlo hoy al hosting
 * actual, reemplazando el que autogenera el panel (Crawl-delay: 10, sin Sitemap).
 *
 * Por qué solo robots.txt: sitemap.xml y llms.txt listan las URLs canónicas nuevas
 * (/soluciones/connected-tv/, …), que el sitio actual no sirve. Publicarlos antes que el
 * sitio nuevo apunta a los crawlers a páginas inexistentes. Salen con el primer deploy de
 * dist/, que los genera desde sitemap.json.
 *
 * La línea Sitemap: del robots.txt ya apunta a /sitemap.xml: hasta el deploy devuelve 404,
 * que Search Console marca como error de lectura, sin efecto sobre el rastreo del resto.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { robotsTxt } from '../src/lib/fase0.ts';

mkdirSync('dist-fase0', { recursive: true });
writeFileSync('dist-fase0/robots.txt', robotsTxt());
console.log('✓ dist-fase0/robots.txt — subilo a la raíz del docroot del hosting actual.');
