/**
 * Types for Abstract Syntax Tree (AST) nodes and expression structure
 */

import type { ConditionalOperator, RerollType, OperatorType } from './TokenTypes';

/**
 * Base interface for all AST nodes
 */
export interface ASTNode {
  type: string;
  position?: number;
}

/**
 * Literal number value
 */
export interface NumberNode extends ASTNode {
  type: 'number';
  value: number;
}

/**
 * Dice expression (e.g., 3d6)
 */
export interface DiceNode extends ASTNode {
  type: 'dice';
  count: number;
  sides: number;
}

/**
 * Binary operation (e.g., +, -, *, /)
 */
export interface BinaryOperationNode extends ASTNode {
  type: 'binary_operation';
  operator: OperatorType;
  left: ExpressionNode;
  right: ExpressionNode;
}

/**
 * Parenthesized expression
 */
export interface ParenthesesNode extends ASTNode {
  type: 'parentheses';
  expression: ExpressionNode;
}

/**
 * Conditional dice (e.g., 3d6>4)
 */
export interface ConditionalDiceNode extends ASTNode {
  type: 'conditional_dice';
  count: number;
  sides: number;
  operator: ConditionalOperator;
  threshold: number;
}

/**
 * Reroll dice (e.g., 3d6r1, 2d8ro<3)
 */
export interface RerollDiceNode extends ASTNode {
  type: 'reroll_dice';
  count: number;
  sides: number;
  rerollType: RerollType;
  condition: string;
  threshold: number;
}

/**
 * Union type for all expression nodes
 */
export type ExpressionNode = 
  | NumberNode
  | DiceNode
  | BinaryOperationNode
  | ParenthesesNode
  | ConditionalDiceNode
  | RerollDiceNode;

/**
 * Result of parsing process
 */
export interface ParseResult {
  ast: ExpressionNode;
  originalExpression: string;
  tokenCount: number;
}

/**
 * Parser configuration
 */
export interface ParserConfig {
  maxNestingDepth: number;
  maxNodes: number;
  strictMode: boolean;
}

/**
 * Parse error with detailed information
 */
export class ParseError extends Error {
  constructor(
    message: string,
    public position: number,
    public token?: string,
    public expected?: string[]
  ) {
    super(`Parse error: ${message}${token ? ` (token: "${token}")` : ''}${position >= 0 ? ` at position ${position}` : ''}`);
    this.name = 'ParseError';
  }
}

/**
 * Helper type guards for AST nodes
 */
export namespace ASTNodeGuards {
  export function isNumberNode(node: ExpressionNode): node is NumberNode {
    return node.type === 'number';
  }

  export function isDiceNode(node: ExpressionNode): node is DiceNode {
    return node.type === 'dice';
  }

  export function isBinaryOperationNode(node: ExpressionNode): node is BinaryOperationNode {
    return node.type === 'binary_operation';
  }

  export function isParenthesesNode(node: ExpressionNode): node is ParenthesesNode {
    return node.type === 'parentheses';
  }

  export function isConditionalDiceNode(node: ExpressionNode): node is ConditionalDiceNode {
    return node.type === 'conditional_dice';
  }

  export function isRerollDiceNode(node: ExpressionNode): node is RerollDiceNode {
    return node.type === 'reroll_dice';
  }

  export function isDiceRelated(node: ExpressionNode): node is DiceNode | ConditionalDiceNode | RerollDiceNode {
    return isDiceNode(node) || isConditionalDiceNode(node) || isRerollDiceNode(node);
  }
}

/**
 * AST visitor pattern interface
 */
export interface ASTVisitor<T> {
  visitNumber(node: NumberNode): T;
  visitDice(node: DiceNode): T;
  visitBinaryOperation(node: BinaryOperationNode): T;
  visitParentheses(node: ParenthesesNode): T;
  visitConditionalDice(node: ConditionalDiceNode): T;
  visitRerollDice(node: RerollDiceNode): T;
}

/**
 * AST utilities
 */
export namespace ASTUtils {
  /**
   * Walk the AST and apply visitor pattern
   */
  export function visit<T>(node: ExpressionNode, visitor: ASTVisitor<T>): T {
    switch (node.type) {
      case 'number':
        return visitor.visitNumber(node);
      case 'dice':
        return visitor.visitDice(node);
      case 'binary_operation':
        return visitor.visitBinaryOperation(node);
      case 'parentheses':
        return visitor.visitParentheses(node);
      case 'conditional_dice':
        return visitor.visitConditionalDice(node);
      case 'reroll_dice':
        return visitor.visitRerollDice(node);
      default:
        throw new Error(`Unknown node type: ${(node as any).type}`);
    }
  }

  /**
   * Count total nodes in AST
   */
  export function countNodes(node: ExpressionNode): number {
    let count = 1;
    
    if (ASTNodeGuards.isBinaryOperationNode(node)) {
      count += countNodes(node.left) + countNodes(node.right);
    } else if (ASTNodeGuards.isParenthesesNode(node)) {
      count += countNodes(node.expression);
    }
    
    return count;
  }

  /**
   * Calculate maximum nesting depth
   */
  export function calculateDepth(node: ExpressionNode): number {
    if (ASTNodeGuards.isBinaryOperationNode(node)) {
      return 1 + Math.max(calculateDepth(node.left), calculateDepth(node.right));
    } else if (ASTNodeGuards.isParenthesesNode(node)) {
      return 1 + calculateDepth(node.expression);
    }
    
    return 1;
  }

  /**
   * Serialize AST back to string representation
   */
  export function toString(node: ExpressionNode): string {
    switch (node.type) {
      case 'number':
        return String(node.value);
      case 'dice':
        return `${node.count}d${node.sides}`;
      case 'binary_operation':
        return `${toString(node.left)} ${node.operator} ${toString(node.right)}`;
      case 'parentheses':
        return `(${toString(node.expression)})`;
      case 'conditional_dice':
        return `${node.count}d${node.sides}${node.operator}${node.threshold}`;
      case 'reroll_dice':
        return `${node.count}d${node.sides}r${node.rerollType === 'once' ? 'o' : node.rerollType === 'recursive' ? 'r' : ''}${node.condition}`;
      default:
        throw new Error(`Cannot serialize node type: ${(node as any).type}`);
    }
  }
}
