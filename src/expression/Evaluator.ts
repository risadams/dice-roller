import { Die } from '../Die';
import {
  ExpressionNode,
  NumberNode,
  DiceNode,
  BinaryOperationNode,
  ParenthesesNode,
  ConditionalDiceNode,
  RerollDiceNode,
  EvaluationResult,
  DetailedEvaluationResult,
  EvaluationContext,
  EvaluationError,
  MaxRerollsExceededError
} from './types';

/**
 * Evaluator configuration constants
 */
const EVALUATOR_CONFIG = {
  /** Maximum number of rerolls allowed before stopping to prevent infinite loops */
  MAX_REROLLS: 100,
  /** Maximum execution time in milliseconds */
  MAX_EXECUTION_TIME: 5000,
} as const;

/**
 * Expression evaluator responsible for executing AST nodes and calculating results
 * 
 * Responsibilities:
 * - Evaluate AST nodes to numerical results
 * - Handle dice rolling with proper randomization
 * - Support reroll mechanics and conditional dice
 * - Maintain operator precedence through tree traversal
 * - Track evaluation steps for explanation
 * - Provide performance monitoring
 */
export class Evaluator {
  private static config = EVALUATOR_CONFIG;
  private context: EvaluationContext | null = null;
  private allRolls: number[] = [];
  
  /**
   * Configure evaluator limits
   */
  public static configure(options: Partial<typeof EVALUATOR_CONFIG>): void {
    Evaluator.config = { ...Evaluator.config, ...options };
  }

  /**
   * Evaluate an AST node and return the numerical result
   * @param node The AST node to evaluate
   * @param context Optional evaluation context for configuration
   * @returns The numerical result of the evaluation
   */
  public evaluate(node: ExpressionNode, context?: EvaluationContext): number {
    this.initializeEvaluation(context);
    
    try {
      const result = this.evaluateNode(node);
      return result;
    } catch (error) {
      if (error instanceof EvaluationError) {
        throw error;
      }
      throw new EvaluationError(`Evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, node);
    } finally {
      this.cleanup();
    }
  }

  /**
   * Evaluate an AST node and return detailed results with explanation
   * @param node The AST node to evaluate
   * @param context Optional evaluation context for configuration
   * @returns Detailed evaluation result with steps and metrics
   */
  public evaluateWithDetails(node: ExpressionNode, context?: EvaluationContext): DetailedEvaluationResult {
    this.initializeEvaluation(context);
    
    try {
      const startTime = Date.now();
      const value = this.evaluateNode(node);
      const endTime = Date.now();
      
      return {
        value,
        originalExpression: '', // Will be set by caller
        rolls: [...this.allRolls],
        minValue: value, // Simplified for now
        maxValue: value, // Simplified for now
        executionTime: endTime - startTime
      };
    } catch (error) {
      const evaluationError = error instanceof EvaluationError ? error : 
        new EvaluationError(`Evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, node);
      
      return {
        value: 0,
        originalExpression: '', // Will be set by caller
        rolls: [...this.allRolls],
        minValue: 0,
        maxValue: 0,
        executionTime: 0
      };
    } finally {
      this.cleanup();
    }
  }

  /**
   * Initialize evaluation state
   */
  private initializeEvaluation(context?: EvaluationContext): void {
    this.context = context || this.createDefaultContext();
    this.allRolls = [];
  }

  /**
   * Create default evaluation context
   */
  private createDefaultContext(): EvaluationContext {
    return {
      randomProvider: () => Math.random(),
      maxRerolls: Evaluator.config.MAX_REROLLS,
      maxExecutionTime: Evaluator.config.MAX_EXECUTION_TIME,
      enableExplanation: false,
      stepCounter: 0,
      metrics: {
        executionTime: 0,
        nodesEvaluated: 0,
        diceRolled: 0,
        rerollsPerformed: 0
      }
    };
  }

  /**
   * Clean up evaluation state
   */
  private cleanup(): void {
    this.context = null;
    this.allRolls = [];
  }

  /**
   * Evaluate a single AST node
   */
  private evaluateNode(node: ExpressionNode): number {
    // Record node evaluation in context metrics (if using ExpressionContext)
    if (this.context && 'recordNodeEvaluation' in this.context) {
      (this.context as any).recordNodeEvaluation(node);
    }
    
    switch (node.type) {
      case 'number':
        return this.evaluateNumber(node as NumberNode);
      
      case 'dice':
        return this.evaluateDice(node as DiceNode);
      
      case 'binary_operation':
        return this.evaluateBinaryOperation(node as BinaryOperationNode);
      
      case 'parentheses':
        return this.evaluateParentheses(node as ParenthesesNode);
      
      case 'conditional_dice':
        return this.evaluateConditionalDice(node as ConditionalDiceNode);
      
      case 'reroll_dice':
        return this.evaluateRerollDice(node as RerollDiceNode);
      
      default:
        throw new EvaluationError(`Unknown node type: ${(node as any).type}`, node);
    }
  }

