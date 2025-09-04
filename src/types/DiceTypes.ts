/**
 * Core type definitions for dice rolling operations
 */

export type RandomProvider = () => number;

export interface DiceRollResult {
  result: number;
  rolls: number[];
}

export interface DetailedDiceResult extends DiceRollResult {
  kept?: number[];
  dropped?: number[];
  total?: number;
}

export interface ExplodingDiceResult extends DiceRollResult {
  explosions: number;
  maxReached?: boolean;
}

export interface PenetratingDiceResult extends DiceRollResult {
  penetrations: number;
  originalRolls: number[];
}

export interface CompoundingDiceResult {
  result: number;
  compoundedRolls: number[];
  totalExplosions: number;
  allRolls: number[][];
}

export interface StepDiceResult {
  result: number;
  finalDie: number;
  modifier: number;
  rolled: number;
  aced: boolean;
  aceRolls?: number[];
}

export interface AdvantageResult {
  result: number;
  rolls: number[];
}
