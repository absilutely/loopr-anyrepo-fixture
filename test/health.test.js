import { test } from 'node:test';
import assert from 'node:assert/strict';
import { health } from '../server.js';

test('health names missing keys', async () => {
  delete process.env.FIXTURE_API_KEY;
  const h = await health();
  assert.ok(h.missing.includes('FIXTURE_API_KEY'));
});
