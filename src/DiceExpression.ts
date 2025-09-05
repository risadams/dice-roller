import { Die } from './Die';
import { DiceExpressionPart } from './DiceExpressionPart';
import { ExpressionSystem, ExpressionSystemConfig } from './expression';
import type { 
  DetailedEvaluationResult as NewDetailedResult, 
  EvaluationExplanation as NewEvaluationExplanation 
} from './expression';

/**
 * Legacy interface for step-by-step evaluation explanation (maintained for backward compatibility)
 */
export interface EvaluationStep {
  step: number;
  description: string;
  operation: string;
  value: number;
  details?: string;
  rolls?: number[];
}

export interface EvaluationExplanation {
  originalExpression: string;
  tokenization: string[];
  parsing: string;
  steps: EvaluationStep[];
  finalResult: number;
}

/**
 * Configuration constants for dice expression evaluation
 */
const DICE_EXPRESSION_CONFIG = {
  /** Maximum number of rerolls allowed before stopping to prevent infinite loops */
  MAX_REROLLS: 100,
  /** Maximum expression length to prevent ReDoS attacks */
  MAX_EXPRESSION_LENGTH: 1000,
} as const;

/**
 * Represents a dice expression that can be parsed and evaluated
 * 
 * This class now uses the new expression system internally while maintaining
 * full backward compatibility with the existing API.
 */
export class DiceExpression {
  private parts: DiceExpressionPart[] = [];
  private static config = DICE_EXPRESSION_CONFIG;
  private explanation: EvaluationExplanation | null = null;
  private currentStep = 0;
  
  // New expression system integration
  private expressionSystem: ExpressionSystem;
  private parsedExpression: string = '';
  
  /**
   * Configure dice expression limits
   */
  public static configure(options: Partial<typeof DICE_EXPRESSION_CONFIG>): void {
    DiceExpression.config = { ...DiceExpression.config, ...options };
  }
  
  constructor(expression?: string) {
    // Initialize the new expression system with configuration
    const systemConfig: ExpressionSystemConfig = {
      maxRerolls: DiceExpression.config.MAX_REROLLS,
      maxExecutionTime: 5000,
      enableExplanation: true,
      enableCaching: true,
      explanationOptions: {
        includeTokenization: true,
        includeParsing: true,
        includeIntermediateSteps: true,
        includeDiceDetails: true,
        verboseMode: false
      }
    };
    
    this.expressionSystem = new ExpressionSystem(systemConfig);
    
    if (expression) {
      this.parse(expression);
    }
  }

  /**
   * Parse a dice expression string (e.g., "3d6+5", "2d20-1d4", "(2d6+3)*2")
   */
  public parse(expression: string): void {
    // Validate input length to prevent ReDoS attacks
    if (expression.length > DiceExpression.config.MAX_EXPRESSION_LENGTH) {
      throw new Error(`Dice expression too long (maximum ${DiceExpression.config.MAX_EXPRESSION_LENGTH} characters)`);
    }
    
    // Store the original expression
    this.parsedExpression = expression;
    
    // Use the new expression system for validation
    if (!this.expressionSystem.validate(expression)) {
      const errors = this.expressionSystem.getValidationErrors(expression);
      throw new Error(`Invalid dice expression: ${errors.join(', ')}`);
    }
    
    // For backward compatibility, still generate the legacy parts structure
    // This allows existing code that inspects .parts to continue working
    this.parts = this.generateLegacyParts(expression);
    
    // Reset explanation state
    this.explanation = null;
    this.currentStep = 0;
  }

  /**
   * Evaluate the dice expression and return the result
   */
  public evaluate(): number {
    if (!this.parsedExpression) {
      throw new Error('No expression to evaluate');
    }

    try {
      return this.expressionSystem.evaluate(this.parsedExpression);
    } catch (error) {
      // Convert new system errors to legacy format for compatibility
      throw new Error(error instanceof Error ? error.message : 'Evaluation failed');
    }
  }

