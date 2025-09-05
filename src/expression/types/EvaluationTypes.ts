/**
 * Types for evaluation results and step-by-step explanations
 */

import type { ExpressionNode } from './ExpressionTypes';

/**
 * Basic result of evaluating an expression
 */
export interface EvaluationResult {
  value: number;
  originalExpression: string;
}

/**
 * Detailed result including intermediate values and dice rolls
 */
export interface DetailedEvaluationResult extends EvaluationResult {
  rolls: number[];
  minValue: number;
  maxValue: number;
  executionTime?: number;
}

/**
 * Individual step in the evaluation explanation
 */
export interface EvaluationStep {
  step: number;
  operation: string;
  description: string;
  value: number;
  details?: string;
  rolls?: number[];
  node?: ExpressionNode;
}

/**
 * Complete explanation of expression evaluation
 */
export interface EvaluationExplanation {
  originalExpression: string;
  tokenization: string[];
  parsing: string;
  steps: EvaluationStep[];
  finalResult: number;
  executionTime?: number;
}

/**
 * Result of dice roll evaluation within expression context
 */
export interface ExpressionDiceResult {
  rolls: number[];
  total: number;
  count: number;
  sides: number;
}

/**
 * Result of conditional dice evaluation
 */
export interface ConditionalDiceResult extends ExpressionDiceResult {
  successes: number;
  threshold: number;
  condition: string;
  successfulRolls: number[];
  failedRolls: number[];
}

/**
 * Result of reroll dice evaluation
 */
export interface RerollDiceResult extends ExpressionDiceResult {
  rerollCount: number;
  maxRerollsReached: boolean;
  rerollType: string;
  condition: string;
  allRolls: number[]; // includes rerolls
  finalRolls: number[]; // final dice values
}

/**
 * Range information for expressions
 */
export interface ExpressionRange {
  minimum: number;
  maximum: number;
  average: number;
}

/**
 * Performance metrics for evaluation
 */
export interface EvaluationMetrics {
  executionTime: number;
  nodesEvaluated: number;
  diceRolled: number;
  rerollsPerformed: number;
  memoryUsed?: number;
}

/**
 * Context for evaluation (shared state)
 */
export interface EvaluationContext {
  randomProvider: () => number;
  maxRerolls: number;
  maxExecutionTime: number;
  enableExplanation: boolean;
  stepCounter: number;
  metrics: EvaluationMetrics;
}

/**
 * Configuration for evaluators
 */
export interface EvaluatorConfig {
  maxRerolls: number;
  maxExecutionTime: number;
  enableMetrics: boolean;
  enableCaching: boolean;
  randomProvider?: () => number;
}

/**
 * Configuration for expression context
 */
export interface ContextConfiguration {
  maxRerolls: number;
  maxExecutionTime: number;
  enableExplanation: boolean;
  enableMetrics: boolean;
  randomSeed?: number;
  debugMode: boolean;
}

/**
 * Evaluation error with context
 */
export class EvaluationError extends Error {
  constructor(
    message: string,
    public node?: ExpressionNode,
    public context?: string,
    public value?: number
  ) {
    super(`Evaluation error: ${message}${context ? ` in ${context}` : ''}${value !== undefined ? ` (value: ${value})` : ''}`);
    this.name = 'EvaluationError';
  }
}

/**
 * Timeout error for long-running evaluations
 */
export class EvaluationTimeoutError extends EvaluationError {
  constructor(timeLimit: number, actualTime: number) {
    super(`Evaluation timed out after ${actualTime}ms (limit: ${timeLimit}ms)`);
    this.name = 'EvaluationTimeoutError';
  }
}

/**
 * Error for too many rerolls
 */
export class MaxRerollsExceededError extends EvaluationError {
  constructor(maxRerolls: number, node?: ExpressionNode) {
    super(`Maximum rerolls exceeded (${maxRerolls})`, node, 'reroll evaluation');
    this.name = 'MaxRerollsExceededError';
  }
}

/**
 * Result caching interface
 */
export interface CacheEntry {
  expression: string;
  result: EvaluationResult;
  timestamp: number;
  hitCount: number;
}

export interface EvaluationCache {
  get(key: string): CacheEntry | undefined;
  set(key: string, result: EvaluationResult): void;
  clear(): void;
  size(): number;
  getStats(): {
    hits: number;
    misses: number;
    hitRate: number;
    entries: number;
  };
}

/**
 * Event types for evaluation lifecycle
 */
export type EvaluationEvent = 
  | 'evaluation_start'
  | 'evaluation_complete'
  | 'evaluation_error'
  | 'step_start'
  | 'step_complete'
  | 'dice_roll'
  | 'reroll_triggered'
  | 'cache_hit'
  | 'cache_miss';

/**
 * Event data interface
 */
export interface EvaluationEventData {
  event: EvaluationEvent;
  timestamp: number;
  node?: ExpressionNode;
  step?: EvaluationStep;
  result?: any;
  error?: Error;
}

/**
 * Event listener interface
 */
export interface EvaluationEventListener {
  (event: EvaluationEventData): void;
}

/**
 * Statistics for expression evaluation
 */
export interface EvaluationStatistics {
  totalEvaluations: number;
  averageExecutionTime: number;
  cacheHitRate: number;
  mostCommonExpressions: Array<{
    expression: string;
    count: number;
  }>;
  errorRate: number;
  averageDiceRolled: number;
}

/**
 * Type guards for evaluation results
 */
export namespace EvaluationResultGuards {
  export function isDetailedResult(result: EvaluationResult): result is DetailedEvaluationResult {
    return 'rolls' in result;
  }

  export function isConditionalResult(result: ExpressionDiceResult): result is ConditionalDiceResult {
    return 'successes' in result;
  }

  export function isRerollResult(result: ExpressionDiceResult): result is RerollDiceResult {
    return 'rerollCount' in result;
  }
}

/**
 * Utility functions for evaluation results
 */
export namespace EvaluationUtils {
  /**
   * Calculate average execution time from metrics
   */
  export function calculateAverageTime(metrics: EvaluationMetrics[]): number {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.executionTime, 0) / metrics.length;
  }

  /**
   * Format evaluation step for display
   */
  export function formatStep(step: EvaluationStep): string {
    let formatted = `${step.step}. ${step.operation} → ${step.description}`;
    if (step.details) {
      formatted += ` (${step.details})`;
    }
    if (step.rolls && step.rolls.length > 0) {
      formatted += ` [rolls: ${step.rolls.join(', ')}]`;
    }
    return formatted;
  }

  /**
   * Create metrics object with default values
   */
  export function createMetrics(): EvaluationMetrics {
    return {
      executionTime: 0,
      nodesEvaluated: 0,
      diceRolled: 0,
      rerollsPerformed: 0
    };
  }

  /**
   * Merge multiple metrics objects
   */
  export function mergeMetrics(metrics: EvaluationMetrics[]): EvaluationMetrics {
    return metrics.reduce((acc, curr) => ({
      executionTime: acc.executionTime + curr.executionTime,
      nodesEvaluated: acc.nodesEvaluated + curr.nodesEvaluated,
      diceRolled: acc.diceRolled + curr.diceRolled,
      rerollsPerformed: acc.rerollsPerformed + curr.rerollsPerformed,
      memoryUsed: (acc.memoryUsed || 0) + (curr.memoryUsed || 0)
    }), createMetrics());
  }
}
