import { NextRequest, NextResponse } from 'next/server';
import {
  BRAND_STORY_IMAGE_CONFIGS,
  buildBrandStoryImagePrompt,
} from '@/lib/brand-story-images';
import {
  resolveBrandStoryThreadRuntimeConfig,
} from '@/lib/brand-story-threads';
import type { BrandCopy } from '@/lib/brand-story-types';
import {
  buildBrandStoryImageApiRequest,
  extractBrandStoryImageFromResponse,
} from '@/lib/brand-story-clients';
import { storeBrandStoryImage } from '@/lib/brand-story-image-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface ImageRequest {
  storeName: string;
  category: string;
  threadId?: string;
  brandCopy: BrandCopy;
}

interface ImageData {
  index: number;
  aspectRatio: string;
  imageUrl: string;
  mimeType: string;
  storageType: 'oss' | 'inline';
}

interface ImageError {
  index: number;
  error: string;
}

async function generateSingleImage(
  requestConfig: ReturnType<typeof buildBrandStoryImageApiRequest>,
  threadConfig: ReturnType<typeof resolveBrandStoryThreadRuntimeConfig>
): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(requestConfig.url, {
    method: 'POST',
    headers: requestConfig.headers,
    body: JSON.stringify(requestConfig.body),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API 请求失败: ${response.status} - ${errorText}`);
  }

  return extractBrandStoryImageFromResponse(threadConfig, await response.json());
}

function resolveGeneratedImageName(index: number, mimeType: string): string {
  const subtype = mimeType.split('/')[1] || 'png';
  const extension = subtype === 'jpeg' ? 'jpg' : subtype;
  return `brand-story-${index}.${extension}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: ImageRequest = await request.json();
    const { storeName, category, brandCopy, threadId } = body;

    if (!storeName || !category || !brandCopy) {
      return NextResponse.json(
        { error: '缺少必需字段: storeName, category, brandCopy' },
        { status: 400 }
      );
    }

    const threadConfig = resolveBrandStoryThreadRuntimeConfig(threadId);
    if (!threadConfig.imageApiKey) {
      return NextResponse.json(
        { error: `${threadConfig.name} 未配置图片密钥` },
        { status: 500 }
      );
    }

    const images: ImageData[] = [];
    const errors: ImageError[] = [];

    for (let i = 0; i < BRAND_STORY_IMAGE_CONFIGS.length; i++) {
      const config = BRAND_STORY_IMAGE_CONFIGS[i];
      const index = i + 1;

      try {
        console.log(`开始生成第 ${index} 张图片: ${config.name}`);
        
        const promptContent = config.getPrompt(brandCopy);
        const requestConfig = buildBrandStoryImageApiRequest(
          threadConfig,
          buildBrandStoryImagePrompt(storeName, category, promptContent),
          config.aspectRatio
        );
        const { base64, mimeType } = await generateSingleImage(
          requestConfig,
          threadConfig
        );
        const storedImage = await storeBrandStoryImage({
          base64,
          mimeType,
          originalName: resolveGeneratedImageName(index, mimeType),
        });

        images.push({
          index,
          aspectRatio: config.aspectRatio,
          imageUrl: storedImage.imageUrl,
          mimeType,
          storageType: storedImage.storageType,
        });

        console.log(`第 ${index} 张图片生成成功`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        console.error(`第 ${index} 张图片生成失败:`, errorMessage);
        
        errors.push({
          index,
          error: errorMessage,
        });
      }
    }

    return NextResponse.json({
      images,
      ...(errors.length > 0 && { errors }),
    });

  } catch (error) {
    console.error('图片生成 API 错误:', error);
    return NextResponse.json(
      { 
        error: '图片生成失败', 
        details: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    );
  }
}
