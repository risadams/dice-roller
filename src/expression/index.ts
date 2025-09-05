/**
 * Expression System - Complete dice expression parsing and evaluation system
 * 
 * This module provides a comprehensive system for parsing and evaluating dice expressions
 * with full explanation capabilities, performance metrics, and extensible architecture.
 */

// Main facade
export { ExpressionSystem } from './ExpressionSystem';

// Core components
export { Parser } from './Parser';
export { Evaluator } from './Evaluator';
export { ExpressionContext } from './ExpressionContext';
export { ExplanationEngine, ExplanationOptions, StepType } from './ExplanationEngine';

// Type definitions
export * from './types';

// Configuration interfaces
export type { ExpressionSystemConfig } from './ExpressionSystem';

// Import for convenience functions
import { ExpressionSystem } from './ExpressionSystem';

/**
 * Quick evaluation function for simple use cases
 * @param expression The dice expression to evaluate
 * @returns The numerical result
 */
export function evaluate(expression: string): number {
  return ExpressionSystem.quickEvaluate(expression);
}

/**
 * Detailed evaluation function with explanation
 * @param expression The dice expression to evaluate
 * @returns Object with result and explanation
 */
export function evaluateDetailed(expression: string) {
  const system = ExpressionSystem.create();
  return system.evaluateWithExplanation(expression);
}

/**
 * Validate a dice expression
 * @param expression The expression to validate
 * @returns True if valid, false otherwise
 */
export function validate(expression: string): boolean {
  const system = ExpressionSystem.create();
  return system.validate(expression);
}

/**
 * Get validation errors for an expression
 * @param expression The expression to validate
 * @returns Array of error messages
 */
export function getValidationErrors(expression: string): string[] {
  const system = ExpressionSystem.create();
  return system.getValidationErrors(expression);
}

/**
 * Generate explanation for an expression
 * @param expression The expression to explain
 * @param format Output format ('text' | 'markdown')
 * @returns Formatted explanation
 */
export function explain(expression: string, format: 'text' | 'markdown' = 'text'): string {
  const system = ExpressionSystem.create();
  return system.explainExpression(expression, format);
}
