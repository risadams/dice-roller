/**
 * Shared constants for dice mechanics throughout the application
 */

/**
 * Standard step dice progression used in various dice systems
 * Common progression: d4 -> d6 -> d8 -> d10 -> d12
 */
export const DIE_PROGRESSION = [4, 6, 8, 10, 12];

/**
 * Type representing valid step dice values
 */
export type StepDiceValue = 4 | 6 | 8 | 10 | 12;

/**
 * Standard dice sides commonly used in RPG systems
 */
export const STANDARD_DICE_SIDES = [2, 3, 4, 6, 8, 10, 12, 16, 20, 24, 30, 100] as const;

/**
 * Type representing standard dice side values
 */
export type StandardDiceSides = typeof STANDARD_DICE_SIDES[number];

/**
 * Maximum number of dice that can be rolled in a single expression
 * to prevent memory issues and excessively long calculations
 */
export const MAX_DICE_COUNT = 1000;

/**
 * Maximum number of sides a die can have
 * to prevent memory issues and excessively long calculations
 */
export const MAX_DICE_SIDES = 10000;

/**
 * Default maximum number of rerolls to prevent infinite loops
 */
export const DEFAULT_MAX_REROLLS = 100;
