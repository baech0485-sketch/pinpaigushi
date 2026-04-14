import type { NextConfig } from "next";

function resolveCustomImageHost(): string | null {
  const domain = process.env.ALI_OSS_CUSTOM_DOMAIN;
  if (!domain) return null;

  try {
    const normalized = domain.startsWith('http') ? domain : `https://${domain}`;
    return new URL(normalized).hostname;
  } catch {
    return null;
  }
}

const customImageHost = resolveCustomImageHost();
const remotePatterns: NonNullable<NonNullable<NextConfig['images']>['remotePatterns']> = [
  { protocol: 'https', hostname: '**.aliyuncs.com' },
  { protocol: 'http', hostname: '**.aliyuncs.com' },
  ...(customImageHost
    ? [
        { protocol: 'https' as const, hostname: customImageHost },
        { protocol: 'http' as const, hostname: customImageHost },
      ]
    : []),
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
