import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { health } from '../server.js';
import fs from 'node:fs';

test('health names missing keys', async () => {
  delete process.env.FIXTURE_API_KEY;
  const h = await health();
  assert.ok(h.missing.includes('FIXTURE_API_KEY'));
});

test('version endpoint returns app version', async () => {
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));
  const server = http.createServer(async (req, res) => {
    if (req.url === '/version') {
      res.setHeader('content-type', 'application/json');
      return res.end(JSON.stringify({ version: pkg.version }));
    }
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const addr = server.address();

  try {
    const response = await new Promise((resolve, reject) => {
      const req = http.request(`http://localhost:${addr.port}/version`, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve(JSON.parse(data)));
      });
      req.on('error', reject);
      req.end();
    });
    assert.strictEqual(response.version, pkg.version);
  } finally {
    server.close();
  }
});
