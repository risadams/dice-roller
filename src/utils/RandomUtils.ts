/**
 * @fileoverview Random number generation utilities with seeded and unseeded generators
 * @module RandomUtils
 */

/**
 * Seeded random number generator using Linear Congruential Generator (LCG)
 * Uses standard parameters: a = 1664525, c = 1013904223, m = 2^32
 */
export class SeededRNG {
  private state: number;

  constructor(seed: number = Date.now()) {
    this.state = seed;
  }

  /**
   * Generate next random number between 0 and 1
   */
  next(): number {
    // LCG formula: (a * seed + c) % m
    this.state = (this.state * 1664525 + 1013904223) % (2 ** 32);
    return this.state / (2 ** 32);
  }

  /**
   * Generate random integer between min and max (inclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Reset the generator with a new seed
   */
  setSeed(seed: number): void {
    this.state = seed;
  }

  /**
   * Get current seed state
   */
  getSeed(): number {
    return this.state;
  }
}

/**
 * Random number utilities
 */
export const RandomUtils = {
  /**
   * Create a seeded random number generator
   */
  createSeeded(seed: number = Date.now()): SeededRNG {
    return new SeededRNG(seed);
  },

  /**
   * Generate random integer between min and max (inclusive) using Math.random
   */
  randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Generate random number between 0 and 1 using Math.random
   */
  random(): number {
    return Math.random();
  }
};

export default RandomUtils;
