/**
 * @fileoverview Core DiceSession class for managing dice rolling sessions
 * @module DiceSession
 */

import { generateUUID } from '../utils/UuidUtils';
import { 
  SessionId, 
  RollId, 
  RollHistoryEntry, 
  RollMetadata, 
  SessionConfig, 
  SessionStatistics, 
  SessionState, 
  SessionMetadata, 
  SessionData,
  ExportOptions,
  ImportResult,
  SessionEvent,
  SessionEventType,
  SessionEventListener
} from './SessionTypes';
import { DiceResult } from '../utils';

/**
 * Default session configuration
 */
const DEFAULT_CONFIG: Required<SessionConfig> = {
  maxHistorySize: 10000,
  autoStatistics: true,
  trackSeeds: false,
  defaultTags: [],
  defaultContext: {},
  enableUndoRedo: true,
  maxUndoHistory: 100
};

/**
 * Current format version for session data
 */
const CURRENT_FORMAT_VERSION = '1.0.0';

/**
 * Main session management class for tracking dice rolls and managing session state
 */
export class DiceSession {
  private readonly _id: SessionId;
  private _metadata: SessionMetadata;
  private _config: Required<SessionConfig>;
  private _history: RollHistoryEntry[] = [];
  private _statistics: SessionStatistics;
  private _undoStack: SessionState[] = [];
  private _redoStack: SessionState[] = [];
  private _eventListeners: Map<SessionEventType, SessionEventListener[]> = new Map();
  private _rollCounter = 0;

  /**
   * Creates a new DiceSession
   * @param config Optional session configuration
   * @param metadata Optional session metadata
   */
  constructor(config: SessionConfig = {}, metadata?: Partial<SessionMetadata>) {
    this._id = generateUUID();
    this._config = { ...DEFAULT_CONFIG, ...config };
    
    const now = new Date();
    this._metadata = {
      id: this._id,
      name: metadata?.name || `Session ${now.toISOString().split('T')[0]}`,
      description: metadata?.description,
      created: now,
      lastModified: now,
      version: CURRENT_FORMAT_VERSION,
      tags: metadata?.tags,
      customData: metadata?.customData,
      ...metadata
    };

    this._statistics = this._createInitialStatistics();
    
    this._emitEvent('session:created', { sessionId: this._id });
  }

  /**
   * Gets the session ID
   */
  public get id(): SessionId {
    return this._id;
  }

  /**
   * Gets the session metadata
   */
  public get metadata(): SessionMetadata {
    return { ...this._metadata };
  }

  /**
   * Gets the session configuration
   */
  public get config(): SessionConfig {
    return { ...this._config };
  }

  /**
   * Gets the current roll history
   */
  public get history(): ReadonlyArray<RollHistoryEntry> {
    return [...this._history];
  }

  /**
   * Gets the current session statistics
   */
  public get statistics(): SessionStatistics {
    return { ...this._statistics };
  }

  /**
   * Gets the total number of rolls in the session
   */
  public get rollCount(): number {
    return this._history.length;
  }

  /**
   * Gets whether undo is available
   */
  public get canUndo(): boolean {
    return this._config.enableUndoRedo && this._undoStack.length > 0;
  }

  /**
   * Gets whether redo is available
   */
  public get canRedo(): boolean {
    return this._config.enableUndoRedo && this._redoStack.length > 0;
  }

  /**
   * Records a new dice roll in the session
   * @param result The dice roll result
   * @param metadata Metadata about how the roll was performed
   * @param seed Optional random seed for replay
   * @returns The roll ID
   */
  public addRoll(result: DiceResult, metadata: RollMetadata, seed?: number): RollId {
    if (this._config.enableUndoRedo) {
      this._saveStateForUndo();
    }

    const rollId = generateUUID();
    const now = new Date();
    
    const entry: RollHistoryEntry = {
      id: rollId,
      timestamp: now,
      result: { ...result },
      metadata: {
        ...metadata,
        tags: [...(metadata.tags || []), ...this._config.defaultTags],
        context: { ...this._config.defaultContext, ...(metadata.context || {}) }
      },
      seed: this._config.trackSeeds ? seed : undefined,
      index: this._rollCounter++
    };

    this._history.push(entry);
    this._metadata.lastModified = now;

    // Enforce history size limit
    if (this._history.length > this._config.maxHistorySize) {
      this._history.shift();
    }

    // Update statistics if enabled
    if (this._config.autoStatistics) {
      this._updateStatistics();
    }

    // Clear redo stack since we're adding a new state
    this._redoStack = [];

    this._emitEvent('roll:added', { rollId, sessionId: this._id });

    return rollId;
  }

