import { DiceRoller } from '../core/DiceRoller';
import { CompoundingDiceResult } from '../types/DiceTypes';
import { ValidationHelpers } from '../validation/ValidationHelpers';

/**
 * Handles compounding dice mechanics
 */
export class CompoundingDice {
  private roller: DiceRoller;

  constructor(roller: DiceRoller) {
    this.roller = roller;
  }

  /**
   * Roll compounding dice (explosions are added to the original die's total)
   * Each die becomes a single large number instead of multiple separate dice
   */
  public roll(count: number, sides: number, maxExplosions: number = 10): CompoundingDiceResult {
    ValidationHelpers.validateDiceCount(count);
    ValidationHelpers.validateSides(sides);
    ValidationHelpers.validateExplosionLimit(maxExplosions);

    const compoundedRolls: number[] = [];
    const allRolls: number[][] = [];
    let totalExplosions = 0;

    for (let i = 0; i < count; i++) {
      const dieRolls: number[] = [];
      let dieTotal = 0;
      let roll = this.roller.rollDie(sides);
      dieRolls.push(roll);
      dieTotal += roll;

      let currentExplosions = 0;
      while (roll === sides && currentExplosions < maxExplosions) {
        roll = this.roller.rollDie(sides);
        dieRolls.push(roll);
        dieTotal += roll;
        totalExplosions++;
        currentExplosions++;
      }

      compoundedRolls.push(dieTotal);
      allRolls.push(dieRolls);
    }

    return {
      result: compoundedRolls.reduce((sum, roll) => sum + roll, 0),
      compoundedRolls,
      totalExplosions,
      allRolls
    };
  }
}
