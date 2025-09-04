import {
  ExpressionNode,
  NumberNode,
  DiceNode,
  BinaryOperationNode,
  ParenthesesNode,
  ConditionalDiceNode,
  RerollDiceNode,
  EvaluationStep,
  EvaluationExplanation,
  EvaluationContext,
  DiceRollResult,
  ConditionalDiceResult,
  RerollDiceResult
} from './types';

/**
 * Step types for detailed explanation categorization
 */
export enum StepType {
  TOKENIZATION = 'tokenization',
  PARSING = 'parsing',
  EVALUATION = 'evaluation',
  DICE_ROLL = 'dice_roll',
  REROLL = 'reroll',
  CONDITIONAL = 'conditional',
  OPERATION = 'operation',
  PARENTHESES = 'parentheses',
  FINAL_RESULT = 'final_result'
}

/**
 * Options for explanation generation
 */
export interface ExplanationOptions {
  includeTokenization: boolean;
  includeParsing: boolean;
  includeIntermediateSteps: boolean;
  includeDiceDetails: boolean;
  includeTimestamps: boolean;
  verboseMode: boolean;
}

/**
 * Default explanation options
 */
const DEFAULT_EXPLANATION_OPTIONS: ExplanationOptions = {
  includeTokenization: true,
  includeParsing: true,
  includeIntermediateSteps: true,
  includeDiceDetails: true,
  includeTimestamps: false,
  verboseMode: false
};

/**
 * ExplanationEngine responsible for step-by-step evaluation tracking and detailed explanations
 * 
 * Responsibilities:
 * - Record evaluation steps as they occur
 * - Generate human-readable explanations
 * - Track dice roll details and reroll logic
 * - Provide formatted output for different use cases
 * - Support debugging and educational modes
 * - Maintain performance metrics during explanation
 */
export class ExplanationEngine {
  private steps: EvaluationStep[] = [];
  private originalExpression: string = '';
  private tokenizationSteps: string[] = [];
  private parsingDescription: string = '';
  private context: EvaluationContext | null = null;
  private options: ExplanationOptions;
  private stepCounter: number = 0;

  /**
   * Create a new explanation engine
   * @param options Configuration for explanation generation
   */
  constructor(options: Partial<ExplanationOptions> = {}) {
    this.options = { ...DEFAULT_EXPLANATION_OPTIONS, ...options };
  }

  /**
   * Initialize explanation for a new expression
   * @param expression The original expression string
   * @param context Evaluation context for metrics and configuration
   */
  public initialize(expression: string, context?: EvaluationContext): void {
    this.originalExpression = expression;
    this.context = context || null;
    this.steps = [];
    this.tokenizationSteps = [];
    this.parsingDescription = '';
    this.stepCounter = 0;
  }

  /**
   * Record tokenization step
   * @param tokens Array of tokens from parsing
   */
  public recordTokenization(tokens: string[]): void {
    if (!this.options.includeTokenization) return;
    
    this.tokenizationSteps = [...tokens];
    this.addStep({
      step: ++this.stepCounter,
      operation: StepType.TOKENIZATION,
      description: `Tokenized expression into: ${tokens.join(', ')}`,
      value: tokens.length,
      details: this.options.verboseMode ? `Each token represents a distinct element: ${tokens.map((t, i) => `${i + 1}. "${t}"`).join(', ')}` : undefined
    });
  }

  /**
   * Record parsing step
   * @param description Description of the parsing process
   * @param astSize Number of nodes in the AST
   */
  public recordParsing(description: string, astSize: number): void {
    if (!this.options.includeParsing) return;
    
    this.parsingDescription = description;
    this.addStep({
      step: ++this.stepCounter,
      operation: StepType.PARSING,
      description: `Parsed tokens into AST: ${description}`,
      value: astSize,
      details: this.options.verboseMode ? `Abstract Syntax Tree contains ${astSize} nodes representing the expression structure` : undefined
    });
  }

  /**
   * Record node evaluation
   * @param node The AST node being evaluated
   * @param result The result of evaluating the node
   * @param details Additional details about the evaluation
   */
  public recordNodeEvaluation(node: ExpressionNode, result: number, details?: string): void {
    if (!this.options.includeIntermediateSteps) return;
    
    this.addStep({
      step: ++this.stepCounter,
      operation: StepType.EVALUATION,
      description: this.getNodeEvaluationDescription(node, result),
      value: result,
      details: details || (this.options.verboseMode ? this.getVerboseNodeDescription(node) : undefined),
      node
    });
  }

