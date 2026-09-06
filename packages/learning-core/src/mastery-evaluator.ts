import type { MasteryDimension, MasteryScore } from '@algoreflex/contracts';

export interface MasteryEvaluationInput {
  currentScore?: MasteryScore;
  dimension: MasteryDimension;
  success: boolean;
  timeSpentSeconds?: number;
  expectedTimeSeconds?: number;
}

/**
 * PROVISIONAL / HEURISTIC mastery evaluator for Milestone M0.
 *
 * NOTE: This evaluator is explicitly provisional and exists solely to validate
 * architecture, contracts, and test pipelines.
 *
 * Production mastery calibration and learning science models will be developed
 * during Milestone M5 (Adaptive Learning) and must be empirically evaluated against
 * real learner data before becoming authoritative.
 */
export class HeuristicMasteryEvaluator {
  private static readonly DEFAULT_INITIAL_SCORE = 50;
  private static readonly LEARNING_RATE = 0.15;

  public static calculateUpdatedScore(input: MasteryEvaluationInput): MasteryScore {
    const currentScoreValue = input.currentScore?.score ?? this.DEFAULT_INITIAL_SCORE;
    const currentCount = input.currentScore?.sampleCount ?? 0;

    let targetDelta = input.success ? 100 - currentScoreValue : -currentScoreValue;

    // Adjust for time pressure if applicable
    if (
      input.dimension === 'RECALL_UNDER_PRESSURE' &&
      input.timeSpentSeconds &&
      input.expectedTimeSeconds
    ) {
      const speedRatio = input.expectedTimeSeconds / Math.max(input.timeSpentSeconds, 1);
      if (input.success) {
        // Bonus for fast recall, penalty if excessively slow even if correct
        const speedMultiplier = Math.min(Math.max(speedRatio, 0.5), 1.5);
        targetDelta *= speedMultiplier;
      }
    }

    const updatedScore = Math.max(
      0,
      Math.min(100, Math.round(currentScoreValue + targetDelta * this.LEARNING_RATE))
    );
    const updatedCount = currentCount + 1;
    // Confidence grows asymptotically with sample count
    const confidence = Math.min(
      1,
      Math.round((1 - Math.exp(-updatedCount / 5)) * 100) / 100
    );

    return {
      dimension: input.dimension,
      score: updatedScore,
      confidence,
      sampleCount: updatedCount,
      lastEvaluatedAt: new Date().toISOString(),
    };
  }
}

// Backward-compatible alias for existing imports
export const MasteryEvaluator = HeuristicMasteryEvaluator;
export type MasteryEvaluator = HeuristicMasteryEvaluator;
