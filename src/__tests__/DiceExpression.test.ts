import { DiceExpression } from '../DiceExpression';

describe('DiceExpression', () => {
  describe('parsing', () => {
    it('should parse simple dice notation', () => {
      const expr = new DiceExpression('3d6');
      const parts = expr.getParts();
      expect(parts).toHaveLength(1);
      expect(parts[0].type).toBe('dice');
      expect(parts[0].count).toBe(3);
      expect(parts[0].sides).toBe(6);
    });

    it('should parse single die notation', () => {
      const expr = new DiceExpression('d20');
      const parts = expr.getParts();
      expect(parts).toHaveLength(1);
      expect(parts[0].type).toBe('dice');
      expect(parts[0].count).toBe(1);
      expect(parts[0].sides).toBe(20);
    });

    it('should parse dice with addition', () => {
      const expr = new DiceExpression('3d6+5');
      const parts = expr.getParts();
      expect(parts).toHaveLength(3);
      expect(parts[0].type).toBe('dice');
      expect(parts[1].type).toBe('operator');
      expect(parts[1].operator).toBe('+');
      expect(parts[2].type).toBe('constant');
      expect(parts[2].value).toBe(5);
    });

    it('should parse complex expressions', () => {
      const expr = new DiceExpression('2d8+1d4-2');
      const parts = expr.getParts();
      expect(parts).toHaveLength(5);
      expect(parts[0].type).toBe('dice');
      expect(parts[1].operator).toBe('+');
      expect(parts[2].type).toBe('dice');
      expect(parts[3].operator).toBe('-');
      expect(parts[4].type).toBe('constant');
    });

    it('should handle spaces in expressions', () => {
      const expr = new DiceExpression('3d6 + 5');
      const parts = expr.getParts();
      expect(parts).toHaveLength(3);
    });

    it('should throw error for invalid expressions', () => {
      expect(() => new DiceExpression('invalid')).toThrow();
      expect(() => new DiceExpression('3d')).toThrow();
      expect(() => new DiceExpression('d')).toThrow();
      expect(() => new DiceExpression('+3d6')).toThrow();
      expect(() => new DiceExpression('3d6+')).toThrow();
    });
  });

  describe('evaluation', () => {
    it('should evaluate simple dice expressions', () => {
      // Use a fixed random function for testing
      const mockRandom = jest.fn()
        .mockReturnValueOnce(0.5) // Should roll 4 on d6
        .mockReturnValueOnce(0.5) // Should roll 4 on d6
        .mockReturnValueOnce(0.5); // Should roll 4 on d6

      // Mock Math.random temporarily
      const originalRandom = Math.random;
      Math.random = mockRandom;

      try {
        const expr = new DiceExpression('3d6');
        const result = expr.evaluate();
        expect(result).toBe(12); // 3 * 4 = 12
      } finally {
        Math.random = originalRandom;
      }
    });

    it('should evaluate expressions with constants', () => {
      const expr = new DiceExpression('5');
      const result = expr.evaluate();
      expect(result).toBe(5);
    });

    it('should respect operator precedence (left to right)', () => {
      // Mock for predictable results
      const mockRandom = jest.fn().mockReturnValue(0.5);
      const originalRandom = Math.random;
      Math.random = mockRandom;

      try {
        const expr = new DiceExpression('d6+2*3');
        // Should be (4 + 2) * 3 = 18, not 4 + (2 * 3) = 10
        // Note: Our implementation is left-to-right, not mathematical precedence
        const result = expr.evaluate();
        expect(result).toBe(18);
      } finally {
        Math.random = originalRandom;
      }
    });
  });

  describe('min/max values', () => {
    it('should calculate correct min value for dice', () => {
      const expr = new DiceExpression('3d6');
      expect(expr.getMinValue()).toBe(3);
    });

    it('should calculate correct max value for dice', () => {
      const expr = new DiceExpression('3d6');
      expect(expr.getMaxValue()).toBe(18);
    });

    it('should calculate min/max for expressions with constants', () => {
      const expr = new DiceExpression('3d6+5');
      expect(expr.getMinValue()).toBe(8);
      expect(expr.getMaxValue()).toBe(23);
    });

    it('should handle subtraction in min/max calculations', () => {
      const expr = new DiceExpression('3d6-2');
      expect(expr.getMinValue()).toBe(1); // 3 - 2 = 1 (min dice - constant)
      expect(expr.getMaxValue()).toBe(16); // 18 - 2 = 16 (max dice - constant)
    });
  });

  describe('toString', () => {
    it('should return correct string representation', () => {
      const expr = new DiceExpression('3d6+5');
      expect(expr.toString()).toBe('3d6+5');
    });
  });
});
