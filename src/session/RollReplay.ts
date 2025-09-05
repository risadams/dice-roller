/**
 * @fileoverview Roll replay system for recreating previous dice roll sequences
 * @module RollReplay
 */

import { DiceSession } from './DiceSession';
import { RollHistoryEntry, RollId } from './SessionTypes';
import { DiceResult } from '../utils';

/**
 * Result of a replay operation
 */
export interface ReplayResult {
  /** Whether the replay was successful */
  success: boolean;
  
  /** Error message if replay failed */
  error?: string;
  
  /** Number of rolls successfully replayed */
  rollsReplayed: number;
  
  /** The replayed roll results */
  results: DiceResult[];
  
  /** Original roll entries that were replayed */
  originalEntries: RollHistoryEntry[];
  
  /** Whether results match exactly (if seeds were available) */
  exactMatch?: boolean;
}

/**
 * Options for replay operations
 */
export interface ReplayOptions {
  /** Whether to add replayed rolls to the current session */
  addToSession?: boolean;
  
  /** Whether to use original seeds (if available) */
  useOriginalSeeds?: boolean;
  
  /** Custom random function to use for replay */
  randomFunction?: () => number;
  
  /** Tags to add to replayed rolls */
  replayTags?: string[];
  
  /** Whether to validate results match original (if seeds available) */
  validateResults?: boolean;
}

/**
 * Seeded random number generator for deterministic replay
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Generates the next random number in sequence
   * @returns Random number between 0 and 1
   */
  public random(): number {
    // Simple Linear Congruential Generator (LCG)
    // Note: For production use, consider a more robust PRNG
    this.seed = (this.seed * 1664525 + 1013904223) % (2 ** 32);
    return this.seed / (2 ** 32);
  }

  /**
   * Resets the generator to initial seed
   * @param newSeed Optional new seed value
   */
  public reset(newSeed?: number): void {
    if (newSeed !== undefined) {
      this.seed = newSeed;
    }
  }
}

/**
 * Roll replay system for recreating dice roll sequences
 */
export class RollReplay {
  private session: DiceSession;
  private roller: any; // Will be injected - the main Roller instance

  constructor(session: DiceSession, roller?: any) {
    this.session = session;
    this.roller = roller;
  }

  /**
   * Sets the roller instance for executing replays
   * @param roller The main Roller instance
   */
  public setRoller(roller: any): void {
    this.roller = roller;
  }

  /**
   * Replays a single roll by ID
   * @param rollId The ID of the roll to replay
   * @param options Replay options
   * @returns Replay result
   */
  public replayRoll(rollId: RollId, options: ReplayOptions = {}): ReplayResult {
    const entry = this.session.getRoll(rollId);
    if (!entry) {
      return {
        success: false,
        error: `Roll with ID ${rollId} not found`,
        rollsReplayed: 0,
        results: [],
        originalEntries: []
      };
    }

    return this.replayRolls([entry], options);
  }

