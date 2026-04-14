function stripDataUriPrefix(input: string): string {
  return input.replace(/^data:[^;]+;base64,/, '');
}

function isDataUrl(input: string): boolean {
  return input.startsWith('data:');
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(stripDataUriPrefix(base64));
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary);
}

export async function imageSourceToBytes(imageUrl: string): Promise<Uint8Array> {
  if (isDataUrl(imageUrl)) {
    return base64ToBytes(imageUrl);
  }

  let response: Response;

  try {
    response = await fetch(imageUrl);
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `远程图片读取失败，请检查 OSS 的公开读与 CORS 配置：${error.message}`
        : '远程图片读取失败，请检查 OSS 的公开读与 CORS 配置'
    );
  }

  if (!response.ok) {
    throw new Error(`远程图片下载失败：${response.status} ${response.statusText}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}
