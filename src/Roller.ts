import { Die } from './Die';
import { DiceExpression } from './DiceExpression';
import { CustomDie } from './CustomDie';
import { ValidationHelpers } from './validation/ValidationHelpers';

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
        const die = new Die(part.sides!, this.random);
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
    ValidationHelpers.validateKeepCount(count, keep);

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
    ValidationHelpers.validateKeepCount(count, keep);

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
   * Rolls a single penetrating die with explosion tracking
   */
  private rollSinglePenetratingDie(sides: number, maxExplosions: number): {
    rolls: number[];
    originalRolls: number[];
    penetrations: number;
  } {
    const rolls: number[] = [];
    const originalRolls: number[] = [];

    let roll = this.rollDie(sides);
    rolls.push(roll);
    originalRolls.push(roll);

    let currentPenetrations = 0;
    while (roll === sides && currentPenetrations < maxExplosions) {
      const originalRoll = this.rollDie(sides);
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

  /**
   * Roll penetrating dice (exploding dice but subsequent rolls are reduced by 1)
   * Used in systems like Savage Worlds for Aces
   */
  public rollPenetrating(count: number, sides: number, maxExplosions: number = 10): {
    result: number;
    rolls: number[];
    penetrations: number;
    originalRolls: number[];
  } {
    ValidationHelpers.validateDiceCount(count);
    
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
   * Roll compounding dice (explosions are added to the original die's total)
   * Each die becomes a single large number instead of multiple separate dice
   */
  public rollCompounding(count: number, sides: number, maxExplosions: number = 10): {
    result: number;
    compoundedRolls: number[];
    totalExplosions: number;
    allRolls: number[][];
  } {
    ValidationHelpers.validateDiceCount(count);
    
    const compoundedRolls: number[] = [];
    const allRolls: number[][] = [];
    let totalExplosions = 0;

    for (let i = 0; i < count; i++) {
      const dieRolls: number[] = [];
      let dieTotal = 0;
      let roll = this.rollDie(sides);
      dieRolls.push(roll);
      dieTotal += roll;

      let currentExplosions = 0;
      while (roll === sides && currentExplosions < maxExplosions) {
        roll = this.rollDie(sides);
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

  /**
   * Drop highest N dice from M rolls
   */
  public rollDropHighest(count: number, sides: number, drop: number): {
    result: number;
    kept: number[];
    dropped: number[];
    allRolls: number[];
  } {
    ValidationHelpers.validateDropCount(count, drop);

    const rolls = this.rollDice(count, sides);
    const sorted = [...rolls].sort((a, b) => b - a);
    const dropped = sorted.slice(0, drop);
    const kept = sorted.slice(drop);

    return {
      result: kept.reduce((sum, roll) => sum + roll, 0),
      kept,
      dropped,
      allRolls: rolls
    };
  }

  /**
   * Drop lowest N dice from M rolls
   */
  public rollDropLowest(count: number, sides: number, drop: number): {
    result: number;
    kept: number[];
    dropped: number[];
    allRolls: number[];
  } {
    ValidationHelpers.validateDropCount(count, drop);

    const rolls = this.rollDice(count, sides);
    const sorted = [...rolls].sort((a, b) => a - b);
    const dropped = sorted.slice(0, drop);
    const kept = sorted.slice(drop);

    return {
      result: kept.reduce((sum, roll) => sum + roll, 0),
      kept,
      dropped,
      allRolls: rolls
    };
  }

  /**
   * Keep middle N dice from M rolls (drop highest and lowest)
   */
  public rollKeepMiddle(count: number, sides: number, keep: number): {
    result: number;
    kept: number[];
    dropped: number[];
    allRolls: number[];
  } {
    ValidationHelpers.validateKeepCount(count, keep);
    
    if (keep === count) {
      const rolls = this.rollDice(count, sides);
      return {
        result: rolls.reduce((sum, roll) => sum + roll, 0),
        kept: rolls,
        dropped: [],
        allRolls: rolls
      };
    }

    const rolls = this.rollDice(count, sides);
    const sorted = [...rolls].sort((a, b) => a - b);
    
    const totalToDrop = count - keep;
    const dropLow = Math.floor(totalToDrop / 2);
    const dropHigh = totalToDrop - dropLow;
    
    const kept = sorted.slice(dropLow, sorted.length - dropHigh);
    const dropped = [...sorted.slice(0, dropLow), ...sorted.slice(sorted.length - dropHigh)];

    return {
      result: kept.reduce((sum, roll) => sum + roll, 0),
      kept,
      dropped,
      allRolls: rolls
    };
  }

  /**
   * Keep dice conditionally based on a threshold
   */
  public rollKeepConditional(
    count: number, 
    sides: number, 
    condition: 'above' | 'below' | 'equal', 
    threshold: number
  ): {
    result: number;
    kept: number[];
    dropped: number[];
    allRolls: number[];
  } {
    const rolls = this.rollDice(count, sides);
    const kept: number[] = [];
    const dropped: number[] = [];

    for (const roll of rolls) {
      let keepDie = false;
      switch (condition) {
        case 'above':
          keepDie = roll > threshold;
          break;
        case 'below':
          keepDie = roll < threshold;
          break;
        case 'equal':
          keepDie = roll === threshold;
          break;
      }

      if (keepDie) {
        kept.push(roll);
      } else {
        dropped.push(roll);
      }
    }

    return {
      result: kept.reduce((sum, roll) => sum + roll, 0),
      kept,
      dropped,
      allRolls: rolls
    };
  }

  /**
   * Standard Savage Worlds die progression
   */
  private static readonly DIE_PROGRESSION = [4, 6, 8, 10, 12];

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
    } else if (targetIndex >= Roller.DIE_PROGRESSION.length) {
      // Stepped above d12, becomes d12 + modifier
      return {
        finalDie: 12,
        modifier: targetIndex - (Roller.DIE_PROGRESSION.length - 1)
      };
    } else {
      return {
        finalDie: Roller.DIE_PROGRESSION[targetIndex],
        modifier: 0
      };
    }
  }

  /**
   * Rolls exploding dice (Aces) for Savage Worlds
   */
  private rollWithAces(sides: number): { total: number; aced: boolean; aceRolls?: number[] } {
    let roll = this.rollDie(sides);
    
    if (roll !== sides) {
      return { total: roll, aced: false };
    }

    // Handle exploding dice
    const aceRolls = [roll];
    let totalRoll = roll;
    
    while (roll === sides) {
      roll = this.rollDie(sides);
      aceRolls.push(roll);
      totalRoll += roll;
    }

    return {
      total: totalRoll,
      aced: true,
      aceRolls
    };
  }

  /**
   * Savage Worlds style step dice system
   * Dice "step up" or "step down" in size: d4 -> d6 -> d8 -> d10 -> d12 -> d12+1 -> d12+2, etc.
   */
  public rollStepDice(baseDie: number, steps: number): {
    result: number;
    finalDie: number;
    modifier: number;
    rolled: number;
    aced: boolean;
    aceRolls?: number[];
  } {
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
    const numericResults: number[] = [];

    for (let i = 0; i < samples; i++) {
      const result = customDie.roll();
      results.push(result);
      if (typeof result === 'number') {
        numericResults.push(result);
      }
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

  /**
   * Roll a dice pool and count successes against a threshold
   * Common in World of Darkness, Shadowrun, and similar systems
   */
  public rollSuccessPool(
    count: number, 
    sides: number, 
    threshold: number, 
    options: {
      botchOn?: number; // Value that counts as botch (typically 1), undefined means no botches
      doubleOn?: number; // Value that counts as double success (typically max)
      countBotches?: boolean; // Whether botches subtract from successes
    } = {}
  ): {
    successes: number;
    botches: number;
    rolls: number[];
    netSuccesses: number;
    details: Array<{ roll: number; type: 'success' | 'botch' | 'failure' | 'double' }>;
  } {
    ValidationHelpers.validateDiceCount(count);
    ValidationHelpers.validateThreshold(threshold, sides);

    const { botchOn, doubleOn, countBotches = false } = options;
    
    const rolls = this.rollDice(count, sides);
    let successes = 0;
    let botches = 0;
    const details: Array<{ roll: number; type: 'success' | 'botch' | 'failure' | 'double' }> = [];

    for (const roll of rolls) {
      if (doubleOn !== undefined && roll === doubleOn && roll >= threshold) {
        successes += 2;
        details.push({ roll, type: 'double' });
      } else if (roll >= threshold) {
        successes += 1;
        details.push({ roll, type: 'success' });
      } else if (botchOn !== undefined && roll === botchOn) {
        botches += 1;
        details.push({ roll, type: 'botch' });
      } else {
        details.push({ roll, type: 'failure' });
      }
    }

    const netSuccesses = countBotches ? Math.max(0, successes - botches) : successes;

    return {
      successes,
      botches,
      rolls,
      netSuccesses,
      details
    };
  }

  /**
   * Roll multiple dice against individual target numbers
   * Useful for systems where each die has its own difficulty
   */
  public rollTargetNumbers(
    dice: Array<{ sides: number; target: number }>,
    options: {
      criticalOn?: number; // Exact value that counts as critical hit (e.g., 20 for d20)
      fumbleOn?: number; // Exact value that counts as fumble (e.g., 1 for natural 1)
    } = {}
  ): {
    hits: number;
    misses: number;
    criticalHits: number;
    fumbles: number;
    results: Array<{ 
      roll: number; 
      target: number; 
      hit: boolean; 
      critical: boolean; 
      fumble: boolean;
      margin: number; // How much over/under target
    }>;
  } {
    if (dice.length === 0) {
      throw new Error('At least one die must be specified');
    }

    const { criticalOn, fumbleOn } = options;
    let hits = 0;
    let misses = 0;
    let criticalHits = 0;
    let fumbles = 0;
    const results: Array<{ 
      roll: number; 
      target: number; 
      hit: boolean; 
      critical: boolean; 
      fumble: boolean;
      margin: number;
    }> = [];

    for (const die of dice) {
      ValidationHelpers.validateTarget(die.target, die.sides);

      const roll = this.rollDie(die.sides);
      const hit = roll >= die.target;
      const critical = criticalOn !== undefined && roll === criticalOn;
      const fumble = fumbleOn !== undefined && roll === fumbleOn;
      const margin = roll - die.target;

      if (hit) hits++;
      else misses++;
      
      if (critical) criticalHits++;
      if (fumble) fumbles++;

      results.push({
        roll,
        target: die.target,
        hit,
        critical,
        fumble,
        margin
      });
    }

    return {
      hits,
      misses,
      criticalHits,
      fumbles,
      results
    };
  }

  /**
   * Roll dice pool with variable thresholds per die
   * Advanced version that allows different success thresholds for each die
   */
  public rollVariableSuccessPool(
    pool: Array<{ 
      sides: number; 
      threshold: number; 
      botchOn?: number; // undefined means no botches for this die
      doubleOn?: number; // undefined means no double successes for this die
    }>
  ): {
    totalSuccesses: number;
    totalBotches: number;
    netSuccesses: number;
    results: Array<{
      roll: number;
      sides: number;
      threshold: number;
      successes: number;
      botch: boolean;
      double: boolean;
    }>;
  } {
    if (pool.length === 0) {
      throw new Error('Pool cannot be empty');
    }

    let totalSuccesses = 0;
    let totalBotches = 0;
    const results: Array<{
      roll: number;
      sides: number;
      threshold: number;
      successes: number;
      botch: boolean;
      double: boolean;
    }> = [];

    for (const die of pool) {
      ValidationHelpers.validateThreshold(die.threshold, die.sides);

      const { botchOn, doubleOn } = die;
      
      const roll = this.rollDie(die.sides);
      let successes = 0;
      let botch = false;
      let double = false;

      if (doubleOn !== undefined && roll === doubleOn && roll >= die.threshold) {
        successes = 2;
        double = true;
      } else if (roll >= die.threshold) {
        successes = 1;
      } else if (botchOn !== undefined && roll === botchOn) {
        botch = true;
        totalBotches++;
      }

      totalSuccesses += successes;

      results.push({
        roll,
        sides: die.sides,
        threshold: die.threshold,
        successes,
        botch,
        double
      });
    }

    return {
      totalSuccesses,
      totalBotches,
      netSuccesses: Math.max(0, totalSuccesses - totalBotches),
      results
    };
  }
}
