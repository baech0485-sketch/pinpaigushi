import type { OssConfig } from './oss-config.ts';

interface OssPutOptions {
  headers?: Record<string, string>;
}

interface OssPutResult {
  url?: string;
}

export interface OssLikeClient {
  put: (
    objectKey: string,
    buffer: Buffer,
    options?: OssPutOptions
  ) => Promise<OssPutResult>;
}

type OssConstructor = new (options: Record<string, unknown>) => OssLikeClient;

export async function createOssClient(config: OssConfig): Promise<OssLikeClient> {
  const imported = await import('ali-oss');
  const OSS = imported.default as unknown as OssConstructor;
  const options: Record<string, unknown> = {
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    bucket: config.bucket,
    secure: true,
    timeout: 60000,
  };

  if (config.useAccelerate) {
    options.endpoint = `https://${config.bucket}.oss-accelerate.aliyuncs.com`;
    options.cname = true;
  } else {
    options.region = config.region;
  }

  return new OSS(options);
}
