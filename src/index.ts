// Models
export { KnowledgeUnit } from './models/knowledge-unit.js';
export { UserKnowledgeState } from './models/user-knowledge-state.js';
export { UserResponse } from './models/user-response.js';
export { KnowledgeDependency } from './models/knowledge-dependency.js';
export { KnowledgeType, DependencyType } from './models/enums.js';

// Interfaces
export type {
  IKnowledgeRepository,
  IUserProgressRepository,
  IUserResponseRepository,
  IPrerequisiteRepository,
  ICacheClient,
} from './interfaces/index.js';

// Service interfaces
export type {
  IKnowledgeRegistryService,
  IUserProgressService,
  MasteryOverview,
} from './services/interfaces.js';

// Service implementations
export { KnowledgeRegistryService } from './services/knowledge-registry.js';
export type { KnowledgeUnitHydrator } from './services/knowledge-registry.js';
export { UserProgressService } from './services/user-progress.js';
export { SpacedRepetitionService } from './services/spaced-repetition.js';
export { ScheduleService } from './services/schedule.js';
export type { ScheduleKnowledgeUnit, ScheduleParams, ScheduleResult } from './services/schedule.js';
