import { buildOssPublicUrl, getOssConfig } from './oss-config.ts';
import { createOssClient } from './oss-client.ts';

export interface StoredBrandStoryImage {
  imageUrl: string;
  storageType: 'oss' | 'inline';
  objectKey?: string;
}

interface StoreBrandStoryImageParams {
  base64: string;
  mimeType: string;
  originalName: string;
}

function stripDataUriPrefix(base64: string): string {
  return base64.replace(/^data:[^;]+;base64,/, '');
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildUploadHeaders(mimeType: string): Record<string, string> {
  return {
    'Content-Type': mimeType,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Disposition': 'inline',
  };
}

function resolveFileExtension(originalName: string): string {
  const match = originalName.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] || '.png';
}

export function buildBrandStoryImageObjectKey(
  originalName: string,
  date: Date = new Date(),
  imageId: string = crypto.randomUUID()
): string {
  const day = date.toISOString().split('T')[0];
  return `generated/${day}/${imageId}${resolveFileExtension(originalName)}`;
}

export function buildInlineImageUrl(base64: string, mimeType: string): string {
  return `data:${mimeType};base64,${stripDataUriPrefix(base64)}`;
}

export async function storeBrandStoryImage(
  params: StoreBrandStoryImageParams
): Promise<StoredBrandStoryImage> {
  const sanitizedBase64 = stripDataUriPrefix(params.base64);
  const ossConfig = getOssConfig();

  if (!ossConfig) {
    return {
      imageUrl: buildInlineImageUrl(sanitizedBase64, params.mimeType),
      storageType: 'inline',
    };
  }

  const buffer = Buffer.from(sanitizedBase64, 'base64');
  const objectKey = buildBrandStoryImageObjectKey(params.originalName);

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const client = await createOssClient(ossConfig);
      await client.put(objectKey, buffer, {
        headers: buildUploadHeaders(params.mimeType),
      });

      return {
        imageUrl: buildOssPublicUrl(ossConfig, objectKey),
        storageType: 'oss',
        objectKey,
      };
    } catch (error) {
      if (attempt === 3) {
        console.error('OSS 上传失败，回退为内联图片', error);
        break;
      }

      await wait(attempt * 1000);
    }
  }

  return {
    imageUrl: buildInlineImageUrl(sanitizedBase64, params.mimeType),
    storageType: 'inline',
  };
}
