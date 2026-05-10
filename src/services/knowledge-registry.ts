import { KnowledgeUnit } from '../models/knowledge-unit.js';
import { KnowledgeType } from '../models/enums.js';
import { KnowledgeDependency } from '../models/knowledge-dependency.js';
import { DependencyType } from '../models/enums.js';
import {
  IKnowledgeRepository,
  IPrerequisiteRepository,
  ICacheClient,
} from '../interfaces/index.js';
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
export class KnowledgeRegistryService implements IKnowledgeRegistryService {
  constructor(
    private readonly repo: IKnowledgeRepository,
    private readonly hydrate: KnowledgeUnitHydrator,
    private readonly prerequisiteRepo?: IPrerequisiteRepository,
    private readonly cache?: ICacheClient,
  ) {}

  async registerKnowledge(unit: KnowledgeUnit): Promise<number> {
    this.validateUnit(unit);

    const id = await this.repo.insert({
      knowledgeType: unit.knowledgeType,
      value: unit.value,
      difficultyLevel: unit.difficultyLevel,
      metadata: JSON.stringify(unit.metadata),
    });

    if (this.cache) {
      await this.cache.deleteByPrefix('lp:knowledge:type:').catch(() => {});
    }

    return id;
  }

  async getKnowledgeById(id: number): Promise<KnowledgeUnit | null> {
    if (this.cache) {
      const cached = await this.cache.get<string>(`lp:knowledge:${id}`).catch(() => null);
      if (cached) {
        const row = JSON.parse(cached);
        return this.hydrate(row);
      }
    }

    const row = await this.repo.getById(id);
    if (!row) return null;

    if (this.cache) {
      await this.cache.set(`lp:knowledge:${id}`, JSON.stringify(row), 3600).catch(() => {});
    }

    return this.hydrate(row);
  }

  async getKnowledgeByType(
    knowledgeType: KnowledgeType,
    filters?: Record<string, number>,
  ): Promise<KnowledgeUnit[]> {
    const filtersHash = filters ? JSON.stringify(filters) : '';
    const cacheKey = `lp:knowledge:type:${knowledgeType}:${filtersHash}`;

    if (this.cache) {
      const cached = await this.cache.get<string>(cacheKey).catch(() => null);
      if (cached) {
        const rows = JSON.parse(cached);
        return rows.map((row: Parameters<KnowledgeUnitHydrator>[0]) => this.hydrate(row));
      }
    }

    const rows = await this.repo.getByType(knowledgeType, filters);

    if (this.cache) {
      await this.cache.set(cacheKey, JSON.stringify(rows), 3600).catch(() => {});
    }

    return rows.map((row) => this.hydrate(row));
  }

  async searchKnowledge(query: string): Promise<KnowledgeUnit[]> {
    const rows = await this.repo.search(query, 50);
    return rows.map((row) => this.hydrate(row));
  }

  async getPrerequisites(knowledgeId: number): Promise<KnowledgeDependency[]> {
    if (!this.prerequisiteRepo) return [];
    const rows = await this.prerequisiteRepo.getPrerequisites(knowledgeId);
    return rows.map(
      (row) =>
        new KnowledgeDependency({
          fromKnowledgeId: row.from_knowledge_id,
          toKnowledgeId: row.to_knowledge_id,
          dependencyType: row.dependency_type as DependencyType,
          weight: row.weight,
        }),
    );
  }

  async getDependents(knowledgeId: number): Promise<KnowledgeDependency[]> {
    if (!this.prerequisiteRepo) return [];
    const rows = await this.prerequisiteRepo.getDependents(knowledgeId);
    return rows.map(
      (row) =>
        new KnowledgeDependency({
          fromKnowledgeId: row.from_knowledge_id,
          toKnowledgeId: row.to_knowledge_id,
          dependencyType: row.dependency_type as DependencyType,
          weight: row.weight,
        }),
    );
  }

  async bulkRegister(units: KnowledgeUnit[]): Promise<number[]> {
    if (units.length > 500) {
      throw new Error('Maximum batch size is 500 units');
    }

    for (const unit of units) {
      this.validateUnit(unit);
    }

    const ids = await this.repo.bulkInsert(
      units.map((unit) => ({
        knowledgeType: unit.knowledgeType,
        value: unit.value,
        difficultyLevel: unit.difficultyLevel,
        metadata: JSON.stringify(unit.metadata),
      })),
    );

    if (this.cache) {
      await this.cache.deleteByPrefix('lp:knowledge:type:').catch(() => {});
    }

    return ids;
  }

  private validateUnit(unit: KnowledgeUnit): void {
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
