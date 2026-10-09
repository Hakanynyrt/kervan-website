/**
 * Night mode by the visitor's sun: the only server code in the shop.
 *
 * Cloudflare knows the approximate place of every request (city-level IP geolocation,
 * `request.cf.latitude/longitude`). For an HTML page this middleware works out whether the
 * sun is up there right now and marks the document (`<html data-sun="night|day">`), so the
 * stylesheet turns the shop dark after civil dusk and light again at dawn. Nothing is asked
 * of the browser: no geolocation permission, no cookie, no script; the coordinates never
 * leave the edge (the header only says day or night). A visitor can still pick a theme by
 * hand (header "Tema", localStorage `kv_theme`, see src/components/ThemeSelect.tsx), which
 * wins over the sun. Without coordinates (local `wrangler pages dev`, some networks) the page
 * is left untouched and the stylesheet falls back to `prefers-color-scheme`.
 *
 * public/_routes.json keeps the function off the immutable assets (photos, renders, models,
 * bundles), so only page requests are counted against Pages Functions.
 */
import { sunPhase, type SunPhase } from './_lib/sun';

interface CfRequest extends Request {
  cf?: { latitude?: string; longitude?: string };
}

interface Ctx {
  request: CfRequest;
  next: () => Promise<Response>;
}

// Workers runtime globals (the DOM lib does not know them; keep the declarations minimal).
interface Element {
  setAttribute(name: string, value: string): void;
}
declare class HTMLRewriter {
  on(selector: string, handlers: { element(el: Element): void }): HTMLRewriter;
  transform(res: Response): Response;
}

const HEADER = 'X-Kv-Sun';

export const onRequest = async ({ request, next }: Ctx): Promise<Response> => {
  const res = await next();
  if (request.method !== 'GET' && request.method !== 'HEAD') return res;
  const type = res.headers.get('Content-Type') ?? '';
  if (!type.includes('text/html')) return res;
  const phase: SunPhase | null = sunPhase(Date.now(), request.cf?.latitude, request.cf?.longitude);
  const out = new Response(res.body, res);
  out.headers.set(HEADER, phase ?? 'unknown');
  if (!phase) return out;
  return new HTMLRewriter()
    .on('html', {
      element(el) {
        el.setAttribute('data-sun', phase);
      },
    })
    .transform(out);
};
