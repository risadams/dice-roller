import { Die } from './Die';
import { DiceExpressionPart } from './DiceExpressionPart';

/**
 * Interface for step-by-step evaluation explanation
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
 */
export class DiceExpression {
  private parts: DiceExpressionPart[] = [];
  private static config = DICE_EXPRESSION_CONFIG;
  private explanation: EvaluationExplanation | null = null;
  private currentStep = 0;
  
  /**
   * Configure dice expression limits
   */
  public static configure(options: Partial<typeof DICE_EXPRESSION_CONFIG>): void {
    DiceExpression.config = { ...DiceExpression.config, ...options };
  }
  
  constructor(expression?: string) {
    if (expression) {
      this.parse(expression);
    }
  }

  /**
   * Parse a dice expression string (e.g., "3d6+5", "2d20-1d4", "(2d6+3)*2")
   */
  public parse(expression: string): void {
    this.parts = [];
    
    // Validate input length to prevent ReDoS attacks
    if (expression.length > DiceExpression.config.MAX_EXPRESSION_LENGTH) {
      throw new Error(`Dice expression too long (maximum ${DiceExpression.config.MAX_EXPRESSION_LENGTH} characters)`);
    }
    
    // Remove spaces and convert to lowercase
    const cleanExpression = expression.replace(/\s/g, '').toLowerCase();
    
    // Parse the expression using recursive descent parser
    const tokens = this.tokenize(cleanExpression);
    this.parts = this.parseExpression(tokens);
    
    // Validate the expression structure
    this.validateStructure();
  }

  /**
   * Tokenize the expression into components
   */
  private tokenize(expression: string): string[] {
    // Enhanced regex to include parentheses, conditional operators, and reroll mechanics
    // Updated to handle complex reroll patterns like r1, ro<2, rr>=3
    const regex = /(\d*d\d+(?:r[ro]*[<>=]*\d+|[<>=]+\d+)?|[+\-*/()]|[<>=]+|\d+)/g;
    const tokens = expression.match(regex);
    
    if (!tokens || tokens.join('') !== expression) {
      throw new Error(`Invalid dice expression: ${expression}`);
    }
    
    return tokens;
  }

  /**
   * Parse an expression with operator precedence
   */
  private parseExpression(tokens: string[]): DiceExpressionPart[] {
    const result = this.parseAdditionSubtraction(tokens);
    
    // Ensure all tokens are consumed
    if (tokens.length > 0) {
      throw new Error(`Unexpected token: ${tokens[0]}`);
    }
    
    return result;
  }

  /**
   * Parse addition and subtraction (lowest precedence)
   */
  private parseAdditionSubtraction(tokens: string[]): DiceExpressionPart[] {
    let parts = this.parseMultiplicationDivision(tokens);
    
    while (tokens.length > 0 && (tokens[0] === '+' || tokens[0] === '-')) {
      const operator = tokens.shift()!;
      parts.push(DiceExpressionPart.createOperator(operator));
      const rightParts = this.parseMultiplicationDivision(tokens);
      parts.push(...rightParts);
    }
    
    return parts;
  }

  /**
   * Parse multiplication and division (higher precedence)
   */
  private parseMultiplicationDivision(tokens: string[]): DiceExpressionPart[] {
    let parts = this.parsePrimary(tokens);
    
    while (tokens.length > 0 && (tokens[0] === '*' || tokens[0] === '/')) {
      const operator = tokens.shift()!;
      parts.push(DiceExpressionPart.createOperator(operator));
      const rightParts = this.parsePrimary(tokens);
      parts.push(...rightParts);
    }
    
    return parts;
  }

