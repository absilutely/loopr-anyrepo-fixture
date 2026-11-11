import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import { createHmac, timingSafeEqual } from 'node:crypto';

const port = Number(process.env.PORT || 3000);
const required = ['FIXTURE_API_KEY', 'FIXTURE_WEBHOOK_SECRET', 'DATABASE_URL'];
// Made-up sign-in (anyrepo-previews): "Made-up ID" signs a short code with this made-up secret and sends the browser
// back to our callback; nothing real is involved.
const ID_URL = process.env.FIXTURE_ID_URL || 'http://id.localhost:5543';
const ID_SECRET = process.env.FIXTURE_ID_SECRET || 'made-up-id-secret-not-real';
const APP_URL = process.env.LOOPR_APP_URL || `http://localhost:${port}`;
const COPY = process.env.LOOPR_COPY || 'this computer';
const webhooks = [];

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

const sign = (body) => createHmac('sha256', ID_SECRET).update(body).digest('base64url');
function checkCode(code) {
  const [body, sig] = String(code || '').split('.');
  if (!body || !sig) return null;
  const want = Buffer.from(sign(body)), got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  const { user, exp } = JSON.parse(Buffer.from(body, 'base64url').toString());
  return exp > Date.now() ? user : null;
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const cookieOf = (req, name) => (req.headers.cookie || '').split(';').map((c) => c.trim()).find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1);

function home(req) {
  const user = cookieOf(req, 'fx_user');
  const last = webhooks[webhooks.length - 1];
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fixture app</title>
<body style="font:16px/1.5 system-ui,sans-serif;max-width:560px;margin:40px auto;padding:0 16px">
<h1>Fixture app</h1>
<p>Served by copy <b id="copy">${esc(COPY)}</b>.</p>
<p id="who">${user ? `Signed in as <b>${esc(decodeURIComponent(user))}</b> with Made-up ID.` : 'Not signed in.'}</p>
<p><a id="login" href="/login">Sign in with Made-up ID</a></p>
<p id="hooks">Webhooks received by this copy: <b>${webhooks.length}</b>${last ? ` (last: ${esc(last.type)} at ${esc(last.at)})` : ''}</p>
<p style="color:#666;font-size:13px">Callback address: ${esc(APP_URL)}/auth/callback</p>`;
}

if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/health') {
      res.setHeader('content-type', 'application/json');
      return res.end(JSON.stringify(await health()));
    }
    if (url.pathname === '/login') {
      const q = new URLSearchParams({ client_id: 'fixture', redirect_uri: `${APP_URL}/auth/callback`, state: COPY });
      res.writeHead(302, { location: `${ID_URL}/authorize?${q}` });
      return res.end();
    }
    if (url.pathname === '/auth/callback') {
      const user = checkCode(url.searchParams.get('code'));
      if (!user) { res.writeHead(400, { 'content-type': 'text/plain' }); return res.end('bad sign-in code'); }
      res.writeHead(302, { location: '/', 'set-cookie': `fx_user=${encodeURIComponent(user)}; Path=/; HttpOnly; SameSite=Lax` });
      return res.end();
    }
    if (url.pathname.startsWith('/webhooks/') && req.method === 'POST') {
      let body = '';
      req.on('data', (d) => { body += d; });
      req.on('end', () => {
        let type = 'unknown';
        try { type = JSON.parse(body).type || type; } catch {}
        webhooks.push({ type, at: new Date().toISOString().slice(11, 19), path: url.pathname });
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ received: true, copy: COPY, count: webhooks.length }));
      });
      return;
    }
    res.setHeader('content-type', 'text/html');
    if (url.pathname === '/') return res.end(home(req));
    res.end(fs.readFileSync(new URL('./web/index.html', import.meta.url)));
  }).listen(port, () => console.log(`fixture app on http://localhost:${port}`));
}
