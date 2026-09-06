import { describe, it, expect } from 'vitest';
import { MasteryEvaluator } from '../src/mastery-evaluator.js';

describe('MasteryEvaluator', () => {
  it('increases mastery score on success', () => {
    const updated = MasteryEvaluator.calculateUpdatedScore({
      currentScore: {
        dimension: 'CONCEPT_UNDERSTANDING',
        score: 50,
        confidence: 0.2,
        sampleCount: 1,
        lastEvaluatedAt: new Date().toISOString(),
      },
      dimension: 'CONCEPT_UNDERSTANDING',
      success: true,
    });

    expect(updated.score).toBeGreaterThan(50);
    expect(updated.sampleCount).toBe(2);
    expect(updated.confidence).toBeGreaterThan(0.2);
  });

  it('decreases mastery score on failure', () => {
    const updated = MasteryEvaluator.calculateUpdatedScore({
      currentScore: {
        dimension: 'SYNTAX_RECALL',
        score: 60,
        confidence: 0.3,
        sampleCount: 2,
        lastEvaluatedAt: new Date().toISOString(),
      },
      dimension: 'SYNTAX_RECALL',
      success: false,
    });

    expect(updated.score).toBeLessThan(60);
    expect(updated.sampleCount).toBe(3);
  });

  it('rewards fast response under pressure training', () => {
    const baseline = MasteryEvaluator.calculateUpdatedScore({
      currentScore: {
        dimension: 'RECALL_UNDER_PRESSURE',
        score: 50,
        confidence: 0.1,
        sampleCount: 1,
        lastEvaluatedAt: new Date().toISOString(),
      },
      dimension: 'RECALL_UNDER_PRESSURE',
      success: true,
      timeSpentSeconds: 10,
      expectedTimeSeconds: 10,
    });

    const fast = MasteryEvaluator.calculateUpdatedScore({
      currentScore: {
        dimension: 'RECALL_UNDER_PRESSURE',
        score: 50,
        confidence: 0.1,
        sampleCount: 1,
        lastEvaluatedAt: new Date().toISOString(),
      },
      dimension: 'RECALL_UNDER_PRESSURE',
      success: true,
      timeSpentSeconds: 5,
      expectedTimeSeconds: 10,
    });

    expect(fast.score).toBeGreaterThanOrEqual(baseline.score);
  });
});
