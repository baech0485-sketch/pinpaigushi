import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildOssPublicUrl,
  getOssConfig,
  isOssEnabled,
} from './oss-config.ts';

test('OSS 环境变量齐全时返回配置对象', () => {
  process.env.ALI_OSS_REGION = 'oss-cn-hangzhou';
  process.env.ALI_OSS_ACCESS_KEY_ID = 'demo-id';
  process.env.ALI_OSS_ACCESS_KEY_SECRET = 'demo-secret';
  process.env.ALI_OSS_BUCKET = 'demo-bucket';
  process.env.ALI_OSS_CUSTOM_DOMAIN = 'https://cdn.example.com/';

  const config = getOssConfig();

  assert.deepEqual(config, {
    region: 'oss-cn-hangzhou',
    accessKeyId: 'demo-id',
    accessKeySecret: 'demo-secret',
    bucket: 'demo-bucket',
    customDomain: 'https://cdn.example.com',
    useAccelerate: false,
  });
  assert.equal(isOssEnabled(), true);
});

test('OSS 环境变量缺失时返回 null', () => {
  delete process.env.ALI_OSS_REGION;
  delete process.env.ALI_OSS_ACCESS_KEY_ID;
  delete process.env.ALI_OSS_ACCESS_KEY_SECRET;
  delete process.env.ALI_OSS_BUCKET;
  delete process.env.ALI_OSS_CUSTOM_DOMAIN;

  assert.equal(getOssConfig(), null);
  assert.equal(isOssEnabled(), false);
});

test('OSS 公网地址优先使用自定义域名', () => {
  const url = buildOssPublicUrl(
    {
      region: 'oss-cn-hangzhou',
      accessKeyId: 'demo-id',
      accessKeySecret: 'demo-secret',
      bucket: 'demo-bucket',
      customDomain: 'https://cdn.example.com',
      useAccelerate: false,
    },
    'generated/2026-04-14/demo.png'
  );

  assert.equal(url, 'https://cdn.example.com/generated/2026-04-14/demo.png');
});

test('OSS 公网地址在无自定义域名时使用 bucket 默认域名', () => {
  const url = buildOssPublicUrl(
    {
      region: 'oss-cn-hangzhou',
      accessKeyId: 'demo-id',
      accessKeySecret: 'demo-secret',
      bucket: 'demo-bucket',
      useAccelerate: true,
    },
    'generated/2026-04-14/demo.png'
  );

  assert.equal(
    url,
    'https://demo-bucket.oss-cn-hangzhou.aliyuncs.com/generated/2026-04-14/demo.png'
  );
});
