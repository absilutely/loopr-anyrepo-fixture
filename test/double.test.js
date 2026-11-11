import { test } from 'node:test';
import assert from 'node:assert';
import { double } from '../lib/double.js';

test('double(5) should equal 10', () => {
  assert.strictEqual(double(5), 10);
});
