// Servidor estático mínimo para mirar HTML local en el panel de vista previa.
// Uso: node .claude/servir-estatico.mjs <directorio> <puerto>
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
const [dir, puerto] = [resolve(process.argv[2]), Number(process.argv[3])];
const tipos = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
createServer((req, res) => {
  let f = join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!f.startsWith(dir) || !existsSync(f)) return res.writeHead(404).end('404');
  res.writeHead(200, { 'Content-Type': tipos[extname(f)] ?? 'application/octet-stream' }).end(readFileSync(f));
}).listen(puerto, '127.0.0.1', () => console.log(`http://127.0.0.1:${puerto}`));
