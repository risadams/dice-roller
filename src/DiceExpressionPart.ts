/**
 * Represents a part of a dice expression (e.g., "3d6", "+5", "*2", "(2d6+3)")
 */
export class DiceExpressionPart {
  public readonly type: 'dice' | 'constant' | 'operator' | 'parentheses' | 'conditional' | 'reroll';
  public readonly value: number;
  public readonly operator?: string;
  public readonly count?: number;
  public readonly sides?: number;
  public readonly subExpression?: DiceExpressionPart[];
  public readonly condition?: string;
  public readonly threshold?: number;
  public readonly rerollType?: 'once' | 'recursive' | 'exploding';
  public readonly rerollCondition?: string;

  constructor(
    type: 'dice' | 'constant' | 'operator' | 'parentheses' | 'conditional' | 'reroll',
    value: number,
    operator?: string,
    count?: number,
    sides?: number,
    subExpression?: DiceExpressionPart[],
    condition?: string,
    threshold?: number,
    rerollType?: 'once' | 'recursive' | 'exploding',
    rerollCondition?: string
  ) {
    this.type = type;
    this.value = value;
    this.operator = operator;
    this.count = count;
    this.sides = sides;
    this.subExpression = subExpression;
    this.condition = condition;
    this.threshold = threshold;
    this.rerollType = rerollType;
    this.rerollCondition = rerollCondition;
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
   * Create a parentheses part containing a sub-expression
   */
  public static createParentheses(subExpression: DiceExpressionPart[]): DiceExpressionPart {
    return new DiceExpressionPart('parentheses', 0, undefined, undefined, undefined, subExpression);
  }

  /**
   * Create a conditional part (e.g., ">10", ">=4")
   */
  public static createConditional(condition: string, threshold: number): DiceExpressionPart {
    return new DiceExpressionPart('conditional', 0, undefined, undefined, undefined, undefined, condition, threshold);
  }

  /**
   * Create a reroll part with mechanics
   */
  public static createReroll(
    count: number, 
    sides: number, 
    rerollType: 'once' | 'recursive' | 'exploding',
    rerollCondition: string,
    threshold?: number
  ): DiceExpressionPart {
    return new DiceExpressionPart('reroll', threshold || 0, undefined, count, sides, undefined, undefined, threshold, rerollType, rerollCondition);
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
      case 'parentheses':
        return `(${this.subExpression?.map(p => p.toString()).join('') || ''})`;
      case 'conditional':
        return `${this.condition}${this.threshold}`;
      case 'reroll':
        const rerollStr = this.rerollType === 'once' ? 'ro' : 
                         this.rerollType === 'recursive' ? 'rr' : 'r';
        return `${this.count}d${this.sides}${rerollStr}${this.rerollCondition}`;
      default:
        return '';
    }
  }
}
