import { Die } from './Die';
import { DiceExpression } from './DiceExpression';
import { CustomDie } from './CustomDie';

/**
 * Main dice rolling engine that handles various dice operations
 */
export class Roller {
  private random: () => number;

  constructor(randomFunction?: () => number) {
    this.random = randomFunction || Math.random;
  }

  /**
   * Roll a single die with the specified number of sides
   */
  public rollDie(sides: number): number {
    return Math.floor(this.random() * sides) + 1;
  }

  /**
   * Roll multiple dice with the specified number of sides
   */
  public rollDice(count: number, sides: number): number[] {
    const die = new Die(sides);
    return die.rollMultiple(count);
  }

  /**
   * Roll dice and return the sum
   */
  public rollSum(count: number, sides: number): number {
    return this.rollDice(count, sides).reduce((sum, roll) => sum + roll, 0);
  }

  /**
   * Roll a dice expression (e.g., "3d6+5", "2d20-1d4")
   */
  public rollExpression(expression: string): number {
    const diceExpression = new DiceExpression(expression);
    return diceExpression.evaluate();
  }

  /**
   * Parse and evaluate a dice expression, returning detailed results
   */
  public rollExpressionDetailed(expression: string): {
    result: number;
    expression: string;
    minValue: number;
    maxValue: number;
    parts: Array<{ type: string; value: string; result?: number; rolls?: number[] }>;
  } {
    const diceExpression = new DiceExpression(expression);
    const result = diceExpression.evaluate();
    const parts = diceExpression.getParts();
    
    const detailedParts = parts.map(part => {
      if (part.type === 'dice') {
        const die = new Die(part.sides!);
        const rolls = die.rollMultiple(part.count!);
        const sum = rolls.reduce((s, r) => s + r, 0);
        return {
          type: part.type,
          value: `${part.count}d${part.sides}`,
          result: sum,
          rolls
        };
      } else {
        return {
          type: part.type,
          value: part.toString(),
          result: part.type === 'constant' ? part.value : undefined
        };
      }
    });

    return {
      result,
      expression: diceExpression.toString(),
      minValue: diceExpression.getMinValue(),
      maxValue: diceExpression.getMaxValue(),
      parts: detailedParts
    };
  }

  /**
   * Roll a standard set of RPG dice (d4, d6, d8, d10, d12, d20, d100)
   */
  public rollStandard(): { [key: string]: number } {
    return {
      d4: this.rollDie(4),
      d6: this.rollDie(6),
      d8: this.rollDie(8),
      d10: this.rollDie(10),
      d12: this.rollDie(12),
      d20: this.rollDie(20),
      d100: this.rollDie(100)
    };
  }

  /**
   * Roll with advantage (roll twice, take higher)
   */
  public rollWithAdvantage(sides: number): { result: number; rolls: number[] } {
    const rolls = [this.rollDie(sides), this.rollDie(sides)];
    return {
      result: Math.max(...rolls),
      rolls
    };
  }

  /**
   * Roll with disadvantage (roll twice, take lower)
   */
  public rollWithDisadvantage(sides: number): { result: number; rolls: number[] } {
    const rolls = [this.rollDie(sides), this.rollDie(sides)];
    return {
      result: Math.min(...rolls),
      rolls
    };
  }

  /**
   * Roll and keep highest N dice from M rolls
   */
  public rollKeepHighest(count: number, sides: number, keep: number): {
    result: number;
    kept: number[];
    dropped: number[];
    total: number;
  } {
    if (keep > count) {
      throw new Error('Cannot keep more dice than rolled');
    }

    const rolls = this.rollDice(count, sides);
    const sorted = [...rolls].sort((a, b) => b - a);
    const kept = sorted.slice(0, keep);
    const dropped = sorted.slice(keep);

    return {
      result: kept.reduce((sum, roll) => sum + roll, 0),
      kept,
      dropped,
      total: rolls.reduce((sum, roll) => sum + roll, 0)
    };
  }

  /**
   * Roll and keep lowest N dice from M rolls
   */
  public rollKeepLowest(count: number, sides: number, keep: number): {
    result: number;
    kept: number[];
    dropped: number[];
    total: number;
  } {
    if (keep > count) {
      throw new Error('Cannot keep more dice than rolled');
    }

    const rolls = this.rollDice(count, sides);
    const sorted = [...rolls].sort((a, b) => a - b);
    const kept = sorted.slice(0, keep);
    const dropped = sorted.slice(keep);

    return {
      result: kept.reduce((sum, roll) => sum + roll, 0),
      kept,
      dropped,
      total: rolls.reduce((sum, roll) => sum + roll, 0)
    };
  }

  /**
   * Roll exploding dice (reroll on max value)
   */
  public rollExploding(count: number, sides: number, maxExplosions: number = 10): {
    result: number;
    rolls: number[];
    explosions: number;
  } {
    const allRolls: number[] = [];
    let explosions = 0;

    for (let i = 0; i < count; i++) {
      let roll = this.rollDie(sides);
      allRolls.push(roll);

      let currentExplosions = 0;
      while (roll === sides && currentExplosions < maxExplosions) {
        roll = this.rollDie(sides);
        allRolls.push(roll);
        explosions++;
        currentExplosions++;
      }
    }

    return {
      result: allRolls.reduce((sum, roll) => sum + roll, 0),
      rolls: allRolls,
      explosions
    };
  }

