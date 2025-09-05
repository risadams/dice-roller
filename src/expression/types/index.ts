/**
 * Central export file for all expression types
 * Provides unified access to all type definitions used in the expression system
 */

// Token types for parsing
export * from './TokenTypes';

// AST node types for expression structure
export * from './ExpressionTypes';

// Evaluation result types
export * from './EvaluationTypes';

// Re-export commonly used types for convenience
export type {
  // Token types
  Token,
  ParsedToken,
  TokenType,
  DiceToken,
  NumberToken,
  OperatorToken,
  ConditionalToken,
  RerollToken,
  TokenizationResult
} from './TokenTypes';

export type {
  // Expression types
  ExpressionNode,
  DiceNode,
  NumberNode as ExpressionNumberNode,
  BinaryOperationNode,
  ParenthesesNode,
  ConditionalDiceNode,
  RerollDiceNode,
  ParseResult
} from './ExpressionTypes';

export type {
  // Evaluation types
  EvaluationResult,
  DetailedEvaluationResult,
  EvaluationStep,
  EvaluationExplanation,
  ExpressionDiceResult,
  ConditionalDiceResult,
  RerollDiceResult,
  EvaluationContext,
  EvaluationMetrics
} from './EvaluationTypes';

// Re-export error types
export {
  TokenizationError
} from './TokenTypes';

export {
  ParseError
} from './ExpressionTypes';

export {
  EvaluationError,
  EvaluationTimeoutError,
  MaxRerollsExceededError
} from './EvaluationTypes';

// Re-export utility namespaces
export {
  ASTNodeGuards,
  ASTUtils
} from './ExpressionTypes';

export {
  EvaluationResultGuards,
  EvaluationUtils
} from './EvaluationTypes';

/**
 * Combined configuration for the entire expression system
 */
export interface ExpressionSystemConfig {
  tokenizer: {
    maxExpressionLength: number;
    caseSensitive: boolean;
  };
  parser: {
    maxNestingDepth: number;
    maxNodes: number;
    strictMode: boolean;
  };
  evaluator: {
    maxRerolls: number;
    maxExecutionTime: number;
    enableMetrics: boolean;
    enableCaching: boolean;
    randomProvider?: () => number;
  };
  explanation: {
    enableByDefault: boolean;
    includeIntermediateSteps: boolean;
    includeTimings: boolean;
  };
}

/**
 * Default configuration values
 */
export const DEFAULT_EXPRESSION_CONFIG: ExpressionSystemConfig = {
  tokenizer: {
    maxExpressionLength: 1000,
    caseSensitive: false
  },
  parser: {
    maxNestingDepth: 10,
    maxNodes: 100,
    strictMode: false
  },
  evaluator: {
    maxRerolls: 100,
    maxExecutionTime: 5000, // 5 seconds
    enableMetrics: true,
    enableCaching: false,
    randomProvider: Math.random
  },
  explanation: {
    enableByDefault: false,
    includeIntermediateSteps: true,
    includeTimings: false
  }
};

/**
 * Version information for the expression system
 */
export const EXPRESSION_SYSTEM_VERSION = {
  major: 2,
  minor: 0,
  patch: 0,
  prerelease: 'alpha',
  toString: () => '2.0.0-alpha'
} as const;
