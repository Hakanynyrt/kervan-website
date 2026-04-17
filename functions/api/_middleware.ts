// Applies to all /api/* routes.
// Adds security headers; does NOT short-circuit route handlers.
export const onRequest: PagesFunction = async (ctx) => {
  const response = await ctx.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('Cache-Control', 'no-store');
  return response;
};