  /**
   * Replays multiple rolls
   * @param entries The roll entries to replay
   * @param options Replay options
   * @returns Replay result
   */
  public replayRolls(entries: RollHistoryEntry[], options: ReplayOptions = {}): ReplayResult {
    if (!this.roller) {
      return {
        success: false,
        error: 'No roller instance available for replay',
        rollsReplayed: 0,
        results: [],
        originalEntries: entries
      };
    }

    const results: DiceResult[] = [];
    let rollsReplayed = 0;
    let exactMatch = true;

    try {
      for (const entry of entries) {
        const replayResult = this._replayEntry(entry, options);
        
        if (replayResult) {
          results.push(replayResult);
          rollsReplayed++;

          // Check for exact match if we have seeds and validation is enabled
          if (options.validateResults && entry.seed !== undefined && options.useOriginalSeeds) {
            const originalResult = entry.result.result;
            const replayedResult = replayResult.result;
            if (originalResult !== replayedResult) {
              exactMatch = false;
            }
          }

          // Add to session if requested
          if (options.addToSession) {
            const replayMetadata = {
              ...entry.metadata,
              description: `Replay of ${entry.metadata.description || 'roll'}`,
              tags: [
                ...(entry.metadata.tags || []),
                'replay',
                ...(options.replayTags || [])
              ],
              context: {
                ...entry.metadata.context,
                originalRollId: entry.id,
                originalTimestamp: entry.timestamp,
                replayedAt: new Date()
              }
            };

            this.session.addRoll(replayResult, replayMetadata, entry.seed);
          }
        } else {
          // Failed to replay this entry
          return {
            success: false,
            error: `Failed to replay roll: ${entry.metadata.method}`,
            rollsReplayed,
            results,
            originalEntries: entries
          };
        }
      }

      return {
        success: true,
        rollsReplayed,
        results,
        originalEntries: entries,
        exactMatch: options.validateResults ? exactMatch : undefined
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown replay error',
        rollsReplayed,
        results,
        originalEntries: entries
      };
    }
  }

  /**
   * Replays all rolls in the session
   * @param options Replay options
   * @returns Replay result
   */
  public replayAll(options: ReplayOptions = {}): ReplayResult {
    const allEntries = [...this.session.history];
    return this.replayRolls(allEntries, options);
  }

  /**
   * Replays rolls within a date range
   * @param start Start date
   * @param end End date
   * @param options Replay options
   * @returns Replay result
   */
  public replayRange(start: Date, end: Date, options: ReplayOptions = {}): ReplayResult {
    const entries = this.session.getRollsInRange(start, end);
    return this.replayRolls(entries, options);
  }

  /**
   * Replays rolls with specific tags
   * @param tags Tags to filter by
   * @param options Replay options
   * @returns Replay result
   */
  public replayByTags(tags: string[], options: ReplayOptions = {}): ReplayResult {
    const entries = this.session.getRollsByTags(tags);
    return this.replayRolls(entries, options);
  }

  /**
   * Replays rolls by method
   * @param method The roll method to replay
   * @param options Replay options
   * @returns Replay result
   */
  public replayByMethod(method: string, options: ReplayOptions = {}): ReplayResult {
    const entries = this.session.getRollsByMethod(method);
    return this.replayRolls(entries, options);
  }

  /**
   * Creates a replay scenario for testing or demonstration
   * @param entries Roll entries to include in scenario
   * @param name Scenario name
   * @param description Scenario description
   * @returns Scenario data that can be saved/shared
   */
  public createScenario(
    entries: RollHistoryEntry[], 
    name: string, 
    description?: string
  ): ReplayScenario {
    return {
      name,
      description,
      entries: entries.map(entry => ({
        ...entry,
        // Remove session-specific IDs for portability
        id: `scenario-${entry.index}`,
      })),
      createdAt: new Date(),
      version: '1.0.0'
    };
  }

  /**
   * Replays a scenario
   * @param scenario The scenario to replay
   * @param options Replay options
   * @returns Replay result
   */
  public replayScenario(scenario: ReplayScenario, options: ReplayOptions = {}): ReplayResult {
    return this.replayRolls(scenario.entries, options);
  }

