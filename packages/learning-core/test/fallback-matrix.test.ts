import { describe, it, expect } from 'vitest';
import { FallbackMatrix } from '../src/fallback-matrix.js';

describe('FallbackMatrix', () => {
  it('provides default contest fallback for std::accumulate', () => {
    const matrix = new FallbackMatrix();
    const fallback = matrix.getPrimaryFallback('std::accumulate');

    expect(fallback).toBeDefined();
    expect(fallback?.fallbackToolId).toBe('range-for-sum');
    expect(fallback?.safeInContest).toBe(true);
    expect(fallback?.scenario).toContain('<numeric>');
  });

  it('provides fallback for std::lower_bound', () => {
    const matrix = new FallbackMatrix();
    const fallback = matrix.getPrimaryFallback('std::lower_bound');

    expect(fallback).toBeDefined();
    expect(fallback?.fallbackToolId).toBe('manual-binary-search');
  });

  it('allows registering custom tool fallbacks', () => {
    const matrix = new FallbackMatrix();
    matrix.registerStrategy({
      preferredToolId: 'std::gcd',
      preferredToolName: 'std::gcd',
      fallbackToolId: 'euclidean-while-loop',
      fallbackToolName: 'Euclidean algorithm while loop',
      scenario: 'Pre-C++17 environment or forgot header <numeric>',
      tradeoffExplanation: 'Requires writing 3-line gcd function manually',
      safeInContest: true,
    });

    const fallback = matrix.getPrimaryFallback('std::gcd');
    expect(fallback?.fallbackToolId).toBe('euclidean-while-loop');
  });
});
