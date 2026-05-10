import { describe, it, expect } from 'vitest';
import { KnowledgeUnit, KnowledgeType } from '../../src/index.js';

class TestUnit extends KnowledgeUnit {
  getDisplayName(): string {
    return `Test ${this.value}`;
  }
  getPracticeContexts(): string[] {
    return ['test_context'];
  }
}

describe('KnowledgeUnit', () => {
  it('creates with valid parameters', () => {
    const unit = new TestUnit(1, KnowledgeType.LETTER, 'А', 1, { phoneme: 'а' });
    expect(unit.id).toBe(1);
    expect(unit.knowledgeType).toBe(KnowledgeType.LETTER);
    expect(unit.value).toBe('А');
    expect(unit.difficultyLevel).toBe(1);
    expect(unit.metadata).toEqual({ phoneme: 'а' });
    expect(unit.createdAt).toBeTruthy();
  });

  it('throws on invalid difficulty level', () => {
    expect(() => new TestUnit(1, KnowledgeType.LETTER, 'А', 0)).toThrow('difficultyLevel must be between 1 and 5');
    expect(() => new TestUnit(1, KnowledgeType.LETTER, 'А', 6)).toThrow('difficultyLevel must be between 1 and 5');
  });

  it('throws on empty value', () => {
    expect(() => new TestUnit(1, KnowledgeType.LETTER, '', 1)).toThrow('value must be non-empty');
    expect(() => new TestUnit(1, KnowledgeType.LETTER, '  ', 1)).toThrow('value must be non-empty');
  });

  it('calls abstract methods on subclass', () => {
    const unit = new TestUnit(1, KnowledgeType.WORD, 'МАМА', 2);
    expect(unit.getDisplayName()).toBe('Test МАМА');
    expect(unit.getPracticeContexts()).toEqual(['test_context']);
  });

  it('defaults metadata to empty object', () => {
    const unit = new TestUnit(1, KnowledgeType.LETTER, 'Б', 1);
    expect(unit.metadata).toEqual({});
  });
});
