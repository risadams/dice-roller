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
   * Parse a dice expression string (e.g., "3d6+5", "2d20-1d4")
   */
  public parse(expression: string): void {
    this.parts = [];
    
    // Validate input length to prevent ReDoS attacks
    if (expression.length > 1000) {
      throw new Error('Dice expression too long (maximum 1000 characters)');
    }
    
    // Remove spaces and convert to lowercase
    const cleanExpression = expression.replace(/\s/g, '').toLowerCase();
    
    // Regular expression to match dice notation, operators, and constants
    // Fixed to avoid ReDoS: split \d*d\d+ into \d+d\d+ and d\d+ to eliminate ambiguity
    const regex = /(\d+d\d+|d\d+|[+\-*/]|\d+)/g;
    const matches = cleanExpression.match(regex);
    
    if (!matches || matches.join('') !== cleanExpression) {
      throw new Error(`Invalid dice expression: ${expression}`);
    }

    for (const match of matches) {
      if (match.match(/^(\d+d\d+|d\d+)$/)) {
        // Dice notation (e.g., "3d6" or "d20")
        const [countStr, sidesStr] = match.split('d');
        const count = countStr === '' ? 1 : parseInt(countStr, 10);
        const sides = parseInt(sidesStr, 10);
        
        if (isNaN(count) || isNaN(sides) || count <= 0 || sides <= 0) {
          if (count <= 0) {
            throw new Error(`At least one die is required, got ${count} dice in: ${match}`);
          }
          throw new Error(`Invalid dice notation: ${match}`);
        }
        
        this.parts.push(DiceExpressionPart.createDice(count, sides));
      } else if (match.match(/^[+\-*/]$/)) {
        // Operator
        this.parts.push(DiceExpressionPart.createOperator(match));
      } else if (match.match(/^\d+$/)) {
        // Constant
        const value = parseInt(match, 10);
        if (isNaN(value)) {
          throw new Error(`Invalid constant: ${match}`);
        }
        this.parts.push(DiceExpressionPart.createConstant(value));
      } else {
        throw new Error(`Unrecognized token: ${match}`);
      }
    }

    // Validate the expression structure
    this.validateStructure();
  }

  /**
   * Validate that the expression has proper structure
   */
  private validateStructure(): void {
    if (this.parts.length === 0) {
      throw new Error('Empty expression');
    }

    // First part should be dice or constant
    if (this.parts[0].type === 'operator') {
      throw new Error('Expression cannot start with an operator');
    }

    // Last part should be dice or constant
    if (this.parts[this.parts.length - 1].type === 'operator') {
      throw new Error('Expression cannot end with an operator');
    }

    // Check alternating pattern: (dice|constant) operator (dice|constant) ...
    for (let i = 1; i < this.parts.length; i += 2) {
      if (this.parts[i].type !== 'operator') {
        throw new Error('Expected operator at position ' + i);
      }
    }

    for (let i = 0; i < this.parts.length; i += 2) {
      if (this.parts[i].type === 'operator') {
        throw new Error('Expected dice or constant at position ' + i);
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

    let result = this.evaluatePart(this.parts[0]);
    
    for (let i = 1; i < this.parts.length; i += 2) {
      const operator = this.parts[i];
      const operand = this.evaluatePart(this.parts[i + 1]);
      
      switch (operator.operator) {
        case '+':
          result += operand;
          break;
        case '-':
          result -= operand;
          break;
        case '*':
          result *= operand;
          break;
        case '/':
          result = Math.floor(result / operand);
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
      default:
        throw new Error(`Cannot evaluate part of type: ${part.type}`);
    }
  }

  /**
   * Get the minimum possible value of this expression
   */
  public getMinValue(): number {
    if (this.parts.length === 0) {
      return 0;
    }

    let result = this.getPartMinValue(this.parts[0]);
    
    for (let i = 1; i < this.parts.length; i += 2) {
      const operator = this.parts[i];
      const operand = this.getPartMinValue(this.parts[i + 1]);
      
      switch (operator.operator) {
        case '+':
          result += operand;
          break;
        case '-':
          result -= this.getPartMaxValue(this.parts[i + 1]);
          break;
        case '*':
          result *= Math.min(operand, this.getPartMaxValue(this.parts[i + 1]));
          break;
        case '/':
          result = Math.floor(result / this.getPartMaxValue(this.parts[i + 1]));
          break;
      }
    }
    
    return result;
  }

  /**
   * Get the maximum possible value of this expression
   */
  public getMaxValue(): number {
    if (this.parts.length === 0) {
      return 0;
    }

    let result = this.getPartMaxValue(this.parts[0]);
    
    for (let i = 1; i < this.parts.length; i += 2) {
      const operator = this.parts[i];
      const operand = this.getPartMaxValue(this.parts[i + 1]);
      
      switch (operator.operator) {
        case '+':
          result += operand;
          break;
        case '-':
          result -= this.getPartMinValue(this.parts[i + 1]);
          break;
        case '*':
          result *= Math.max(operand, this.getPartMinValue(this.parts[i + 1]));
          break;
        case '/':
          result = Math.floor(result / this.getPartMinValue(this.parts[i + 1]));
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
