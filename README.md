This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Vercel Deployment Notes (Production)

### 1) Environment Variables (required)

Set these in **Vercel → Project Settings → Environment Variables**:

- `TEXT_API_KEY`
- `IMAGE_API_KEY`
- `API_BASE_URL` (example: `https://yunwu.ai`)

Do not rely on `.env.local` in production.

### 2) Server Runtime

This project uses Next.js Route Handlers under `app/api/*` as server-side proxy:

- `app/api/generate-text/route.ts`
- `app/api/generate-images/route.ts`

Both are configured for Node.js runtime on Vercel to keep API keys server-side.

### 3) Function Duration

Image generation can take longer (multiple sequential image calls). Route handlers include `maxDuration` hints.
If your Vercel plan enforces a lower cap, you may need to:

- upgrade plan limits, or
- reduce per-request image count, or
- split image generation into multiple requests.

### 4) Tauri Clipboard Compatibility

This project uses a unified clipboard adapter at `lib/clipboard.ts`:

- Web first: `navigator.clipboard.writeText`
- Tauri fallback: `__TAURI__.core.invoke(...)` with clipboard-manager command variants
- Final fallback: `document.execCommand('copy')`

If this web app is embedded in a Tauri `iframe`, the host app must allow clipboard permissions on the iframe:

```tsx
<iframe allow="clipboard-write; clipboard-read" />
```

Without this, browsers may block Clipboard API with Permissions Policy errors.

### 5) Tauri Web Export Compatibility (iframe embedded)

`lib/download.ts` now supports three export paths (in order):

1. **iframe host bridge** via `postMessage` (recommended when web app is embedded in Tauri iframe)
2. **Direct Tauri plugin calls** (`plugin:dialog|save` + `plugin:fs|write_file`) if `window.__TAURI__` is available
3. **Browser fallback** (`a[download]`)

If your app is embedded by Tauri in an iframe, implement this in the host app:

```ts
window.addEventListener('message', async (event) => {
  const data = event.data;
  if (!data || data.type !== 'TAURI_EXPORT_REQUEST') return;

  const reply = (success: boolean, error?: string) => {
    event.source?.postMessage(
      {
        type: 'TAURI_EXPORT_RESPONSE',
        requestId: data.requestId,
        success,
        error,
      },
      '*'
    );
  };

  try {
    // data.payload.kind: 'single' | 'zip'
    // save with Tauri dialog + fs plugin in host app
    reply(true);
  } catch (e) {
    reply(false, String(e));
  }
});
```

Also ensure Tauri plugin permissions are enabled for `dialog.save` and `fs.writeFile`.
