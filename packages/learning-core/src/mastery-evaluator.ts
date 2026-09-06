import type { MasteryDimension, MasteryScore } from '@algoreflex/contracts';

export interface MasteryEvaluationInput {
  currentScore?: MasteryScore;
  dimension: MasteryDimension;
  success: boolean;
  timeSpentSeconds?: number;
  expectedTimeSeconds?: number;
}

/**
 * Pure domain evaluator for learning mastery dimensions.
 * Avoids any AI/LLM dependencies; relies strictly on deterministic domain heuristics.
 */
export class MasteryEvaluator {
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
