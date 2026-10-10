import type { RequestHandler } from "express";

type Options = { name: string; windowMs: number; max: number };
type Bucket = { count: number; resetAt: number };

/** Small in-memory fixed-window limiter, keyed by client IP. Enough for a single API instance. */
export function rateLimit({ name, windowMs, max }: Options): RequestHandler {
  const buckets = new Map<string, Bucket>();
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
  }, windowMs);
  sweep.unref();

  return (request, response, next) => {
    const now = Date.now();
    const key = `${name}:${request.ip ?? "unknown"}`;
    const current = buckets.get(key);
    const bucket = current && current.resetAt > now ? current : { count: 0, resetAt: now + windowMs };
    bucket.count += 1;
    buckets.set(key, bucket);
    response.setHeader("RateLimit-Limit", String(max));
    response.setHeader("RateLimit-Remaining", String(Math.max(0, max - bucket.count)));
    if (bucket.count > max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      response.setHeader("Retry-After", String(retryAfter));
      response.status(429).json({
        error: { code: "rate_limited", message: "Too many requests. Please wait a moment and try again." },
      });
      return;
    }
    next();
  };
}
