import { KnowledgeType } from '../models/enums.js';
import { KnowledgeDependency } from '../models/knowledge-dependency.js';
/**
 * Manages the catalog of all knowledge units.
 * Provides CRUD, bulk registration, type-based querying, and text search.
 */
export class KnowledgeRegistryService {
    repo;
    hydrate;
    prerequisiteRepo;
    cache;
    constructor(repo, hydrate, prerequisiteRepo, cache) {
        this.repo = repo;
        this.hydrate = hydrate;
        this.prerequisiteRepo = prerequisiteRepo;
        this.cache = cache;
    }
    async registerKnowledge(unit) {
        this.validateUnit(unit);
        const id = await this.repo.insert({
            knowledgeType: unit.knowledgeType,
            value: unit.value,
            difficultyLevel: unit.difficultyLevel,
            metadata: JSON.stringify(unit.metadata),
        });
        if (this.cache) {
            await this.cache.deleteByPrefix('lp:knowledge:type:').catch(() => { });
        }
        return id;
    }
    async getKnowledgeById(id) {
        if (this.cache) {
            const cached = await this.cache.get(`lp:knowledge:${id}`).catch(() => null);
            if (cached) {
                const row = JSON.parse(cached);
                return this.hydrate(row);
            }
        }
        const row = await this.repo.getById(id);
        if (!row)
            return null;
        if (this.cache) {
            await this.cache.set(`lp:knowledge:${id}`, JSON.stringify(row), 3600).catch(() => { });
        }
        return this.hydrate(row);
    }
    async getKnowledgeByType(knowledgeType, filters) {
        const filtersHash = filters ? JSON.stringify(filters) : '';
        const cacheKey = `lp:knowledge:type:${knowledgeType}:${filtersHash}`;
        if (this.cache) {
            const cached = await this.cache.get(cacheKey).catch(() => null);
            if (cached) {
                const rows = JSON.parse(cached);
                return rows.map((row) => this.hydrate(row));
            }
        }
        const rows = await this.repo.getByType(knowledgeType, filters);
        if (this.cache) {
            await this.cache.set(cacheKey, JSON.stringify(rows), 3600).catch(() => { });
        }
        return rows.map((row) => this.hydrate(row));
    }
    async searchKnowledge(query) {
        const rows = await this.repo.search(query, 50);
        return rows.map((row) => this.hydrate(row));
    }
    async getPrerequisites(knowledgeId) {
        if (!this.prerequisiteRepo)
            return [];
        const rows = await this.prerequisiteRepo.getPrerequisites(knowledgeId);
        return rows.map((row) => new KnowledgeDependency({
            fromKnowledgeId: row.from_knowledge_id,
            toKnowledgeId: row.to_knowledge_id,
            dependencyType: row.dependency_type,
            weight: row.weight,
        }));
    }
    async getDependents(knowledgeId) {
        if (!this.prerequisiteRepo)
            return [];
        const rows = await this.prerequisiteRepo.getDependents(knowledgeId);
        return rows.map((row) => new KnowledgeDependency({
            fromKnowledgeId: row.from_knowledge_id,
            toKnowledgeId: row.to_knowledge_id,
            dependencyType: row.dependency_type,
            weight: row.weight,
        }));
    }
    async bulkRegister(units) {
        if (units.length > 500) {
            throw new Error('Maximum batch size is 500 units');
        }
        for (const unit of units) {
            this.validateUnit(unit);
        }
        const ids = await this.repo.bulkInsert(units.map((unit) => ({
            knowledgeType: unit.knowledgeType,
            value: unit.value,
            difficultyLevel: unit.difficultyLevel,
            metadata: JSON.stringify(unit.metadata),
        })));
        if (this.cache) {
            await this.cache.deleteByPrefix('lp:knowledge:type:').catch(() => { });
        }
        return ids;
    }
    validateUnit(unit) {
        const validTypes = Object.values(KnowledgeType);
        if (!validTypes.includes(unit.knowledgeType)) {
            throw new Error(`Invalid knowledge type: ${unit.knowledgeType}`);
        }
        if (unit.difficultyLevel < 1 || unit.difficultyLevel > 5) {
            throw new Error('difficultyLevel must be between 1 and 5');
        }
        if (!unit.value || unit.value.trim().length === 0) {
            throw new Error('value must be non-empty');
        }
    }
}
//# sourceMappingURL=knowledge-registry.js.map