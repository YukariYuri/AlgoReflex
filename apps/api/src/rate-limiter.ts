export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  now?: () => number;
}

interface RateLimitEntry {
  count: number;
  windowStartedAt: number;
}

/** In-memory development limiter; production deployments need a shared store. */
export class FixedWindowRateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly now: () => number;

  public constructor({ maxRequests, windowMs, now = Date.now }: RateLimitOptions) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.now = now;
  }

  public tryConsume(key: string): boolean {
    const currentTime = this.now();
    const existing = this.entries.get(key);
    if (!existing || currentTime - existing.windowStartedAt >= this.windowMs) {
      this.entries.set(key, { count: 1, windowStartedAt: currentTime });
      return true;
    }
    if (existing.count >= this.maxRequests) {
      return false;
    }
    existing.count += 1;
    return true;
  }
}
