interface RateLimitEntry { count: number; resetAt: number; }
interface RequestLike { ip?: string; path: string; }
interface ResponseLike { setHeader(name: string, value: string | number): void; status(code: number): { json(body: object): void }; }

export function createRateLimitMiddleware(windowSeconds: number, maxRequests: number) {
  const entries = new Map<string, RateLimitEntry>();
  const windowMs = windowSeconds * 1000;
  return (request: RequestLike, response: ResponseLike, next: () => void): void => {
    if (windowMs === 0 || maxRequests === 0 || request.path === '/health') return next();
    const now = Date.now();
    const key = request.ip ?? 'unknown';
    const current = entries.get(key);
    const entry = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
    entry.count += 1;
    entries.set(key, entry);
    if (entry.count > maxRequests) {
      response.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      response.status(429).json({ statusCode: 429, code: 'RATE_LIMITED', message: 'Muitas requisiÃ§Ãµes. Tente novamente em instantes.' });
      return;
    }
    next();
  };
}
