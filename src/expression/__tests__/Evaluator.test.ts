import { Evaluator } from '../Evaluator';
import { ExpressionContext } from '../ExpressionContext';
import { Parser } from '../Parser';
import { 
  EvaluationError, 
  MaxRerollsExceededError,
  NumberNode,
  DiceNode,
  BinaryOperationNode
} from '../types';

describe('Expression System - Evaluator', () => {
  let evaluator: Evaluator;
  let parser: Parser;
  let mockContext: ExpressionContext;

  beforeEach(() => {
    evaluator = new Evaluator();
    parser = new Parser();
    
    // Create a context with seeded random for predictable tests
    mockContext = ExpressionContext.createTestContext(12345, {
      maxRerolls: 10,
      debugMode: false
    });
  });

  describe('Basic Evaluation', () => {
    it('should evaluate number literals', () => {
      const ast = parser.parse('42');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(42);
    });

    it('should evaluate simple arithmetic', () => {
      const testCases = [
        { expr: '3+5', expected: 8 },
        { expr: '10-4', expected: 6 },
        { expr: '6*7', expected: 42 },
        { expr: '15/3', expected: 5 }
      ];

      testCases.forEach(testCase => {
        const ast = parser.parse(testCase.expr);
        const result = evaluator.evaluate(ast, mockContext);
        expect(result).toBe(testCase.expected);
      });
    });

    it('should handle operator precedence correctly', () => {
      const testCases = [
        { expr: '2+3*4', expected: 14 },  // 2 + (3 * 4)
        { expr: '10-6/2', expected: 7 }, // 10 - (6 / 2)
        { expr: '2*3+4', expected: 10 }, // (2 * 3) + 4
        { expr: '12/3-2', expected: 2 } // (12 / 3) - 2
      ];

      testCases.forEach(testCase => {
        const ast = parser.parse(testCase.expr);
        const result = evaluator.evaluate(ast, mockContext);
        expect(result).toBe(testCase.expected);
      });
    });

    it('should handle parentheses correctly', () => {
      const testCases = [
        { expr: '(2+3)*4', expected: 20 },
        { expr: '2*(3+4)', expected: 14 },
        { expr: '(10-6)/2', expected: 2 },
        { expr: '((2+3)*4)', expected: 20 }
      ];

      testCases.forEach(testCase => {
        const ast = parser.parse(testCase.expr);
        const result = evaluator.evaluate(ast, mockContext);
        expect(result).toBe(testCase.expected);
      });
    });
  });

  describe('Dice Evaluation', () => {
    it('should evaluate simple dice expressions', () => {
      const ast = parser.parse('1d6');
      const result = evaluator.evaluate(ast, mockContext);
      
      // With seeded random, result should be predictable
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    });

    it('should evaluate multiple dice', () => {
      const ast = parser.parse('3d6');
      const result = evaluator.evaluate(ast, mockContext);
      
      expect(result).toBeGreaterThanOrEqual(3);
      expect(result).toBeLessThanOrEqual(18);
    });

    it('should handle dice with arithmetic', () => {
      const ast = parser.parse('1d6+3');
      const result = evaluator.evaluate(ast, mockContext);
      
      expect(result).toBeGreaterThanOrEqual(4);
      expect(result).toBeLessThanOrEqual(9);
    });

    it('should track dice rolls in detailed results', () => {
      const ast = parser.parse('2d6');
      const result = evaluator.evaluateWithDetails(ast, mockContext);
      
      expect(result.rolls).toHaveLength(2);
      expect(result.rolls.every(roll => roll >= 1 && roll <= 6)).toBe(true);
      expect(result.value).toBe(result.rolls.reduce((sum, roll) => sum + roll, 0));
    });
  });

  describe('Advanced Dice Mechanics', () => {
    it('should evaluate conditional dice (success counting)', () => {
      // Create context with seeded random to test success counting
      const controlledContext = ExpressionContext.createTestContext(999999);
      
      const ast = parser.parse('3d6>3');
      const result = evaluator.evaluate(ast, controlledContext);
      
      // Result should be between 0 and 3 successes
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(3);
    });

    it('should handle different conditional operators', () => {
      const testCases = [
        { expr: '1d6>3', description: 'greater than' },
        { expr: '1d6>=4', description: 'greater than or equal' },
        { expr: '1d6<4', description: 'less than' },
        { expr: '1d6<=3', description: 'less than or equal' },
        { expr: '1d6=6', description: 'equal to' }
      ];

      testCases.forEach(testCase => {
        const ast = parser.parse(testCase.expr);
        expect(() => evaluator.evaluate(ast, mockContext)).not.toThrow();
      });
    });

    it('should evaluate reroll dice', () => {
      const ast = parser.parse('1d6r1');
      const result = evaluator.evaluate(ast, mockContext);
      
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    });

    it('should handle different reroll types', () => {
      const testCases = [
        { expr: '1d6r1', type: 'exploding' },
        { expr: '1d6ro1', type: 'once' },
        { expr: '1d6rr1', type: 'recursive' }
      ];

      testCases.forEach(testCase => {
        const ast = parser.parse(testCase.expr);
        expect(() => evaluator.evaluate(ast, mockContext)).not.toThrow();
      });
    });

    it('should prevent infinite reroll loops', () => {
      // Create context with specific seed that might cause rerolls
      const infiniteContext = ExpressionContext.createTestContext(12345, {
        maxRerolls: 5
      });
      
      const ast = parser.parse('1d6rr1');
      // Should complete without infinite loop (may or may not throw based on random results)
      expect(() => evaluator.evaluate(ast, infiniteContext)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should throw EvaluationError for division by zero', () => {
      const ast = parser.parse('10/0');
      expect(() => evaluator.evaluate(ast, mockContext)).toThrow('Division by zero is not allowed');
    });

    it('should handle invalid operators gracefully', () => {
      // Create a malformed AST node to test error handling
      const invalidNode: any = {
        type: 'binary_operation',
        operator: '%', // Unsupported operator
        left: { type: 'number', value: 5 },
        right: { type: 'number', value: 3 }
      };

      expect(() => evaluator.evaluate(invalidNode, mockContext)).toThrow(EvaluationError);
    });

    it('should handle unknown node types', () => {
      const unknownNode: any = {
        type: 'unknown_type',
        value: 42
      };

      expect(() => evaluator.evaluate(unknownNode, mockContext)).toThrow(EvaluationError);
    });

    it('should provide meaningful error messages', () => {
      try {
        const unknownNode: any = { type: 'invalid' };
        evaluator.evaluate(unknownNode, mockContext);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(EvaluationError);
        expect((error as EvaluationError).message).toContain('Unknown node type');
      }
    });
  });

  describe('Performance and Limits', () => {
    it('should handle complex expressions efficiently', () => {
      const complexExpr = '(2d6+3)*4-1d8+5*(3d4-2)';
      const ast = parser.parse(complexExpr);
      
      const startTime = Date.now();
      const result = evaluator.evaluate(ast, mockContext);
      const endTime = Date.now();
      
      expect(typeof result).toBe('number');
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    it('should respect reroll limits', () => {
      const limitedContext = ExpressionContext.createTestContext(12345, {
        maxRerolls: 2
      });
      
      // This would normally cause many rerolls but should stop at limit
      const ast = parser.parse('1d6rr6');
      expect(() => evaluator.evaluate(ast, limitedContext)).not.toThrow();
    });
  });

  describe('Context Integration', () => {
    it('should use provided random function', () => {
      let callCount = 0;
      const testContext = ExpressionContext.createTestContext(12345);
      
      const ast = parser.parse('1d6');
      evaluator.evaluate(ast, testContext);
      
      // Should use seeded random function
      expect(testContext.metrics.diceRolled).toBeGreaterThan(0);
    });

    it('should update context metrics', () => {
      const ast = parser.parse('2d6+3');
      evaluator.evaluate(ast, mockContext);
      
      expect(mockContext.metrics.diceRolled).toBeGreaterThan(0);
      expect(mockContext.metrics.nodesEvaluated).toBeGreaterThan(0);
    });

    it('should work without context (use defaults)', () => {
      const ast = parser.parse('1d6+2');
      expect(() => evaluator.evaluate(ast)).not.toThrow();
    });
  });

  describe('Detailed Evaluation', () => {
    it('should provide detailed results', () => {
      const ast = parser.parse('2d6+3');
      const result = evaluator.evaluateWithDetails(ast, mockContext);
      
      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('rolls');
      expect(result).toHaveProperty('minValue');
      expect(result).toHaveProperty('maxValue');
      expect(result).toHaveProperty('executionTime');
      
      expect(result.rolls).toHaveLength(2);
      expect(typeof result.executionTime).toBe('number');
    });

    it('should handle evaluation errors in detailed mode', () => {
      const invalidNode: any = { type: 'invalid' };
      const result = evaluator.evaluateWithDetails(invalidNode, mockContext);
      
      // Should return safe defaults on error
      expect(result.value).toBe(0);
      expect(result.rolls).toEqual([]);
    });
  });

  describe('Configuration', () => {
    it('should allow evaluator configuration', () => {
      Evaluator.configure({ MAX_REROLLS: 5 as any });
      
      const infiniteContext = ExpressionContext.createTestContext(12345);
      
      const ast = parser.parse('1d6rr1');
      // Should work with configuration
      expect(() => evaluator.evaluate(ast, infiniteContext)).not.toThrow();
      
      // Reset
      Evaluator.configure({ MAX_REROLLS: 100 as any });
    });
  });
});
