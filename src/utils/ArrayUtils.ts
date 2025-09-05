/**
 * Utility functions for array manipulation and operations
 */

export class ArrayUtils {
  /**
   * Gets the maximum value from an array of numbers
   */
  static max(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return Math.max(...numbers);
  }

  /**
   * Gets the minimum value from an array of numbers
   */
  static min(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return Math.min(...numbers);
  }

  /**
   * Shuffles an array using Fisher-Yates algorithm
   */
  static shuffle<T>(array: T[], randomProvider: () => number = Math.random): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(randomProvider() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Groups array elements by a key function
   */
  static groupBy<T, K extends string | number>(
    array: T[], 
    keyFn: (item: T) => K
  ): Record<K, T[]> {
    const result = {} as Record<K, T[]>;
    
    for (const item of array) {
      const key = keyFn(item);
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(item);
    }
    
    return result;
  }

  /**
   * Counts occurrences of each element in an array
   */
  static countOccurrences<T>(array: T[]): Map<T, number> {
    const counts = new Map<T, number>();
    
    for (const item of array) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }
    
    return counts;
  }

  /**
   * Removes duplicates from an array
   */
  static unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  }

  /**
   * Chunks an array into smaller arrays of specified size
   */
  static chunk<T>(array: T[], size: number): T[][] {
    if (size <= 0) return [];
    
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  /**
   * Flattens a nested array one level deep
   */
  static flatten<T>(array: (T | T[])[]): T[] {
    return array.reduce<T[]>((acc, item) => {
      if (Array.isArray(item)) {
        acc.push(...item);
      } else {
        acc.push(item);
      }
      return acc;
    }, []);
  }

  /**
   * Sorts numbers in ascending order (non-mutating)
   */
  static sortNumbers(numbers: number[], ascending: boolean = true): number[] {
    const result = [...numbers];
    return ascending 
      ? result.sort((a, b) => a - b)
      : result.sort((a, b) => b - a);
  }

  /**
   * Gets the top N elements from an array of numbers
   */
  static topN(numbers: number[], n: number): number[] {
    return this.sortNumbers(numbers, false).slice(0, n);
  }

  /**
   * Gets the bottom N elements from an array of numbers
   */
  static bottomN(numbers: number[], n: number): number[] {
    return this.sortNumbers(numbers, true).slice(0, n);
  }

  /**
   * Filters an array by removing the highest N values
   */
  static dropHighest(numbers: number[], n: number): number[] {
    if (n >= numbers.length) return [];
    
    const sorted = this.sortNumbers(numbers, true);
    return sorted.slice(0, sorted.length - n);
  }

  /**
   * Filters an array by removing the lowest N values
   */
  static dropLowest(numbers: number[], n: number): number[] {
    if (n >= numbers.length) return [];
    
    const sorted = this.sortNumbers(numbers, true);
    return sorted.slice(n);
  }

  /**
   * Keeps only the middle values after dropping highest and lowest
   */
  static keepMiddle(numbers: number[], keep: number): number[] {
    if (keep >= numbers.length) return [...numbers];
    
    const sorted = this.sortNumbers(numbers, true);
    const totalToDrop = sorted.length - keep;
    const dropLow = Math.floor(totalToDrop / 2);
    const dropHigh = totalToDrop - dropLow;
    
    return sorted.slice(dropLow, sorted.length - dropHigh);
  }

  /**
   * Checks if two arrays are equal (shallow comparison)
   */
  static areEqual<T>(array1: T[], array2: T[]): boolean {
    if (array1.length !== array2.length) return false;
    
    for (let i = 0; i < array1.length; i++) {
      if (array1[i] !== array2[i]) return false;
    }
    
    return true;
  }

  /**
   * Finds the intersection of two arrays
   */
  static intersection<T>(array1: T[], array2: T[]): T[] {
    const set2 = new Set(array2);
    return array1.filter(item => set2.has(item));
  }

  /**
   * Finds the difference between two arrays (items in first but not second)
   */
  static difference<T>(array1: T[], array2: T[]): T[] {
    const set2 = new Set(array2);
    return array1.filter(item => !set2.has(item));
  }

  /**
   * Randomly selects N elements from an array
   */
  static randomSample<T>(array: T[], n: number, randomProvider: () => number = Math.random): T[] {
    if (n >= array.length) return [...array];
    
    const shuffled = this.shuffle(array, randomProvider);
    return shuffled.slice(0, n);
  }

  /**
   * Randomly selects one element from an array
   */
  static randomElement<T>(array: T[], randomProvider: () => number = Math.random): T | undefined {
    if (array.length === 0) return undefined;
    
    const index = Math.floor(randomProvider() * array.length);
    return array[index];
  }
}
