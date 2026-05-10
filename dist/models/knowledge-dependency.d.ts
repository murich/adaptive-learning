import { DependencyType } from './enums.js';
/**
 * Represents a dependency relationship between two knowledge units.
 * Used for prerequisite chains and related-content linking.
 */
export declare class KnowledgeDependency {
    readonly fromKnowledgeId: number;
    readonly toKnowledgeId: number;
    readonly dependencyType: DependencyType;
    readonly weight: number;
    constructor(params: {
        fromKnowledgeId: number;
        toKnowledgeId: number;
        dependencyType: DependencyType;
        weight?: number;
    });
    /** True if this dependency is a blocking prerequisite */
    isBlocking(): boolean;
}
//# sourceMappingURL=knowledge-dependency.d.ts.map