import { KnowledgeUnit } from '../models/knowledge-unit.js';
import { KnowledgeType } from '../models/enums.js';
import { UserKnowledgeState } from '../models/user-knowledge-state.js';
import { UserResponse } from '../models/user-response.js';
import { KnowledgeDependency } from '../models/knowledge-dependency.js';
export interface MasteryOverview {
    totalUnits: number;
    mastered: number;
    inProgress: number;
    notStarted: number;
    avgMastery: number;
    masteryByDifficulty: Record<string, number>;
}
export interface IKnowledgeRegistryService {
    registerKnowledge(unit: KnowledgeUnit): Promise<number>;
    getKnowledgeById(id: number): Promise<KnowledgeUnit | null>;
    getKnowledgeByType(knowledgeType: KnowledgeType, filters?: Record<string, number>): Promise<KnowledgeUnit[]>;
    searchKnowledge(query: string): Promise<KnowledgeUnit[]>;
    getPrerequisites(knowledgeId: number): Promise<KnowledgeDependency[]>;
    getDependents(knowledgeId: number): Promise<KnowledgeDependency[]>;
    bulkRegister(units: KnowledgeUnit[]): Promise<number[]>;
}
export interface IUserProgressService {
    recordResponse(response: UserResponse): Promise<void>;
    getUserState(userId: number, knowledgeId: number): Promise<UserKnowledgeState | null>;
    getDueReviews(userId: number, knowledgeType?: KnowledgeType): Promise<UserKnowledgeState[]>;
    getWeakAreas(userId: number, threshold?: number, limit?: number): Promise<UserKnowledgeState[]>;
    getMasteryOverview(userId: number, knowledgeType: KnowledgeType): Promise<MasteryOverview>;
    checkStageProgression(userId: number): Promise<string | null>;
}
//# sourceMappingURL=interfaces.d.ts.map