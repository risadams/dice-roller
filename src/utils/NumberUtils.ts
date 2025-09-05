/**
 * Utility functions for number parsing, validation, and mathematical operations
 */

export class NumberUtils {
  /**
   * Safely parses an integer with validation
   */
  static safeParseInt(value: string, paramName: string): number {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new Error(`${paramName} must be a valid number`);
    }
    return parsed;
  }

  /**
   * Safely parses a float with validation
   */
  static safeParseFloat(value: string, paramName: string): number {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      throw new Error(`${paramName} must be a valid number`);
    }
    return parsed;
  }

  /**
   * Clamps a number between min and max values
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Rounds a number to specified decimal places
   */
  static roundToDecimal(value: number, decimals: number = 2): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  /**
   * Calculates the sum of an array of numbers
   */
  static sum(numbers: number[]): number {
    return numbers.reduce((acc, num) => acc + num, 0);
  }

  /**
   * Calculates the average of an array of numbers
   */
  static average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return this.sum(numbers) / numbers.length;
  }

  /**
   * Calculates the standard deviation of an array of numbers
   */
  static standardDeviation(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const avg = this.average(numbers);
    const squaredDiffs = numbers.map(num => Math.pow(num - avg, 2));
    const avgSquaredDiff = this.average(squaredDiffs);
    
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Finds the median of an array of numbers
   */
  static median(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const sorted = [...numbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      return sorted[middle];
    }
  }

  /**
   * Finds the mode (most frequent value) in an array of numbers
   */
  static mode(numbers: number[]): number[] {
    if (numbers.length === 0) return [];
    
    const frequency: { [key: number]: number } = {};
    let maxFreq = 0;
    
    // Count frequencies
    for (const num of numbers) {
      frequency[num] = (frequency[num] || 0) + 1;
      maxFreq = Math.max(maxFreq, frequency[num]);
    }
    
    // Find all numbers with max frequency
    return Object.keys(frequency)
      .map(Number)
      .filter(num => frequency[num] === maxFreq);
  }

  /**
   * Generates a random integer between min and max (inclusive)
   */
  static randomInt(min: number, max: number, randomProvider: () => number = Math.random): number {
    return Math.floor(randomProvider() * (max - min + 1)) + min;
  }

  /**
   * Checks if a number is within a specified range (inclusive)
   */
  static isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  /**
   * Formats a number with thousands separators
   */
  static formatWithCommas(value: number): string {
    return value.toLocaleString();
  }

  /**
   * Calculates percentage of a value relative to a total
   */
  static percentage(value: number, total: number, precision: number = 2): number {
    if (total === 0) return 0;
    return this.roundToDecimal((value / total) * 100, precision);
  }
}
