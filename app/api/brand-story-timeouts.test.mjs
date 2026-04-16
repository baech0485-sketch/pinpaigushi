import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('品牌故事文案接口超时配置符合 Vercel Hobby 300 秒限制', () => {
  const source = fs.readFileSync(new URL('./generate-text/route.ts', import.meta.url), 'utf8');
  assert.match(source, /export const maxDuration = 300;/);
  assert.match(source, /AbortSignal\.timeout\(290000\)/);
});

test('品牌故事图片接口超时配置符合 Vercel Hobby 300 秒限制', () => {
  const source = fs.readFileSync(new URL('./generate-images/route.ts', import.meta.url), 'utf8');
  assert.match(source, /export const maxDuration = 300;/);
  assert.match(source, /AbortSignal\.timeout\(290000\)/);
});