  /**
   * Evaluate a number node
   */
  private evaluateNumber(node: NumberNode): number {
    return node.value;
  }

  /**
   * Evaluate a dice node
   */
  private evaluateDice(node: DiceNode): number {
    const die = new Die(node.sides, this.context?.randomProvider);
    const rolls = die.rollMultiple(node.count);
    const sum = rolls.reduce((acc, roll) => acc + roll, 0);
    
    // Track all rolls for detailed results
    this.allRolls.push(...rolls);
    
    // Record dice roll in context metrics (if using ExpressionContext)
    if (this.context && 'recordDiceRoll' in this.context) {
      (this.context as any).recordDiceRoll(node.count);
    }
    
    return sum;
  }

  /**
   * Evaluate a binary operation node
   */
  private evaluateBinaryOperation(node: BinaryOperationNode): number {
    const left = this.evaluateNode(node.left);
    const right = this.evaluateNode(node.right);
    
    switch (node.operator) {
      case '+':
        return left + right;
      case '-':
        return left - right;
      case '*':
        return left * right;
      case '/':
        if (right === 0) {
          return 0; // Graceful handling of division by zero
        }
        return Math.floor(left / right);
      default:
        throw new EvaluationError(`Unknown operator: ${node.operator}`, node);
    }
  }

  /**
   * Evaluate a parentheses node
   */
  private evaluateParentheses(node: ParenthesesNode): number {
    return this.evaluateNode(node.expression);
  }

  /**
   * Evaluate a conditional dice node
   */
  private evaluateConditionalDice(node: ConditionalDiceNode): number {
    const die = new Die(node.sides, this.context?.randomProvider);
    const rolls = die.rollMultiple(node.count);
    const threshold = node.threshold;
    const operator = node.operator;
    
    // Track all rolls for detailed results
    this.allRolls.push(...rolls);
    
    let successes = 0;
    
    for (const roll of rolls) {
      if (this.testCondition(roll, operator, threshold)) {
        successes++;
      }
    }
    
    return successes;
  }

  /**
   * Evaluate a reroll dice node
   */
  private evaluateRerollDice(node: RerollDiceNode): number {
    const die = new Die(node.sides, this.context?.randomProvider);
    let totalSum = 0;

    for (let i = 0; i < node.count; i++) {
      const result = this.rollSingleDieWithRerolls(die, node.condition, node.rerollType);
      totalSum += result.value;
      this.allRolls.push(...result.allRolls);
    }

    return totalSum;
  }

  /**
   * Roll a single die with reroll mechanics
   */
  private rollSingleDieWithRerolls(die: Die, condition: string, rerollType: string): { value: number; allRolls: number[] } {
    let roll = die.roll();
    let total = roll;
    let rerollCount = 0;
    const maxRerolls = this.context?.maxRerolls || Evaluator.config.MAX_REROLLS;
    const allRolls = [roll];

    while (this.shouldReroll(roll, condition) && rerollCount < maxRerolls) {
      if (rerollType === 'exploding') {
        // Standard reroll: keep the original and add the reroll
        roll = die.roll();
        total += roll;
        allRolls.push(roll);
      } else {
        // Replace reroll: discard the original, use the new roll
        roll = die.roll();
        total = roll;
        allRolls.push(roll);
      }
      
      rerollCount++;
      
      // For 'once' type, only reroll once
      if (rerollType === 'once') {
        break;
      }
    }

    if (rerollCount >= maxRerolls) {
      throw new MaxRerollsExceededError(maxRerolls);
    }

    return { value: total, allRolls };
  }

  /**
   * Test if a roll meets the reroll condition
   */
  private shouldReroll(roll: number, condition: string): boolean {
    // Parse condition like "=1", ">3", "<=2"
    const match = condition.match(/^(<=|>=|[<>=])(\d+)$/);
    if (!match) {
      throw new EvaluationError(`Invalid reroll condition: ${condition}`);
    }

    const operator = match[1];
    const threshold = parseInt(match[2], 10);
    
    return this.testCondition(roll, operator, threshold);
  }

  /**
   * Test if a value meets a condition
   */
  private testCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case '>':
        return value > threshold;
      case '>=':
        return value >= threshold;
      case '<':
        return value < threshold;
      case '<=':
        return value <= threshold;
      case '=':
      case '==':
        return value === threshold;
      default:
        throw new EvaluationError(`Unknown conditional operator: ${operator}`);
    }
  }

  /**
   * Get the current evaluation context (for testing/debugging)
   */
  public getContext(): EvaluationContext | null {
    return this.context;
  }
}
