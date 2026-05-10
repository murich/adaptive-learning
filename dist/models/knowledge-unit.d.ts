import { KnowledgeType } from './enums.js';
/**
 * Abstract base class for all knowledge units in the learning system.
 * Subclasses provide domain-specific behavior (e.g., Letter, Syllable, Word).
 */
export declare abstract class KnowledgeUnit {
    readonly id: number;
    readonly knowledgeType: KnowledgeType;
    readonly value: string;
    readonly difficultyLevel: number;
    readonly metadata: Record<string, unknown>;
    readonly createdAt: string;
    constructor(id: number, knowledgeType: KnowledgeType, value: string, difficultyLevel: number, metadata?: Record<string, unknown>);
    /** Human-readable display name for this knowledge unit */
    abstract getDisplayName(): string;
    /** List of game types where this unit can be practiced */
    abstract getPracticeContexts(): string[];
}
//# sourceMappingURL=knowledge-unit.d.ts.map