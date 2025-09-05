/**
 * Utility functions for testing, including mock helpers
 */

import { SeededRNG } from './RandomUtils';

export class TestUtils {
  /**
   * Creates a mock random function that returns values in sequence
   */
  static createSequentialMock(values: number[]): () => number {
    let index = 0;
    return () => {
      const value = values[index % values.length];
      index++;
      return value;
    };
  }

  /**
   * Creates a mock random function that always returns the same value
   */
  static createConstantMock(value: number): () => number {
    return () => value;
  }

  /**
   * Creates a mock random function that returns values based on a pattern
   */
  static createPatternMock(pattern: number[]): () => number {
    let index = 0;
    return () => {
      const value = pattern[index % pattern.length];
      index++;
      return value;
    };
  }

  /**
   * Mocks Math.random with a custom function and restores it automatically
   */
  static withMockedRandom<T>(mockFn: () => number, testFn: () => T): T {
    const originalRandom = Math.random;
    Math.random = mockFn;
    
    try {
      return testFn();
    } finally {
      Math.random = originalRandom;
    }
  }

  /**
   * Creates a spy function that tracks calls
   */
  static createSpy<T extends (...args: any[]) => any>(originalFn?: T): T & {
    calls: Array<{ args: Parameters<T>; result: ReturnType<T> }>;
    callCount: number;
    reset: () => void;
  } {
    const calls: Array<{ args: Parameters<T>; result: ReturnType<T> }> = [];
    
    const spy = ((...args: Parameters<T>): ReturnType<T> => {
      const result = originalFn ? originalFn(...args) : undefined;
      calls.push({ args, result });
      return result;
    }) as T & {
      calls: Array<{ args: Parameters<T>; result: ReturnType<T> }>;
      callCount: number;
      reset: () => void;
    };
    
    Object.defineProperty(spy, 'calls', {
      get: () => calls,
      enumerable: true
    });
    
    Object.defineProperty(spy, 'callCount', {
      get: () => calls.length,
      enumerable: true
    });
    
    spy.reset = () => {
      calls.length = 0;
    };
    
    return spy;
  }

  /**
   * Generates test data for dice rolls
   */
  static generateTestRolls(count: number, sides: number, seed?: number): number[] {
    let random = seed ? this.createSeededRandom(seed) : Math.random;
    
    return Array.from({ length: count }, () => 
      Math.floor(random() * sides) + 1
    );
  }

  /**
   * Creates a seeded random number generator for consistent test results
   */
  static createSeededRandom(seed: number): () => number {
    const rng = new SeededRNG(seed);
    return () => rng.next();
  }

  /**
   * Validates that a result is within expected statistical bounds
   */
  static isWithinStatisticalBounds(
    actual: number, 
    expected: number, 
    tolerance: number = 0.1
  ): boolean {
    const margin = expected * tolerance;
    return actual >= expected - margin && actual <= expected + margin;
  }

  /**
   * Creates test data for success pools
   */
  static createSuccessPoolTestData(
    count: number, 
    sides: number, 
    threshold: number,
    seed?: number
  ): {
    rolls: number[];
    successes: number;
    failures: number;
  } {
    const rolls = this.generateTestRolls(count, sides, seed);
    const successes = rolls.filter(roll => roll >= threshold).length;
    const failures = rolls.length - successes;
    
    return { rolls, successes, failures };
  }

  /**
   * Measures execution time of a function
   */
  static measureTime<T>(fn: () => T): { result: T; timeMs: number } {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    return {
      result,
      timeMs: end - start
    };
  }

  /**
   * Runs a function multiple times and returns performance statistics
   */
  static benchmark<T>(
    fn: () => T, 
    iterations: number = 1000
  ): {
    results: T[];
    totalTimeMs: number;
    averageTimeMs: number;
    minTimeMs: number;
    maxTimeMs: number;
  } {
    const results: T[] = [];
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const { result, timeMs } = this.measureTime(fn);
      results.push(result);
      times.push(timeMs);
    }
    
    return {
      results,
      totalTimeMs: times.reduce((sum, time) => sum + time, 0),
      averageTimeMs: times.reduce((sum, time) => sum + time, 0) / times.length,
      minTimeMs: Math.min(...times),
      maxTimeMs: Math.max(...times)
    };
  }

  /**
   * Creates a deep clone of an object for test isolation
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }
    
    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as unknown as T;
    }
    
    if (typeof obj === 'object') {
      const cloned: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }
    
    return obj;
  }

  /**
   * Asserts that two objects are deeply equal
   */
  static deepEqual<T>(actual: T, expected: T): boolean {
    if (actual === expected) return true;
    
    if (actual == null || expected == null) return false;
    
    if (typeof actual !== typeof expected) return false;
    
    if (actual instanceof Array && expected instanceof Array) {
      if (actual.length !== expected.length) return false;
      
      for (let i = 0; i < actual.length; i++) {
        if (!this.deepEqual(actual[i], expected[i])) return false;
      }
      
      return true;
    }
    
    if (typeof actual === 'object' && typeof expected === 'object') {
      const actualKeys = Object.keys(actual as any);
      const expectedKeys = Object.keys(expected as any);
      
      if (actualKeys.length !== expectedKeys.length) return false;
      
      for (const key of actualKeys) {
        if (!expectedKeys.includes(key)) return false;
        if (!this.deepEqual((actual as any)[key], (expected as any)[key])) return false;
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Generates random test expressions for dice notation
   */
  static generateRandomExpression(complexity: 'simple' | 'medium' | 'complex' = 'simple'): string {
    const diceTypes = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];
    const operators = ['+', '-'];
    
    if (complexity === 'simple') {
      const count = Math.floor(Math.random() * 5) + 1;
      const die = diceTypes[Math.floor(Math.random() * diceTypes.length)];
      return `${count}${die}`;
    }
    
    if (complexity === 'medium') {
      const count1 = Math.floor(Math.random() * 3) + 1;
      const die1 = diceTypes[Math.floor(Math.random() * diceTypes.length)];
      const operator = operators[Math.floor(Math.random() * operators.length)];
      const modifier = Math.floor(Math.random() * 10) + 1;
      return `${count1}${die1}${operator}${modifier}`;
    }
    
    // complex
    const count1 = Math.floor(Math.random() * 3) + 1;
    const die1 = diceTypes[Math.floor(Math.random() * diceTypes.length)];
    const operator1 = operators[Math.floor(Math.random() * operators.length)];
    const count2 = Math.floor(Math.random() * 2) + 1;
    const die2 = diceTypes[Math.floor(Math.random() * diceTypes.length)];
    const operator2 = operators[Math.floor(Math.random() * operators.length)];
    const modifier = Math.floor(Math.random() * 5) + 1;
    
    return `${count1}${die1}${operator1}${count2}${die2}${operator2}${modifier}`;
  }
}