  /**
   * Record dice roll operation
   * @param node The dice node being rolled
   * @param result The dice roll result
   */
  public recordDiceRoll(node: DiceNode, result: DiceRollResult): void {
    const rolls = result.rolls;
    this.addStep({
      step: ++this.stepCounter,
      operation: StepType.DICE_ROLL,
      description: `Rolled ${node.count}d${node.sides}: ${rolls.join(', ')} (total: ${result.total})`,
      value: result.total,
      details: this.options.includeDiceDetails ? 
        `Individual rolls: [${rolls.map((r, i) => `die ${i + 1}: ${r}`).join(', ')}]` : undefined,
      rolls,
      node
    });
  }

  /**
   * Record conditional dice evaluation
   * @param node The conditional dice node
   * @param result The conditional dice result
   */
  public recordConditionalDice(node: ConditionalDiceNode, result: ConditionalDiceResult): void {
    this.addStep({
      step: ++this.stepCounter,
      operation: StepType.CONDITIONAL,
      description: `Evaluated ${node.count}d${node.sides} with condition ${node.operator}${node.threshold}: ${result.successes} successes`,
      value: result.successes,
      details: this.options.includeDiceDetails ? 
        `Rolls: ${result.rolls.join(', ')} | Successes: [${result.successfulRolls.join(', ')}] | Failures: [${result.failedRolls.join(', ')}]` : undefined,
      rolls: result.rolls,
      node
    });
  }

  /**
   * Record reroll dice evaluation
   * @param node The reroll dice node
   * @param result The reroll dice result
   */
  public recordRerollDice(node: RerollDiceNode, result: RerollDiceResult): void {
    this.addStep({
      step: ++this.stepCounter,
      operation: StepType.REROLL,
      description: `Rolled ${node.count}d${node.sides} with rerolls on ${node.condition}: ${result.total} (${result.rerollCount} rerolls)`,
      value: result.total,
      details: this.options.includeDiceDetails ? 
        `All rolls: [${result.allRolls.join(', ')}] | Final values: [${result.finalRolls.join(', ')}] | Reroll type: ${result.rerollType}` : undefined,
      rolls: result.finalRolls,
      node
    });
  }

  /**
   * Record binary operation
   * @param operation The operation being performed
   * @param left Left operand value
   * @param right Right operand value
   * @param result Operation result
   */
  public recordOperation(operation: string, left: number, right: number, result: number): void {
    this.addStep({
      step: ++this.stepCounter,
      operation: StepType.OPERATION,
      description: `${left} ${operation} ${right} = ${result}`,
      value: result,
      details: this.options.verboseMode ? this.getOperationExplanation(operation, left, right, result) : undefined
    });
  }

  /**
   * Record parentheses evaluation
   * @param innerResult The result of the expression inside parentheses
   */
  public recordParentheses(innerResult: number): void {
    this.addStep({
      step: ++this.stepCounter,
      operation: StepType.PARENTHESES,
      description: `Evaluated parenthetical expression: ${innerResult}`,
      value: innerResult,
      details: this.options.verboseMode ? 'Parentheses force evaluation order by grouping sub-expressions' : undefined
    });
  }

  /**
   * Record final result
   * @param result The final evaluation result
   */
  public recordFinalResult(result: number): void {
    this.addStep({
      step: ++this.stepCounter,
      operation: StepType.FINAL_RESULT,
      description: `Final result: ${result}`,
      value: result
    });
  }

  /**
   * Generate complete explanation
   * @returns Complete evaluation explanation
   */
  public generateExplanation(): EvaluationExplanation {
    return {
      originalExpression: this.originalExpression,
      tokenization: this.tokenizationSteps,
      parsing: this.parsingDescription,
      steps: [...this.steps],
      finalResult: this.steps.length > 0 ? this.steps[this.steps.length - 1].value : 0,
      executionTime: this.context?.metrics.executionTime
    };
  }

  /**
   * Generate human-readable explanation text
   * @returns Formatted explanation string
   */
  public generateText(): string {
    const explanation = this.generateExplanation();
    const lines: string[] = [];
    
    lines.push(`Expression: ${explanation.originalExpression}`);
    lines.push('');
    
    if (this.options.includeTokenization && explanation.tokenization.length > 0) {
      lines.push(`Tokenization: ${explanation.tokenization.join(' → ')}`);
      lines.push('');
    }
    
    if (this.options.includeParsing && explanation.parsing) {
      lines.push(`Parsing: ${explanation.parsing}`);
      lines.push('');
    }
    
    lines.push('Evaluation Steps:');
    explanation.steps.forEach(step => {
      lines.push(`  ${step.step}. ${step.description}`);
      if (step.details && this.options.verboseMode) {
        lines.push(`     Details: ${step.details}`);
      }
    });
    
    lines.push('');
    lines.push(`Final Result: ${explanation.finalResult}`);
    
    if (explanation.executionTime !== undefined && this.options.includeTimestamps) {
      lines.push(`Execution Time: ${explanation.executionTime}ms`);
    }
    
    return lines.join('\n');
  }