  /**
   * Removes a roll from the session by ID
   * @param rollId The ID of the roll to remove
   * @returns True if the roll was found and removed
   */
  public removeRoll(rollId: RollId): boolean {
    if (this._config.enableUndoRedo) {
      this._saveStateForUndo();
    }

    const index = this._history.findIndex(entry => entry.id === rollId);
    if (index === -1) {
      return false;
    }

    this._history.splice(index, 1);
    this._metadata.lastModified = new Date();

    // Update indices for remaining rolls
    for (let i = index; i < this._history.length; i++) {
      this._history[i].index = i;
    }

    if (this._config.autoStatistics) {
      this._updateStatistics();
    }

    this._redoStack = [];

    return true;
  }

  /**
   * Gets a specific roll by ID
   * @param rollId The roll ID to find
   * @returns The roll entry or undefined if not found
   */
  public getRoll(rollId: RollId): RollHistoryEntry | undefined {
    return this._history.find(entry => entry.id === rollId);
  }

  /**
   * Gets rolls within a date range
   * @param start Start date
   * @param end End date
   * @returns Array of roll entries within the range
   */
  public getRollsInRange(start: Date, end: Date): RollHistoryEntry[] {
    return this._history.filter(entry => 
      entry.timestamp >= start && entry.timestamp <= end
    );
  }

  /**
   * Gets rolls with specific tags
   * @param tags Tags to filter by
   * @returns Array of roll entries with any of the specified tags
   */
  public getRollsByTags(tags: string[]): RollHistoryEntry[] {
    return this._history.filter(entry =>
      entry.metadata.tags?.some(tag => tags.includes(tag))
    );
  }

  /**
   * Gets rolls by method
   * @param method The roll method to filter by
   * @returns Array of roll entries using the specified method
   */
  public getRollsByMethod(method: string): RollHistoryEntry[] {
    return this._history.filter(entry => entry.metadata.method === method);
  }

  /**
   * Undoes the last operation
   * @returns True if undo was successful
   */
  public undo(): boolean {
    if (!this.canUndo) {
      return false;
    }

    const currentState = this._createCurrentState();
    this._redoStack.push(currentState);

    const previousState = this._undoStack.pop()!;
    this._restoreState(previousState);

    this._emitEvent('roll:undone', { sessionId: this._id });

    return true;
  }

  /**
   * Redoes the last undone operation
   * @returns True if redo was successful
   */
  public redo(): boolean {
    if (!this.canRedo) {
      return false;
    }

    const currentState = this._createCurrentState();
    this._undoStack.push(currentState);

    const nextState = this._redoStack.pop()!;
    this._restoreState(nextState);

    this._emitEvent('roll:redone', { sessionId: this._id });

    return true;
  }

  /**
   * Clears the entire session history
   */
  public clear(): void {
    if (this._config.enableUndoRedo) {
      this._saveStateForUndo();
    }

    this._history = [];
    this._rollCounter = 0;
    this._metadata.lastModified = new Date();
    this._statistics = this._createInitialStatistics();
    this._redoStack = [];

    this._emitEvent('session:cleared', { sessionId: this._id });
  }

  /**
   * Updates session metadata
   * @param updates Partial metadata updates
   */
  public updateMetadata(updates: Partial<SessionMetadata>): void {
    this._metadata = {
      ...this._metadata,
      ...updates,
      id: this._id, // Prevent ID changes
      lastModified: new Date()
    };
  }

  /**
   * Updates session configuration
   * @param updates Partial configuration updates
   */
  public updateConfig(updates: Partial<SessionConfig>): void {
    this._config = { ...this._config, ...updates };
    
    // Re-enforce history size limit if it was reduced
    if (updates.maxHistorySize && this._history.length > updates.maxHistorySize) {
      this._history = this._history.slice(-updates.maxHistorySize);
    }

    // Update statistics if auto-statistics was enabled
    if (updates.autoStatistics && !this._config.autoStatistics) {
      this._updateStatistics();
    }
  }

