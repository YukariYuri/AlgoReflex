export interface FallbackStrategy {
  preferredToolId: string;
  preferredToolName: string;
  fallbackToolId: string;
  fallbackToolName: string;
  scenario: string;
  tradeoffExplanation: string;
  safeInContest: boolean;
}

export class FallbackMatrix {
  private readonly strategies: Map<string, FallbackStrategy[]> = new Map();

  constructor() {
    this.initializeDefaultFallbacks();
  }

  public registerStrategy(strategy: FallbackStrategy): void {
    const list = this.strategies.get(strategy.preferredToolId) || [];
    list.push(strategy);
    this.strategies.set(strategy.preferredToolId, list);
  }

  public getFallbacks(preferredToolId: string): FallbackStrategy[] {
    return this.strategies.get(preferredToolId) || [];
  }

  public getPrimaryFallback(preferredToolId: string): FallbackStrategy | undefined {
    const list = this.getFallbacks(preferredToolId);
    return list[0];
  }

  private initializeDefaultFallbacks(): void {
    this.registerStrategy({
      preferredToolId: 'std::accumulate',
      preferredToolName: 'std::accumulate',
      fallbackToolId: 'range-for-sum',
      fallbackToolName: 'range-based for loop with accumulator',
      scenario:
        'Forgotten <numeric> header or forgot to cast initial value 0LL for 64-bit sum',
      tradeoffExplanation:
        'Slightly more verbose syntax, but immune to 32-bit overflow gotcha with 0 vs 0LL in header',
      safeInContest: true,
    });

    this.registerStrategy({
      preferredToolId: 'std::lower_bound',
      preferredToolName: 'std::lower_bound',
      fallbackToolId: 'manual-binary-search',
      fallbackToolName: 'manual while (low <= high) binary search',
      scenario:
        'Unsure of iterator subtraction syntax or custom comparator lambda formatting under time pressure',
      tradeoffExplanation:
        'Requires index bounds checking and careful mid calculation, but relies only on fundamental integers',
      safeInContest: true,
    });

    this.registerStrategy({
      preferredToolId: 'std::nth_element',
      preferredToolName: 'std::nth_element',
      fallbackToolId: 'std::sort',
      fallbackToolName: 'std::sort complete array',
      scenario: 'Forgotten O(N) selection syntax or pivot positioning semantics',
      tradeoffExplanation:
        'O(N log N) time complexity instead of O(N), acceptable if N <= 2*10^5 and time limit allows',
      safeInContest: true,
    });

    this.registerStrategy({
      preferredToolId: 'std::unordered_map',
      preferredToolName: 'std::unordered_map',
      fallbackToolId: 'vector-frequency-array',
      fallbackToolName: 'std::vector<int> frequency array',
      scenario:
        'Key domain is bounded (e.g. values <= 10^6) or avoiding hash collision anti-hash test cases in contests',
      tradeoffExplanation:
        'Memory overhead if keys are sparse, but strictly O(1) guaranteed and cannot be hacked with anti-hash tests',
      safeInContest: true,
    });
  }
}
