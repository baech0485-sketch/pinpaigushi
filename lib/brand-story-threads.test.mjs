import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BRAND_STORY_THREAD_DEFINITIONS,
  buildGeminiGenerateContentUrl,
  getBrandStoryThread,
  getBrandStoryThreadAvailability,
} from './brand-story-threads.ts';

test('未知线路回退到线路1', () => {
  const thread = getBrandStoryThread('unknown');

  assert.equal(thread.id, 'thread1');
  assert.equal(thread.name, '线路1');
});

test('四条线路默认模型与参考项目一致', () => {
  assert.deepEqual(
    BRAND_STORY_THREAD_DEFINITIONS.map((thread) => ({
      id: thread.id,
      description: thread.description,
      textModel: thread.textModel,
      imageModel: thread.imageModel,
    })),
    [
      {
        id: 'thread1',
        description: 'yunwu-API',
        textModel: 'gemini-3-flash-preview',
        imageModel: 'gemini-2.5-flash-image',
      },
      {
        id: 'thread2',
        description: '糖果-API',
        textModel: 'gemini-3-flash-preview',
        imageModel: 'gemini-2.5-flash-image',
      },
      {
        id: 'thread3',
        description: '向量-API',
        textModel: 'gemini-3.1-flash-lite-preview',
        imageModel: 'gemini-3.1-flash-image-preview',
      },
      {
        id: 'thread4',
        description: '128API',
        textModel: 'gemini-3-flash-preview',
        imageModel: 'gemini-3.1-flash-image',
      },
    ]
  );
});

test('线路可用性会根据环境变量和兼容兜底正确返回', () => {
  process.env.TEXT_API_KEY = 'fallback-text-key';
  process.env.IMAGE_API_KEY = 'fallback-image-key';
  process.env.API_BASE_URL = 'https://yunwu.ai';
  delete process.env.BRAND_STORY_THREAD2_API_KEY;
  delete process.env.BRAND_STORY_THREAD3_API_KEY;
  delete process.env.BRAND_STORY_THREAD2_TEXT_API_KEY;
  delete process.env.BRAND_STORY_THREAD2_IMAGE_API_KEY;
  delete process.env.BRAND_STORY_THREAD3_TEXT_API_KEY;
  delete process.env.BRAND_STORY_THREAD3_IMAGE_API_KEY;
  process.env.NEW_PICTURE_WALL_128API_BASE_URL = 'https://128api.cn/v1';
  process.env.NEW_PICTURE_WALL_128API_KEY = 'thread4-shared-key';

  const availability = getBrandStoryThreadAvailability();

  assert.equal(availability.thread1.available, true);
  assert.equal(availability.thread2.available, false);
  assert.equal(availability.thread3.available, false);
  assert.equal(availability.thread4.available, true);
});

test('Gemini generateContent 地址会按模型替换并附带 key', () => {
  assert.equal(
    buildGeminiGenerateContentUrl(
      'https://yunwu.ai/v1beta/models/gemini-2.5-flash-image:generateContent',
      'gemini-3.1-flash-lite-preview',
      'demo-key'
    ),
    'https://yunwu.ai/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=demo-key'
  );
});
