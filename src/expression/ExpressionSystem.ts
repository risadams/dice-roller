import { Parser } from './Parser';
import { Evaluator } from './Evaluator';
import { ExpressionContext } from './ExpressionContext';
import { ExplanationEngine, ExplanationOptions } from './ExplanationEngine';
import {
  ExpressionNode,
  EvaluationResult,
  DetailedEvaluationResult,
  EvaluationExplanation,
  ContextConfiguration,
  EvaluationError,
  EvaluationTimeoutError
} from './types';

/**
 * Configuration options for the expression system
 */
export interface ExpressionSystemConfig extends Partial<ContextConfiguration> {
  /** Options for explanation generation */
  explanationOptions?: Partial<ExplanationOptions>;
  /** Whether to cache parsed expressions */
  enableCaching?: boolean;
  /** Maximum number of expressions to cache */
  cacheSize?: number;
}

/**
 * Cached expression entry
 */
interface CachedExpression {
  expression: string;
  ast: ExpressionNode;
  timestamp: number;
}

/**
 * Expression system facade that orchestrates Parser, Evaluator, Context, and ExplanationEngine
 * 
 * This is the main interface for the expression system, providing:
 * - Simple API for evaluating dice expressions
 * - Comprehensive explanations and step-by-step breakdowns
 * - Performance metrics and optimization
 * - Caching for frequently used expressions
 * - Error handling and recovery
 * - Backward compatibility with existing code
 */
export class ExpressionSystem {
  private parser: Parser;
  private evaluator: Evaluator;
  private explanationEngine: ExplanationEngine;
  private config: ExpressionSystemConfig;
  private cache: Map<string, CachedExpression> = new Map();
  private readonly maxCacheSize: number;

  /**
   * Create a new expression system
   * @param config Configuration options
   */
  constructor(config: ExpressionSystemConfig = {}) {
    this.config = { ...config };
    this.maxCacheSize = config.cacheSize || 100;
    
    // Initialize components
    this.parser = new Parser();
    this.evaluator = new Evaluator();
    this.explanationEngine = new ExplanationEngine(config.explanationOptions);
  }

  /**
   * Evaluate a dice expression and return the numerical result
   * @param expression The dice expression to evaluate (e.g., "3d6+2", "2d20r1")
   * @param context Optional evaluation context
   * @returns The numerical result
   */
  public evaluate(expression: string, context?: Partial<ContextConfiguration>): number {
    try {
      const evalContext = this.createContext(context);
      const ast = this.parseExpression(expression);
      
      return this.evaluator.evaluate(ast, evalContext);
    } catch (error) {
      this.handleError(error, expression, 'evaluate');
      throw error;
    }
  }

  /**
   * Evaluate a dice expression and return detailed results
   * @param expression The dice expression to evaluate
   * @param context Optional evaluation context
   * @returns Detailed evaluation result with metrics
   */
  public evaluateDetailed(expression: string, context?: Partial<ContextConfiguration>): DetailedEvaluationResult {
    try {
      const evalContext = this.createContext(context);
      const ast = this.parseExpression(expression);
      
      const result = this.evaluator.evaluateWithDetails(ast, evalContext);
      result.originalExpression = expression;
      
      return result;
    } catch (error) {
      this.handleError(error, expression, 'evaluateDetailed');
      
      // Return a safe default result on error
      return {
        value: 0,
        originalExpression: expression,
        rolls: [],
        minValue: 0,
        maxValue: 0,
        executionTime: 0
      };
    }
  }

  /**
   * Evaluate a dice expression with complete explanation
   * @param expression The dice expression to evaluate
   * @param context Optional evaluation context
   * @returns Complete evaluation with step-by-step explanation
   */
  public evaluateWithExplanation(expression: string, context?: Partial<ContextConfiguration>): {
    result: DetailedEvaluationResult;
    explanation: EvaluationExplanation;
  } {
    try {
      const evalContext = this.createContext({ ...context, enableExplanation: true });
      const ast = this.parseExpression(expression);
      
      // Initialize explanation
      this.explanationEngine.initialize(expression, evalContext);
      
      // Record tokenization and parsing
      const tokens = this.parser.tokenize(expression);
      const tokenStrings = tokens.map(token => token.value);
      this.explanationEngine.recordTokenization(tokenStrings);
      this.explanationEngine.recordParsing('Expression parsed into AST', this.countASTNodes(ast));
      
      // Evaluate with explanation tracking
      const result = this.evaluateWithExplanationTracking(ast, evalContext);
      result.originalExpression = expression;
      
      // Generate explanation
      const explanation = this.explanationEngine.generateExplanation();
      
      return { result, explanation };
    } catch (error) {
      this.handleError(error, expression, 'evaluateWithExplanation');
      
      // Return safe defaults
      return {
        result: {
          value: 0,
          originalExpression: expression,
          rolls: [],
          minValue: 0,
          maxValue: 0,
          executionTime: 0
        },
        explanation: {
          originalExpression: expression,
          tokenization: [],
          parsing: '',
          steps: [],
          finalResult: 0
        }
      };
    }
  }

