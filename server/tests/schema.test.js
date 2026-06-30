import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('progress report stage uses a varchar column to avoid charset-sensitive enum mismatches', () => {
  const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');

  assert.match(schema, /stage\s+VARCHAR\(32\)\s+NOT\s+NULL/i);
  assert.doesNotMatch(schema, /stage\s+ENUM/i);
});
