import memoizee from 'memoizee';

const CACHE_TTL = 30 * 1000;
const CACHE_TTL_SHORT = 10 * 1000;
const CACHE_TTL_LONG = 60 * 1000;

export function createCachedFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    maxAge?: number;
    primitive?: boolean;
    normalizer?: (args: Parameters<T>) => string;
  } = {}
): T {
  return memoizee(fn, {
    promise: true,
    maxAge: options.maxAge || CACHE_TTL,
    primitive: options.primitive ?? true,
    normalizer: options.normalizer,
  }) as T;
}

export function clearCache(cachedFn: any): void {
  if (cachedFn && typeof cachedFn.clear === 'function') {
    cachedFn.clear();
  }
}

export { CACHE_TTL, CACHE_TTL_SHORT, CACHE_TTL_LONG };
