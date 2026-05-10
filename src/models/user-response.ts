/**
 * Records a single user interaction with a knowledge unit during a game session.
 */
export class UserResponse {
  readonly id: number;
  readonly userId: number;
  readonly knowledgeUnitId: number;
  readonly gameType: string;
  readonly isCorrect: boolean;
  readonly responseTimeMs: number;
  readonly hintsUsed: number;
  readonly qualityScore: number;
  readonly contextMetadata: Record<string, unknown>;
  readonly timestamp: string;

  constructor(params: {
    id?: number;
    userId: number;
    knowledgeUnitId: number;
    gameType: string;
    isCorrect: boolean;
    responseTimeMs: number;
    hintsUsed?: number;
    qualityScore?: number;
    contextMetadata?: Record<string, unknown>;
    timestamp?: string;
  }) {
    this.id = params.id ?? 0;
    this.userId = params.userId;
    this.knowledgeUnitId = params.knowledgeUnitId;
    this.gameType = params.gameType;
    this.isCorrect = params.isCorrect;
    this.responseTimeMs = params.responseTimeMs;
    this.hintsUsed = params.hintsUsed ?? 0;
    this.qualityScore = params.qualityScore ?? this.calculateQualityScore();
    this.contextMetadata = params.contextMetadata ?? {};
    this.timestamp = params.timestamp ?? new Date().toISOString();
  }

  /**
   * Derive quality score (0-5) from response correctness, hints, and time.
   * - Incorrect + no hints = 0
   * - Incorrect + hints = 1
   * - Correct: base 5 minus hintsUsed, min 2
   */
  calculateQualityScore(): number {
    if (!this.isCorrect) {
      return this.hintsUsed > 0 ? 1 : 0;
    }
    return Math.max(2, 5 - this.hintsUsed);
  }
}
