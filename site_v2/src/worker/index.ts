/**
 * Kervan Heat — site_v2 Worker.
 * Static SPA asset server. /api/rfq is NOT handled here — the form posts
 * directly to https://kervanheat.com/api/rfq (mevcut Worker). Cross-origin
 * is handled with Allow-Origin headers on that side.
 */

interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
