/**
 * Represents a part of a dice expression (e.g., "3d6", "+5", "*2")
 */
export class DiceExpressionPart {
  public readonly type: 'dice' | 'constant' | 'operator';
  public readonly value: number;
  public readonly operator?: string;
  public readonly count?: number;
  public readonly sides?: number;

  constructor(
    type: 'dice' | 'constant' | 'operator',
    value: number,
    operator?: string,
    count?: number,
    sides?: number
  ) {
    this.type = type;
    this.value = value;
    this.operator = operator;
    this.count = count;
    this.sides = sides;
  }

  /**
   * Create a dice part (e.g., "3d6")
   */
  public static createDice(count: number, sides: number): DiceExpressionPart {
    return new DiceExpressionPart('dice', 0, undefined, count, sides);
  }

  /**
   * Create a constant part (e.g., "5")
   */
  public static createConstant(value: number): DiceExpressionPart {
    return new DiceExpressionPart('constant', value);
  }

  /**
   * Create an operator part (e.g., "+", "-", "*", "/")
   */
  public static createOperator(operator: string): DiceExpressionPart {
    return new DiceExpressionPart('operator', 0, operator);
  }

  /**
   * String representation of the part
   */
  public toString(): string {
    switch (this.type) {
      case 'dice':
        return `${this.count}d${this.sides}`;
      case 'constant':
        return this.value.toString();
      case 'operator':
        return this.operator || '';
      default:
        return '';
    }
  }
}
