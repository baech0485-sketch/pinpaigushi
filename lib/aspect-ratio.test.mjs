import test from 'node:test';
import assert from 'node:assert/strict';

import { toCssAspectRatio } from './aspect-ratio.ts';

test('品牌故事图片比例会转换为 CSS 可用格式', () => {
  assert.equal(toCssAspectRatio('3:2'), '3 / 2');
  assert.equal(toCssAspectRatio('16:9'), '16 / 9');
  assert.equal(toCssAspectRatio('4:3'), '4 / 3');
});

test('已经是 CSS 格式的比例保持不变', () => {
  assert.equal(toCssAspectRatio('1 / 1'), '1 / 1');
});