  /**
   * Parse primary expressions (dice, constants, parentheses)
   */
  private parsePrimary(tokens: string[]): DiceExpressionPart[] {
    if (tokens.length === 0) {
      throw new Error('Unexpected end of expression');
    }

    const token = tokens.shift()!;

    if (token === '(') {
      // Parse parenthesized expression
      const subTokens: string[] = [];
      let depth = 1;
      
      while (tokens.length > 0 && depth > 0) {
        const nextToken = tokens.shift()!;
        if (nextToken === '(') {
          depth++;
        } else if (nextToken === ')') {
          depth--;
        }
        
        if (depth > 0) {
          subTokens.push(nextToken);
        }
      }
      
      if (depth > 0) {
        throw new Error('Unmatched opening parenthesis');
      }
      
      // Create a parenthesis group containing the sub-expression
      const subExpression = this.parseExpression(subTokens);
      return [DiceExpressionPart.createParentheses(subExpression)];
    } else if (token.match(/^(\d+d\d+|d\d+)/)) {
      // Enhanced dice notation with reroll mechanics
      return [this.parseDiceNotation(token)];
    } else if (token.match(/^\d+$/)) {
      // Constant
      const value = parseInt(token, 10);
      if (isNaN(value)) {
        throw new Error(`Invalid constant: ${token}`);
      }
      return [DiceExpressionPart.createConstant(value)];
    } else if (token === '-' || token === '+') {
      // Handle unary operators at the start
      throw new Error('Expression cannot start with an operator');
    } else {
      throw new Error(`Unrecognized token: ${token}`);
    }
  }

  /**
   * Parse dice notation with potential reroll mechanics and conditional operators
   */
  private parseDiceNotation(token: string): DiceExpressionPart {
    // Extract basic dice notation first
    const diceMatch = token.match(/^(\d*)d(\d+)/);
    if (!diceMatch) {
      throw new Error(`Invalid dice notation: ${token}`);
    }

    const count = diceMatch[1] === '' ? 1 : parseInt(diceMatch[1], 10);
    const sides = parseInt(diceMatch[2], 10);

    if (isNaN(count) || isNaN(sides) || count <= 0 || sides <= 0) {
      if (count <= 0) {
        throw new Error(`At least one die is required, got ${count} dice in: ${token}`);
      }
      throw new Error(`Invalid dice notation: ${token}`);
    }

    // Check what remains after the basic dice notation
    const remaining = token.substring(diceMatch[0].length);
    if (remaining.length > 0) {
      // Check for reroll mechanics first (r, ro, rr)
      const rerollMatch = remaining.match(/^(r[ro]*[<>=]*\d+)/);
      if (rerollMatch) {
        return this.parseRerollMechanics(count, sides, rerollMatch[1]);
      }
      
      // Check for conditional operators (>, >=, etc.)
      const conditionalMatch = remaining.match(/^([<>=]+)(\d+)/);
      if (conditionalMatch) {
        const operator = conditionalMatch[1];
        const threshold = parseInt(conditionalMatch[2], 10);
        
        // Validate operator
        if (!['>', '>=', '<', '<=', '=', '=='].includes(operator)) {
          throw new Error(`Invalid conditional operator: ${operator}`);
        }
        
        return DiceExpressionPart.createConditionalDice(count, sides, operator, threshold);
      }
      
      // If we get here, it's an unrecognized modifier
      throw new Error(`Unrecognized dice modifier: ${remaining}`);
    }

    return DiceExpressionPart.createDice(count, sides);
  }

