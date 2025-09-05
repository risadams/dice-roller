/**
 * @fileoverview Type definitions for session management system
 * @module SessionTypes
 */

import { DiceResult } from '../utils';

/**
 * Unique identifier for sessions and rolls
 */
export type SessionId = string;
export type RollId = string;

/**
 * Metadata about how a roll was performed
 */
export interface RollMetadata {
  /** The method used to generate the roll */
  method: 'roll' | 'rollWithModifier' | 'rollExpression' | 'rollExploding' | 'rollPenetrating' | 'rollCompounding' | 'rollSuccessPool' | 'rollKeepHighest' | 'rollKeepLowest' | 'rollDropHighest' | 'rollDropLowest' | 'rollKeepMiddle' | 'rollKeepConditional' | 'rollStepDice';
  
  /** Original parameters used for the roll */
  parameters: Record<string, any>;
  
  /** Expression string if applicable */
  expression?: string;
  
  /** User-provided description or label */
  description?: string;
  
  /** Tags for categorization */
  tags?: string[];
  
  /** Context information (e.g., game system, character name) */
  context?: Record<string, any>;
}

/**
 * A recorded roll with full history information
 */
export interface RollHistoryEntry {
  /** Unique identifier for this roll */
  id: RollId;
  
  /** When the roll was made */
  timestamp: Date;
  
  /** The actual roll result */
  result: DiceResult;
  
  /** Metadata about how the roll was performed */
  metadata: RollMetadata;
  
  /** Random seed used (if available) for replay */
  seed?: number;
  
  /** Index in the session (0-based) */
  index: number;
}

/**
 * Session statistics computed from roll history
 */
export interface SessionStatistics {
  /** Total number of rolls in the session */
  totalRolls: number;
  
  /** Session duration in milliseconds */
  duration: number;
  
  /** Distribution of roll methods used */
  methodDistribution: Record<string, number>;
  
  /** Most frequently used dice types */
  diceDistribution: Record<string, number>;
  
  /** Total dice rolled across all rolls */
  totalDiceRolled: number;
  
  /** Average result per roll */
  averageResult: number;
  
  /** Highest and lowest single results */
  highestResult: number;
  lowestResult: number;
  
  /** Most recent activity timestamp */
  lastActivity: Date;
  
  /** Total time spent rolling (excluding idle time) */
  activeTime: number;
  
  /** Rolls per minute during active periods */
  rollsPerMinute: number;
  
  /** Breakdown by dice sides */
  sideDistribution: Record<number, number>;
  
  /** Success rates for success pool rolls */
  successRates?: {
    totalPools: number;
    averageSuccesses: number;
    successRate: number;
  };
}

/**
 * Configuration options for a dice session
 */
export interface SessionConfig {
  /** Maximum number of rolls to keep in history */
  maxHistorySize?: number;
  
  /** Whether to automatically compute statistics */
  autoStatistics?: boolean;
  
  /** Whether to track random seeds for replay */
  trackSeeds?: boolean;
  
  /** Default tags to apply to rolls */
  defaultTags?: string[];
  
  /** Default context information */
  defaultContext?: Record<string, any>;
  
  /** Whether to enable undo/redo functionality */
  enableUndoRedo?: boolean;
  
  /** Maximum undo history size */
  maxUndoHistory?: number;
}

/**
 * Session state for undo/redo operations
 */
export interface SessionState {
  /** Current roll history */
  history: RollHistoryEntry[];
  
  /** Current session statistics */
  statistics: SessionStatistics;
  
  /** Session metadata */
  metadata: SessionMetadata;
  
  /** Timestamp of this state */
  timestamp: Date;
}

/**
 * Metadata about a dice session
 */
export interface SessionMetadata {
  /** Unique session identifier */
  id: SessionId;
  
  /** Human-readable session name */
  name?: string;
  
  /** Session description */
  description?: string;
  
  /** When the session was created */
  created: Date;
  
  /** When the session was last modified */
  lastModified: Date;
  
  /** Session version for compatibility */
  version: string;
  
  /** Tags for organization */
  tags?: string[];
  
  /** Additional metadata */
  customData?: Record<string, any>;
}

/**
 * Serializable session data for export/import
 */
export interface SessionData {
  /** Session metadata */
  metadata: SessionMetadata;
  
  /** Complete roll history */
  history: RollHistoryEntry[];
  
  /** Session configuration */
  config: SessionConfig;
  
  /** Computed statistics */
  statistics: SessionStatistics;
  
  /** Export timestamp */
  exportedAt: Date;
  
  /** Format version for compatibility */
  formatVersion: string;
}

/**
 * Options for session export
 */
export interface ExportOptions {
  /** Whether to include full roll details */
  includeRollDetails?: boolean;
  
  /** Whether to include random seeds */
  includeSeeds?: boolean;
  
  /** Whether to compress the output */
  compress?: boolean;
  
  /** Date range to export */
  dateRange?: {
    start: Date;
    end: Date;
  };
  
  /** Filter by tags */
  tags?: string[];
  
  /** Filter by roll methods */
  methods?: string[];
}

/**
 * Result of a session import operation
 */
export interface ImportResult {
  /** Whether the import was successful */
  success: boolean;
  
  /** Error message if import failed */
  error?: string;
  
  /** Warnings during import */
  warnings?: string[];
  
  /** Number of rolls imported */
  rollsImported: number;
  
  /** Session metadata from imported data */
  sessionMetadata?: SessionMetadata;
  
  /** Format version of imported data */
  formatVersion?: string;
}

/**
 * Event types for session events
 */
export type SessionEventType = 
  | 'session:created'
  | 'session:loaded'
  | 'session:saved'
  | 'session:cleared'
  | 'roll:added'
  | 'roll:undone'
  | 'roll:redone'
  | 'statistics:updated';

/**
 * Session event data
 */
export interface SessionEvent {
  /** Event type */
  type: SessionEventType;
  
  /** Event timestamp */
  timestamp: Date;
  
  /** Session ID */
  sessionId: SessionId;
  
  /** Event-specific data */
  data?: any;
}

/**
 * Session event listener function
 */
export type SessionEventListener = (event: SessionEvent) => void;
