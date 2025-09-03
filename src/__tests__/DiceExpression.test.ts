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

    it('should throw error for zero dice expressions', () => {
      expect(() => new DiceExpression('0d6')).toThrow('At least one die is required, got 0 dice in: 0d6');
      expect(() => new DiceExpression('0d20')).toThrow('At least one die is required, got 0 dice in: 0d20');
      expect(() => new DiceExpression('2d6+0d4')).toThrow('At least one die is required, got 0 dice in: 0d4');
    });

    it('should throw error for negative dice expressions', () => {
      // Note: negative dice counts will be parsed as operator + dice, causing structure error
      expect(() => new DiceExpression('-1d6')).toThrow('Expression cannot start with an operator');
      expect(() => new DiceExpression('-2d20')).toThrow('Expression cannot start with an operator');
    });

    it('should reject expressions that are too long to prevent ReDoS attacks', () => {
      const longExpression = '9'.repeat(1001);
      expect(() => new DiceExpression(longExpression)).toThrow('Dice expression too long (maximum 1000 characters)');
    });

    it('should handle potential ReDoS patterns efficiently', () => {
      const start = Date.now();
      
      // This pattern could cause exponential backtracking with the old regex
      const maliciousInput = '9'.repeat(100);
      
      try {
        new DiceExpression(maliciousInput);
      } catch (error) {
        // Expected to throw an error for invalid input
      }
      
      const elapsed = Date.now() - start;
      
      // Should complete very quickly (under 100ms even on slow systems)
      expect(elapsed).toBeLessThan(100);
    });

    it('should handle complex malicious ReDoS patterns efficiently', () => {
      const testCases = [
        '9'.repeat(50),  // Many digits without 'd'
        '9'.repeat(50) + 'x',  // Many digits followed by invalid character
        '9'.repeat(20) + 'd' + '9'.repeat(20) + 'x',  // Almost valid dice notation
      ];

      testCases.forEach(testCase => {
        const start = Date.now();
        
        try {
          new DiceExpression(testCase);
        } catch (error) {
          // Expected to throw an error for invalid input
        }
        
        const elapsed = Date.now() - start;
        
        // Each test should complete very quickly
        expect(elapsed).toBeLessThan(50);
      });
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

    it('should respect mathematical operator precedence', () => {
      // Mock for predictable results
      const mockRandom = jest.fn().mockReturnValue(0.5);
      const originalRandom = Math.random;
      Math.random = mockRandom;

      try {
        const expr = new DiceExpression('d6+2*3');
        // Should be 4 + (2 * 3) = 10, with mathematical precedence
        const result = expr.evaluate();
        expect(result).toBe(10);
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

  describe('parentheses support', () => {
    it('should parse simple parentheses expressions', () => {
      const expr = new DiceExpression('(3d6)');
      const parts = expr.getParts();
      expect(parts).toHaveLength(1);
      expect(parts[0].type).toBe('parentheses');
      expect(parts[0].subExpression).toHaveLength(1);
      expect(parts[0].subExpression![0].type).toBe('dice');
    });

    it('should parse complex parentheses expressions', () => {
      const expr = new DiceExpression('(2d6+3)*2');
      const parts = expr.getParts();
      expect(parts).toHaveLength(3);
      expect(parts[0].type).toBe('parentheses');
      expect(parts[1].operator).toBe('*');
      expect(parts[2].type).toBe('constant');
      expect(parts[2].value).toBe(2);
    });

    it('should parse nested parentheses', () => {
      const expr = new DiceExpression('(2d6+(1d4*2))');
      const parts = expr.getParts();
      expect(parts).toHaveLength(1);
      expect(parts[0].type).toBe('parentheses');
      expect(parts[0].subExpression).toHaveLength(3);
    });

    it('should evaluate parentheses with correct precedence', () => {
      const mockRandom = jest.fn()
        .mockReturnValueOnce(0.5) // d6 = 4
        .mockReturnValueOnce(0.5) // d6 = 4
        .mockReturnValueOnce(0.5); // d4 = 3

      const originalRandom = Math.random;
      Math.random = mockRandom;

      try {
        const expr = new DiceExpression('(2d6+1d4)*2');
        const result = expr.evaluate();
        expect(result).toBe(22); // (4 + 4 + 3) * 2 = 22
      } finally {
        Math.random = originalRandom;
      }
    });

    it('should evaluate nested parentheses correctly', () => {
      const mockRandom = jest.fn()
        .mockReturnValueOnce(0.5) // d6 = 4
        .mockReturnValueOnce(0.5) // d6 = 4
        .mockReturnValueOnce(0.5); // d4 = 3

      const originalRandom = Math.random;
      Math.random = mockRandom;

      try {
        const expr = new DiceExpression('2d6+(1d4*3)');
        const result = expr.evaluate();
        expect(result).toBe(17); // 4 + 4 + (3 * 3) = 17
      } finally {
        Math.random = originalRandom;
      }
    });

    it('should handle dice inside parentheses for dice count', () => {
      // This should parse but not evaluate because (1d4+2)d6 is not supported yet
      expect(() => new DiceExpression('(1d4+2)d6')).toThrow('Unexpected token: d6');
    });

    it('should calculate min/max values for parentheses expressions', () => {
      const expr = new DiceExpression('(2d6+3)*2');
      expect(expr.getMinValue()).toBe(10); // (2 + 3) * 2 = 10
      expect(expr.getMaxValue()).toBe(30); // (12 + 3) * 2 = 30
    });

    it('should handle parentheses toString correctly', () => {
      const expr = new DiceExpression('(2d6+3)*2');
      expect(expr.toString()).toBe('(2d6+3)*2');
    });

    it('should throw error for unmatched parentheses', () => {
      expect(() => new DiceExpression('(2d6+3')).toThrow('Unmatched opening parenthesis');
      expect(() => new DiceExpression('2d6+3)')).toThrow('Unexpected token: )');
    });

    it('should handle empty parentheses', () => {
      expect(() => new DiceExpression('()')).toThrow('Unexpected end of expression');
    });

    it('should handle complex mathematical precedence with parentheses', () => {
      const mockRandom = jest.fn().mockReturnValue(0.5); // All dice = middle value

      const originalRandom = Math.random;
      Math.random = mockRandom;

      try {
        const expr = new DiceExpression('d6+2*3+(d4*2)');
        const result = expr.evaluate();
        // d6 = 4, d4 = 3
        // 4 + (2 * 3) + (3 * 2) = 4 + 6 + 6 = 16
        expect(result).toBe(16);
      } finally {
        Math.random = originalRandom;
      }
    });
  });

  describe('conditional operators', () => {
    it('should parse conditional dice expressions', () => {
      const expr = new DiceExpression('3d6>4');
      const parts = expr.getParts();
      expect(parts).toHaveLength(1);
      expect(parts[0].type).toBe('conditional');
      expect(parts[0].count).toBe(3);
      expect(parts[0].sides).toBe(6);
      expect(parts[0].condition).toBe('>');
      expect(parts[0].threshold).toBe(4);
    });

    it('should parse different conditional operators', () => {
      const testCases = [
        { expr: '4d6>=4', condition: '>=', threshold: 4 },
        { expr: '2d8<3', condition: '<', threshold: 3 },
        { expr: '5d10<=6', condition: '<=', threshold: 6 },
        { expr: '3d6=4', condition: '=', threshold: 4 },
        { expr: '2d20==15', condition: '==', threshold: 15 },
      ];

      testCases.forEach(testCase => {
        const expr = new DiceExpression(testCase.expr);
        const parts = expr.getParts();
        expect(parts[0].condition).toBe(testCase.condition);
        expect(parts[0].threshold).toBe(testCase.threshold);
      });
    });

    it('should evaluate conditional dice and count successes', () => {
      const mockRandom = jest.fn()
        .mockReturnValueOnce(0.8) // d6 = 5
        .mockReturnValueOnce(0.5) // d6 = 4  
        .mockReturnValueOnce(0.2); // d6 = 2

      const originalRandom = Math.random;
      Math.random = mockRandom;

      try {
        const expr = new DiceExpression('3d6>3');
        const result = expr.evaluate();
        // Rolls: 5, 4, 2 - two are > 3
        expect(result).toBe(2);
      } finally {
        Math.random = originalRandom;
      }
    });

    it('should handle >= conditional operator', () => {
      const mockRandom = jest.fn()
        .mockReturnValueOnce(0.8) // d6 = 5
        .mockReturnValueOnce(0.5) // d6 = 4
        .mockReturnValueOnce(0.5); // d6 = 4

      const originalRandom = Math.random;
      Math.random = mockRandom;

      try {
        const expr = new DiceExpression('3d6>=4');
        const result = expr.evaluate();
        // Rolls: 5, 4, 4 - all three are >= 4
        expect(result).toBe(3);
      } finally {
        Math.random = originalRandom;
      }
    });

    it('should handle < conditional operator', () => {
      const mockRandom = jest.fn()
        .mockReturnValueOnce(0.1) // d6 = 1
        .mockReturnValueOnce(0.3) // d6 = 2
        .mockReturnValueOnce(0.8); // d6 = 5

      const originalRandom = Math.random;
      Math.random = mockRandom;

      try {
        const expr = new DiceExpression('3d6<4');
        const result = expr.evaluate();
        // Rolls: 1, 2, 5 - two are < 4
        expect(result).toBe(2);
      } finally {
        Math.random = originalRandom;
      }
    });

    it('should handle = conditional operator', () => {
      const mockRandom = jest.fn()
        .mockReturnValueOnce(0.5) // d6 = 4
        .mockReturnValueOnce(0.5) // d6 = 4
        .mockReturnValueOnce(0.8); // d6 = 5

      const originalRandom = Math.random;
      Math.random = mockRandom;

      try {
        const expr = new DiceExpression('3d6=4');
        const result = expr.evaluate();
        // Rolls: 4, 4, 5 - two are = 4
        expect(result).toBe(2);
      } finally {
        Math.random = originalRandom;
      }
    });

    it('should handle conditional dice in complex expressions', () => {
      const mockRandom = jest.fn()
        .mockReturnValueOnce(0.8) // d6 = 5
        .mockReturnValueOnce(0.8) // d6 = 5
        .mockReturnValueOnce(0.5) // d8 = 5
        .mockReturnValueOnce(0.3); // d8 = 3

      const originalRandom = Math.random;
      Math.random = mockRandom;

      try {
        const expr = new DiceExpression('2d6>4+2d8>=4');
        const result = expr.evaluate();
        // 2d6>4: rolls 5,5 - both > 4 = 2 successes
        // 2d8>=4: rolls 5,3 - one >= 4 = 1 success
        // Total: 2 + 1 = 3
        expect(result).toBe(3);
      } finally {
        Math.random = originalRandom;
      }
    });

    it('should handle conditional dice with parentheses', () => {
      const mockRandom = jest.fn()
        .mockReturnValueOnce(0.8) // d6 = 5
        .mockReturnValueOnce(0.8) // d6 = 5
        .mockReturnValueOnce(0.5) // d4 = 3
        .mockReturnValueOnce(0.8); // d4 = 4

      const originalRandom = Math.random;
      Math.random = mockRandom;

      try {
        const expr = new DiceExpression('(2d6>4+2d4>=3)*2');
        const result = expr.evaluate();
        // 2d6>4: rolls 5,5 - both > 4 = 2 successes
        // 2d4>=3: rolls 3,4 - both >= 3 = 2 successes
        // (2 + 2) * 2 = 8
        expect(result).toBe(8);
      } finally {
        Math.random = originalRandom;
      }
    });

    it('should calculate correct min/max values for conditional dice', () => {
      const expr = new DiceExpression('3d6>4');
      expect(expr.getMinValue()).toBe(0); // No dice could succeed
      expect(expr.getMaxValue()).toBe(3); // All dice could succeed
    });

    it('should handle conditional dice toString correctly', () => {
      const expr = new DiceExpression('3d6>4');
      expect(expr.toString()).toBe('3d6>4');
    });

    it('should handle multiple conditional operators in toString', () => {
      const testCases = [
        { expr: '4d6>=4', expected: '4d6>=4' },
        { expr: '2d8<3', expected: '2d8<3' },
        { expr: '5d10<=6', expected: '5d10<=6' },
        { expr: '3d6=4', expected: '3d6=4' },
        { expr: '2d20==15', expected: '2d20==15' },
      ];

      testCases.forEach(testCase => {
        const expr = new DiceExpression(testCase.expr);
        expect(expr.toString()).toBe(testCase.expected);
      });
    });

    it('should throw error for invalid conditional operators', () => {
      // != fails at tokenization level since ! isn't valid
      expect(() => new DiceExpression('3d6!=4')).toThrow('Invalid dice expression');
      // <> gets tokenized but is rejected as invalid conditional operator
      expect(() => new DiceExpression('3d6<>4')).toThrow('Invalid conditional operator: <>');
    });

    it('should handle no successes correctly', () => {
      const mockRandom = jest.fn()
        .mockReturnValueOnce(0.1) // d6 = 1
        .mockReturnValueOnce(0.2) // d6 = 2
        .mockReturnValueOnce(0.3); // d6 = 2

      const originalRandom = Math.random;
      Math.random = mockRandom;

      try {
        const expr = new DiceExpression('3d6>5');
        const result = expr.evaluate();
        // Rolls: 1, 2, 2 - none are > 5
        expect(result).toBe(0);
      } finally {
        Math.random = originalRandom;
      }
    });
  });
});