  /**
   * Parse reroll mechanics (r1, ro<2, rr1, etc.)
   */
  private parseRerollMechanics(count: number, sides: number, mechanics: string): DiceExpressionPart {
    // Parse reroll patterns: r, ro, rr followed by condition
    const rerollMatch = mechanics.match(/^(r|ro|rr)([<>=]*)(\d+)$/);
    if (!rerollMatch) {
      throw new Error(`Invalid reroll mechanics: ${mechanics}`);
    }

    const rerollTypeStr = rerollMatch[1];
    const conditionOperator = rerollMatch[2] || '='; // Default to equality if no operator
    const threshold = parseInt(rerollMatch[3], 10);

    // Determine reroll type
    let rerollType: 'once' | 'recursive' | 'exploding';
    switch (rerollTypeStr) {
      case 'r':
        rerollType = 'exploding'; // Standard reroll (once, but keeps original behavior)
        break;
      case 'ro':
        rerollType = 'once'; // Reroll once
        break;
      case 'rr':
        rerollType = 'recursive'; // Reroll recursively
        break;
      default:
        throw new Error(`Unknown reroll type: ${rerollTypeStr}`);
    }

    // Validate condition operator
    if (!['', '=', '<', '>', '<=', '>='].includes(conditionOperator)) {
      throw new Error(`Invalid reroll condition operator: ${conditionOperator}`);
    }

    // Build condition string
    const rerollCondition = conditionOperator + threshold;

    return DiceExpressionPart.createReroll(count, sides, rerollType, rerollCondition, threshold);
  }

  /**
   * Validate that the expression has proper structure
   */
  private validateStructure(): void {
    if (this.parts.length === 0) {
      throw new Error('Empty expression');
    }

    // With the new parser, we don't need the old alternating validation
    // The recursive descent parser ensures proper structure
    this.validatePartsStructure(this.parts);
  }

  /**
   * Validate structure of expression parts recursively
   */
  private validatePartsStructure(parts: DiceExpressionPart[]): void {
    if (parts.length === 0) {
      return;
    }

    // First part should not be an operator
    if (parts[0].type === 'operator') {
      throw new Error('Expression cannot start with an operator');
    }

    // Last part should not be an operator
    if (parts[parts.length - 1].type === 'operator') {
      throw new Error('Expression cannot end with an operator');
    }

    // Validate parentheses sub-expressions
    for (const part of parts) {
      if (part.type === 'parentheses' && part.subExpression) {
        this.validatePartsStructure(part.subExpression);
      }
    }
  }

  /**
   * Evaluate the dice expression and return the result
   */
  public evaluate(): number {
    if (this.parts.length === 0) {
      throw new Error('No expression to evaluate');
    }

    return this.evaluatePartsList(this.parts);
  }

  /**
   * Evaluate the dice expression with detailed step-by-step explanation
   */
  public evaluateWithExplanation(originalExpression: string): EvaluationExplanation {
    if (this.parts.length === 0) {
      throw new Error('No expression to evaluate');
    }

    // Initialize explanation
    this.explanation = {
      originalExpression,
      tokenization: this.tokenize(originalExpression.replace(/\s/g, '').toLowerCase()),
      parsing: this.formatParsingExplanation(),
      steps: [],
      finalResult: 0
    };
    this.currentStep = 0;

    // Evaluate with tracking
    const result = this.evaluatePartsListWithExplanation(this.parts, 'main expression');
    this.explanation.finalResult = result;

    return this.explanation;
  }

  /**
   * Format the parsing explanation
   */
  private formatParsingExplanation(): string {
    return `Parsed into ${this.parts.length} parts: ${this.parts.map(p => p.toString()).join(' ')}`;
  }

  /**
   * Evaluate a list of expression parts with explanation tracking
   */
  private evaluatePartsListWithExplanation(parts: DiceExpressionPart[], context: string): number {
    if (parts.length === 0) {
      throw new Error('No parts to evaluate');
    }

    if (parts.length === 1) {
      return this.evaluatePartWithExplanation(parts[0], context);
    }

    // Handle multiplication and division first (higher precedence)
    const processedParts = this.evaluateMultiplicationDivisionWithExplanation([...parts]);
    
    // Then handle addition and subtraction (lower precedence)
    return this.evaluateAdditionSubtractionWithExplanation(processedParts);
  }

  /**
   * Evaluate a list of expression parts with proper operator precedence
   */
  private evaluatePartsList(parts: DiceExpressionPart[]): number {
    if (parts.length === 0) {
      throw new Error('No parts to evaluate');
    }

    if (parts.length === 1) {
      return this.evaluatePart(parts[0]);
    }

    // Handle multiplication and division first (higher precedence)
    const processedParts = this.evaluateMultiplicationDivision([...parts]);
    
    // Then handle addition and subtraction (lower precedence)
    return this.evaluateAdditionSubtraction(processedParts);
  }

