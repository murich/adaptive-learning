import { KnowledgeUnit } from '../models/knowledge-unit.js';
import { KnowledgeType } from '../models/enums.js';
import { KnowledgeDependency } from '../models/knowledge-dependency.js';
import { IKnowledgeRepository, IPrerequisiteRepository, ICacheClient } from '../interfaces/index.js';
import { IKnowledgeRegistryService } from './interfaces.js';
export type KnowledgeUnitHydrator = (row: {
    id: number;
    knowledge_type: string;
    value: string;
    difficulty_level: number;
    metadata: string | null;
    created_at: string;
}) => KnowledgeUnit;
/**
 * Manages the catalog of all knowledge units.
 * Provides CRUD, bulk registration, type-based querying, and text search.
 */
export declare class KnowledgeRegistryService implements IKnowledgeRegistryService {
    private readonly repo;
    private readonly hydrate;
    private readonly prerequisiteRepo?;
    private readonly cache?;
    constructor(repo: IKnowledgeRepository, hydrate: KnowledgeUnitHydrator, prerequisiteRepo?: IPrerequisiteRepository | undefined, cache?: ICacheClient | undefined);
    registerKnowledge(unit: KnowledgeUnit): Promise<number>;
    getKnowledgeById(id: number): Promise<KnowledgeUnit | null>;
    getKnowledgeByType(knowledgeType: KnowledgeType, filters?: Record<string, number>): Promise<KnowledgeUnit[]>;
    searchKnowledge(query: string): Promise<KnowledgeUnit[]>;
    getPrerequisites(knowledgeId: number): Promise<KnowledgeDependency[]>;
    getDependents(knowledgeId: number): Promise<KnowledgeDependency[]>;
    bulkRegister(units: KnowledgeUnit[]): Promise<number[]>;
    private validateUnit;
}
//# sourceMappingURL=knowledge-registry.d.ts.map