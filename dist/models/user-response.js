/**
 * Records a single user interaction with a knowledge unit during a game session.
 */
export class UserResponse {
    id;
    userId;
    knowledgeUnitId;
    gameType;
    isCorrect;
    responseTimeMs;
    hintsUsed;
    qualityScore;
    contextMetadata;
    timestamp;
    constructor(params) {
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
    calculateQualityScore() {
        if (!this.isCorrect) {
            return this.hintsUsed > 0 ? 1 : 0;
        }
        return Math.max(2, 5 - this.hintsUsed);
    }
}
//# sourceMappingURL=user-response.js.map