  /**
   * Process multiplication and division operations with explanation
   */
  private evaluateMultiplicationDivisionWithExplanation(parts: DiceExpressionPart[]): DiceExpressionPart[] {
    const result: DiceExpressionPart[] = [];
    let i = 0;

    while (i < parts.length) {
      if (i + 2 < parts.length && 
          parts[i + 1].type === 'operator' && 
          (parts[i + 1].operator === '*' || parts[i + 1].operator === '/')) {
        
        const left = this.evaluatePartWithExplanation(parts[i], `left operand of ${parts[i + 1].operator}`);
        const operator = parts[i + 1].operator!;
        const right = this.evaluatePartWithExplanation(parts[i + 2], `right operand of ${parts[i + 1].operator}`);
        
        let value: number;
        if (operator === '*') {
          value = left * right;
        } else {
          value = Math.floor(left / right);
        }

        this.addExplanationStep(
          `${left} ${operator} ${right} = ${value}`,
          `${operator === '*' ? 'multiply' : 'divide'} ${left} and ${right}`,
          value
        );

        result.push(DiceExpressionPart.createConstant(value));
        i += 3;
      } else {
        result.push(parts[i]);
        i++;
      }
    }

    return result;
  }

  /**
   * Process addition and subtraction operations with explanation
   */
  private evaluateAdditionSubtractionWithExplanation(parts: DiceExpressionPart[]): number {
    let result = this.evaluatePartWithExplanation(parts[0], 'starting value');

    for (let i = 1; i < parts.length; i += 2) {
      if (i + 1 >= parts.length) break;
      
      const operator = parts[i].operator!;
      const operand = this.evaluatePartWithExplanation(parts[i + 1], `operand for ${operator}`);
      
      const oldResult = result;
      if (operator === '+') {
        result += operand;
      } else if (operator === '-') {
        result -= operand;
      }

      this.addExplanationStep(
        `${oldResult} ${operator} ${operand} = ${result}`,
        `${operator === '+' ? 'add' : 'subtract'} ${operand} ${operator === '+' ? 'to' : 'from'} ${oldResult}`,
        result
      );
    }

    return result;
  }

  /**
   * Evaluate a single part with explanation tracking
   */
  private evaluatePartWithExplanation(part: DiceExpressionPart, context: string): number {
    switch (part.type) {
      case 'dice':
        const die = new Die(part.sides!);
        const rolls = die.rollMultiple(part.count!);
        const sum = rolls.reduce((sum, roll) => sum + roll, 0);
        
        this.addExplanationStep(
          `${part.count}d${part.sides} = [${rolls.join(', ')}] = ${sum}`,
          `roll ${part.count} ${part.sides}-sided dice for ${context}`,
          sum,
          `Individual rolls: ${rolls.join(', ')}`,
          rolls
        );
        
        return sum;

      case 'constant':
        this.addExplanationStep(
          `${part.value}`,
          `use constant value ${part.value} for ${context}`,
          part.value
        );
        return part.value;

      case 'parentheses':
        if (!part.subExpression) {
          throw new Error('Parentheses part missing sub-expression');
        }
        
        this.addExplanationStep(
          `(${part.subExpression.map(p => p.toString()).join(' ')})`,
          `evaluate parenthesized expression for ${context}`,
          0,
          'Entering parenthesized sub-expression'
        );
        
        const result = this.evaluatePartsListWithExplanation(part.subExpression, 'parenthesized expression');
        
        this.addExplanationStep(
          `= ${result}`,
          `parenthesized expression result`,
          result,
          'Exiting parenthesized sub-expression'
        );
        
        return result;

      case 'conditional':
        if (part.count && part.sides) {
          return this.evaluateConditionalDiceWithExplanation(part);
        } else {
          throw new Error('Standalone conditional operators are not supported in expressions');
        }

      case 'reroll':
        return this.evaluateRerollDiceWithExplanation(part);

      default:
        throw new Error(`Cannot evaluate part of type: ${part.type}`);
    }
  }

