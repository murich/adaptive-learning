/** Persistence layer for knowledge units */
export interface IKnowledgeRepository {
    insert(unit: {
        knowledgeType: string;
        value: string;
        difficultyLevel: number;
        metadata: string;
    }): Promise<number>;
    getById(id: number): Promise<{
        id: number;
        knowledge_type: string;
        value: string;
        difficulty_level: number;
        metadata: string | null;
        created_at: string;
    } | null>;
    getByType(knowledgeType: string, filters?: Record<string, number>): Promise<Array<{
        id: number;
        knowledge_type: string;
        value: string;
        difficulty_level: number;
        metadata: string | null;
        created_at: string;
    }>>;
    search(query: string, limit?: number): Promise<Array<{
        id: number;
        knowledge_type: string;
        value: string;
        difficulty_level: number;
        metadata: string | null;
        created_at: string;
    }>>;
    bulkInsert(units: Array<{
        knowledgeType: string;
        value: string;
        difficultyLevel: number;
        metadata: string;
    }>): Promise<number[]>;
}
/** Persistence layer for user progress state */
export interface IUserProgressRepository {
    getState(userId: number, knowledgeUnitId: number): Promise<{
        user_id: number;
        knowledge_unit_id: number;
        mastery_level: number;
        easiness_factor: number;
        interval_days: number;
        review_count: number;
        last_practiced: string | null;
        next_review_date: string | null;
    } | null>;
    upsertState(state: {
        userId: number;
        knowledgeUnitId: number;
        masteryLevel: number;
        easinessFactor: number;
        intervalDays: number;
        reviewCount: number;
        lastPracticed: string | null;
        nextReviewDate: string | null;
    }): Promise<void>;
    getDueReviews(userId: number, knowledgeType?: string): Promise<Array<{
        user_id: number;
        knowledge_unit_id: number;
        mastery_level: number;
        easiness_factor: number;
        interval_days: number;
        review_count: number;
        last_practiced: string | null;
        next_review_date: string | null;
    }>>;
    getWeakAreas(userId: number, threshold: number, limit: number): Promise<Array<{
        user_id: number;
        knowledge_unit_id: number;
        mastery_level: number;
        easiness_factor: number;
        interval_days: number;
        review_count: number;
        last_practiced: string | null;
        next_review_date: string | null;
    }>>;
    getMasteryOverview(userId: number, knowledgeType: string): Promise<{
        totalUnits: number;
        mastered: number;
        inProgress: number;
        notStarted: number;
        avgMastery: number;
        masteryByDifficulty: Record<string, number>;
    }>;
}
/** Persistence layer for user responses */
export interface IUserResponseRepository {
    insert(response: {
        userId: number;
        knowledgeUnitId: number;
        gameType: string;
        isCorrect: boolean;
        responseTimeMs: number;
        hintsUsed: number;
        qualityScore: number;
        contextMetadata: string;
    }): Promise<number>;
}
/** Persistence layer for prerequisite/dependency relationships */
export interface IPrerequisiteRepository {
    getPrerequisites(knowledgeId: number): Promise<Array<{
        from_knowledge_id: number;
        to_knowledge_id: number;
        dependency_type: string;
        weight: number;
    }>>;
    getDependents(knowledgeId: number): Promise<Array<{
        from_knowledge_id: number;
        to_knowledge_id: number;
        dependency_type: string;
        weight: number;
    }>>;
}
/** Cache client for read-through caching */
export interface ICacheClient {
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: unknown, ttl: number): Promise<void>;
    delete(key: string): Promise<void>;
    deleteByPrefix(prefix: string): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map