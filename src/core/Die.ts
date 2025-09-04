/**
 * Represents a single die with a specified number of sides
 */
export class Die {
  public readonly sides: number;
  private random: () => number;

  constructor(sides: number, randomFunction?: () => number) {
    if (sides <= 0) {
      throw new Error("Number of sides must be positive");
    }
    this.sides = sides;
    this.random = randomFunction || Math.random;
  }

  /**
   * Roll the die and return a random value between 1 and sides (inclusive)
   */
  public roll(): number {
    return Math.floor(this.random() * this.sides) + 1;
  }

  /**
   * Roll the die multiple times and return an array of results
   */
  public rollMultiple(count: number): number[] {
    if (count <= 0) {
      throw new Error("Count must be positive");
    }
    
    const results: number[] = [];
    for (let i = 0; i < count; i++) {
      results.push(this.roll());
    }
    return results;
  }

  /**
   * Get the minimum possible value (always 1)
   */
  public get minValue(): number {
    return 1;
  }

  /**
   * Get the maximum possible value (number of sides)
   */
  public get maxValue(): number {
    return this.sides;
  }

  /**
   * String representation of the die
   */
  public toString(): string {
    return `d${this.sides}`;
  }
}
