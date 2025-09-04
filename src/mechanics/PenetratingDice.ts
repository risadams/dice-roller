import { DiceRoller } from '../core/DiceRoller';
import { PenetratingDiceResult } from '../types/DiceTypes';
import { ValidationHelpers } from '../validation/ValidationHelpers';

/**
 * Handles penetrating dice mechanics (Savage Worlds Aces)
 */
export class PenetratingDice {
  private roller: DiceRoller;

  constructor(roller: DiceRoller) {
    this.roller = roller;
  }

  /**
   * Roll penetrating dice (exploding dice with -1 penalty on subsequent rolls)
   */
  public roll(count: number, sides: number, maxExplosions: number = 10): PenetratingDiceResult {
    ValidationHelpers.validateDiceCount(count);
    ValidationHelpers.validateSides(sides);
    ValidationHelpers.validateExplosionLimit(maxExplosions);

    const allRolls: number[] = [];
    const allOriginalRolls: number[] = [];
    let totalPenetrations = 0;

    for (let i = 0; i < count; i++) {
      const dieResult = this.rollSinglePenetratingDie(sides, maxExplosions);
      allRolls.push(...dieResult.rolls);
      allOriginalRolls.push(...dieResult.originalRolls);
      totalPenetrations += dieResult.penetrations;
    }

    return {
      result: allRolls.reduce((sum, roll) => sum + roll, 0),
      rolls: allRolls,
      penetrations: totalPenetrations,
      originalRolls: allOriginalRolls
    };
  }

  /**
   * Roll a single penetrating die with explosion tracking
   */
  private rollSinglePenetratingDie(sides: number, maxExplosions: number): {
    rolls: number[];
    originalRolls: number[];
    penetrations: number;
  } {
    const rolls: number[] = [];
    const originalRolls: number[] = [];

    let roll = this.roller.rollDie(sides);
    rolls.push(roll);
    originalRolls.push(roll);

    let currentPenetrations = 0;
    while (roll === sides && currentPenetrations < maxExplosions) {
      const originalRoll = this.roller.rollDie(sides);
      const adjustedRoll = originalRoll - 1; // Penetrating: subtract 1 from subsequent rolls
      originalRolls.push(originalRoll);
      
      if (adjustedRoll > 0) { // Only add if positive
        rolls.push(adjustedRoll);
        currentPenetrations++;
      } else {
        // If adjusted roll is 0 or negative, stop penetrating
        break;
      }
      
      // Continue exploding based on the ORIGINAL roll, not the adjusted one
      roll = originalRoll;
    }

    return { rolls, originalRolls, penetrations: currentPenetrations };
  }
}
