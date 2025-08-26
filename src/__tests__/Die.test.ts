import { Die } from '../Die';

describe('Die', () => {
  describe('constructor', () => {
    it('should create a die with valid number of sides', () => {
      const die = new Die(6);
      expect(die.sides).toBe(6);
    });

    it('should throw error for zero or negative sides', () => {
      expect(() => new Die(0)).toThrow('Number of sides must be positive');
      expect(() => new Die(-1)).toThrow('Number of sides must be positive');
    });
  });

  describe('roll', () => {
    it('should return a value between 1 and sides', () => {
      const die = new Die(6);
      for (let i = 0; i < 100; i++) {
        const result = die.roll();
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(6);
        expect(Number.isInteger(result)).toBe(true);
      }
    });

    it('should work with different die sizes', () => {
      const d20 = new Die(20);
      const result = d20.roll();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(20);
    });
  });

  describe('rollMultiple', () => {
    it('should return correct number of rolls', () => {
      const die = new Die(6);
      const results = die.rollMultiple(5);
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(6);
      });
    });

    it('should throw error for zero or negative count', () => {
      const die = new Die(6);
      expect(() => die.rollMultiple(0)).toThrow('Count must be positive');
      expect(() => die.rollMultiple(-1)).toThrow('Count must be positive');
    });
  });

  describe('properties', () => {
    it('should return correct min and max values', () => {
      const die = new Die(8);
      expect(die.minValue).toBe(1);
      expect(die.maxValue).toBe(8);
    });
  });

  describe('toString', () => {
    it('should return correct string representation', () => {
      const die = new Die(20);
      expect(die.toString()).toBe('d20');
    });
  });
});
