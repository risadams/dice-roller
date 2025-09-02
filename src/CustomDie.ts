/**
 * Represents a custom die with user-defined values for each side
 * Supports both numeric and non-numeric faces (e.g., strings, symbols)
 */
export class CustomDie<T = number | string> {
  public readonly sides: number;
  public readonly values: readonly T[];
  private random: () => number;

  constructor(values: T[], randomFunction?: () => number) {
    if (!values || values.length === 0) {
      throw new Error("Values array cannot be empty");
    }
    
    this.values = Object.freeze([...values]);
    this.sides = values.length;
    this.random = randomFunction || Math.random;
  }

  /**
   * Roll the die and return a random value from the defined values
   */
  public roll(): T {
    const index = Math.floor(this.random() * this.sides);
    return this.values[index];
  }

  /**
   * Roll the die multiple times and return an array of results
   */
  public rollMultiple(count: number): T[] {
    if (count <= 0) {
      throw new Error("Count must be positive");
    }
    
    const results: T[] = [];
    for (let i = 0; i < count; i++) {
      results.push(this.roll());
    }
    return results;
  }

  /**
   * Get the minimum possible numeric value (only considers numeric values)
   */
  public get minValue(): number {
    const numericValues = this.getNumericValues();
    if (numericValues.length === 0) {
      throw new Error("No numeric values found on this die");
    }
    return Math.min(...numericValues);
  }

  /**
   * Get the maximum possible numeric value (only considers numeric values)
   */
  public get maxValue(): number {
    const numericValues = this.getNumericValues();
    if (numericValues.length === 0) {
      throw new Error("No numeric values found on this die");
    }
    return Math.max(...numericValues);
  }

  /**
   * Get all possible values this die can produce
   */
  public getPossibleValues(): T[] {
    const uniqueValues = [...new Set(this.values)];
    const numericValues = uniqueValues.filter(v => typeof v === 'number') as number[];
    const nonNumericValues = uniqueValues.filter(v => typeof v !== 'number');
    const sortedNumeric = numericValues.slice().sort((a, b) => a - b);
    const sortedNonNumeric = nonNumericValues.slice().sort((a, b) => String(a).localeCompare(String(b)));
    return [...(sortedNumeric as T[]), ...(sortedNonNumeric as T[])];
  }

  /**
   * Get only the numeric values from this die
   */
  public getNumericValues(): number[] {
    return this.values.filter(value => typeof value === 'number') as number[];
  }

  /**
   * Get only the non-numeric values from this die
   */
  public getNonNumericValues(): T[] {
    return this.values.filter(value => typeof value !== 'number');
  }

  /**
   * Check if this die has any numeric values
   */
  public hasNumericValues(): boolean {
    return this.values.some(value => typeof value === 'number');
  }

  /**
   * Check if this die has any non-numeric values
   */
  public hasNonNumericValues(): boolean {
    return this.values.some(value => typeof value !== 'number');
  }

  /**
   * Get the probability of rolling a specific value
   */
  public getProbability(value: T): number {
    const occurrences = this.values.filter(v => v === value).length;
    return occurrences / this.sides;
  }

  /**
   * Calculate expected value (mean) of numeric values only
   */
  public getExpectedValue(): number {
    const numericValues = this.getNumericValues();
    if (numericValues.length === 0) {
      throw new Error("Cannot calculate expected value: no numeric values found");
    }
    
    // Calculate expected value considering only numeric faces
    let sum = 0;
    let numericCount = 0;
    
    for (const value of this.values) {
      if (typeof value === 'number') {
        sum += value;
        numericCount++;
      }
    }
    
    return sum / this.sides; // Divided by total sides, not just numeric ones
  }

  /**
   * String representation of the die
   */
  public toString(): string {
    return `custom[${this.values.join(',')}]`;
  }
}

/**
 * Pre-configured dice templates for common use cases
 */
export class DicePresets {
  /**
   * Create a Fibonacci sequence die with the specified number of terms
   * Perfect for Scrum planning poker
   */
  public static createFibonacciDie(terms: number = 8): CustomDie<number> {
    if (terms <= 0) {
      throw new Error("Number of terms must be positive");
    }

    const fibValues: number[] = [];
    
    if (terms >= 1) fibValues.push(0);
    if (terms >= 2) fibValues.push(1);
    
    for (let i = 2; i < terms; i++) {
      fibValues.push(fibValues[i - 1] + fibValues[i - 2]);
    }

    return new CustomDie(fibValues);
  }

  /**
   * Create a standard Scrum planning poker die
   * Values: 1, 2, 3, 5, 8, 13, 20, "?"
   */
  public static createScrumPlanningDie(): CustomDie<number | string> {
    return new CustomDie([1, 2, 3, 5, 8, 13, 20, "?"]);
  }

  /**
   * Create a simple text-based die (e.g., "Yes", "No", "Maybe")
   */
  public static createTextDie(values: string[]): CustomDie<string> {
    return new CustomDie(values);
  }

  /**
   * Create a classic Magic 8-Ball style die
   */
  public static createMagic8BallDie(): CustomDie<string> {
    return new CustomDie([
      "Yes",
      "No", 
      "Maybe",
      "Ask again later",
      "Definitely",
      "Absolutely not",
      "Signs point to yes",
      "Cannot predict now"
    ]);
  }

  /**
   * Create a coin flip die
   */
  public static createCoinDie(): CustomDie<string> {
    return new CustomDie(["Heads", "Tails"]);
  }

  /**
   * Create a die with arithmetic progression
   */
  public static createArithmeticDie(start: number, step: number, count: number): CustomDie<number> {
    if (count <= 0) {
      throw new Error("Count must be positive");
    }

    const values: number[] = [];
    for (let i = 0; i < count; i++) {
      values.push(start + (i * step));
    }

    return new CustomDie(values);
  }

  /**
   * Create a die with geometric progression
   */
  public static createGeometricDie(start: number, ratio: number, count: number): CustomDie<number> {
    if (count <= 0) {
      throw new Error("Count must be positive");
    }
    if (start === 0) {
      throw new Error("Start value cannot be zero for geometric progression");
    }

    const values: number[] = [];
    let current = start;
    for (let i = 0; i < count; i++) {
      values.push(Math.round(current));
      current *= ratio;
    }

    return new CustomDie(values);
  }

  /**
   * Create a weighted die where some values appear more frequently
   */
  public static createWeightedDie<T = number>(valueWeights: Array<{ value: T; weight: number }>): CustomDie<T> {
    if (!valueWeights || valueWeights.length === 0) {
      throw new Error("Value weights array cannot be empty");
    }

    const values: T[] = [];
    for (const { value, weight } of valueWeights) {
      if (weight <= 0) {
        throw new Error("Weight must be positive");
      }
      for (let i = 0; i < weight; i++) {
        values.push(value);
      }
    }

    return new CustomDie(values);
  }
}
