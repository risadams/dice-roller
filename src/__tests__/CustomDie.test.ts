import { CustomDie, DicePresets } from '../CustomDie';

describe('CustomDie', () => {
  describe('constructor', () => {
    it('should create a custom die with valid numeric values', () => {
      const values = [1, 3, 5, 7, 9];
      const die = new CustomDie(values);
      expect(die.sides).toBe(5);
      expect(die.values).toEqual(values);
    });

    it('should create a custom die with string values', () => {
      const values = ['A', 'B', 'C'];
      const die = new CustomDie(values);
      expect(die.sides).toBe(3);
      expect(die.values).toEqual(values);
    });

    it('should create a custom die with mixed numeric and string values', () => {
      const values = [1, 'A', 3, 'B'];
      const die = new CustomDie(values);
      expect(die.sides).toBe(4);
      expect(die.values).toEqual(values);
    });

    it('should throw error for empty values array', () => {
      expect(() => new CustomDie([])).toThrow('Values array cannot be empty');
      expect(() => new CustomDie(null as any)).toThrow('Values array cannot be empty');
      expect(() => new CustomDie(undefined as any)).toThrow('Values array cannot be empty');
    });

    it('should freeze the values array to prevent mutation', () => {
      const values = [1, 2, 3];
      const die = new CustomDie(values);
      expect(() => {
        (die.values as any).push(4);
      }).toThrow();
    });
  });

  describe('roll', () => {
    it('should return values only from the defined numeric set', () => {
      const values = [2, 4, 6, 8, 10];
      const die = new CustomDie(values);
      
      for (let i = 0; i < 100; i++) {
        const result = die.roll();
        expect(values).toContain(result);
      }
    });

    it('should return values only from the defined string set', () => {
      const values = ['red', 'blue', 'green'];
      const die = new CustomDie(values);
      
      for (let i = 0; i < 50; i++) {
        const result = die.roll();
        expect(values).toContain(result);
      }
    });

    it('should work with mixed numeric and string values', () => {
      const values = [1, 'A', 3, 'B', 5];
      const die = new CustomDie(values);
      
      for (let i = 0; i < 50; i++) {
        const result = die.roll();
        expect(values).toContain(result);
      }
    });

    it('should work with negative values', () => {
      const values = [-5, -2, 0, 3, 7];
      const die = new CustomDie(values);
      
      for (let i = 0; i < 50; i++) {
        const result = die.roll();
        expect(values).toContain(result);
      }
    });

    it('should work with duplicate values', () => {
      const values = [1, 1, 2, 2, 2, 3];
      const die = new CustomDie(values);
      
      for (let i = 0; i < 50; i++) {
        const result = die.roll();
        expect([1, 2, 3]).toContain(result);
      }
    });
  });

  describe('rollMultiple', () => {
    it('should return correct number of rolls', () => {
      const die = new CustomDie([1, 2, 3, 4, 5]);
      const results = die.rollMultiple(10);
      expect(results).toHaveLength(10);
      
      results.forEach(result => {
        expect([1, 2, 3, 4, 5]).toContain(result);
      });
    });

    it('should throw error for invalid count', () => {
      const die = new CustomDie([1, 2, 3]);
      expect(() => die.rollMultiple(0)).toThrow('Count must be positive');
      expect(() => die.rollMultiple(-1)).toThrow('Count must be positive');
    });
  });

  describe('minValue and maxValue', () => {
    it('should return correct min and max values for numeric die', () => {
      const die = new CustomDie([5, 1, 9, 3, 7]);
      expect(die.minValue).toBe(1);
      expect(die.maxValue).toBe(9);
    });

    it('should handle negative values correctly', () => {
      const die = new CustomDie([-10, -5, 0, 3, 8]);
      expect(die.minValue).toBe(-10);
      expect(die.maxValue).toBe(8);
    });

    it('should throw error for non-numeric die', () => {
      const die = new CustomDie(['A', 'B', 'C']);
      expect(() => die.minValue).toThrow('No numeric values found on this die');
      expect(() => die.maxValue).toThrow('No numeric values found on this die');
    });

    it('should work with mixed values by considering only numeric ones', () => {
      const die = new CustomDie([1, 'A', 5, 'B', 3]);
      expect(die.minValue).toBe(1);
      expect(die.maxValue).toBe(5);
    });
  });

  describe('getPossibleValues', () => {
    it('should return unique numeric values sorted', () => {
      const die = new CustomDie([3, 1, 3, 5, 1, 2]);
      const possibleValues = die.getPossibleValues();
      expect(possibleValues).toEqual([1, 2, 3, 5]);
    });

    it('should return unique string values sorted', () => {
      const die = new CustomDie(['C', 'A', 'C', 'B', 'A']);
      const possibleValues = die.getPossibleValues();
      expect(possibleValues).toEqual(['A', 'B', 'C']);
    });

    it('should handle mixed values correctly', () => {
      const die = new CustomDie([3, 'B', 1, 'A', 2]);
      const possibleValues = die.getPossibleValues();
      expect(possibleValues).toEqual([1, 2, 3, 'A', 'B']);
    });
  });

  describe('getNumericValues and getNonNumericValues', () => {
    it('should separate numeric and non-numeric values', () => {
      const die = new CustomDie([1, 'A', 2, 'B', 3]);
      expect(die.getNumericValues()).toEqual([1, 2, 3]);
      expect(die.getNonNumericValues()).toEqual(['A', 'B']);
    });

    it('should return empty array when no numeric values exist', () => {
      const die = new CustomDie(['A', 'B', 'C']);
      expect(die.getNumericValues()).toEqual([]);
    });

    it('should return empty array when no non-numeric values exist', () => {
      const die = new CustomDie([1, 2, 3]);
      expect(die.getNonNumericValues()).toEqual([]);
    });
  });

  describe('hasNumericValues and hasNonNumericValues', () => {
    it('should correctly identify numeric-only die', () => {
      const die = new CustomDie([1, 2, 3]);
      expect(die.hasNumericValues()).toBe(true);
      expect(die.hasNonNumericValues()).toBe(false);
    });

    it('should correctly identify string-only die', () => {
      const die = new CustomDie(['A', 'B', 'C']);
      expect(die.hasNumericValues()).toBe(false);
      expect(die.hasNonNumericValues()).toBe(true);
    });

    it('should correctly identify mixed die', () => {
      const die = new CustomDie([1, 'A', 2]);
      expect(die.hasNumericValues()).toBe(true);
      expect(die.hasNonNumericValues()).toBe(true);
    });
  });

  describe('getProbability', () => {
    it('should calculate correct probabilities for numeric values', () => {
      const die = new CustomDie([1, 1, 2, 2, 2, 3]); // 2 ones, 3 twos, 1 three
      expect(die.getProbability(1)).toBeCloseTo(2/6);
      expect(die.getProbability(2)).toBeCloseTo(3/6);
      expect(die.getProbability(3)).toBeCloseTo(1/6);
      expect(die.getProbability(4)).toBe(0);
    });

    it('should calculate correct probabilities for string values', () => {
      const die = new CustomDie(['A', 'A', 'B', 'C', 'C', 'C']);
      expect(die.getProbability('A')).toBeCloseTo(2/6);
      expect(die.getProbability('B')).toBeCloseTo(1/6);
      expect(die.getProbability('C')).toBeCloseTo(3/6);
      expect(die.getProbability('D')).toBe(0);
    });
  });

  describe('getExpectedValue', () => {
    it('should calculate correct expected value for numeric die', () => {
      const die = new CustomDie([1, 2, 3, 4, 5, 6]);
      expect(die.getExpectedValue()).toBeCloseTo(3.5);
    });

    it('should handle duplicate values correctly', () => {
      const die = new CustomDie([1, 1, 3, 3]); // Expected: (1+1+3+3)/4 = 2
      expect(die.getExpectedValue()).toBe(2);
    });

    it('should throw error for non-numeric die', () => {
      const die = new CustomDie(['A', 'B', 'C']);
      expect(() => die.getExpectedValue()).toThrow('Cannot calculate expected value: no numeric values found');
    });

    it('should calculate expected value considering only numeric faces in mixed die', () => {
      const die = new CustomDie([1, 'A', 2, 'B']); // (1 + 2) / 4 = 0.75
      expect(die.getExpectedValue()).toBe(0.75);
    });
  });

  describe('toString', () => {
    it('should return proper string representation', () => {
      const die = new CustomDie([1, 3, 5]);
      expect(die.toString()).toBe('custom[1,3,5]');
    });
  });
});

