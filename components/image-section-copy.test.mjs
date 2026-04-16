import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('视觉资产区域包含少图可复用的红字提示', () => {
  const source = fs.readFileSync(new URL('./ImageSection.tsx', import.meta.url), 'utf8');

  assert.match(source, /少量图片未生成也没关系/);
  assert.match(source, /可直接复用已生成图片替换缺失位置/);
  assert.match(source, /text-\[#d92d20\]/);
});
