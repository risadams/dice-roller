import { DiceRoller } from '../core/DiceRoller';
import { StepDiceResult } from '../types/DiceTypes';
import { ValidationHelpers } from '../validation/ValidationHelpers';

/**
 * Handles Savage Worlds step dice mechanics
 */
export class StepDice {
  private static readonly DIE_PROGRESSION = [4, 6, 8, 10, 12];
  private roller: DiceRoller;

  constructor(roller: DiceRoller) {
    this.roller = roller;
  }

  /**
   * Savage Worlds style step dice system
   * Dice "step up" or "step down" in size: d4 -> d6 -> d8 -> d10 -> d12 -> d12+1 -> d12+2, etc.
   */
  public roll(baseDie: number, steps: number): StepDiceResult {
    const baseIndex = ValidationHelpers.validateStepDie(baseDie);
    const { finalDie, modifier } = this.calculateSteppedDie(baseIndex, steps);
    
    const rollResult = this.rollWithAces(finalDie);
    const finalResult = rollResult.total + modifier;

    return {
      result: Math.max(1, finalResult), // Minimum result is 1
      finalDie,
      modifier,
      rolled: rollResult.total,
      aced: rollResult.aced,
      aceRolls: rollResult.aceRolls
    };
  }

  /**
   * Calculates final die and modifier after applying steps
   */
  private calculateSteppedDie(baseIndex: number, steps: number): { finalDie: number; modifier: number } {
    const targetIndex = baseIndex + steps;
    
    if (targetIndex < 0) {
      // Stepped below d4, treat as d4 with penalty
      return {
        finalDie: 4,
        modifier: targetIndex // Negative modifier
      };
    } else if (targetIndex >= StepDice.DIE_PROGRESSION.length) {
      // Stepped above d12, becomes d12 + modifier
      return {
        finalDie: 12,
        modifier: targetIndex - (StepDice.DIE_PROGRESSION.length - 1)
      };
    } else {
      return {
        finalDie: StepDice.DIE_PROGRESSION[targetIndex],
        modifier: 0
      };
    }
  }

  /**
   * Rolls exploding dice (Aces) for Savage Worlds
   */
  private rollWithAces(sides: number): { total: number; aced: boolean; aceRolls?: number[] } {
    let roll = this.roller.rollDie(sides);
    
    if (roll !== sides) {
      return { total: roll, aced: false };
    }

    // Handle exploding dice
    const aceRolls = [roll];
    let totalRoll = roll;
    
    while (roll === sides) {
      roll = this.roller.rollDie(sides);
      aceRolls.push(roll);
      totalRoll += roll;
    }

    return {
      total: totalRoll,
      aced: true,
      aceRolls
    };
  }
}
