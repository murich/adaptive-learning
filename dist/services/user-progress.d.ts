import { KnowledgeType } from '../models/enums.js';
import { UserKnowledgeState } from '../models/user-knowledge-state.js';
import { UserResponse } from '../models/user-response.js';
import { IUserProgressRepository, IUserResponseRepository, ICacheClient } from '../interfaces/index.js';
import { IUserProgressService, MasteryOverview } from './interfaces.js';
/**
 * Records user responses, updates mastery levels, and provides analytics.
 */
export declare class UserProgressService implements IUserProgressService {
    private readonly progressRepo;
    private readonly responseRepo;
    private readonly cache?;
    constructor(progressRepo: IUserProgressRepository, responseRepo: IUserResponseRepository, cache?: ICacheClient | undefined);
    recordResponse(response: UserResponse): Promise<void>;
    getUserState(userId: number, knowledgeId: number): Promise<UserKnowledgeState | null>;
    getDueReviews(userId: number, knowledgeType?: KnowledgeType): Promise<UserKnowledgeState[]>;
    getWeakAreas(userId: number, threshold?: number, limit?: number): Promise<UserKnowledgeState[]>;
    getMasteryOverview(userId: number, knowledgeType: KnowledgeType): Promise<MasteryOverview>;
    checkStageProgression(userId: number): Promise<string | null>;
    private hydrateState;
    /** Type helper for row shape (used for type inference in map callbacks) */
    private stateRowType;
}
//# sourceMappingURL=user-progress.d.ts.map