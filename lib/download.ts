import JSZip from 'jszip';

export interface ImageData {
  index: number;
  base64: string;
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

function stripDataUriPrefix(input: string): string {
  return input.replace(/^data:[^;]+;base64,/, '');
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(stripDataUriPrefix(base64));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
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

function saveByBrowser(dataUri: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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

// 单张下载
export async function downloadImage(base64: string, filename: string, mimeType: string): Promise<void> {
  // Ensure we have a valid data URI
  const dataUri = base64.startsWith('data:') 
    ? base64 
    : `data:${mimeType};base64,${base64}`;

  const exportedByHost = await requestHostExport({
    kind: 'single',
    filename,
    mimeType,
    base64: stripDataUriPrefix(dataUri),
  });
  if (exportedByHost) return;

  try {
    const bytes = base64ToBytes(dataUri);
    const extension = filename.split('.').pop() || 'jpg';
    await saveByTauriDialogAndFs(bytes, filename, [
      { name: '图片文件', extensions: [extension] },
    ]);
    return;
  } catch {
    // fallback to browser download
  }

  saveByBrowser(dataUri, filename);
}

// 批量下载（使用 JSZip）
export async function downloadAllImages(images: ImageData[]): Promise<void> {
  const zip = new JSZip();
  // Create a folder or just put files in root of zip. 
  // Requirement says "download zip". Usually better to have files in root or a folder.
  // I'll put them in the root of the zip for simplicity unless specified otherwise.
  
  images.forEach((img) => {
    // JSZip expects base64 without the data URI prefix
    const base64Data = stripDataUriPrefix(img.base64);
    // Determine extension from mimeType
    const extension = img.mimeType.split('/')[1] === 'jpeg' ? 'jpg' : (img.mimeType.split('/')[1] || 'jpg');
    zip.file(`${img.index}.${extension}`, base64Data, { base64: true });
  });

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

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'images.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
