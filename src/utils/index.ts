/**
 * Central export file for all utility modules
 * Provides convenient access to all utility functions in the dice roller library
 */

import { NumberUtils } from './NumberUtils';
import { ArrayUtils } from './ArrayUtils';
import { StringUtils } from './StringUtils';
import { ConsoleUtils } from './ConsoleUtils';
import { TestUtils } from './TestUtils';
import { ValidationHelpers } from '../validation/ValidationHelpers';
import { SeededRNG } from './RandomUtils';

// Export the utility classes
export { NumberUtils } from './NumberUtils';
export { ArrayUtils } from './ArrayUtils';
export { StringUtils } from './StringUtils';
export { ConsoleUtils } from './ConsoleUtils';
export { TestUtils } from './TestUtils';
export { SeededRNG } from './RandomUtils';

// Re-export commonly used utilities for convenience
export const {
  safeParseInt,
  safeParseFloat,
  clamp,
  roundToDecimal,
  sum,
  average,
  standardDeviation,
  median,
  mode,
  randomInt,
  isInRange,
  formatWithCommas,
  percentage
} = NumberUtils;

export const {
  max,
  min,
  shuffle,
  groupBy,
  countOccurrences,
  unique,
  chunk,
  flatten,
  sortNumbers,
  topN,
  bottomN,
  dropHighest,
  dropLowest,
  keepMiddle,
  areEqual,
  intersection,
  difference,
  randomSample,
  randomElement
} = ArrayUtils;

export const {
  capitalize,
  toTitleCase,
  pad,
  truncate,
  pluralize,
  ordinal,
  grammarJoin,
  formatDiceRolls,
  formatDiceExpression,
  stripAnsi,
  wordWrap,
  progressBar,
  formatPercentage,
  escapeRegex,
  isInteger,
  isFloat,
  formatDuration,
  formatBytes
} = StringUtils;

export const {
  Colors,
  Symbols,
  colorize,
  log,
  error,
  success,
  warning,
  info,
  header,
  box,
  table,
  progress,
  clear,
  separator,
  formatDiceResult,
  formatSuccessPool,
  formatStatistics,
  formatHelp
} = ConsoleUtils;

export const {
  createSequentialMock,
  createConstantMock,
  createPatternMock,
  withMockedRandom,
  createSpy,
  generateTestRolls,
  createSeededRandom,
  isWithinStatisticalBounds,
  createSuccessPoolTestData,
  measureTime,
  benchmark,
  deepClone,
  deepEqual,
  generateRandomExpression
} = TestUtils;

/**
 * Utility constants for common dice-related values
 */
export const DiceConstants = {
  STANDARD_DICE: [4, 6, 8, 10, 12, 20, 100],
  MIN_DICE_SIDES: 2,
  MAX_DICE_SIDES: 1000,
  MIN_DICE_COUNT: 1,
  MAX_DICE_COUNT: 1000,
  DEFAULT_EXPLOSION_LIMIT: 100,
  
  // Common dice step progression (for step dice)
  STEP_PROGRESSION: [4, 6, 8, 10, 12],
  
  // Unicode dice faces
  DICE_FACES: {
    1: '⚀',
    2: '⚁',
    3: '⚂',
    4: '⚃',
    5: '⚄',
    6: '⚅'
  } as const,
  
  // Common dice expressions
  COMMON_EXPRESSIONS: [
    'd4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100',
    '2d6', '3d6', '4d6',
    '1d20+1', '1d20+2', '1d20+3',
    '2d6+6', '3d6+3'
  ] as const
} as const;

/**
 * Type definitions for common utility patterns
 */
export type DiceResult = {
  result: number;
  rolls?: number[];
  details?: string[];
};

export type SuccessPoolResult = {
  successes: number;
  rolls: number[];
  botches?: number;
  doubles?: number;
  netSuccesses?: number;
};

export type StatisticsResult = {
  min: number;
  max: number;
  average: number;
  standardDeviation: number;
  distribution?: Record<number, number>;
};

export type RandomProvider = () => number;

/**
 * Validation helpers specifically for dice operations
 */
export const DiceValidation = {
  /**
   * Validates dice count is within reasonable bounds
   */
  validateDiceCount(count: number, min: number = 1, max: number = 1000): void {
    if (!Number.isInteger(count) || count < min || count > max) {
      throw new Error(`Dice count must be an integer between ${min} and ${max}`);
    }
  },

  /**
   * Validates dice sides is within reasonable bounds
   */
  validateDiceSides(sides: number, min: number = 2, max: number = 1000): void {
    if (!Number.isInteger(sides) || sides < min || sides > max) {
      throw new Error(`Dice sides must be an integer between ${min} and ${max}`);
    }
  },

  /**
   * Validates threshold is within valid range for dice
   */
  validateThreshold(threshold: number, sides: number): void {
    ValidationHelpers.validateThreshold(threshold, sides);
  },

  /**
   * Validates explosion limit is reasonable
   */
  validateExplosionLimit(limit: number, min: number = 1, max: number = 1000): void {
    if (!Number.isInteger(limit) || limit < min || limit > max) {
      throw new Error(`Explosion limit must be an integer between ${min} and ${max}`);
    }
  }
} as const;
