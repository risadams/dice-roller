import { Die } from './Die';
import { DiceExpressionPart } from './DiceExpressionPart';

/**
 * Represents a dice expression that can be parsed and evaluated
 */
export class DiceExpression {
  private parts: DiceExpressionPart[] = [];
  
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
    if (expression.length > 1000) {
      throw new Error('Dice expression too long (maximum 1000 characters)');
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
    const regex = /(\d+d\d+[ro]*[<>=]*\d*|d\d+[ro]*[<>=]*\d*|[+\-*/()]|[<>=]+|\d+)/g;
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

    // Check for conditional operators (e.g., 3d6>10, 4d6>=4)
    const remaining = token.substring(diceMatch[0].length);
    if (remaining.length > 0) {
      const conditionalMatch = remaining.match(/^([><=]+)(\d+)/);
      if (conditionalMatch) {
        const operator = conditionalMatch[1];
        const threshold = parseInt(conditionalMatch[2], 10);
        
        // Validate operator
        if (!['>', '>=', '<', '<=', '=', '=='].includes(operator)) {
          throw new Error(`Invalid conditional operator: ${operator}`);
        }
        
        return DiceExpressionPart.createConditionalDice(count, sides, operator, threshold);
      }
      
      // Check for reroll mechanics (for future implementation)
      return this.parseRerollMechanics(count, sides, remaining);
    }

    return DiceExpressionPart.createDice(count, sides);
  }

  /**
   * Parse reroll mechanics (r1, ro<2, rr1, etc.)
   */
  private parseRerollMechanics(count: number, sides: number, mechanics: string): DiceExpressionPart {
    // For now, create a basic dice part - we'll enhance this when implementing reroll mechanics
    // This is a placeholder to support the enhanced tokenization
    return DiceExpressionPart.createDice(count, sides);
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
        // For now, treat reroll dice as regular dice - we'll implement reroll mechanics later
        const rerollDie = new Die(part.sides!);
        return rerollDie.rollMultiple(part.count!).reduce((sum, roll) => sum + roll, 0);
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
        return part.count!; // For now, treat as regular dice
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
        return part.count! * part.sides!; // For now, treat as regular dice
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
