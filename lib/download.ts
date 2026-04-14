import JSZip from 'jszip';
import {
  bytesToBase64,
  imageSourceToBytes,
} from '@/lib/download-source';

export interface ImageData {
  index: number;
  imageUrl: string;
  mimeType: string;
  aspectRatio: string;
}

interface TauriLike {
  core?: {
    invoke?: (command: string, args?: unknown, options?: unknown) => Promise<unknown>;
  };
  invoke?: (command: string, args?: unknown, options?: unknown) => Promise<unknown>;
}

interface HostExportRequest {
  type: 'TAURI_EXPORT_REQUEST';
  requestId: string;
  payload:
    | { kind: 'single'; filename: string; mimeType: string; base64: string }
    | { kind: 'zip'; filename: string; base64: string };
}

interface HostExportResponse {
  type: 'TAURI_EXPORT_RESPONSE';
  requestId: string;
  success: boolean;
  error?: string;
}

function getTauriInvoke() {
  if (typeof window === 'undefined') return null;
  const tauri = (window as Window & { __TAURI__?: TauriLike }).__TAURI__;
  return tauri?.core?.invoke ?? tauri?.invoke ?? null;
}

function buildObjectUrl(bytes: Uint8Array, mimeType: string): string {
  const blob = new Blob([bytes as BlobPart], { type: mimeType });
  return URL.createObjectURL(blob);
}

function resolveExtension(mimeType: string): string {
  const subtype = mimeType.split('/')[1] || 'png';
  return subtype === 'jpeg' ? 'jpg' : subtype;
}

async function saveByTauriDialogAndFs(bytes: Uint8Array, filename: string, filters: Array<{ name: string; extensions: string[] }>) {
  const invoke = getTauriInvoke();
  if (!invoke) throw new Error('Tauri invoke 不可用');

  const filePath = await invoke('plugin:dialog|save', {
    options: {
      defaultPath: filename,
      title: '保存文件',
      filters,
    },
  }) as string | null;

  if (!filePath) return;

  await invoke(
    'plugin:fs|write_file',
    bytes,
    {
      headers: {
        path: encodeURIComponent(filePath),
        options: JSON.stringify({}),
      },
    },
  );
}

async function requestHostExport(payload: HostExportRequest['payload']): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (window.self === window.top) return false;
  if (!window.parent) return false;

  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const result = await new Promise<boolean>((resolve) => {
    let done = false;

    const finish = (value: boolean) => {
      if (done) return;
      done = true;
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
      resolve(value);
    };

    const onMessage = (event: MessageEvent) => {
      const data = event.data as HostExportResponse | undefined;
      if (!data || data.type !== 'TAURI_EXPORT_RESPONSE') return;
      if (data.requestId !== requestId) return;
      finish(Boolean(data.success));
    };

    const timer = window.setTimeout(() => finish(false), 1800);

    window.addEventListener('message', onMessage);

    const message: HostExportRequest = {
      type: 'TAURI_EXPORT_REQUEST',
      requestId,
      payload,
    };

    window.parent.postMessage(message, '*');
  });

  return result;
}

function saveByBrowserUrl(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function revokeObjectUrlLater(url: string): void {
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// 单张下载
export async function downloadImage(imageUrl: string, filename: string, mimeType: string): Promise<void> {
  const bytes = await imageSourceToBytes(imageUrl);
  const base64 = bytesToBase64(bytes);

  const exportedByHost = await requestHostExport({
    kind: 'single',
    filename,
    mimeType,
    base64,
  });
  if (exportedByHost) return;

  try {
    const extension = filename.split('.').pop() || 'jpg';
    await saveByTauriDialogAndFs(bytes, filename, [
      { name: '图片文件', extensions: [extension] },
    ]);
    return;
  } catch {
    // fallback to browser download
  }

  const objectUrl = buildObjectUrl(bytes, mimeType);
  saveByBrowserUrl(objectUrl, filename);
  revokeObjectUrlLater(objectUrl);
}

// 批量下载（使用 JSZip）
export async function downloadAllImages(images: ImageData[]): Promise<void> {
  const zip = new JSZip();

  for (const img of images) {
    const bytes = await imageSourceToBytes(img.imageUrl);
    const extension = resolveExtension(img.mimeType);
    zip.file(`${img.index}.${extension}`, bytes);
  }

  const zipBytes = await zip.generateAsync({ type: 'uint8array' });
  const zipBase64 = bytesToBase64(zipBytes);

  const exportedByHost = await requestHostExport({
    kind: 'zip',
    filename: 'images.zip',
    base64: zipBase64,
  });
  if (exportedByHost) return;

  try {
    await saveByTauriDialogAndFs(zipBytes, 'images.zip', [
      { name: 'ZIP 文件', extensions: ['zip'] },
    ]);
    return;
  } catch {
    // fallback to browser download
  }

  const url = buildObjectUrl(zipBytes, 'application/zip');
  saveByBrowserUrl(url, 'images.zip');
  revokeObjectUrlLater(url);
}
