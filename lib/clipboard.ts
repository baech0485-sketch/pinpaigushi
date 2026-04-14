interface TauriLike {
  core?: {
    invoke?: (command: string, args?: unknown, options?: unknown) => Promise<unknown>;
  };
  invoke?: (command: string, args?: unknown, options?: unknown) => Promise<unknown>;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  if (typeof window === 'undefined') return false;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Web Clipboard API may be blocked by Permissions Policy (e.g. iframe)
  }

  try {
    const tauriGlobal = (window as Window & { __TAURI__?: TauriLike }).__TAURI__;
    const invoke = tauriGlobal?.core?.invoke ?? tauriGlobal?.invoke;

    if (typeof invoke === 'function') {
      const commands = [
        { cmd: 'plugin:clipboard-manager|write_text', args: { value: text } },
        { cmd: 'plugin:clipboard-manager|write_text', args: { text } },
        { cmd: 'plugin:clipboard-manager|writeText', args: { value: text } },
        { cmd: 'plugin:clipboard-manager|writeText', args: { text } },
      ];

      for (const item of commands) {
        try {
          await invoke(item.cmd, item.args);
          return true;
        } catch {
          // try next command signature
        }
      }
    }
  } catch {
    // ignore and continue to fallback
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}
