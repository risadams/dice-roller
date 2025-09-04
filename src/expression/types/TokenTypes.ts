/**
 * Token types for dice expression parsing
 */

/**
 * Types of tokens that can appear in a dice expression
 */
export type TokenType = 
  | 'number'
  | 'dice'
  | 'operator'
  | 'parenthesis'
  | 'conditional'
  | 'reroll'
  | 'unknown';

/**
 * Individual token in the expression
 */
export interface Token {
  type: TokenType;
  value: string;
  position: number;
  length: number;
}

/**
 * Operator tokens
 */
export type OperatorType = '+' | '-' | '*' | '/';

/**
 * Parenthesis tokens
 */
export type ParenthesisType = '(' | ')';

/**
 * Conditional operators for dice expressions
 */
export type ConditionalOperator = '>' | '>=' | '<' | '<=' | '=' | '==';

/**
 * Reroll types
 */
export type RerollType = 'once' | 'recursive' | 'exploding';

/**
 * Reroll mechanics token
 */
export interface RerollToken extends Token {
  type: 'reroll';
  rerollType: RerollType;
  condition: string;
  threshold: number;
}

/**
 * Dice notation token
 */
export interface DiceToken extends Token {
  type: 'dice';
  count: number;
  sides: number;
}

/**
 * Number token
 */
export interface NumberToken extends Token {
  type: 'number';
  numericValue: number;
}

/**
 * Operator token
 */
export interface OperatorToken extends Token {
  type: 'operator';
  operator: OperatorType;
}

/**
 * Conditional token
 */
export interface ConditionalToken extends Token {
  type: 'conditional';
  operator: ConditionalOperator;
  threshold: number;
}

/**
 * Parenthesis token
 */
export interface ParenthesisToken extends Token {
  type: 'parenthesis';
  parenthesis: ParenthesisType;
}

/**
 * Union type for all specific token types
 */
export type ParsedToken = 
  | DiceToken
  | NumberToken
  | OperatorToken
  | ConditionalToken
  | ParenthesisToken
  | RerollToken
  | Token;

/**
 * Result of tokenization process
 */
export interface TokenizationResult {
  tokens: ParsedToken[];
  originalExpression: string;
  cleanedExpression: string;
}

/**
 * Tokenizer configuration
 */
export interface TokenizerConfig {
  maxExpressionLength: number;
  allowedOperators: OperatorType[];
  allowedConditionals: ConditionalOperator[];
  caseSensitive: boolean;
}

/**
 * Tokenization error with position information
 */
export class TokenizationError extends Error {
  constructor(
    message: string,
    public position: number,
    public expression: string
  ) {
    super(`${message} at position ${position} in expression: "${expression}"`);
    this.name = 'TokenizationError';
  }
}