  /**
   * Parse an expression into an AST without evaluating it
   * @param expression The expression to parse
   * @returns The parsed AST
   */
  public parse(expression: string): ExpressionNode {
    return this.parseExpression(expression);
  }

  /**
   * Validate that an expression is syntactically correct
   * @param expression The expression to validate
   * @returns True if valid, false otherwise
   */
  public validate(expression: string): boolean {
    try {
      this.parseExpression(expression);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get validation errors for an expression
   * @param expression The expression to validate
   * @returns Array of error messages, empty if valid
   */
  public getValidationErrors(expression: string): string[] {
    try {
      this.parseExpression(expression);
      return [];
    } catch (error) {
      if (error instanceof EvaluationError) {
        return [error.message];
      }
      return [error instanceof Error ? error.message : 'Unknown validation error'];
    }
  }

  /**
   * Get system configuration
   */
  public getConfig(): ExpressionSystemConfig {
    return { ...this.config };
  }

  /**
   * Update system configuration
   * @param config New configuration options
   */
  public updateConfig(config: Partial<ExpressionSystemConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update explanation engine if needed
    if (config.explanationOptions) {
      this.explanationEngine = new ExplanationEngine(config.explanationOptions);
    }
  }

  /**
   * Clear the expression cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ expression: string; age: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([expr, cached]) => ({
      expression: expr,
      age: now - cached.timestamp
    }));
    
    // Note: For a proper hit rate, we'd need to track cache hits/misses
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0, // Would need additional tracking
      entries
    };
  }

  /**
   * Generate a formatted explanation text
   * @param expression The expression to explain
   * @param format Output format ('text' | 'markdown')
   * @param context Optional evaluation context
   */
  public explainExpression(expression: string, format: 'text' | 'markdown' = 'text', context?: Partial<ContextConfiguration>): string {
    const { explanation } = this.evaluateWithExplanation(expression, context);
    
    if (format === 'markdown') {
      return this.explanationEngine.generateMarkdown();
    }
    
    return this.explanationEngine.generateText();
  }

  /**
   * Get system performance metrics
   */
  public getPerformanceMetrics(): {
    cacheSize: number;
    totalExpressions: number;
    averageExecutionTime: number;
  } {
    // This would require additional tracking in a real implementation
    return {
      cacheSize: this.cache.size,
      totalExpressions: 0, // Would track this
      averageExecutionTime: 0 // Would calculate this
    };
  }

  /**
   * Parse expression with caching
   */
  private parseExpression(expression: string): ExpressionNode {
    // Check cache first
    if (this.config.enableCaching !== false) {
      const cached = this.cache.get(expression);
      if (cached) {
        return cached.ast;
      }
    }
    
    // Parse new expression
    const ast = this.parser.parse(expression);
    
    // Cache the result
    if (this.config.enableCaching !== false) {
      this.cacheExpression(expression, ast);
    }
    
    return ast;
  }

  /**
   * Cache a parsed expression
   */
  private cacheExpression(expression: string, ast: ExpressionNode): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(expression, {
      expression,
      ast,
      timestamp: Date.now()
    });
  }

  /**
   * Create evaluation context
   */
  private createContext(contextOverrides?: Partial<ContextConfiguration>): ExpressionContext {
    const contextConfig = { ...this.config, ...contextOverrides };
    return new ExpressionContext(contextConfig);
  }

  /**
   * Evaluate with explanation tracking
   */
  private evaluateWithExplanationTracking(ast: ExpressionNode, context: ExpressionContext): DetailedEvaluationResult {
    // This is a simplified version - in a full implementation, we'd integrate 
    // the explanation engine more deeply with the evaluator
    const result = this.evaluator.evaluateWithDetails(ast, context);
    this.explanationEngine.recordFinalResult(result.value);
    return result;
  }

  /**
   * Count nodes in AST (for explanation purposes)
   */
  private countASTNodes(node: ExpressionNode): number {
    let count = 1;
    
    // Recursively count child nodes
    if ('left' in node && node.left) {
      count += this.countASTNodes(node.left);
    }
    if ('right' in node && node.right) {
      count += this.countASTNodes(node.right);
    }
    if ('expression' in node && node.expression) {
      count += this.countASTNodes(node.expression);
    }
    
    return count;
  }

  /**
   * Handle errors consistently
   */
  private handleError(error: unknown, expression: string, operation: string): void {
    if (error instanceof EvaluationError || error instanceof EvaluationTimeoutError) {
      // These are expected errors, let them bubble up
      return;
    }
    
    // Log unexpected errors
    console.error(`[ExpressionSystem] Error in ${operation} for expression "${expression}":`, error);
  }

  /**
   * Static factory method for simple use cases
   * @param config Optional configuration
   */
  public static create(config?: ExpressionSystemConfig): ExpressionSystem {
    return new ExpressionSystem(config);
  }

  /**
   * Static method for quick evaluation without creating an instance
   * @param expression The expression to evaluate
   * @param config Optional configuration
   */
  public static quickEvaluate(expression: string, config?: ExpressionSystemConfig): number {
    const system = new ExpressionSystem(config);
    return system.evaluate(expression);
  }
}
