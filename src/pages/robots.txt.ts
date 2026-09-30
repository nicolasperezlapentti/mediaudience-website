import type { APIRoute } from 'astro';
import { robotsTxt } from '../lib/fase0.ts';

export const GET: APIRoute = () => new Response(robotsTxt(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
