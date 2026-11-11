import { test } from 'node:test';
import assert from 'node:assert';
import { sum } from '../lib/sum.js';

test('sum(2, 2) should equal 4', () => {
  assert.strictEqual(sum(2, 2), 4);
});
