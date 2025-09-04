import {
  EvaluationContext,
  EvaluationMetrics,
  ContextConfiguration,
  ExpressionNode
} from './types';

/**
 * Default configuration for expression evaluation
 */
const DEFAULT_CONTEXT_CONFIG: ContextConfiguration = {
  maxRerolls: 100,
  maxExecutionTime: 5000,
  enableExplanation: false,
  enableMetrics: true,
  randomSeed: undefined,
  debugMode: false
};

/**
 * Expression context manager responsible for shared state, configuration, and metrics
 * 
 * Responsibilities:
 * - Manage evaluation configuration and limits
 * - Provide centralized random number generation
 * - Track performance metrics across evaluations
 * - Handle context lifecycle and cleanup
 * - Support seeded random generation for testing
 * - Manage debug and explanation modes
 */
export class ExpressionContext implements EvaluationContext {
  public readonly randomProvider: () => number;
  public readonly maxRerolls: number;
  public readonly maxExecutionTime: number;
  public readonly enableExplanation: boolean;
  public stepCounter: number = 0;
  public readonly metrics: EvaluationMetrics;

  private readonly config: ContextConfiguration;
  private readonly startTime: number;
  private seedGenerator: (() => number) | null = null;

  /**
   * Create a new expression context
   * @param config Optional configuration overrides
   */
  constructor(config: Partial<ContextConfiguration> = {}) {
    this.config = { ...DEFAULT_CONTEXT_CONFIG, ...config };
    this.startTime = Date.now();
    
    // Initialize metrics
    this.metrics = this.createInitialMetrics();
    
    // Setup random provider
    this.randomProvider = this.createRandomProvider();
    
    // Set context properties
    this.maxRerolls = this.config.maxRerolls;
    this.maxExecutionTime = this.config.maxExecutionTime;
    this.enableExplanation = this.config.enableExplanation;
  }

  /**
   * Create a child context with inherited configuration
   * @param overrides Configuration overrides for the child context
   * @returns New ExpressionContext with inherited and overridden settings
   */
  public createChildContext(overrides: Partial<ContextConfiguration> = {}): ExpressionContext {
    const childConfig = { ...this.config, ...overrides };
    const childContext = new ExpressionContext(childConfig);
    
    // Inherit step counter if not specifically overridden
    if (!overrides.hasOwnProperty('stepCounter')) {
      childContext.stepCounter = this.stepCounter;
    }
    
    return childContext;
  }

  /**
   * Reset the context for a new evaluation
   */
  public reset(): void {
    this.stepCounter = 0;
    this.metrics.executionTime = 0;
    this.metrics.nodesEvaluated = 0;
    this.metrics.diceRolled = 0;
    this.metrics.rerollsPerformed = 0;
    if (this.metrics.memoryUsed !== undefined) {
      this.metrics.memoryUsed = 0;
    }
  }

  /**
   * Record that a node was evaluated
   */
  public recordNodeEvaluation(node: ExpressionNode): void {
    this.metrics.nodesEvaluated++;
    this.stepCounter++;
    
    if (this.config.debugMode) {
      console.log(`[Context] Evaluated node: ${node.type} (step ${this.stepCounter})`);
    }
  }

  /**
   * Record that dice were rolled
   * @param count Number of dice rolled
   */
  public recordDiceRoll(count: number = 1): void {
    this.metrics.diceRolled += count;
    
    if (this.config.debugMode) {
      console.log(`[Context] Rolled ${count} dice (total: ${this.metrics.diceRolled})`);
    }
  }

  /**
   * Record that a reroll was performed
   */
  public recordReroll(): void {
    this.metrics.rerollsPerformed++;
    
    if (this.config.debugMode) {
      console.log(`[Context] Performed reroll (total: ${this.metrics.rerollsPerformed})`);
    }
  }

  /**
   * Update execution time
   */
  public updateExecutionTime(): void {
    this.metrics.executionTime = Date.now() - this.startTime;
  }

  /**
   * Check if execution time limit has been exceeded
   */
  public isTimeoutExceeded(): boolean {
    const currentTime = Date.now() - this.startTime;
    return currentTime > this.maxExecutionTime;
  }

  /**
   * Check if reroll limit has been exceeded
   * @param currentRerolls Number of rerolls performed
   */
  public isRerollLimitExceeded(currentRerolls: number): boolean {
    return currentRerolls >= this.maxRerolls;
  }

  /**
   * Get a summary of the current context state
   */
  public getContextSummary(): {
    config: ContextConfiguration;
    metrics: EvaluationMetrics;
    stepCounter: number;
    executionTime: number;
    isTimedOut: boolean;
  } {
    this.updateExecutionTime();
    
    return {
      config: { ...this.config },
      metrics: { ...this.metrics },
      stepCounter: this.stepCounter,
      executionTime: this.metrics.executionTime,
      isTimedOut: this.isTimeoutExceeded()
    };
  }

  /**
   * Create a random provider based on configuration
   */
  private createRandomProvider(): () => number {
    if (this.config.randomSeed !== undefined) {
      this.seedGenerator = this.createSeededGenerator(this.config.randomSeed);
      return this.seedGenerator;
    }
    
    return () => Math.random();
  }

  /**
   * Create a seeded random number generator for testing
   * Uses a simple Linear Congruential Generator (LCG)
   */
  private createSeededGenerator(seed: number): () => number {
    let state = seed;
    
    return () => {
      // LCG parameters (same as used by glibc)
      state = (state * 1103515245 + 12345) % Math.pow(2, 31);
      return state / Math.pow(2, 31);
    };
  }

  /**
   * Create initial metrics object
   */
  private createInitialMetrics(): EvaluationMetrics {
    return {
      executionTime: 0,
      nodesEvaluated: 0,
      diceRolled: 0,
      rerollsPerformed: 0,
      memoryUsed: 0
    };
  }

  /**
   * Static factory method to create a testing context with seeded random
   * @param seed Random seed for reproducible results
   * @param config Additional configuration
   */
  public static createTestContext(seed: number, config: Partial<ContextConfiguration> = {}): ExpressionContext {
    return new ExpressionContext({
      ...config,
      randomSeed: seed,
      debugMode: false,
      enableMetrics: true
    });
  }

  /**
   * Static factory method to create a production context
   * @param config Configuration options
   */
  public static createProductionContext(config: Partial<ContextConfiguration> = {}): ExpressionContext {
    return new ExpressionContext({
      ...config,
      debugMode: false,
      enableMetrics: true,
      randomSeed: undefined
    });
  }

  /**
   * Static factory method to create a debug context
   * @param config Configuration options
   */
  public static createDebugContext(config: Partial<ContextConfiguration> = {}): ExpressionContext {
    return new ExpressionContext({
      ...config,
      debugMode: true,
      enableMetrics: true,
      enableExplanation: true
    });
  }
}