  /**
   * Generate statistics for a dice expression
   */
  public getStatistics(expression: string, samples: number = 10000): {
    mean: number;
    min: number;
    max: number;
    standardDeviation: number;
    distribution: { [key: number]: number };
  } {
    const results: number[] = [];
    const distribution: { [key: number]: number } = {};

    for (let i = 0; i < samples; i++) {
      const result = this.rollExpression(expression);
      results.push(result);
      distribution[result] = (distribution[result] || 0) + 1;
    }

    const mean = results.reduce((sum, val) => sum + val, 0) / results.length;
    const variance = results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / results.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      mean,
      min: Math.min(...results),
      max: Math.max(...results),
      standardDeviation,
      distribution
    };
  }

  /**
   * Generate statistics for a custom die
   */
  public getCustomDieStatistics<T>(customDie: CustomDie<T>, samples: number = 10000): {
    mean: number | null;
    min: number | null;
    max: number | null;
    standardDeviation: number | null;
    distribution: { [key: string]: number };
    expectedValue: number | null;
    theoreticalDistribution: { [key: string]: number };
    hasNumericValues: boolean;
    hasNonNumericValues: boolean;
  } {
    const results: T[] = [];
    const distribution: { [key: string]: number } = {};

    for (let i = 0; i < samples; i++) {
      const result = customDie.roll();
      results.push(result);
      const key = String(result);
      distribution[key] = (distribution[key] || 0) + 1;
    }

    // Only calculate numeric statistics if the die has numeric values
    let mean: number | null = null;
    let min: number | null = null;
    let max: number | null = null;
    let standardDeviation: number | null = null;
    let expectedValue: number | null = null;

    if (customDie.hasNumericValues()) {
      const numericResults = results.filter(r => typeof r === 'number') as number[];
      
      if (numericResults.length > 0) {
        mean = numericResults.reduce((sum, val) => sum + val, 0) / numericResults.length;
        min = Math.min(...numericResults);
        max = Math.max(...numericResults);
        
        const variance = numericResults.reduce((sum, val) => sum + Math.pow(val - mean!, 2), 0) / numericResults.length;
        standardDeviation = Math.sqrt(variance);
      }
      
      try {
        expectedValue = customDie.getExpectedValue();
      } catch (error) {
        expectedValue = null;
      }
    }

    // Calculate theoretical distribution
    const theoreticalDistribution: { [key: string]: number } = {};
    const possibleValues = customDie.getPossibleValues();
    for (const value of possibleValues) {
      const key = String(value);
      theoreticalDistribution[key] = customDie.getProbability(value);
    }

    return {
      mean,
      min,
      max,
      standardDeviation,
      distribution,
      expectedValue,
      theoreticalDistribution,
      hasNumericValues: customDie.hasNumericValues(),
      hasNonNumericValues: customDie.hasNonNumericValues()
    };
  }

  /**
   * Roll multiple custom dice and return results
   */
  public rollCustomDice<T>(customDie: CustomDie<T>, count: number): T[] {
    return customDie.rollMultiple(count);
  }

  /**
   * Roll multiple custom dice and return the sum (only works with numeric dice)
   */
  public rollCustomDiceSum(customDie: CustomDie<number>, count: number): number {
    const results = this.rollCustomDice(customDie, count);
    return results.reduce((sum, roll) => sum + roll, 0);
  }

  /**
   * Compare two custom dice by rolling them multiple times
   * For non-numeric dice, compares string representations
   */
  public compareCustomDice<T, U>(
    die1: CustomDie<T>, 
    die2: CustomDie<U>, 
    samples: number = 1000
  ): {
    die1Wins: number;
    die2Wins: number;
    ties: number;
    die1Average: number | null;
    die2Average: number | null;
    results: Array<{ die1: T; die2: U; winner: 'die1' | 'die2' | 'tie' }>;
  } {
    let die1Wins = 0;
    let die2Wins = 0;
    let ties = 0;
    let die1Total = 0;
    let die2Total = 0;
    let die1NumericCount = 0;
    let die2NumericCount = 0;
    const results: Array<{ die1: T; die2: U; winner: 'die1' | 'die2' | 'tie' }> = [];

    for (let i = 0; i < samples; i++) {
      const roll1 = die1.roll();
      const roll2 = die2.roll();
      
      // Track numeric totals if possible
      if (typeof roll1 === 'number') {
        die1Total += roll1;
        die1NumericCount++;
      }
      if (typeof roll2 === 'number') {
        die2Total += roll2;
        die2NumericCount++;
      }

      // Compare values
      let winner: 'die1' | 'die2' | 'tie';
      if (typeof roll1 === 'number' && typeof roll2 === 'number') {
        if (roll1 > roll2) {
          winner = 'die1';
          die1Wins++;
        } else if (roll2 > roll1) {
          winner = 'die2';
          die2Wins++;
        } else {
          winner = 'tie';
          ties++;
        }
      } else {
        // For non-numeric values, compare string representations
        const str1 = String(roll1);
        const str2 = String(roll2);
        if (str1 > str2) {
          winner = 'die1';
          die1Wins++;
        } else if (str2 > str1) {
          winner = 'die2';
          die2Wins++;
        } else {
          winner = 'tie';
          ties++;
        }
      }

      results.push({ die1: roll1, die2: roll2, winner });
    }

    return {
      die1Wins,
      die2Wins,
      ties,
      die1Average: die1NumericCount > 0 ? die1Total / die1NumericCount : null,
      die2Average: die2NumericCount > 0 ? die2Total / die2NumericCount : null,
      results
    };
  }
}
