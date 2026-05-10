import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  KnowledgeRegistryService,
  KnowledgeUnit,
  KnowledgeType,
} from '../../src/index.js';
import type { IKnowledgeRepository, ICacheClient } from '../../src/index.js';

class TestUnit extends KnowledgeUnit {
  getDisplayName(): string {
    return `Test ${this.value}`;
  }
  getPracticeContexts(): string[] {
    return ['test'];
  }
}

function mockRepo(): IKnowledgeRepository {
  let autoId = 0;
  const store: Map<number, { id: number; knowledge_type: string; value: string; difficulty_level: number; metadata: string | null; created_at: string }> = new Map();

  return {
    insert: vi.fn(async (unit) => {
      autoId++;
      store.set(autoId, {
        id: autoId,
        knowledge_type: unit.knowledgeType,
        value: unit.value,
        difficulty_level: unit.difficultyLevel,
        metadata: unit.metadata,
        created_at: new Date().toISOString(),
      });
      return autoId;
    }),
    getById: vi.fn(async (id) => store.get(id) ?? null),
    getByType: vi.fn(async (type, filters) => {
      const results = [...store.values()].filter((r) => r.knowledge_type === type);
      if (filters?.['difficultyLevel'] !== undefined) {
        return results.filter((r) => r.difficulty_level === filters['difficultyLevel']);
      }
      return results;
    }),
    search: vi.fn(async (query) => {
      return [...store.values()].filter((r) =>
        r.value.toLowerCase().includes(query.toLowerCase()),
      );
    }),
    bulkInsert: vi.fn(async (units) => {
      const ids: number[] = [];
      for (const unit of units) {
        autoId++;
        store.set(autoId, {
          id: autoId,
          knowledge_type: unit.knowledgeType,
          value: unit.value,
          difficulty_level: unit.difficultyLevel,
          metadata: unit.metadata,
          created_at: new Date().toISOString(),
        });
        ids.push(autoId);
      }
      return ids;
    }),
  };
}

function mockCache(): ICacheClient {
  const store = new Map<string, string>();
  return {
    get: vi.fn(async (key) => {
      const val = store.get(key);
      return val ? (JSON.parse(val) as never) : null;
    }),
    set: vi.fn(async (key, value) => {
      store.set(key, JSON.stringify(value));
    }),
    delete: vi.fn(async (key) => {
      store.delete(key);
    }),
    deleteByPrefix: vi.fn(async (prefix) => {
      for (const key of store.keys()) {
        if (key.startsWith(prefix)) store.delete(key);
      }
    }),
  };
}

const hydrate = (row: { id: number; knowledge_type: string; value: string; difficulty_level: number; metadata: string | null; created_at: string }) => {
  const metadata = row.metadata ? JSON.parse(row.metadata) : {};
  return new TestUnit(row.id, row.knowledge_type as KnowledgeType, row.value, row.difficulty_level, metadata);
};

describe('KnowledgeRegistryService', () => {
  let repo: IKnowledgeRepository;
  let cache: ICacheClient;
  let service: KnowledgeRegistryService;

  beforeEach(() => {
    repo = mockRepo();
    cache = mockCache();
    service = new KnowledgeRegistryService(repo, hydrate, undefined, cache);
  });

  it('registerKnowledge persists and returns ID', async () => {
    const unit = new TestUnit(0, KnowledgeType.LETTER, 'А', 1, { phoneme: 'а' });
    const id = await service.registerKnowledge(unit);
    expect(id).toBe(1);
    expect(repo.insert).toHaveBeenCalledOnce();
  });

  it('getKnowledgeById returns hydrated unit', async () => {
    const unit = new TestUnit(0, KnowledgeType.LETTER, 'Б', 2);
    await service.registerKnowledge(unit);

    const result = await service.getKnowledgeById(1);
    expect(result).not.toBeNull();
    expect(result!.value).toBe('Б');
    expect(result!.difficultyLevel).toBe(2);
  });

  it('getKnowledgeById returns null for non-existent', async () => {
    const result = await service.getKnowledgeById(999);
    expect(result).toBeNull();
  });

  it('getKnowledgeByType with filters', async () => {
    await service.bulkRegister([
      new TestUnit(0, KnowledgeType.LETTER, 'А', 1),
      new TestUnit(0, KnowledgeType.LETTER, 'Щ', 4),
    ]);

    const all = await service.getKnowledgeByType(KnowledgeType.LETTER);
    expect(all.length).toBe(2);

    const easy = await service.getKnowledgeByType(KnowledgeType.LETTER, { difficultyLevel: 1 });
    expect(easy.length).toBe(1);
    expect(easy[0].value).toBe('А');
  });

  it('searchKnowledge is case-insensitive', async () => {
    await service.registerKnowledge(new TestUnit(0, KnowledgeType.WORD, 'МАМА', 2));
    await service.registerKnowledge(new TestUnit(0, KnowledgeType.WORD, 'ПАПА', 2));

    const results = await service.searchKnowledge('мам');
    expect(results.length).toBe(1);
    expect(results[0].value).toBe('МАМА');
  });

  it('bulkRegister returns IDs in order', async () => {
    const units = [
      new TestUnit(0, KnowledgeType.LETTER, 'А', 1),
      new TestUnit(0, KnowledgeType.LETTER, 'Б', 2),
      new TestUnit(0, KnowledgeType.LETTER, 'В', 2),
    ];
    const ids = await service.bulkRegister(units);
    expect(ids).toEqual([1, 2, 3]);
  });

  it('bulkRegister rejects over 500 units', async () => {
    const units = Array.from({ length: 501 }, (_, i) =>
      new TestUnit(0, KnowledgeType.LETTER, String.fromCharCode(65 + (i % 26)), 1),
    );
    await expect(service.bulkRegister(units)).rejects.toThrow('Maximum batch size is 500');
  });

  it('caches on getKnowledgeById', async () => {
    await service.registerKnowledge(new TestUnit(0, KnowledgeType.LETTER, 'А', 1));

    await service.getKnowledgeById(1);
    expect(cache.set).toHaveBeenCalled();

    // Second call should hit cache
    await service.getKnowledgeById(1);
    expect(cache.get).toHaveBeenCalledTimes(2);
  });

  it('invalidates type cache on register', async () => {
    await service.registerKnowledge(new TestUnit(0, KnowledgeType.LETTER, 'А', 1));
    expect(cache.deleteByPrefix).toHaveBeenCalledWith('lp:knowledge:type:');
  });
});