describe('DicePresets', () => {
  describe('createFibonacciDie', () => {
    it('should create Fibonacci sequence die with correct values', () => {
      const die = DicePresets.createFibonacciDie(8);
      expect(die.values).toEqual([0, 1, 1, 2, 3, 5, 8, 13]);
    });

    it('should handle small term counts', () => {
      const die1 = DicePresets.createFibonacciDie(1);
      expect(die1.values).toEqual([0]);

      const die2 = DicePresets.createFibonacciDie(2);
      expect(die2.values).toEqual([0, 1]);

      const die3 = DicePresets.createFibonacciDie(3);
      expect(die3.values).toEqual([0, 1, 1]);
    });

    it('should throw error for invalid term count', () => {
      expect(() => DicePresets.createFibonacciDie(0)).toThrow('Number of terms must be positive');
      expect(() => DicePresets.createFibonacciDie(-1)).toThrow('Number of terms must be positive');
    });
  });

  describe('createScrumPlanningDie', () => {
    it('should create standard Scrum planning die with "?" character', () => {
      const die = DicePresets.createScrumPlanningDie();
      expect(die.values).toEqual([1, 2, 3, 5, 8, 13, 20, "?"]);
      expect(die.hasNumericValues()).toBe(true);
      expect(die.hasNonNumericValues()).toBe(true);
    });

    it('should allow rolling the "?" value', () => {
      const die = DicePresets.createScrumPlanningDie();
      const results: (string | number)[] = [];
      
      // Roll many times to likely get the "?" value
      for (let i = 0; i < 100; i++) {
        results.push(die.roll());
      }
      
      expect(results).toContain("?");
    });
  });

  describe('createTextDie', () => {
    it('should create text-based die', () => {
      const die = DicePresets.createTextDie(['Yes', 'No', 'Maybe']);
      expect(die.values).toEqual(['Yes', 'No', 'Maybe']);
      expect(die.hasNumericValues()).toBe(false);
      expect(die.hasNonNumericValues()).toBe(true);
    });
  });

  describe('createMagic8BallDie', () => {
    it('should create Magic 8-Ball style die', () => {
      const die = DicePresets.createMagic8BallDie();
      expect(die.sides).toBe(8);
      expect(die.values).toContain('Yes');
      expect(die.values).toContain('No');
      expect(die.values).toContain('Maybe');
      expect(die.hasNumericValues()).toBe(false);
      expect(die.hasNonNumericValues()).toBe(true);
    });
  });

  describe('createCoinDie', () => {
    it('should create coin flip die', () => {
      const die = DicePresets.createCoinDie();
      expect(die.values).toEqual(['Heads', 'Tails']);
      expect(die.hasNumericValues()).toBe(false);
      expect(die.hasNonNumericValues()).toBe(true);
    });
  });

  describe('createArithmeticDie', () => {
    it('should create arithmetic progression die', () => {
      const die = DicePresets.createArithmeticDie(5, 3, 4); // 5, 8, 11, 14
      expect(die.values).toEqual([5, 8, 11, 14]);
    });

    it('should handle negative step', () => {
      const die = DicePresets.createArithmeticDie(10, -2, 3); // 10, 8, 6
      expect(die.values).toEqual([10, 8, 6]);
    });

    it('should throw error for invalid count', () => {
      expect(() => DicePresets.createArithmeticDie(1, 1, 0)).toThrow('Count must be positive');
    });
  });

  describe('createGeometricDie', () => {
    it('should create geometric progression die', () => {
      const die = DicePresets.createGeometricDie(2, 3, 4); // 2, 6, 18, 54
      expect(die.values).toEqual([2, 6, 18, 54]);
    });

    it('should handle fractional ratios', () => {
      const die = DicePresets.createGeometricDie(8, 0.5, 3); // 8, 4, 2
      expect(die.values).toEqual([8, 4, 2]);
    });

    it('should throw error for zero start value', () => {
      expect(() => DicePresets.createGeometricDie(0, 2, 3)).toThrow('Start value cannot be zero for geometric progression');
    });

    it('should throw error for invalid count', () => {
      expect(() => DicePresets.createGeometricDie(1, 2, 0)).toThrow('Count must be positive');
    });

    it('should handle fractional values when rounding is disabled', () => {
      const die = DicePresets.createGeometricDie(1, 1.5, 4, false); // 1, 1.5, 2.25, 3.375
      expect(die.values).toEqual([1, 1.5, 2.25, 3.375]);
    });
  });

  describe('createWeightedDie', () => {
    it('should create weighted die with correct numeric distribution', () => {
      const weights = [
        { value: 1, weight: 2 },
        { value: 2, weight: 1 },
        { value: 3, weight: 3 }
      ];
      const die = DicePresets.createWeightedDie(weights);
      expect(die.values).toEqual([1, 1, 2, 3, 3, 3]);
      expect(die.getProbability(1)).toBeCloseTo(2/6);
      expect(die.getProbability(2)).toBeCloseTo(1/6);
      expect(die.getProbability(3)).toBeCloseTo(3/6);
    });

    it('should create weighted die with string values', () => {
      const weights = [
        { value: 'Common', weight: 3 },
        { value: 'Rare', weight: 1 }
      ];
      const die = DicePresets.createWeightedDie(weights);
      expect(die.values).toEqual(['Common', 'Common', 'Common', 'Rare']);
      expect(die.getProbability('Common')).toBeCloseTo(3/4);
      expect(die.getProbability('Rare')).toBeCloseTo(1/4);
    });

    it('should throw error for empty weights', () => {
      expect(() => DicePresets.createWeightedDie([])).toThrow('Value weights array cannot be empty');
    });

    it('should throw error for non-positive weights', () => {
      expect(() => DicePresets.createWeightedDie([{ value: 1, weight: 0 }])).toThrow('Weight must be positive');
      expect(() => DicePresets.createWeightedDie([{ value: 1, weight: -1 }])).toThrow('Weight must be positive');
    });
  });
});

describe('CustomDie with deterministic random', () => {
  it('should work with custom random function', () => {
    let callCount = 0;
    const mockRandom = () => {
      const values = [0, 0.25, 0.5, 0.75, 0.99];
      return values[callCount++ % values.length];
    };

    const die = new CustomDie([10, 20, 30, 40], mockRandom);
    
    // First call: 0 * 4 = 0 -> index 0 -> value 10
    expect(die.roll()).toBe(10);
    // Second call: 0.25 * 4 = 1 -> index 1 -> value 20
    expect(die.roll()).toBe(20);
    // Third call: 0.5 * 4 = 2 -> index 2 -> value 30
    expect(die.roll()).toBe(30);
    // Fourth call: 0.75 * 4 = 3 -> index 3 -> value 40
    expect(die.roll()).toBe(40);
    // Fifth call: 0.99 * 4 = 3.96 -> floor = 3 -> index 3 -> value 40
    expect(die.roll()).toBe(40);
  });
});
