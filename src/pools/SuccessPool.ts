import { DiceRoller } from '../core/DiceRoller';
import { 
  SuccessPoolOptions, 
  SuccessPoolResult, 
  TargetNumberDie, 
  TargetNumberResult,
  VariablePoolDie,
  VariablePoolResult
} from '../types/PoolTypes';
import { ValidationHelpers } from '../validation/ValidationHelpers';

/**
 * Handles success pool dice mechanics
 */
export class SuccessPool {
  private roller: DiceRoller;

  constructor(roller: DiceRoller) {
    this.roller = roller;
  }

  /**
   * Roll a success pool and count successes based on threshold
   */
  public rollSuccessPool(
    count: number, 
    sides: number, 
    threshold: number, 
    options: SuccessPoolOptions = {}
  ): SuccessPoolResult {
    ValidationHelpers.validateDiceCount(count);
    ValidationHelpers.validateSides(sides);
    ValidationHelpers.validateThreshold(threshold, sides);

    const { botchOn, doubleOn, countBotches = false } = options;
    
    const rolls = this.roller.rollDice(count, sides);
    let successes = 0;
    let botches = 0;

    for (const roll of rolls) {
      if (doubleOn !== undefined && roll === doubleOn && roll >= threshold) {
        successes += 2; // Double success
      } else if (roll >= threshold) {
        successes += 1; // Regular success
      } else if (botchOn !== undefined && roll === botchOn) {
        botches += 1; // Botch
      }
    }

    const netSuccesses = countBotches ? successes - botches : successes;

    return {
      successes,
      botches,
      rolls,
      netSuccesses: countBotches ? netSuccesses : undefined
    };
  }

  /**
   * Roll target numbers for different dice types
   */
  public rollTargetNumbers(dice: TargetNumberDie[], criticalOn?: number): TargetNumberResult {
    if (dice.length === 0) {
      throw new Error('At least one die must be specified');
    }

    const results: Array<{
      roll: number;
      hit: boolean;
      critical: boolean;
      margin: number;
    }> = [];

    for (const die of dice) {
      ValidationHelpers.validateSides(die.sides);
      ValidationHelpers.validateTarget(die.target, die.sides);

      const roll = this.roller.rollDie(die.sides);
      const hit = roll >= die.target;
      const critical = criticalOn !== undefined && roll === criticalOn;
      const margin = roll - die.target;

      results.push({ roll, hit, critical, margin });
    }

    const hits = results.filter(r => r.hit).length;
    const criticals = results.filter(r => r.critical).length;
    const total = results.reduce((sum, r) => sum + r.roll, 0);

    return { hits, criticals, total, results };
  }

  /**
   * Roll variable success pool with different dice types
   */
  public rollVariableSuccessPool(pool: VariablePoolDie[]): VariablePoolResult {
    if (pool.length === 0) {
      throw new Error('Pool cannot be empty');
    }

    const results: Array<{
      roll: number;
      success: boolean;
      botch: boolean;
      double: boolean;
    }> = [];

    for (const die of pool) {
      ValidationHelpers.validateSides(die.sides);
      ValidationHelpers.validateThreshold(die.threshold, die.sides);

      const { botchOn, doubleOn } = die;
      
      const roll = this.roller.rollDie(die.sides);
      let successes = 0;
      let botch = false;
      let double = false;

      if (doubleOn !== undefined && roll === doubleOn && roll >= die.threshold) {
        double = true;
        successes += 2;
      } else if (roll >= die.threshold) {
        successes += 1;
      } else if (botchOn !== undefined && roll === botchOn) {
        botch = true;
      }

      results.push({
        roll,
        success: successes > 0,
        botch,
        double
      });
    }

    const successes = results.reduce((sum, r) => sum + (r.double ? 2 : r.success ? 1 : 0), 0);
    const botches = results.filter(r => r.botch).length;

    return { successes, botches, results };
  }
}
