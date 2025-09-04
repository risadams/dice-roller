import { DiceRoller } from '../core/DiceRoller';
import { ExplodingDiceResult } from '../types/DiceTypes';
import { ValidationHelpers } from '../validation/ValidationHelpers';

/**
 * Handles standard exploding dice mechanics
 */
export class ExplodingDice {
  private roller: DiceRoller;

  constructor(roller: DiceRoller) {
    this.roller = roller;
  }

  /**
   * Roll exploding dice (reroll on max value)
   */
  public roll(count: number, sides: number, maxExplosions: number = 10): ExplodingDiceResult {
    ValidationHelpers.validateDiceCount(count);
    ValidationHelpers.validateSides(sides);
    ValidationHelpers.validateExplosionLimit(maxExplosions);

    const allRolls: number[] = [];
    let totalExplosions = 0;
    let maxReached = false;

    for (let i = 0; i < count; i++) {
      let roll = this.roller.rollDie(sides);
      allRolls.push(roll);

      let currentExplosions = 0;
      while (roll === sides && currentExplosions < maxExplosions) {
        roll = this.roller.rollDie(sides);
        allRolls.push(roll);
        totalExplosions++;
        currentExplosions++;
        
        if (currentExplosions >= maxExplosions) {
          maxReached = true;
        }
      }
    }

    return {
      result: allRolls.reduce((sum, roll) => sum + roll, 0),
      rolls: allRolls,
      explosions: totalExplosions,
      maxReached
    };
  }
}
