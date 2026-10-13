/**
 * Light by day, dark at night, by the visitor's sun (kervanheat.com; same as kiriciparca.com's
 * apps/parts-shop/functions/_middleware.ts).
 *
 * Cloudflare knows the approximate place of every request (city-level IP geolocation,
 * `request.cf.latitude/longitude`). For an HTML page this middleware works out whether the
 * sun is up there right now and marks the document (`<html data-sun="day|night">`); the
 * stylesheet (src/styles/globals.css) shows the light palette by day and today's dark Mood C
 * at night. No geolocation permission, no cookie; the coordinates never leave the edge (the
 * `X-Kv-Sun` header only says day, night or unknown). A theme picked by hand (header "Tema",
 * localStorage `kv_theme`, applied by the inline script in index.html) wins over the sun.
 * Without coordinates the page is left unmarked and stays dark.
 *
 * Everything that is not a GET/HEAD page answer passes through untouched: api/rfq (the RFQ form of both sites) and the owner-only api/tech/* answer JSON
 * and are returned exactly as the function produced them. public/_routes.json keeps the
 * function off the immutable assets.
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
