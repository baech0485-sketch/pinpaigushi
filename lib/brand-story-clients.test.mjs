import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildOpenAiChatCompletionsUrl,
  buildBrandStoryImageApiRequest,
  buildBrandStoryTextApiRequest,
} from './brand-story-clients.ts';
import { resolveBrandStoryThreadRuntimeConfig } from './brand-story-threads.ts';

test('线路2默认走 AICohere 的 chat completions 地址', () => {
  delete process.env.BRAND_STORY_THREAD2_BASE_URL;
  delete process.env.BRAND_STORY_THREAD2_TEXT_API_KEY;
  delete process.env.BRAND_STORY_THREAD2_IMAGE_API_KEY;

  const thread2 = resolveBrandStoryThreadRuntimeConfig('thread2');

  assert.equal(thread2.baseUrl, 'https://newapi.aicohere.org/v1/chat/completions');
  assert.equal(thread2.protocol, 'openai');
});

test('线路3默认走 VectorEngine 的 Gemini 原生地址', () => {
  delete process.env.BRAND_STORY_THREAD3_BASE_URL;
  delete process.env.BRAND_STORY_THREAD3_TEXT_API_KEY;
  delete process.env.BRAND_STORY_THREAD3_IMAGE_API_KEY;

  const thread3 = resolveBrandStoryThreadRuntimeConfig('thread3');

  assert.equal(thread3.baseUrl, 'https://api.vectorengine.ai');
  assert.equal(thread3.protocol, 'gemini');
});

test('OpenAI 兼容地址会规范到 /v1/chat/completions', () => {
  assert.equal(
    buildOpenAiChatCompletionsUrl('https://newapi.aicohere.org'),
    'https://newapi.aicohere.org/v1/chat/completions'
  );
  assert.equal(
    buildOpenAiChatCompletionsUrl('https://newapi.aicohere.org/v1'),
    'https://newapi.aicohere.org/v1/chat/completions'
  );
  assert.equal(
    buildOpenAiChatCompletionsUrl('https://newapi.aicohere.org/v1/chat/completions'),
    'https://newapi.aicohere.org/v1/chat/completions'
  );
});

test('线路2文案请求使用 OpenAI 兼容格式', () => {
  const request = buildBrandStoryTextApiRequest(
    {
      id: 'thread2',
      name: '线路2',
      description: 'AICohere',
      protocol: 'openai',
      baseUrl: 'https://newapi.aicohere.org',
      textApiKey: 'demo-text-key',
      imageApiKey: 'demo-image-key',
      textModel: 'gemini-3.1-flash-lite-preview',
      imageModel: 'gemini-2.5-flash-image',
    },
    '测试店铺',
    '汉堡',
    '系统提示'
  );

  assert.equal(request.url, 'https://newapi.aicohere.org/v1/chat/completions');
  assert.equal(request.headers.Authorization, 'Bearer demo-text-key');
  assert.equal(request.body.model, 'gemini-3.1-flash-lite-preview');
  assert.equal(request.body.messages[0].role, 'system');
  assert.equal(request.body.messages[1].role, 'user');
});

test('线路3图片请求使用 Gemini 原生格式', () => {
  const request = buildBrandStoryImageApiRequest(
    {
      id: 'thread3',
      name: '线路3',
      description: 'vectorengine',
      protocol: 'gemini',
      baseUrl: 'https://api.vectorengine.ai',
      textApiKey: 'demo-text-key',
      imageApiKey: 'demo-image-key',
      textModel: 'gemini-3.1-flash-lite-preview',
      imageModel: 'gemini-2.5-flash-image',
    },
    '测试图片提示词',
    '4:3'
  );

  assert.equal(
    request.url,
    'https://api.vectorengine.ai/v1beta/models/gemini-2.5-flash-image:generateContent?key=demo-image-key'
  );
  assert.equal(request.headers['Content-Type'], 'application/json');
  assert.deepEqual(request.body.contents[0].parts, [{ text: '测试图片提示词' }]);
});
