/**
 * Abstract base class for all knowledge units in the learning system.
 * Subclasses provide domain-specific behavior (e.g., Letter, Syllable, Word).
 */
export class KnowledgeUnit {
    id;
    knowledgeType;
    value;
    difficultyLevel;
    metadata;
    createdAt;
    constructor(id, knowledgeType, value, difficultyLevel, metadata = {}) {
        if (difficultyLevel < 1 || difficultyLevel > 5) {
            throw new Error('difficultyLevel must be between 1 and 5');
        }
        if (!value || value.trim().length === 0) {
            throw new Error('value must be non-empty');
        }
        this.id = id;
        this.knowledgeType = knowledgeType;
        this.value = value;
        this.difficultyLevel = difficultyLevel;
        this.metadata = metadata;
        this.createdAt = new Date().toISOString();
    }
}
//# sourceMappingURL=knowledge-unit.js.map