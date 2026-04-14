import type {
  BrandStoryThreadAvailability,
  BrandStoryThreadId,
  BrandStoryThreadProtocol,
} from '@/lib/brand-story-types';

export interface BrandStoryThreadDefinition {
  id: BrandStoryThreadId;
  name: string;
  description: string;
  protocol: BrandStoryThreadProtocol;
  textModel: string;
  imageModel: string;
}

export interface BrandStoryThreadRuntimeConfig {
  id: BrandStoryThreadId;
  name: string;
  description: string;
  protocol: BrandStoryThreadProtocol;
  baseUrl: string;
  textApiKey: string;
  imageApiKey: string;
  textModel: string;
  imageModel: string;
}

export const BRAND_STORY_THREAD_DEFINITIONS: BrandStoryThreadDefinition[] = [
  {
    id: 'thread1',
    name: '线路1',
    description: '当前默认线路',
    protocol: 'gemini',
    textModel: 'gemini-3.1-flash-lite-preview',
    imageModel: 'gemini-2.5-flash-image',
  },
  {
    id: 'thread2',
    name: '线路2',
    description: 'AICohere OpenAI兼容线路',
    protocol: 'openai',
    textModel: 'gemini-3.1-flash-lite-preview',
    imageModel: 'gemini-2.5-flash-image',
  },
  {
    id: 'thread3',
    name: '线路3',
    description: 'VectorEngine Gemini线路',
    protocol: 'gemini',
    textModel: 'gemini-3.1-flash-lite-preview',
    imageModel: 'gemini-2.5-flash-image',
  },
];

const THREAD_MAP = Object.fromEntries(
  BRAND_STORY_THREAD_DEFINITIONS.map((thread) => [thread.id, thread])
) as Record<BrandStoryThreadId, BrandStoryThreadDefinition>;

export function getBrandStoryThread(threadId?: string): BrandStoryThreadDefinition {
  if (threadId === 'thread2' || threadId === 'thread3') {
    return THREAD_MAP[threadId];
  }

  return THREAD_MAP.thread1;
}

function getThreadRuntimeEnv(threadId: BrandStoryThreadId) {
  if (threadId === 'thread2') {
    return {
      baseUrl: process.env.BRAND_STORY_THREAD2_BASE_URL || 'https://newapi.aicohere.org/v1/chat/completions',
      textApiKey: process.env.BRAND_STORY_THREAD2_TEXT_API_KEY || '',
      imageApiKey: process.env.BRAND_STORY_THREAD2_IMAGE_API_KEY || '',
    };
  }

  if (threadId === 'thread3') {
    return {
      baseUrl: process.env.BRAND_STORY_THREAD3_BASE_URL || 'https://api.vectorengine.ai',
      textApiKey: process.env.BRAND_STORY_THREAD3_TEXT_API_KEY || '',
      imageApiKey: process.env.BRAND_STORY_THREAD3_IMAGE_API_KEY || '',
    };
  }

  return {
    baseUrl: process.env.BRAND_STORY_THREAD1_BASE_URL || process.env.API_BASE_URL || 'https://yunwu.ai',
    textApiKey: process.env.BRAND_STORY_THREAD1_TEXT_API_KEY || process.env.TEXT_API_KEY || '',
    imageApiKey: process.env.BRAND_STORY_THREAD1_IMAGE_API_KEY || process.env.IMAGE_API_KEY || '',
  };
}

export function resolveBrandStoryThreadRuntimeConfig(threadId?: string): BrandStoryThreadRuntimeConfig {
  const definition = getBrandStoryThread(threadId);
  const env = getThreadRuntimeEnv(definition.id);

  return {
    ...definition,
    ...env,
  };
}

export function buildGeminiGenerateContentUrl(baseUrl: string, model: string, apiKey: string): string {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, '');

  if (normalizedBaseUrl.includes('/v1beta/models/')) {
    return `${normalizedBaseUrl.replace(
      /\/v1beta\/models\/[^:]+:generateContent$/,
      `/v1beta/models/${model}:generateContent`
    )}?key=${encodeURIComponent(apiKey)}`;
  }

  return `${normalizedBaseUrl}/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

export function buildOpenAiChatCompletionsUrl(baseUrl: string): string {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, '');

  if (normalizedBaseUrl.endsWith('/chat/completions')) {
    return normalizedBaseUrl;
  }

  if (normalizedBaseUrl.endsWith('/v1')) {
    return `${normalizedBaseUrl}/chat/completions`;
  }

  return `${normalizedBaseUrl}/v1/chat/completions`;
}

export function getBrandStoryThreadAvailability(): BrandStoryThreadAvailability {
  return {
    thread1: toAvailabilityItem('thread1'),
    thread2: toAvailabilityItem('thread2'),
    thread3: toAvailabilityItem('thread3'),
  };
}

function toAvailabilityItem(threadId: BrandStoryThreadId) {
  const runtime = resolveBrandStoryThreadRuntimeConfig(threadId);

  return {
    available: Boolean(runtime.baseUrl && runtime.textApiKey && runtime.imageApiKey),
    name: runtime.name,
    description: runtime.description,
  };
}
