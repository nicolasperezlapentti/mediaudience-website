import type { APIRoute } from 'astro';
import { llmsTxt } from '../lib/fase0.ts';
import { cargarSitio } from '../lib/sitio.ts';

export const GET: APIRoute = () => new Response(llmsTxt(cargarSitio()), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
