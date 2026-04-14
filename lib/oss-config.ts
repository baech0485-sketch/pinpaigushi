export interface OssConfig {
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  customDomain?: string;
  useAccelerate: boolean;
}

function normalizeCustomDomain(domain?: string): string | undefined {
  if (!domain) return undefined;
  return domain.replace(/\/+$/, '');
}

export function getOssConfig(): OssConfig | null {
  const region = process.env.ALI_OSS_REGION;
  const accessKeyId = process.env.ALI_OSS_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALI_OSS_ACCESS_KEY_SECRET;
  const bucket = process.env.ALI_OSS_BUCKET;

  if (!region || !accessKeyId || !accessKeySecret || !bucket) {
    return null;
  }

  return {
    region,
    accessKeyId,
    accessKeySecret,
    bucket,
    customDomain: normalizeCustomDomain(process.env.ALI_OSS_CUSTOM_DOMAIN),
    useAccelerate: process.env.ALI_OSS_USE_ACCELERATE === 'true',
  };
}

export function isOssEnabled(): boolean {
  return getOssConfig() !== null;
}

export function buildOssPublicUrl(config: OssConfig, objectKey: string): string {
  if (config.customDomain) {
    return `${config.customDomain}/${objectKey}`;
  }

  return `https://${config.bucket}.${config.region}.aliyuncs.com/${objectKey}`;
}
