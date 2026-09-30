import type { APIRoute } from 'astro';
import { sitemapXml } from '../lib/fase0.ts';
import { cargarSitio } from '../lib/sitio.ts';

export const GET: APIRoute = () =>
  new Response(sitemapXml(cargarSitio()), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