  /**
   * Manually updates session statistics
   */
  public updateStatistics(): void {
    this._updateStatistics();
    this._emitEvent('statistics:updated', { sessionId: this._id });
  }

  /**
   * Exports session data for saving or sharing
   * @param options Export options
   * @returns Serializable session data
   */
  public export(options: ExportOptions = {}): SessionData {
    let history = this._history;

    // Apply filters
    if (options.dateRange) {
      history = history.filter(entry =>
        entry.timestamp >= options.dateRange!.start &&
        entry.timestamp <= options.dateRange!.end
      );
    }

    if (options.tags && options.tags.length > 0) {
      history = history.filter(entry =>
        entry.metadata.tags?.some(tag => options.tags!.includes(tag))
      );
    }

    if (options.methods && options.methods.length > 0) {
      history = history.filter(entry =>
        options.methods!.includes(entry.metadata.method)
      );
    }

    // Remove seeds if not requested
    if (!options.includeSeeds) {
      history = history.map(entry => ({
        ...entry,
        seed: undefined
      }));
    }

    const sessionData: SessionData = {
      metadata: { ...this._metadata },
      history,
      config: { ...this._config },
      statistics: { ...this._statistics },
      exportedAt: new Date(),
      formatVersion: CURRENT_FORMAT_VERSION
    };

    return sessionData;
  }

  /**
   * Imports session data from a previous export
   * @param sessionData The session data to import
   * @param merge Whether to merge with existing data or replace
   * @returns Import result
   */
  public import(sessionData: SessionData, merge: boolean = false): ImportResult {
    try {
      // Validate format version
      if (sessionData.formatVersion !== CURRENT_FORMAT_VERSION) {
        return {
          success: false,
          error: `Unsupported format version: ${sessionData.formatVersion}`,
          rollsImported: 0
        };
      }

      const warnings: string[] = [];

      if (!merge) {
        this.clear();
        this._metadata = { ...sessionData.metadata, id: this._id };
        this._config = { ...DEFAULT_CONFIG, ...sessionData.config };
      }

      let rollsImported = 0;
      for (const entry of sessionData.history) {
        // Regenerate IDs to avoid conflicts
        const newEntry: RollHistoryEntry = {
          ...entry,
          id: generateUUID(),
          index: this._rollCounter++
        };

        this._history.push(newEntry);
        rollsImported++;

        // Enforce history size limit
        if (this._history.length > this._config.maxHistorySize) {
          const removed = this._history.shift();
          if (removed) {
            warnings.push(`Removed oldest roll due to history size limit`);
          }
        }
      }

      this._metadata.lastModified = new Date();
      
      if (this._config.autoStatistics) {
        this._updateStatistics();
      }

      this._emitEvent('session:loaded', { sessionId: this._id });

      return {
        success: true,
        rollsImported,
        warnings: warnings.length > 0 ? warnings : undefined,
        sessionMetadata: sessionData.metadata,
        formatVersion: sessionData.formatVersion
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown import error',
        rollsImported: 0
      };
    }
  }

