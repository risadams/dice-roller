import { DiceRoller } from '../core/DiceRoller';
import { DetailedDiceResult } from '../types/DiceTypes';
import { ValidationHelpers } from '../validation/ValidationHelpers';

/**
 * Handles keep and drop dice mechanics
 */
export class KeepDropMechanics {
  private roller: DiceRoller;

  constructor(roller: DiceRoller) {
    this.roller = roller;
  }

  /**
   * Roll and keep highest N dice from M rolls
   */
  public rollKeepHighest(count: number, sides: number, keep: number): DetailedDiceResult {
    ValidationHelpers.validateDiceCount(count);
    ValidationHelpers.validateSides(sides);
    ValidationHelpers.validateKeepCount(count, keep);

    const rolls = this.roller.rollDice(count, sides);
    const sorted = [...rolls].sort((a, b) => b - a);
    const kept = sorted.slice(0, keep);
    const dropped = sorted.slice(keep);

    return {
      result: kept.reduce((sum, roll) => sum + roll, 0),
      rolls,
      kept,
      dropped,
      total: rolls.reduce((sum, roll) => sum + roll, 0)
    };
  }

  /**
   * Roll and keep lowest N dice from M rolls
   */
  public rollKeepLowest(count: number, sides: number, keep: number): DetailedDiceResult {
    ValidationHelpers.validateDiceCount(count);
    ValidationHelpers.validateSides(sides);
    ValidationHelpers.validateKeepCount(count, keep);

    const rolls = this.roller.rollDice(count, sides);
    const sorted = [...rolls].sort((a, b) => a - b);
    const kept = sorted.slice(0, keep);
    const dropped = sorted.slice(keep);

    return {
      result: kept.reduce((sum, roll) => sum + roll, 0),
      rolls,
      kept,
      dropped,
      total: rolls.reduce((sum, roll) => sum + roll, 0)
    };
  }

  /**
   * Keep middle N dice from M rolls (drop highest and lowest)
   */
  public rollKeepMiddle(count: number, sides: number, keep: number): DetailedDiceResult {
    ValidationHelpers.validateDiceCount(count);
    ValidationHelpers.validateSides(sides);
    ValidationHelpers.validateKeepCount(count, keep);
    
    if (keep === count) {
      const rolls = this.roller.rollDice(count, sides);
      return {
        result: rolls.reduce((sum, roll) => sum + roll, 0),
        rolls,
        kept: rolls,
        dropped: [],
        total: rolls.reduce((sum, roll) => sum + roll, 0)
      };
    }

    const rolls = this.roller.rollDice(count, sides);
    const sorted = [...rolls].sort((a, b) => a - b);
    
    const totalToDrop = count - keep;
    const dropLow = Math.floor(totalToDrop / 2);
    const dropHigh = totalToDrop - dropLow;
    
    const kept = sorted.slice(dropLow, sorted.length - dropHigh);
    const dropped = [...sorted.slice(0, dropLow), ...sorted.slice(sorted.length - dropHigh)];

    return {
      result: kept.reduce((sum, roll) => sum + roll, 0),
      rolls,
      kept,
      dropped,
      total: rolls.reduce((sum, roll) => sum + roll, 0)
    };
  }

  /**
   * Drop highest N dice from M rolls
   */
  public rollDropHighest(count: number, sides: number, drop: number): DetailedDiceResult {
    ValidationHelpers.validateDiceCount(count);
    ValidationHelpers.validateSides(sides);
    ValidationHelpers.validateDropCount(count, drop);

    const rolls = this.roller.rollDice(count, sides);
    const sorted = [...rolls].sort((a, b) => b - a);
    const dropped = sorted.slice(0, drop);
    const kept = sorted.slice(drop);

    return {
      result: kept.reduce((sum, roll) => sum + roll, 0),
      rolls,
      kept,
      dropped,
      total: rolls.reduce((sum, roll) => sum + roll, 0)
    };
  }

  /**
   * Drop lowest N dice from M rolls
   */
  public rollDropLowest(count: number, sides: number, drop: number): DetailedDiceResult {
    ValidationHelpers.validateDiceCount(count);
    ValidationHelpers.validateSides(sides);
    ValidationHelpers.validateDropCount(count, drop);

    const rolls = this.roller.rollDice(count, sides);
    const sorted = [...rolls].sort((a, b) => a - b);
    const dropped = sorted.slice(0, drop);
    const kept = sorted.slice(drop);

    return {
      result: kept.reduce((sum, roll) => sum + roll, 0),
      rolls,
      kept,
      dropped,
      total: rolls.reduce((sum, roll) => sum + roll, 0)
    };
  }
}
