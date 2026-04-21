import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('线路选择器默认展示新的线路说明文案', () => {
  const source = fs.readFileSync(new URL('./ThreadSelector.tsx', import.meta.url), 'utf8');

  assert.match(source, /description: 'yunwu-API'/);
  assert.match(source, /description: '糖果-API'/);
  assert.match(source, /description: '向量-API'/);
});