  /**
   * Add a step to the explanation
   */
  private addExplanationStep(operation: string, description: string, value: number, details?: string, rolls?: number[]): void {
    if (this.explanation) {
      this.explanation.steps.push({
        step: ++this.currentStep,
        operation,
        description,
        value,
        details,
        rolls
      });
    }
  }

  /**
   * Evaluate conditional dice with explanation
   */
  private evaluateConditionalDiceWithExplanation(part: DiceExpressionPart): number {
    const die = new Die(part.sides!);
    const rolls = die.rollMultiple(part.count!);
    const threshold = part.threshold!;
    const condition = part.condition!;
    
    let successes = 0;
    const successfulRolls: number[] = [];
    
    for (const roll of rolls) {
      let isSuccess = false;
      switch (condition) {
        case '>':
          isSuccess = roll > threshold;
          break;
        case '>=':
          isSuccess = roll >= threshold;
          break;
        case '<':
          isSuccess = roll < threshold;
          break;
        case '<=':
          isSuccess = roll <= threshold;
          break;
        case '=':
        case '==':
          isSuccess = roll === threshold;
          break;
        default:
          throw new Error(`Unknown conditional operator: ${condition}`);
      }
      
      if (isSuccess) {
        successes++;
        successfulRolls.push(roll);
      }
    }

    this.addExplanationStep(
      `${part.count}d${part.sides}${condition}${threshold} = [${rolls.join(', ')}] = ${successes} successes`,
      `roll ${part.count} ${part.sides}-sided dice and count successes where result ${condition} ${threshold}`,
      successes,
      `All rolls: [${rolls.join(', ')}], Successful rolls: [${successfulRolls.join(', ')}]`,
      rolls
    );
    
    return successes;
  }

  /**
   * Evaluate reroll dice with explanation
   */
  private evaluateRerollDiceWithExplanation(part: DiceExpressionPart): number {
    const die = new Die(part.sides!);
    const rerollCondition = part.rerollCondition!;
    const rerollType = part.rerollType!;
    let totalSum = 0;
    const allRolls: number[] = [];

    for (let i = 0; i < part.count!; i++) {
      const { value, rolls } = this.rollSingleDieWithRerollsAndTracking(die, rerollCondition, rerollType);
      totalSum += value;
      allRolls.push(...rolls);
    }

    const rerollTypeNames: { [key: string]: string } = {
      'exploding': 'exploding (add rerolls)',
      'once': 'reroll once (replace)',
      'recursive': 'recursive reroll (keep rerolling)'
    };

    this.addExplanationStep(
      `${part.count}d${part.sides}r${part.rerollType === 'once' ? 'o' : part.rerollType === 'recursive' ? 'r' : ''}${rerollCondition} = ${totalSum}`,
      `roll ${part.count} ${part.sides}-sided dice with ${rerollTypeNames[part.rerollType!]} when ${rerollCondition}`,
      totalSum,
      `All rolls including rerolls: [${allRolls.join(', ')}]`,
      allRolls
    );

    return totalSum;
  }

  /**
   * Roll a single die with reroll mechanics and track all rolls
   */
  private rollSingleDieWithRerollsAndTracking(die: Die, condition: string, rerollType: 'once' | 'recursive' | 'exploding'): { value: number; rolls: number[] } {
    let roll = die.roll();
    let total = roll;
    let rerollCount = 0;
    const maxRerolls = DiceExpression.config.MAX_REROLLS;
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
      throw new Error(`Maximum rerolls (${maxRerolls}) reached for safety. This may indicate an infinite reroll condition.`);
    }