  /**
   * Generate markdown-formatted explanation
   * @returns Markdown explanation string
   */
  public generateMarkdown(): string {
    const explanation = this.generateExplanation();
    const lines: string[] = [];
    
    lines.push(`# Expression Evaluation: \`${explanation.originalExpression}\``);
    lines.push('');
    
    if (this.options.includeTokenization && explanation.tokenization.length > 0) {
      lines.push('## Tokenization');
      lines.push(`\`${explanation.tokenization.join(' → ')}\``);
      lines.push('');
    }
    
    if (this.options.includeParsing && explanation.parsing) {
      lines.push('## Parsing');
      lines.push(explanation.parsing);
      lines.push('');
    }
    
    lines.push('## Evaluation Steps');
    explanation.steps.forEach(step => {
      lines.push(`${step.step}. **${step.operation}**: ${step.description}`);
      if (step.details && this.options.verboseMode) {
        lines.push(`   - *${step.details}*`);
      }
    });
    
    lines.push('');
    lines.push(`## Final Result: **${explanation.finalResult}**`);
    
    if (explanation.executionTime !== undefined && this.options.includeTimestamps) {
      lines.push(`*Execution Time: ${explanation.executionTime}ms*`);
    }
    
    return lines.join('\n');
  }

  /**
   * Get the current step count
   */
  public getStepCount(): number {
    return this.steps.length;
  }

  /**
   * Clear all recorded steps
   */
  public clear(): void {
    this.steps = [];
    this.tokenizationSteps = [];
    this.parsingDescription = '';
    this.stepCounter = 0;
  }

  /**
   * Add a step to the explanation
   */
  private addStep(step: EvaluationStep): void {
    this.steps.push(step);
  }

  /**
   * Get description for node evaluation
   */
  private getNodeEvaluationDescription(node: ExpressionNode, result: number): string {
    switch (node.type) {
      case 'number':
        return `Number literal: ${(node as NumberNode).value}`;
      case 'dice':
        const dice = node as DiceNode;
        return `Dice expression: ${dice.count}d${dice.sides} = ${result}`;
      case 'binary_operation':
        const binOp = node as BinaryOperationNode;
        return `Binary operation: ${binOp.operator} = ${result}`;
      case 'parentheses':
        return `Parenthetical expression = ${result}`;
      case 'conditional_dice':
        const condDice = node as ConditionalDiceNode;
        return `Conditional dice: ${condDice.count}d${condDice.sides}${condDice.operator}${condDice.threshold} = ${result}`;
      case 'reroll_dice':
        const rerollDice = node as RerollDiceNode;
        return `Reroll dice: ${rerollDice.count}d${rerollDice.sides}r${rerollDice.condition} = ${result}`;
      default:
        return `Unknown node type = ${result}`;
    }
  }

  /**
   * Get verbose description for a node
   */
  private getVerboseNodeDescription(node: ExpressionNode): string {
    switch (node.type) {
      case 'dice':
        const dice = node as DiceNode;
        return `Rolling ${dice.count} dice with ${dice.sides} sides each`;
      case 'binary_operation':
        const binOp = node as BinaryOperationNode;
        return `Performing ${this.getOperationName(binOp.operator)} operation`;
      case 'conditional_dice':
        const condDice = node as ConditionalDiceNode;
        return `Counting successes where each die roll ${condDice.operator} ${condDice.threshold}`;
      case 'reroll_dice':
        const rerollDice = node as RerollDiceNode;
        return `Rerolling dice that meet condition: ${rerollDice.condition}`;
      default:
        return `Processing ${node.type} node`;
    }
  }

  /**
   * Get operation explanation
   */
  private getOperationExplanation(operation: string, left: number, right: number, result: number): string {
    switch (operation) {
      case '+':
        return `Addition: combining ${left} and ${right} to get ${result}`;
      case '-':
        return `Subtraction: removing ${right} from ${left} to get ${result}`;
      case '*':
        return `Multiplication: ${left} times ${right} equals ${result}`;
      case '/':
        return `Division: ${left} divided by ${right} equals ${result} (integer division)`;
      default:
        return `Operation ${operation} performed`;
    }
  }

  /**
   * Get human-readable operation name
   */
  private getOperationName(operator: string): string {
    switch (operator) {
      case '+': return 'addition';
      case '-': return 'subtraction';
      case '*': return 'multiplication';
      case '/': return 'division';
      default: return operator;
    }
  }
}
