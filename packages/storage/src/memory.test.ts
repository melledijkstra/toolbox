import { describe, vi, it, expect, beforeAll, afterAll } from "vitest";
import { MemoryCache, MIN_5 } from "./memory";

describe('MemoryCache', () => {
  beforeAll(() => {
    vi.useFakeTimers()
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('should cache and retrieve values', () => {
    const cache = new MemoryCache()

    cache.set('foo', 'bar')
    expect(cache.get('foo')).toBe('bar')

    vi.advanceTimersByTime(MIN_5 + 1000)
    expect(cache.get('foo')).toBe(undefined)
  })
})