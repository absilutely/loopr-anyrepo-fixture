import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';

const port = Number(process.env.PORT || 3000);
const required = ['FIXTURE_API_KEY', 'FIXTURE_WEBHOOK_SECRET', 'DATABASE_URL'];
const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

function reach(url) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const s = net.connect({ host: u.hostname, port: Number(u.port) }, () => { s.end(); resolve('ok'); });
      s.setTimeout(1500, () => { s.destroy(); resolve('timeout'); });
      s.on('error', (e) => resolve(e.code || 'error'));
    } catch { resolve('bad url'); }
  });
}

export async function health() {
  const missing = required.filter((k) => !process.env[k]);
  const db = process.env.DATABASE_URL ? await reach(process.env.DATABASE_URL) : 'not set';
  const redis = process.env.REDIS_URL ? await reach(process.env.REDIS_URL) : 'not set';
  return { ok: missing.length === 0 && db === 'ok', missing, db, redis };
}

if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  http.createServer(async (req, res) => {
    if (req.url === '/health') {
      res.setHeader('content-type', 'application/json');
      return res.end(JSON.stringify(await health()));
    }
    if (req.url === '/version') {
      res.setHeader('content-type', 'application/json');
      return res.end(JSON.stringify({ version: pkg.version }));
    }
    res.setHeader('content-type', 'text/html');
    res.end(fs.readFileSync(new URL('./web/index.html', import.meta.url)));
  }).listen(port, () => console.log(`fixture app on http://localhost:${port}`));
}
