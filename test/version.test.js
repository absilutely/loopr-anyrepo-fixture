import { test } from 'node:test';
import assert from 'node:assert/strict';
import { version } from '../server.js';

test('version returns correct structure', () => {
  const v = version();
  assert.ok(v.version);
  assert.ok(v.name);
  assert.strictEqual(v.name, 'anyrepo-fixture');
});

test('version matches package.json', async () => {
  const { readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const { dirname, join } = await import('node:path');

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));
  const v = version();

  assert.strictEqual(v.version, packageJson.version);
  assert.strictEqual(v.name, packageJson.name);
});