  /**
   * Validates that a replay would work for given entries
   * @param entries Entries to validate
   * @returns Validation result
   */
  public validateReplay(entries: RollHistoryEntry[]): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!this.roller) {
      issues.push('No roller instance available');
    }

    for (const entry of entries) {
      // Check if we can replay this method
      if (!this._canReplayMethod(entry.metadata.method)) {
        issues.push(`Cannot replay method: ${entry.metadata.method}`);
      }

      // Check if parameters are valid
      if (!entry.metadata.parameters) {
        issues.push(`Missing parameters for roll ${entry.id}`);
      }

      // Check for seed availability if exact replay is needed
      if (entry.seed === undefined) {
        issues.push(`No seed available for exact replay of roll ${entry.id}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Replays a single entry
   * @param entry The entry to replay
   * @param options Replay options
   * @returns The replayed result or null if failed
   */
  private _replayEntry(entry: RollHistoryEntry, options: ReplayOptions): DiceResult | null {
    const { method, parameters, expression } = entry.metadata;

    // Set up random function
    let originalRandomFunction: (() => number) | undefined;
    if (options.useOriginalSeeds && entry.seed !== undefined) {
      const seededRandom = new SeededRandom(entry.seed);
      originalRandomFunction = this.roller.randomFunction;
      this.roller.setRandomFunction(() => seededRandom.random());
    } else if (options.randomFunction) {
      originalRandomFunction = this.roller.randomFunction;
      this.roller.setRandomFunction(options.randomFunction);
    }

    try {
      let result: DiceResult | null = null;

      // Replay based on method
      switch (method) {
        case 'roll':
          result = this.roller.roll(parameters.count, parameters.sides);
          break;
        
        case 'rollWithModifier':
          result = this.roller.rollWithModifier(parameters.count, parameters.sides, parameters.modifier);
          break;
        
        case 'rollExpression':
          if (expression) {
            result = this.roller.rollExpression(expression);
          }
          break;
        
        case 'rollExploding':
          result = this.roller.rollExploding(parameters.count, parameters.sides, parameters.maxExplosions);
          break;
        
        case 'rollPenetrating':
          result = this.roller.rollPenetrating(parameters.count, parameters.sides, parameters.maxExplosions);
          break;
        
        case 'rollCompounding':
          result = this.roller.rollCompounding(parameters.count, parameters.sides, parameters.maxExplosions);
          break;
        
        case 'rollSuccessPool':
          result = this.roller.rollSuccessPool(parameters.count, parameters.sides, parameters.threshold, parameters.options);
          break;
        
        case 'rollKeepHighest':
          result = this.roller.rollKeepHighest(parameters.count, parameters.sides, parameters.keep);
          break;
        
        case 'rollKeepLowest':
          result = this.roller.rollKeepLowest(parameters.count, parameters.sides, parameters.keep);
          break;
        
        case 'rollDropHighest':
          result = this.roller.rollDropHighest(parameters.count, parameters.sides, parameters.drop);
          break;
        
        case 'rollDropLowest':
          result = this.roller.rollDropLowest(parameters.count, parameters.sides, parameters.drop);
          break;
        
        case 'rollKeepMiddle':
          result = this.roller.rollKeepMiddle(parameters.count, parameters.sides, parameters.keep);
          break;
        
        case 'rollStepDice':
          result = this.roller.rollStepDice(parameters.dieType, parameters.steps);
          break;
        
        default:
          console.warn(`Unknown roll method for replay: ${method}`);
          return null;
      }

      return result;

    } finally {
      // Restore original random function
      if (originalRandomFunction) {
        this.roller.setRandomFunction(originalRandomFunction);
      }
    }
  }

  /**
   * Checks if a method can be replayed
   * @param method The method name
   * @returns True if the method can be replayed
   */
  private _canReplayMethod(method: string): boolean {
    const supportedMethods = [
      'roll',
      'rollWithModifier', 
      'rollExpression',
      'rollExploding',
      'rollPenetrating',
      'rollCompounding',
      'rollSuccessPool',
      'rollKeepHighest',
      'rollKeepLowest',
      'rollDropHighest',
      'rollDropLowest',
      'rollKeepMiddle',
      'rollStepDice'
    ];
    
    return supportedMethods.includes(method);
  }
}

/**
 * Replay scenario data structure
 */
export interface ReplayScenario {
  /** Scenario name */
  name: string;
  
  /** Scenario description */
  description?: string;
  
  /** Roll entries in the scenario */
  entries: RollHistoryEntry[];
  
  /** When the scenario was created */
  createdAt: Date;
  
  /** Scenario format version */
  version: string;
}