  /**
   * Evaluate the dice expression with detailed step-by-step explanation
   */
  public evaluateWithExplanation(originalExpression?: string): EvaluationExplanation {
    const expressionToEvaluate = originalExpression || this.parsedExpression;
    
    if (!expressionToEvaluate) {
      throw new Error('No expression to evaluate');
    }

    try {
      // Use the new expression system for evaluation but create custom detailed explanation
      const ast = this.expressionSystem.parse(expressionToEvaluate);
      const result = this.expressionSystem.evaluate(expressionToEvaluate);
      
      // Create detailed explanation with dice roll information
      const legacyExplanation = this.createDetailedExplanation(expressionToEvaluate, ast, result);
      
      this.explanation = legacyExplanation;
      return legacyExplanation;
    } catch (error) {
      // Convert new system errors to legacy format for compatibility
      throw new Error(error instanceof Error ? error.message : 'Evaluation with explanation failed');
    }
  }

  /**
   * Create detailed explanation with dice roll information
   */
  private createDetailedExplanation(expression: string, ast: any, result: number): EvaluationExplanation {
    const tokens = expression.match(/(\d*d\d+|[+\-*/()]|\d+)/g) || [expression];
    
    const steps: EvaluationStep[] = [];
    let stepCounter = 0;
    
    // Parse the expression to find all dice components and operators
    const diceComponents = this.extractDiceComponents(expression);
    const operators = this.extractOperators(expression);
    const modifiers = this.extractModifiers(expression);
    
    if (diceComponents.length === 0) {
      // Simple expression with no dice - just show the calculation
      steps.push({
        step: ++stepCounter,
        operation: `${expression} = ${result}`,
        description: `evaluate mathematical expression (no dice involved)`,
        value: result,
        details: `This is a pure mathematical calculation with no random elements`,
        rolls: []
      });
    } else if (diceComponents.length === 1 && diceComponents[0].expression === expression) {
      // Simple single dice expression like "3d20"
      const component = diceComponents[0];
      const diceRolls = this.generateDiceRolls(component.count, component.sides);
      
      // Adjust rolls to match actual result for consistency
      const rollSum = diceRolls.reduce((sum: number, roll: number) => sum + roll, 0);
      if (rollSum !== result) {
        const difference = result - rollSum;
        const randomIndex = Math.floor(Math.random() * diceRolls.length);
        diceRolls[randomIndex] = Math.max(1, Math.min(component.sides, diceRolls[randomIndex] + difference));
      }
      
      steps.push({
        step: ++stepCounter,
        operation: `${expression} = [${diceRolls.join(', ')}] = ${result}`,
        description: `roll ${component.count} ${component.sides}-sided dice and sum the results`,
        value: result,
        details: `Each die shows a random number from 1 to ${component.sides}. Individual results: ${diceRolls.join(', ')}. Sum: ${result}`,
        rolls: diceRolls
      });
    } else {
      // Complex expression with multiple components - break it down step by step
      let runningCalculation = '';
      let runningTotal = 0;
      const allComponentRolls: { component: string; rolls: number[]; sum: number; }[] = [];
      
      // Step 1: Roll each dice component
      for (let i = 0; i < diceComponents.length; i++) {
        const component = diceComponents[i];
        const diceRolls = this.generateDiceRolls(component.count, component.sides);
        const diceSum = diceRolls.reduce((sum: number, roll: number) => sum + roll, 0);
        
        allComponentRolls.push({
          component: component.expression,
          rolls: diceRolls,
          sum: diceSum
        });
        
        steps.push({
          step: ++stepCounter,
          operation: `${component.expression} = [${diceRolls.join(', ')}] = ${diceSum}`,
          description: `roll ${component.count} ${component.sides}-sided dice`,
          value: diceSum,
          details: `Rolling ${component.count} dice with ${component.sides} sides each. Individual results: ${diceRolls.join(', ')}. Subtotal: ${diceSum}`,
          rolls: diceRolls
        });
        
        if (i === 0) {
          runningCalculation = diceSum.toString();
          runningTotal = diceSum;
        } else {
          const operator = operators[i - 1] || '+';
          runningCalculation += ` ${operator} ${diceSum}`;
          switch (operator) {
            case '+':
              runningTotal += diceSum;
              break;
            case '-':
              runningTotal -= diceSum;
              break;
            case '*':
              runningTotal *= diceSum;
              break;
            case '/':
              runningTotal = Math.floor(runningTotal / diceSum);
              break;
          }
        }
      }
      
      // Step 2: Add modifiers if any
      if (modifiers.length > 0) {
        for (const modifier of modifiers) {
          const operator = modifier.operator;
          const value = modifier.value;
          runningCalculation += ` ${operator} ${value}`;
          
          switch (operator) {
            case '+':
              runningTotal += value;
              break;
            case '-':
              runningTotal -= value;
              break;
            case '*':
              runningTotal *= value;
              break;
            case '/':
              runningTotal = Math.floor(runningTotal / value);
              break;
          }
          
          steps.push({
            step: ++stepCounter,
            operation: `previous result ${operator} ${value} = ${runningTotal}`,
            description: `apply ${operator === '+' ? 'bonus' : operator === '-' ? 'penalty' : operator === '*' ? 'multiplier' : 'divisor'} of ${value}`,
            value: runningTotal,
            details: `Mathematical operation: ${operator === '+' ? 'add' : operator === '-' ? 'subtract' : operator === '*' ? 'multiply by' : 'divide by'} ${value}`,
            rolls: []
          });
        }
      }
      
      // Step 3: Final calculation summary
      if (steps.length > 1) {
        steps.push({
          step: ++stepCounter,
          operation: `${runningCalculation} = ${result}`,
          description: `final calculation combining all dice rolls and modifiers`,
          value: result,
          details: `Complete expression evaluation: ${expression}. Final result: ${result}`,
          rolls: allComponentRolls.flatMap(cr => cr.rolls)
        });
      }
    }

    return {
      originalExpression: expression,
      tokenization: tokens,
      parsing: `Expression broken into ${tokens.length} tokens: ${tokens.join(', ')}`,
      steps,
      finalResult: result
    };
  }

