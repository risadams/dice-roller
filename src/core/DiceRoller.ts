import { Die } from './Die';
import { RandomProvider, DiceRollResult, AdvantageResult } from '../types/DiceTypes';
import { ValidationHelpers } from '../validation/ValidationHelpers';

/**
 * Core dice rolling functionality - basic operations only
 */
export class DiceRoller {
  private random: RandomProvider;

  constructor(randomFunction?: RandomProvider) {
    this.random = randomFunction || Math.random;
  }

  /**
   * Roll a single die with the specified number of sides
   */
  public rollDie(sides: number): number {
    ValidationHelpers.validateSides(sides);
    return Math.floor(this.random() * sides) + 1;
  }

  /**
   * Roll multiple dice with the specified number of sides
   */
  public rollDice(count: number, sides: number): number[] {
    ValidationHelpers.validateDiceCount(count);
    ValidationHelpers.validateSides(sides);
    
    const die = new Die(sides, this.random);
    return die.rollMultiple(count);
  }

  /**
   * Roll dice and return the sum
   */
  public rollSum(count: number, sides: number): number {
    return this.rollDice(count, sides).reduce((sum, roll) => sum + roll, 0);
  }

  /**
   * Roll with advantage (roll twice, take higher)
   */
  public rollWithAdvantage(sides: number): AdvantageResult {
    ValidationHelpers.validateSides(sides);
    
    const rolls = [this.rollDie(sides), this.rollDie(sides)];
    return {
      result: Math.max(...rolls),
      rolls
    };
  }

  /**
   * Roll with disadvantage (roll twice, take lower)
   */
  public rollWithDisadvantage(sides: number): AdvantageResult {
    ValidationHelpers.validateSides(sides);
    
    const rolls = [this.rollDie(sides), this.rollDie(sides)];
    return {
      result: Math.min(...rolls),
      rolls
    };
  }

  /**
   * Get the random function used by this roller
   */
  public getRandomProvider(): RandomProvider {
    return this.random;
  }
}
