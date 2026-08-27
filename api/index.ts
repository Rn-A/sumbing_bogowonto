import type { VercelRequest, VercelResponse } from '@vercel/node';

let app: any;
let initError: any = null;

try {
  const mod = await import('../server/index.js');
  app = mod.default || mod;
} catch (err: any) {
  initError = err;
  console.error('Failed to load server module:', err);
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (initError) {
    return res.status(500).json({
      success: false,
      error: 'Server module failed to load',
      message: initError?.message || String(initError),
      stack: initError?.stack,
    });
  }

  if (!app) {
    return res.status(500).json({
      success: false,
      error: 'Server app is undefined after loading',
    });
  }

  return app(req, res);
}