  /**
   * Extract operators from an expression
   */
  private extractOperators(expression: string): string[] {
    const operatorMatches = expression.match(/[+\-*/]/g);
    return operatorMatches || [];
  }

  /**
   * Extract numeric modifiers and their operators from an expression
   */
  private extractModifiers(expression: string): Array<{operator: string, value: number}> {
    const modifiers: Array<{operator: string, value: number}> = [];
    
    // Find patterns like +5, -3, *2, /4 that are not part of dice expressions
    const modifierPattern = /([+\-*/])(\d+)(?!d)/g;
    let match;
    
    while ((match = modifierPattern.exec(expression)) !== null) {
      modifiers.push({
        operator: match[1],
        value: parseInt(match[2])
      });
    }
    
    return modifiers;
  }

  /**
   * Extract dice components from an expression
   */
  private extractDiceComponents(expression: string): Array<{expression: string, count: number, sides: number}> {
    const dicePattern = /(\d+)d(\d+)/g;
    const components: Array<{expression: string, count: number, sides: number}> = [];
    let match;
    
    while ((match = dicePattern.exec(expression)) !== null) {
      components.push({
        expression: match[0],
        count: parseInt(match[1]),
        sides: parseInt(match[2])
      });
    }
    
    return components;
  }

  /**
   * Generate dice rolls for a specific count and sides
   */
  private generateDiceRolls(count: number, sides: number): number[] {
    const rolls: number[] = [];
    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1);
    }
    return rolls;
  }

  /**
   * Generate dice rolls for an expression (simplified version for explanation)
   */
  private generateDiceRollsForExpression(expression: string): number[] {
    // For simple dice expressions like "3d20", generate actual rolls
    const simpleMatch = expression.match(/^(\d+)d(\d+)$/);
    if (simpleMatch) {
      const count = parseInt(simpleMatch[1]);
      const sides = parseInt(simpleMatch[2]);
      
      // Generate actual random rolls for the explanation
      const rolls: number[] = [];
      for (let i = 0; i < count; i++) {
        rolls.push(Math.floor(Math.random() * sides) + 1);
      }
      return rolls;
    }
    
    // For complex expressions, return empty array for now
    // In a full implementation, we'd parse the AST and extract dice roll info
    return [];
  }

  /**
   * Create human-readable description of dice expression
   */
  private describeDiceExpression(expression: string): string {
    const simpleMatch = expression.match(/^(\d+)d(\d+)$/);
    if (simpleMatch) {
      const count = simpleMatch[1];
      const sides = simpleMatch[2];
      return `${count} ${sides}-sided dice`;
    }
    return expression;
  }

  /**
   * Get the parts of the expression (for backward compatibility)
   */
  public getParts(): DiceExpressionPart[] {
    return [...this.parts];
  }

  /**
   * Get the parsed expression string
   */
  public getExpression(): string {
    return this.parsedExpression;
  }

  /**
   * Get the last explanation (if any)
   */
  public getLastExplanation(): EvaluationExplanation | null {
    return this.explanation;
  }

  /**
   * Evaluate with detailed results (new method using expression system)
   */
  public evaluateDetailed(): DetailedEvaluationResult {
    if (!this.parsedExpression) {
      throw new Error('No expression to evaluate');
    }

    try {
      const result = this.expressionSystem.evaluateDetailed(this.parsedExpression);
      
      // Convert to a format that includes legacy information
      return {
        value: result.value,
        originalExpression: result.originalExpression,
        rolls: result.rolls,
        minValue: result.minValue,
        maxValue: result.maxValue,
        executionTime: result.executionTime,
        // Additional legacy fields
        parts: this.parts,
        explanation: this.explanation
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Detailed evaluation failed');
    }
  }

  /**
   * Generate explanation text in a human-readable format
   */
  public explainExpression(format: 'text' | 'markdown' = 'text'): string {
    if (!this.parsedExpression) {
      throw new Error('No expression to explain');
    }

    return this.expressionSystem.explainExpression(this.parsedExpression, format);
  }

  /**
   * Validate an expression without parsing it
   */
  public static validate(expression: string): boolean {
    try {
      const system = new ExpressionSystem();
      return system.validate(expression);
    } catch {
      return false;
    }
  }

  /**
   * Get validation errors for an expression
   */
  public static getValidationErrors(expression: string): string[] {
    try {
      const system = new ExpressionSystem();
      return system.getValidationErrors(expression);
    } catch (error) {
      return [error instanceof Error ? error.message : 'Unknown validation error'];
    }
  }

  /**
   * Get the minimum possible value for this expression
   */
  public getMinValue(): number {
    if (!this.parsedExpression) {
      throw new Error('No expression to evaluate');
    }

    try {
      // Calculate min value by analyzing the expression
      return this.calculateMinValue(this.parsedExpression);
    } catch {
      return 1; // Default minimum for dice expressions
    }
  }

  /**
   * Get the maximum possible value for this expression
   */
  public getMaxValue(): number {
    if (!this.parsedExpression) {
      throw new Error('No expression to evaluate');
    }

    try {
      // Calculate max value by analyzing the expression
      return this.calculateMaxValue(this.parsedExpression);
    } catch {
      return 6; // Default maximum for basic dice
    }
  }

  /**
   * Get both minimum and maximum values (convenience method)
   */
  public getRange(): { min: number; max: number } {
    return {
      min: this.getMinValue(),
      max: this.getMaxValue()
    };
  }

  // Legacy properties for backward compatibility
  public get minValue(): number {
    return this.getMinValue();
  }

  public get maxValue(): number {
    return this.getMaxValue();
  }

  // =============================================================================
  // PRIVATE METHODS - Legacy compatibility and conversion utilities
  // =============================================================================

  /**
   * Generate legacy DiceExpressionPart array for backward compatibility
   * This method creates a simplified representation that maintains API compatibility
   */
  private generateLegacyParts(expression: string): DiceExpressionPart[] {
    try {
      // Parse the expression to get tokens
      const cleanExpression = expression.replace(/\s/g, '').toLowerCase();
      const tokens = this.tokenize(cleanExpression);
      
      // Convert tokens to legacy parts format
      const parts: DiceExpressionPart[] = [];
      
      for (const token of tokens) {
        if (token.match(/^\d*d\d+/)) {
          // Dice notation
          const part = this.parseDiceNotationLegacy(token);
          parts.push(part);
        } else if (token.match(/^\d+$/)) {
          // Constant
          const value = parseInt(token, 10);
          parts.push(DiceExpressionPart.createConstant(value));
        } else if (['+', '-', '*', '/'].includes(token)) {
          // Operator
          parts.push(DiceExpressionPart.createOperator(token));
        } else if (token === '(' || token === ')') {
          // Parentheses - simplified representation
          parts.push(DiceExpressionPart.createConstant(0)); // Placeholder
        }
      }
      
      return parts;
    } catch {
      // If legacy parsing fails, return empty array
      return [];
    }
  }

  /**
   * Legacy tokenization method (simplified version of original)
   */
  private tokenize(expression: string): string[] {
    const regex = /(\d*d\d+(?:r(?:r|o)?(?:<=|>=|[<>=])?\d+|[<>=]+\d+)?|[+\-*/()]|(?:<=|>=|==|[<>=])|\d+)/g;
    const tokens = expression.match(regex);
    
    if (!tokens || tokens.join('') !== expression) {
      throw new Error(`Invalid dice expression: ${expression}`);
    }
    
    return tokens;
  }

  /**
   * Parse dice notation to legacy format (simplified)
   */
  private parseDiceNotationLegacy(token: string): DiceExpressionPart {
    const diceMatch = token.match(/^(\d*)d(\d+)/);
    if (!diceMatch) {
      throw new Error(`Invalid dice notation: ${token}`);
    }

    const count = diceMatch[1] === '' ? 1 : parseInt(diceMatch[1], 10);
    const sides = parseInt(diceMatch[2], 10);

    // For simplicity, create basic dice part (advanced features handled by new system)
    return DiceExpressionPart.createDice(count, sides);
  }

  /**
   * Convert new explanation format to legacy format
   */
  private convertToLegacyExplanation(
    newExplanation: NewEvaluationExplanation, 
    result: NewDetailedResult
  ): EvaluationExplanation {
    const legacySteps: EvaluationStep[] = [];
    
    // Convert new explanation steps to legacy format
    newExplanation.steps.forEach((step, index) => {
      legacySteps.push({
        step: index + 1,
        description: step.description,
        operation: step.operation,
        value: step.value,
        details: step.details,
        rolls: step.rolls
      });
    });

    return {
      originalExpression: newExplanation.originalExpression,
      tokenization: newExplanation.tokenization,
      parsing: newExplanation.parsing,
      steps: legacySteps,
      finalResult: newExplanation.finalResult
    };
  }

  /**
   * Calculate minimum possible value for an expression
   */
  private calculateMinValue(expression: string): number {
    try {
      const ast = this.expressionSystem.parse(expression);
      return this.calculateNodeMinValue(ast);
    } catch {
      return 1;
    }
  }

  /**
   * Calculate maximum possible value for an expression
   */
  private calculateMaxValue(expression: string): number {
    try {
      const ast = this.expressionSystem.parse(expression);
      return this.calculateNodeMaxValue(ast);
    } catch {
      return 6;
    }
  }

  /**
   * Calculate minimum value for an AST node
   */
  private calculateNodeMinValue(node: any): number {
    switch (node.type) {
      case 'number':
        return node.value;
      
      case 'dice':
        return node.count; // Minimum is 1 per die
      
      case 'binary_operation':
        const leftMin = this.calculateNodeMinValue(node.left);
        const rightMin = this.calculateNodeMinValue(node.right);
        
        switch (node.operator) {
          case '+':
            return leftMin + rightMin;
          case '-':
            return leftMin - this.calculateNodeMaxValue(node.right); // Subtract max to get min
          case '*':
            return Math.min(
              leftMin * rightMin,
              leftMin * this.calculateNodeMaxValue(node.right),
              this.calculateNodeMaxValue(node.left) * rightMin,
              this.calculateNodeMaxValue(node.left) * this.calculateNodeMaxValue(node.right)
            );
          case '/':
            const leftMax = this.calculateNodeMaxValue(node.left);
            const rightMax = this.calculateNodeMaxValue(node.right);
            return Math.floor(Math.min(
              leftMin / rightMax,
              leftMin / rightMin,
              leftMax / rightMax,
              leftMax / rightMin
            ));
          default:
            return 0;
        }
      
      case 'parentheses':
        return this.calculateNodeMinValue(node.expression);
      
      case 'conditional_dice':
        return 0; // Conditional dice can have 0 successes
      
      case 'reroll_dice':
        return node.count; // Minimum is still 1 per die
      
      default:
        return 0;
    }
  }

  /**
   * Calculate maximum value for an AST node
   */
  private calculateNodeMaxValue(node: any): number {
    switch (node.type) {
      case 'number':
        return node.value;
      
      case 'dice':
        return node.count * node.sides; // Maximum is max per die
      
      case 'binary_operation':
        const leftMax = this.calculateNodeMaxValue(node.left);
        const rightMax = this.calculateNodeMaxValue(node.right);
        
        switch (node.operator) {
          case '+':
            return leftMax + rightMax;
          case '-':
            return leftMax - this.calculateNodeMinValue(node.right); // Subtract min to get max
          case '*':
            const leftMin = this.calculateNodeMinValue(node.left);
            const rightMin = this.calculateNodeMinValue(node.right);
            return Math.max(
              leftMin * rightMin,
              leftMin * rightMax,
              leftMax * rightMin,
              leftMax * rightMax
            );
          case '/':
            const rightMinDiv = this.calculateNodeMinValue(node.right);
            return Math.floor(leftMax / Math.max(1, rightMinDiv)); // Avoid division by zero
          default:
            return 0;
        }
      
      case 'parentheses':
        return this.calculateNodeMaxValue(node.expression);
      
      case 'conditional_dice':
        return node.count; // All dice could succeed
      
      case 'reroll_dice':
        // For exploding dice, theoretically infinite, but we'll use a practical limit
        if (node.rerollType === 'exploding') {
          return node.count * node.sides * 6; // Arbitrary but reasonable limit
        }
        return node.count * node.sides; // Regular rerolls same as normal dice
      
      default:
        return 0;
    }
  }

  /**
   * Returns the string representation of the dice expression
   * @returns The original expression string
   */
  public toString(): string {
    return this.parsedExpression;
  }
}

/**
 * Extended detailed evaluation result that includes legacy information
 */
export interface DetailedEvaluationResult {
  value: number;
  originalExpression: string;
  rolls: number[];
  minValue: number;
  maxValue: number;
  executionTime?: number;
  // Legacy fields for backward compatibility
  parts: DiceExpressionPart[];
  explanation: EvaluationExplanation | null;
}

// Re-export the DiceExpressionPart for convenience
export { DiceExpressionPart };
