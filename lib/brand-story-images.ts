import type { BrandCopy } from '@/lib/brand-story-types';

export interface BrandStoryImageData {
  index: number;
  aspectRatio: string;
  imageUrl: string;
  mimeType: string;
  storageType?: 'oss' | 'inline';
}

interface ImageConfig {
  aspectRatio: string;
  name: string;
  getPrompt: (copy: BrandCopy) => string;
}

interface GeminiImagePart {
  inlineData?: {
    data?: string;
    mimeType?: string;
  };
}

interface GeminiImageResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiImagePart[];
    };
  }>;
}

export const BRAND_STORY_IMAGE_CONFIGS: ImageConfig[] = [
  {
    aspectRatio: '3:2',
    name: '主文案配图',
    getPrompt: (copy) => `${copy.mainSlogan} ${copy.subSlogan}`,
  },
  {
    aspectRatio: '16:9',
    name: '品牌特色配图',
    getPrompt: (copy) => `${copy.featureTitle} ${copy.featureContent}`,
  },
  {
    aspectRatio: '4:3',
    name: '细节1配图',
    getPrompt: (copy) => copy.details[0]?.content || '',
  },
  {
    aspectRatio: '4:3',
    name: '细节2配图',
    getPrompt: (copy) => copy.details[1]?.content || '',
  },
  {
    aspectRatio: '4:3',
    name: '细节3配图',
    getPrompt: (copy) => copy.details[2]?.content || '',
  },
];

export function buildBrandStoryImagePrompt(
  storeName: string,
  category: string,
  promptContent: string
): string {
  return `为${storeName}（${category}店铺）生成一张纯美食图片。
要求：
1. 只展示美食，不要任何文字、logo或水印
2. 高清、精美、有食欲感
3. 图片内容与以下描述相关：${promptContent}`;
}

export function buildBrandStoryImageRequest(prompt: string, aspectRatio: string) {
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

export function extractInlineImageData(response: GeminiImageResponse): {
  base64: string;
  mimeType: string;
} {
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
