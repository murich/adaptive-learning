import { KnowledgeType } from './enums.js';

/**
 * Abstract base class for all knowledge units in the learning system.
 * Subclasses provide domain-specific behavior (e.g., Letter, Syllable, Word).
 */
export abstract class KnowledgeUnit {
  readonly id: number;
  readonly knowledgeType: KnowledgeType;
  readonly value: string;
  readonly difficultyLevel: number;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: string;

  constructor(
    id: number,
    knowledgeType: KnowledgeType,
    value: string,
    difficultyLevel: number,
    metadata: Record<string, unknown> = {},
  ) {
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

  /** Human-readable display name for this knowledge unit */
  abstract getDisplayName(): string;

  /** List of game types where this unit can be practiced */
  abstract getPracticeContexts(): string[];
}
