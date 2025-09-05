import { DIE_PROGRESSION } from '../types/DiceConstants';

/**
 * Reusable validation helper functions
 */

export class ValidationHelpers {
  /**
   * Validates that dice count is positive
   */
  static validateDiceCount(count: number): void {
    if (count <= 0) {
      throw new Error('Dice count must be positive');
    }
  }

  /**
   * Validates that keep count doesn't exceed roll count
   */
  static validateKeepCount(count: number, keep: number): void {
    if (keep > count) {
      throw new Error('Cannot keep more dice than rolled');
    }
  }

  /**
   * Validates that drop count doesn't exceed or equal roll count
   */
  static validateDropCount(count: number, drop: number): void {
    if (drop >= count) {
      throw new Error('Cannot drop more dice than or equal to the number rolled');
    }
  }

  /**
   * Validates that threshold is within valid range for the die
   */
  static validateThreshold(threshold: number, sides: number): void {
    if (threshold < 1 || threshold > sides) {
      throw new Error(`Threshold ${threshold} must be between 1 and ${sides}`);
    }
  }

  /**
   * Validates that target number is within valid range for the die
   */
  static validateTarget(target: number, sides: number): void {
    if (target < 1 || target > sides) {
      throw new Error(`Target number ${target} must be between 1 and ${sides}`);
    }
  }

  /**
   * Validates that sides is a positive number
   */
  static validateSides(sides: number): void {
    if (sides <= 0) {
      throw new Error('Die sides must be positive');
    }
  }

  /**
   * Validates that explosions limit is non-negative
   */
  static validateExplosionLimit(maxExplosions: number): void {
    if (maxExplosions < 0) {
      throw new Error('Maximum explosions must be non-negative');
    }
  }

  /**
   * Validates a base die for step dice system and returns its index
   */
  static validateStepDie(baseDie: number): number {
    const dieIndex = (DIE_PROGRESSION as readonly number[]).indexOf(baseDie);
    if (dieIndex === -1) {
      throw new Error(`Invalid base die: d${baseDie}. Must be one of: d4, d6, d8, d10, d12`);
    }
    return dieIndex;
  }
}