  /**
   * Adds an event listener
   * @param eventType The event type to listen for
   * @param listener The listener function
   */
  public addEventListener(eventType: SessionEventType, listener: SessionEventListener): void {
    if (!this._eventListeners.has(eventType)) {
      this._eventListeners.set(eventType, []);
    }
    this._eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Removes an event listener
   * @param eventType The event type
   * @param listener The listener function to remove
   */
  public removeEventListener(eventType: SessionEventType, listener: SessionEventListener): void {
    const listeners = this._eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index >= 0) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Creates initial statistics object
   */
  private _createInitialStatistics(): SessionStatistics {
    const now = new Date();
    return {
      totalRolls: 0,
      duration: 0,
      methodDistribution: {},
      diceDistribution: {},
      totalDiceRolled: 0,
      averageResult: 0,
      highestResult: 0,
      lowestResult: 0,
      lastActivity: now,
      activeTime: 0,
      rollsPerMinute: 0,
      sideDistribution: {}
    };
  }

  /**
   * Updates session statistics based on current history
   */
  private _updateStatistics(): void {
    if (this._history.length === 0) {
      this._statistics = this._createInitialStatistics();
      return;
    }

    const methodDistribution: Record<string, number> = {};
    const diceDistribution: Record<string, number> = {};
    const sideDistribution: Record<number, number> = {};
    let totalDiceRolled = 0;
    let totalResult = 0;
    let highestResult = Number.NEGATIVE_INFINITY;
    let lowestResult = Number.POSITIVE_INFINITY;

    let successPools = 0;
    let totalSuccesses = 0;

    for (const entry of this._history) {
      // Method distribution
      methodDistribution[entry.metadata.method] = 
        (methodDistribution[entry.metadata.method] || 0) + 1;

      // Result statistics
      const result = typeof entry.result.result === 'number' ? entry.result.result : 0;
      totalResult += result;
      highestResult = Math.max(highestResult, result);
      lowestResult = Math.min(lowestResult, result);

      // Dice statistics
      if (entry.result.rolls) {
        totalDiceRolled += entry.result.rolls.length;
        
        // Extract dice information from parameters
        const params = entry.metadata.parameters;
        if (params.sides) {
          const diceKey = `d${params.sides}`;
          diceDistribution[diceKey] = (diceDistribution[diceKey] || 0) + (params.count || 1);
          sideDistribution[params.sides] = (sideDistribution[params.sides] || 0) + (params.count || 1);
        }
      }

      // Success pool statistics
      if (entry.metadata.method === 'rollSuccessPool') {
        successPools++;
        // Assuming success count is stored in result or details
        // This would need to be enhanced based on actual SuccessPool implementation
      }
    }

    const firstRoll = this._history[0];
    const lastRoll = this._history[this._history.length - 1];
    const duration = lastRoll.timestamp.getTime() - firstRoll.timestamp.getTime();

    this._statistics = {
      totalRolls: this._history.length,
      duration,
      methodDistribution,
      diceDistribution,
      totalDiceRolled,
      averageResult: totalResult / this._history.length,
      highestResult: highestResult === Number.NEGATIVE_INFINITY ? 0 : highestResult,
      lowestResult: lowestResult === Number.POSITIVE_INFINITY ? 0 : lowestResult,
      lastActivity: lastRoll.timestamp,
      activeTime: duration, // Simplified - could be enhanced to track actual active time
      rollsPerMinute: duration > 0 ? (this._history.length / (duration / 60000)) : 0,
      sideDistribution,
      successRates: successPools > 0 ? {
        totalPools: successPools,
        averageSuccesses: totalSuccesses / successPools,
        successRate: totalSuccesses / (successPools * (totalDiceRolled / this._history.length))
      } : undefined
    };
  }

  /**
   * Saves current state for undo
   */
  private _saveStateForUndo(): void {
    if (!this._config.enableUndoRedo) {
      return;
    }

    const state = this._createCurrentState();
    this._undoStack.push(state);

    // Enforce undo history limit
    if (this._undoStack.length > this._config.maxUndoHistory) {
      this._undoStack.shift();
    }
  }

  /**
   * Creates a snapshot of current state
   */
  private _createCurrentState(): SessionState {
    return {
      history: [...this._history],
      statistics: { ...this._statistics },
      metadata: { ...this._metadata },
      timestamp: new Date()
    };
  }

  /**
   * Restores state from a snapshot
   */
  private _restoreState(state: SessionState): void {
    this._history = [...state.history];
    this._statistics = { ...state.statistics };
    this._metadata = { ...state.metadata, lastModified: new Date() };
    
    // Update roll counter to highest index + 1
    this._rollCounter = this._history.length > 0 
      ? Math.max(...this._history.map(entry => entry.index)) + 1
      : 0;
  }

  /**
   * Emits a session event
   */
  private _emitEvent(type: SessionEventType, data?: any): void {
    const event: SessionEvent = {
      type,
      timestamp: new Date(),
      sessionId: this._id,
      data
    };

    const listeners = this._eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in session event listener for ${type}:`, error);
        }
      });
    }
  }
}
