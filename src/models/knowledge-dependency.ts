import { DependencyType } from './enums.js';

/**
 * Represents a dependency relationship between two knowledge units.
 * Used for prerequisite chains and related-content linking.
 */
export class KnowledgeDependency {
  readonly fromKnowledgeId: number;
  readonly toKnowledgeId: number;
  readonly dependencyType: DependencyType;
  readonly weight: number;

  constructor(params: {
    fromKnowledgeId: number;
    toKnowledgeId: number;
    dependencyType: DependencyType;
    weight?: number;
  }) {
    this.fromKnowledgeId = params.fromKnowledgeId;
    this.toKnowledgeId = params.toKnowledgeId;
    this.dependencyType = params.dependencyType;
    this.weight = params.weight ?? 1.0;

    if (this.weight < 0 || this.weight > 1) {
      throw new Error('weight must be between 0.0 and 1.0');
    }
  }

  /** True if this dependency is a blocking prerequisite */
  isBlocking(): boolean {
    return this.dependencyType === DependencyType.PREREQUISITE;
  }
}
