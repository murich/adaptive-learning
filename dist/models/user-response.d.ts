/**
 * Records a single user interaction with a knowledge unit during a game session.
 */
export declare class UserResponse {
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
    });
    /**
     * Derive quality score (0-5) from response correctness, hints, and time.
     * - Incorrect + no hints = 0
     * - Incorrect + hints = 1
     * - Correct: base 5 minus hintsUsed, min 2
     */
    calculateQualityScore(): number;
}
//# sourceMappingURL=user-response.d.ts.map