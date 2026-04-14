import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildBrandStoryImageObjectKey,
  buildInlineImageUrl,
  storeBrandStoryImage,
} from './brand-story-image-storage.ts';

test('品牌故事图片对象路径带 generated 日期目录', () => {
  const objectKey = buildBrandStoryImageObjectKey(
    'story.png',
    new Date('2026-04-14T08:00:00.000Z'),
    'fixed-id'
  );

  assert.equal(objectKey, 'generated/2026-04-14/fixed-id.png');
});

test('内联图片地址会补齐 data URL 前缀', () => {
  const imageUrl = buildInlineImageUrl('abc123', 'image/png');

  assert.equal(imageUrl, 'data:image/png;base64,abc123');
});

test('未配置 OSS 时品牌故事图片回退为 data URL', async () => {
  delete process.env.ALI_OSS_REGION;
  delete process.env.ALI_OSS_ACCESS_KEY_ID;
  delete process.env.ALI_OSS_ACCESS_KEY_SECRET;
  delete process.env.ALI_OSS_BUCKET;
  delete process.env.ALI_OSS_CUSTOM_DOMAIN;

  const result = await storeBrandStoryImage({
    base64: 'abc123',
    mimeType: 'image/png',
    originalName: 'story.png',
  });

  assert.equal(result.storageType, 'inline');
  assert.equal(result.imageUrl, 'data:image/png;base64,abc123');
  assert.equal(result.objectKey, undefined);
});