    return { value: total, rolls: allRolls };
  }

  /**
   * Process multiplication and division operations
   */
  private evaluateMultiplicationDivision(parts: DiceExpressionPart[]): DiceExpressionPart[] {
    const result: DiceExpressionPart[] = [];
    let i = 0;

    while (i < parts.length) {
      if (i + 2 < parts.length && 
          parts[i + 1].type === 'operator' && 
          (parts[i + 1].operator === '*' || parts[i + 1].operator === '/')) {
        
        const left = this.evaluatePart(parts[i]);
        const operator = parts[i + 1].operator!;
        const right = this.evaluatePart(parts[i + 2]);
        
        let value: number;
        if (operator === '*') {
          value = left * right;
        } else {
          value = Math.floor(left / right);
        }
        
        result.push(DiceExpressionPart.createConstant(value));
        i += 3;
      } else {
        result.push(parts[i]);
        i++;
      }
    }

    return result;
  }

  /**
   * Process addition and subtraction operations
   */
  private evaluateAdditionSubtraction(parts: DiceExpressionPart[]): number {
    let result = this.evaluatePart(parts[0]);
    
    for (let i = 1; i < parts.length; i += 2) {
      if (i + 1 >= parts.length) {
        break;
      }
      
      const operator = parts[i];
      const operand = this.evaluatePart(parts[i + 1]);
      
      switch (operator.operator) {
        case '+':
          result += operand;
          break;
        case '-':
          result -= operand;
          break;
        default:
          throw new Error(`Unknown operator: ${operator.operator}`);
      }
    }
    
    return result;
  }

  /**
   * Evaluate a single part of the expression
   */
  private evaluatePart(part: DiceExpressionPart): number {
    switch (part.type) {
      case 'dice':
        const die = new Die(part.sides!);
        return die.rollMultiple(part.count!).reduce((sum, roll) => sum + roll, 0);
      case 'constant':
        return part.value;
      case 'parentheses':
        if (!part.subExpression) {
          throw new Error('Parentheses part missing sub-expression');
        }
        return this.evaluatePartsList(part.subExpression);
      case 'conditional':
        if (part.count && part.sides) {
          // Conditional dice - count successes
          return this.evaluateConditionalDice(part);
        } else {
          throw new Error('Standalone conditional operators are not supported in expressions');
        }
      case 'reroll':
        // Evaluate reroll dice
        return this.evaluateRerollDice(part);
      default:
        throw new Error(`Cannot evaluate part of type: ${part.type}`);
    }
  }

  /**
   * Evaluate conditional dice and count successes
   */
  private evaluateConditionalDice(part: DiceExpressionPart): number {
    const die = new Die(part.sides!);
    const rolls = die.rollMultiple(part.count!);
    const threshold = part.threshold!;
    const condition = part.condition!;
    
    let successes = 0;
    for (const roll of rolls) {
      switch (condition) {
        case '>':
          if (roll > threshold) successes++;
          break;
        case '>=':
          if (roll >= threshold) successes++;
          break;
        case '<':
          if (roll < threshold) successes++;
          break;
        case '<=':
          if (roll <= threshold) successes++;
          break;
        case '=':
        case '==':
          if (roll === threshold) successes++;
          break;
        default:
          throw new Error(`Unknown conditional operator: ${condition}`);
      }
    }
    
    return successes;
  }

  /**
   * Evaluate reroll dice with various reroll mechanics
   */
  private evaluateRerollDice(part: DiceExpressionPart): number {
    const die = new Die(part.sides!);
    const rerollCondition = part.rerollCondition!;
    const rerollType = part.rerollType!;
    let totalSum = 0;

    for (let i = 0; i < part.count!; i++) {
      totalSum += this.rollSingleDieWithRerolls(die, rerollCondition, rerollType);
    }

    return totalSum;
  }

  /**
   * Roll a single die with reroll mechanics
   */
  private rollSingleDieWithRerolls(die: Die, condition: string, rerollType: 'once' | 'recursive' | 'exploding'): number {
    let roll = die.roll();
    let total = roll;
    let rerollCount = 0;
    const maxRerolls = DiceExpression.config.MAX_REROLLS;

    while (this.shouldReroll(roll, condition) && rerollCount < maxRerolls) {
      if (rerollType === 'exploding') {
        // Standard reroll: keep the original and add the reroll
        roll = die.roll();
        total += roll;
      } else {
        // Replace reroll: discard the original, use the new roll
        roll = die.roll();
        total = roll;
      }
      
      rerollCount++;
      
      // For 'once' type, only reroll once
      if (rerollType === 'once') {
        break;
      }
    }

    if (rerollCount >= maxRerolls) {
      throw new Error(`Maximum rerolls (${maxRerolls}) reached for safety. This may indicate an infinite reroll condition.`);
    }

    return total;
  }

  /**
   * Check if a roll should trigger a reroll based on the condition
   */
  private shouldReroll(roll: number, condition: string): boolean {
    // Parse condition string (e.g., "=1", "<2", ">=5")
    const match = condition.match(/^([<>=]*)(\d+)$/);
    if (!match) {
      throw new Error(`Invalid reroll condition: ${condition}`);
    }

    const operator = match[1] || '='; // Default to equality
    const threshold = parseInt(match[2], 10);

    switch (operator) {
      case '=':
      case '':
        return roll === threshold;
      case '<':
        return roll < threshold;
      case '>':
        return roll > threshold;
      case '<=':
        return roll <= threshold;
      case '>=':
        return roll >= threshold;
      default:
        throw new Error(`Unknown reroll operator: ${operator}`);
    }
  }

  /**
   * Get the minimum possible value of this expression
   */
  public getMinValue(): number {
    if (this.parts.length === 0) {
      return 0;
    }

    return this.getMinValueForParts(this.parts);
  }

  /**
   * Get the maximum possible value of this expression
   */
  public getMaxValue(): number {
    if (this.parts.length === 0) {
      return 0;
    }

    return this.getMaxValueForParts(this.parts);
  }

  /**
   * Getter for minimum value
   */
  public get minValue(): number {
    return this.getMinValue();
  }

  /**
   * Getter for maximum value
   */
  public get maxValue(): number {
    return this.getMaxValue();
  }

  /**
   * Get minimum value for a list of parts (respecting operator precedence)
   */
  private getMinValueForParts(parts: DiceExpressionPart[]): number {
    if (parts.length === 0) {
      return 0;
    }

    if (parts.length === 1) {
      return this.getPartMinValue(parts[0]);
    }

    // Handle multiplication and division first
    const processedParts = this.processMinMaxMultiplicationDivision([...parts], true);
    
    // Then handle addition and subtraction
    return this.processMinMaxAdditionSubtraction(processedParts, true);
  }

  /**
   * Get maximum value for a list of parts (respecting operator precedence)
   */
  private getMaxValueForParts(parts: DiceExpressionPart[]): number {
    if (parts.length === 0) {
      return 0;
    }

    if (parts.length === 1) {
      return this.getPartMaxValue(parts[0]);
    }

    // Handle multiplication and division first
    const processedParts = this.processMinMaxMultiplicationDivision([...parts], false);
    
    // Then handle addition and subtraction
    return this.processMinMaxAdditionSubtraction(processedParts, false);
  }

  /**
   * Process multiplication and division for min/max calculations
   */
  private processMinMaxMultiplicationDivision(parts: DiceExpressionPart[], isMin: boolean): DiceExpressionPart[] {
    const result: DiceExpressionPart[] = [];
    let i = 0;

    while (i < parts.length) {
      if (i + 2 < parts.length && 
          parts[i + 1].type === 'operator' && 
          (parts[i + 1].operator === '*' || parts[i + 1].operator === '/')) {
        
        const leftMin = this.getPartMinValue(parts[i]);
        const leftMax = this.getPartMaxValue(parts[i]);
        const rightMin = this.getPartMinValue(parts[i + 2]);
        const rightMax = this.getPartMaxValue(parts[i + 2]);
        const operator = parts[i + 1].operator!;
        
        let value: number;
        if (operator === '*') {
          if (isMin) {
            value = Math.min(leftMin * rightMin, leftMin * rightMax, leftMax * rightMin, leftMax * rightMax);
          } else {
            value = Math.max(leftMin * rightMin, leftMin * rightMax, leftMax * rightMin, leftMax * rightMax);
          }
        } else { // division
          if (isMin) {
            value = Math.floor(leftMin / rightMax);
          } else {
            value = Math.floor(leftMax / rightMin);
          }
        }
        
        result.push(DiceExpressionPart.createConstant(value));
        i += 3;
      } else {
        result.push(parts[i]);
        i++;
      }
    }

    return result;
  }

  /**
   * Process addition and subtraction for min/max calculations
   */
  private processMinMaxAdditionSubtraction(parts: DiceExpressionPart[], isMin: boolean): number {
    let result = isMin ? this.getPartMinValue(parts[0]) : this.getPartMaxValue(parts[0]);
    
    for (let i = 1; i < parts.length; i += 2) {
      if (i + 1 >= parts.length) {
        break;
      }
      
      const operator = parts[i];
      const operand = isMin ? this.getPartMinValue(parts[i + 1]) : this.getPartMaxValue(parts[i + 1]);
      
      switch (operator.operator) {
        case '+':
          result += operand;
          break;
        case '-':
          if (isMin) {
            result -= this.getPartMaxValue(parts[i + 1]);
          } else {
            result -= this.getPartMinValue(parts[i + 1]);
          }
          break;
      }
    }
    
    return result;
  }

  /**
   * Get the minimum value of a single part
   */
  private getPartMinValue(part: DiceExpressionPart): number {
    switch (part.type) {
      case 'dice':
        return part.count!; // Minimum is 1 per die
      case 'constant':
        return part.value;
      case 'parentheses':
        if (!part.subExpression) {
          return 0;
        }
        return this.getMinValueForParts(part.subExpression);
      case 'conditional':
        if (part.count && part.sides) {
          // For conditional dice, minimum successes is 0
          return 0;
        }
        return 0;
      case 'reroll':
        // For reroll dice, minimum depends on the reroll type
        if (part.rerollType === 'exploding') {
          // Exploding dice add to the total, so minimum is still dice count
          return part.count!;
        } else {
          // Replace rerolls have same minimum as regular dice
          return part.count!;
        }
      default:
        return 0;
    }
  }

  /**
   * Get the maximum value of a single part
   */
  private getPartMaxValue(part: DiceExpressionPart): number {
    switch (part.type) {
      case 'dice':
        return part.count! * part.sides!;
      case 'constant':
        return part.value;
      case 'parentheses':
        if (!part.subExpression) {
          return 0;
        }
        return this.getMaxValueForParts(part.subExpression);
      case 'conditional':
        if (part.count && part.sides) {
          // For conditional dice, maximum successes is the number of dice
          // (assuming all dice could potentially meet the condition)
          return part.count!;
        }
        return 0;
      case 'reroll':
        // For reroll dice, theoretical maximum is very high due to potential infinite rerolls
        // We'll use a practical maximum based on expected behavior
        if (part.rerollType === 'exploding') {
          // Exploding dice can theoretically go very high, but we'll use a practical limit
          // Assume average of 2 extra rolls per die that explodes
          return part.count! * part.sides! * 3; // Conservative estimate
        } else {
          // Replace rerolls have same maximum as regular dice
          return part.count! * part.sides!;
        }
      default:
        return 0;
    }
  }

  /**
   * Get all parts of the expression
   */
  public getParts(): DiceExpressionPart[] {
    return [...this.parts];
  }

  /**
   * String representation of the expression
   */
  public toString(): string {
    return this.parts.map(part => part.toString()).join('');
  }
}
