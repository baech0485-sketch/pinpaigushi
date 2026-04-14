import type { BrandStoryThreadRuntimeConfig } from '@/lib/brand-story-threads';

interface OpenAiTextMessage {
  role: 'system' | 'user';
  content: string;
}

interface OpenAiTextResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
}

interface OpenAiImageContentItem {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

interface OpenAiImageResponse {
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
  choices?: Array<{
    message?: {
      content?: string | OpenAiImageContentItem[];
    };
  }>;
}

interface BrandStoryApiRequestConfig {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

interface GeminiTextPart {
  text?: string;
  thought?: boolean;
}

interface GeminiTextResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiTextPart[];
    };
  }>;
}

interface GeminiImageResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: {
          data?: string;
          mimeType?: string;
        };
      }>;
    };
  }>;
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

function buildGeminiTextRequest(storeName: string, category: string, systemPrompt: string) {
  return {
    contents: [
      {
        role: 'user',
        parts: [{ text: `店铺名：${storeName}\n经营品类：${category}` }],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature: 0.8,
    },
  };
}

function extractGeminiTextResponse(response: GeminiTextResponse): string {
  const parts = response.candidates?.[0]?.content?.parts;

  if (!parts || parts.length === 0) {
    throw new Error('AI 生成失败，请重试');
  }

  const responsePart = parts.find((part) => !part.thought && part.text) || parts[parts.length - 1];
  const generatedText = responsePart?.text?.trim();

  if (!generatedText) {
    throw new Error('AI 返回空内容');
  }

  return generatedText;
}

function buildGeminiImageRequest(prompt: string, aspectRatio: string) {
  return {
    contents: [{
      role: 'user',
      parts: [{ text: prompt }],
    }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
      imageConfig: {
        aspectRatio,
      },
    },
  };
}

function extractGeminiImageResponse(response: GeminiImageResponse) {
  const parts = response.candidates?.[0]?.content?.parts || [];
  const inlineData = parts.find((part) => part.inlineData?.data)?.inlineData;

  if (!inlineData?.data) {
    throw new Error('未能从响应中提取图片数据');
  }

  return {
    base64: inlineData.data,
    mimeType: inlineData.mimeType || 'image/png',
  };
}

export function buildBrandStoryTextApiRequest(
  config: BrandStoryThreadRuntimeConfig,
  storeName: string,
  category: string,
  systemPrompt: string
): BrandStoryApiRequestConfig {
  if (config.protocol === 'openai') {
    const messages: OpenAiTextMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `店铺名：${storeName}\n经营品类：${category}` },
    ];

    return {
      url: buildOpenAiChatCompletionsUrl(config.baseUrl),
      headers: {
        Authorization: `Bearer ${config.textApiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        model: config.textModel,
        messages,
        temperature: 0.8,
      },
    };
  }

  return {
    url: buildGeminiGenerateContentUrl(
      config.baseUrl,
      config.textModel,
      config.textApiKey
    ),
    headers: {
      'Content-Type': 'application/json',
    },
    body: buildGeminiTextRequest(storeName, category, systemPrompt),
  };
}

export function extractBrandStoryTextFromResponse(
  config: BrandStoryThreadRuntimeConfig,
  responseJson: unknown
): string {
  if (config.protocol === 'openai') {
    const rawContent = (responseJson as OpenAiTextResponse).choices?.[0]?.message?.content;

    if (typeof rawContent === 'string' && rawContent.trim()) {
      return rawContent.trim();
    }

    if (Array.isArray(rawContent)) {
      const text = rawContent
        .filter((item) => item.type === 'text' && item.text)
        .map((item) => item.text)
        .join('\n')
        .trim();

      if (text) {
        return text;
      }
    }

    throw new Error('AI 返回空内容');
  }

  return extractGeminiTextResponse(responseJson as GeminiTextResponse);
}

export function buildBrandStoryImageApiRequest(
  config: BrandStoryThreadRuntimeConfig,
  prompt: string,
  aspectRatio: string
): BrandStoryApiRequestConfig {
  if (config.protocol === 'openai') {
    return {
      url: buildOpenAiChatCompletionsUrl(config.baseUrl),
      headers: {
        Authorization: `Bearer ${config.imageApiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        model: config.imageModel,
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: prompt }],
          },
        ],
        max_tokens: 4096,
        temperature: 0.7,
      },
    };
  }

  return {
    url: buildGeminiGenerateContentUrl(
      config.baseUrl,
      config.imageModel,
      config.imageApiKey
    ),
    headers: {
      'Content-Type': 'application/json',
    },
    body: buildGeminiImageRequest(prompt, aspectRatio),
  };
}

export async function extractBrandStoryImageFromResponse(
  config: BrandStoryThreadRuntimeConfig,
  responseJson: unknown
): Promise<{ base64: string; mimeType: string }> {
  if (config.protocol !== 'openai') {
    return extractGeminiImageResponse(responseJson as GeminiImageResponse);
  }

  const response = responseJson as OpenAiImageResponse;

  const directData = response.data?.find((item) => item.b64_json || item.url);
  if (directData?.b64_json) {
    return {
      base64: directData.b64_json,
      mimeType: 'image/png',
    };
  }

  if (directData?.url) {
    return fetchImageAsBase64(directData.url);
  }

  const rawContent = response.choices?.[0]?.message?.content;
  if (typeof rawContent === 'string') {
    const dataUrlMatch = rawContent.match(/data:(image\/[^;]+);base64,([A-Za-z0-9+/=]+)/);
    if (dataUrlMatch) {
      return {
        mimeType: dataUrlMatch[1],
        base64: dataUrlMatch[2],
      };
    }

    const urlMatch = rawContent.match(/https?:\/\/[^\s)]+/);
    if (urlMatch?.[0]) {
      return fetchImageAsBase64(urlMatch[0]);
    }
  }

  if (Array.isArray(rawContent)) {
    const imageUrl = rawContent.find((item) => item.image_url?.url)?.image_url?.url;
    if (imageUrl) {
      if (imageUrl.startsWith('data:')) {
        const [meta, base64] = imageUrl.split(',');
        const mimeType = meta.match(/data:([^;]+);base64/)?.[1] || 'image/png';
        return { mimeType, base64 };
      }

      return fetchImageAsBase64(imageUrl);
    }

    const textContent = rawContent
      .filter((item) => item.type === 'text' && typeof item.text === 'string')
      .map((item) => item.text)
      .join('\n');
    const dataUrlMatch = textContent.match(/data:(image\/[^;]+);base64,([A-Za-z0-9+/=]+)/);
    if (dataUrlMatch) {
      return {
        mimeType: dataUrlMatch[1],
        base64: dataUrlMatch[2],
      };
    }
  }

  throw new Error('未能从 OpenAI 兼容响应中提取图片数据');
}

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`下载图片失败: ${response.status}`);
  }

  const mimeType = response.headers.get('content-type') || 'image/png';
  const arrayBuffer = await response.arrayBuffer();

  return {
    mimeType,
    base64: Buffer.from(arrayBuffer).toString('base64'),
  };
}
