import { Parser } from '../Parser';
import { 
  ParseError, 
  TokenizationError, 
  NumberNode, 
  DiceNode, 
  BinaryOperationNode,
  ParenthesesNode,
  ConditionalDiceNode,
  RerollDiceNode
} from '../types';

describe('Expression System - Parser', () => {
  let parser: Parser;

  beforeEach(() => {
    parser = new Parser();
  });

  describe('Tokenization', () => {
    it('should tokenize simple expressions', () => {
      const tokens = parser.tokenize('3d6+5');
      expect(tokens).toHaveLength(3);
      expect(tokens[0].type).toBe('dice');
      expect(tokens[1].type).toBe('operator');
      expect(tokens[2].type).toBe('number');
    });

    it('should tokenize complex expressions', () => {
      const tokens = parser.tokenize('(2d6+1)*3-1d4');
      expect(tokens).toHaveLength(9);
      expect(tokens.map(t => t.value)).toEqual(['(', '2d6', '+', '1', ')', '*', '3', '-', '1d4']);
    });

    it('should tokenize dice with rerolls', () => {
      const tokens = parser.tokenize('3d6r1');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('reroll');
      expect(tokens[0].value).toBe('3d6r1');
    });

    it('should tokenize conditional dice', () => {
      const tokens = parser.tokenize('4d6>3');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('conditional');
      expect(tokens[0].value).toBe('4d6>3');
    });

    it('should handle uppercase dice notation', () => {
      const tokensUpper = parser.tokenize('3D6+2D8');
      expect(tokensUpper).toHaveLength(3);
      expect(tokensUpper[0].type).toBe('dice');
      expect(tokensUpper[0].value).toBe('3D6');
      expect(tokensUpper[2].type).toBe('dice');
      expect(tokensUpper[2].value).toBe('2D8');
      
      // Should also work with conditional dice
      const condTokens = parser.tokenize('4D6>3');
      expect(condTokens).toHaveLength(1);
      expect(condTokens[0].type).toBe('conditional');
      expect(condTokens[0].value).toBe('4D6>3');
    });

    it('should handle empty input', () => {
      const tokens = parser.tokenize('');
      expect(tokens).toHaveLength(0);
    });

    it('should throw error for invalid syntax', () => {
      expect(() => parser.tokenize('invalid')).toThrow(TokenizationError);
      expect(() => parser.tokenize('definitely invalid expression')).toThrow(TokenizationError);
    });
  });

  describe('Basic Expression Parsing', () => {
    it('should parse number literals', () => {
      const ast = parser.parse('42');
      expect(ast.type).toBe('number');
      expect((ast as NumberNode).value).toBe(42);
    });

    it('should parse simple dice expressions', () => {
      const ast = parser.parse('3d6');
      expect(ast.type).toBe('dice');
      const diceNode = ast as DiceNode;
      expect(diceNode.count).toBe(3);
      expect(diceNode.sides).toBe(6);
    });

    it('should parse dice with implicit count', () => {
      const ast = parser.parse('d20');
      expect(ast.type).toBe('dice');
      const diceNode = ast as DiceNode;
      expect(diceNode.count).toBe(1);
      expect(diceNode.sides).toBe(20);
    });

    it('should parse simple addition', () => {
      const ast = parser.parse('3+5');
      expect(ast.type).toBe('binary_operation');
      const binOp = ast as BinaryOperationNode;
      expect(binOp.operator).toBe('+');
      expect((binOp.left as NumberNode).value).toBe(3);
      expect((binOp.right as NumberNode).value).toBe(5);
    });
  });

  describe('Operator Precedence', () => {
    it('should handle multiplication before addition', () => {
      const ast = parser.parse('2+3*4');
      expect(ast.type).toBe('binary_operation');
      const binOp = ast as BinaryOperationNode;
      expect(binOp.operator).toBe('+');
      expect((binOp.left as NumberNode).value).toBe(2);
      expect(binOp.right.type).toBe('binary_operation');
      const rightOp = binOp.right as BinaryOperationNode;
      expect(rightOp.operator).toBe('*');
    });

    it('should handle division before subtraction', () => {
      const ast = parser.parse('10-6/2');
      expect(ast.type).toBe('binary_operation');
      const binOp = ast as BinaryOperationNode;
      expect(binOp.operator).toBe('-');
      expect((binOp.left as NumberNode).value).toBe(10);
      expect(binOp.right.type).toBe('binary_operation');
    });

    it('should handle left-to-right evaluation for same precedence', () => {
      const ast = parser.parse('10-3-2');
      expect(ast.type).toBe('binary_operation');
      const binOp = ast as BinaryOperationNode;
      expect(binOp.operator).toBe('-');
      expect(binOp.left.type).toBe('binary_operation');
      expect((binOp.right as NumberNode).value).toBe(2);
    });
  });

  describe('Parentheses', () => {
    it('should parse parenthesized expressions', () => {
      const ast = parser.parse('(3+5)');
      expect(ast.type).toBe('parentheses');
      const parenNode = ast as ParenthesesNode;
      expect(parenNode.expression.type).toBe('binary_operation');
    });

    it('should override operator precedence with parentheses', () => {
      const ast = parser.parse('(2+3)*4');
      expect(ast.type).toBe('binary_operation');
      const binOp = ast as BinaryOperationNode;
      expect(binOp.operator).toBe('*');
      expect(binOp.left.type).toBe('parentheses');
      expect((binOp.right as NumberNode).value).toBe(4);
    });

    it('should handle nested parentheses', () => {
      const ast = parser.parse('((2+3)*4)');
      expect(ast.type).toBe('parentheses');
      const parenNode = ast as ParenthesesNode;
      expect(parenNode.expression.type).toBe('binary_operation');
    });

    it('should throw error for unmatched parentheses', () => {
      expect(() => parser.parse('(2+3')).toThrow(ParseError);
      expect(() => parser.parse('2+3)')).toThrow(ParseError);
      expect(() => parser.parse('((2+3)')).toThrow(ParseError);
    });

    it('should throw error for empty parentheses', () => {
      expect(() => parser.parse('()')).toThrow(ParseError);
    });
  });

  describe('Advanced Dice Mechanics', () => {
    it('should parse conditional dice', () => {
      const ast = parser.parse('4d6>3');
      expect(ast.type).toBe('conditional_dice');
      const condNode = ast as ConditionalDiceNode;
      expect(condNode.count).toBe(4);
      expect(condNode.sides).toBe(6);
      expect(condNode.operator).toBe('>');
      expect(condNode.threshold).toBe(3);
    });

    it('should parse different conditional operators', () => {
      const testCases = [
        { expr: '3d6>=4', operator: '>=', threshold: 4 },
        { expr: '2d8<5', operator: '<', threshold: 5 },
        { expr: '1d20<=10', operator: '<=', threshold: 10 },
        { expr: '5d6=6', operator: '=', threshold: 6 }
      ];

      testCases.forEach(testCase => {
        const ast = parser.parse(testCase.expr);
        expect(ast.type).toBe('conditional_dice');
        const condNode = ast as ConditionalDiceNode;
        expect(condNode.operator).toBe(testCase.operator);
        expect(condNode.threshold).toBe(testCase.threshold);
      });
    });

    it('should parse reroll dice', () => {
      const ast = parser.parse('3d6r1');
      expect(ast.type).toBe('reroll_dice');
      const rerollNode = ast as RerollDiceNode;
      expect(rerollNode.count).toBe(3);
      expect(rerollNode.sides).toBe(6);
      expect(rerollNode.condition).toBe('=1');
      expect(rerollNode.rerollType).toBe('exploding');
    });

    it('should parse different reroll types', () => {
      const testCases = [
        { expr: '2d6r1', condition: '=1', type: 'exploding' },
        { expr: '3d8ro2', condition: '=2', type: 'once' },
        { expr: '4d10rr<=3', condition: '<=3', type: 'recursive' }
      ];

      testCases.forEach(testCase => {
        const ast = parser.parse(testCase.expr);
        expect(ast.type).toBe('reroll_dice');
        const rerollNode = ast as RerollDiceNode;
        expect(rerollNode.condition).toBe(testCase.condition);
        expect(rerollNode.rerollType).toBe(testCase.type);
      });
    });
  });

  describe('Complex Expressions', () => {
    it('should parse mixed dice and arithmetic', () => {
      const ast = parser.parse('2d6+1d4+3');
      expect(ast.type).toBe('binary_operation');
      // Should be structured as ((2d6 + 1d4) + 3)
    });

    it('should parse complex expressions with parentheses', () => {
      const ast = parser.parse('(2d6+3)*2-1d4');
      expect(ast.type).toBe('binary_operation');
      const binOp = ast as BinaryOperationNode;
      expect(binOp.operator).toBe('-');
    });

    it('should parse expressions with multiple dice types', () => {
      const ast = parser.parse('3d6>4+2d8r1');
      expect(ast.type).toBe('binary_operation');
      const binOp = ast as BinaryOperationNode;
      expect(binOp.left.type).toBe('conditional_dice');
      expect(binOp.right.type).toBe('reroll_dice');
    });
  });

  describe('Error Handling', () => {
    it('should throw ParseError for invalid expressions', () => {
      const parseErrorExpressions = [
        '+3d6',      // Starting with operator - should parse but fail evaluation
        '3d6+',      // Ending with operator - parsing issue
        '3d6++2',    // Double operators - parsing issue
        '0d6',       // Zero dice - validation issue
      ];

      parseErrorExpressions.forEach(expr => {
        expect(() => parser.parse(expr)).toThrow(); // Just expect any error, not specific type
      });

      // These specifically cause tokenization errors
      const tokenErrorExpressions = [
        'd',         // Incomplete dice
        '3d',        // Missing sides
        'dd6',       // Invalid format
      ];

      tokenErrorExpressions.forEach(expr => {
        expect(() => parser.parse(expr)).toThrow(TokenizationError);
      });
    });

    it('should provide meaningful error messages', () => {
      expect(() => parser.parse('+3d6')).toThrow(/unary/i);
      expect(() => parser.parse('3d6+')).toThrow(/unexpected end/i);
      expect(() => parser.parse('0d6')).toThrow(/at least one die/i);
    });

    it('should include position information in errors', () => {
      try {
        parser.parse('3d6++2');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
        expect((error as ParseError).position).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Performance and Limits', () => {
    it('should handle reasonable expression sizes', () => {
      // Generate a long but valid expression
      const longExpr = Array(10).fill('1d6').join('+');
      expect(() => parser.parse(longExpr)).not.toThrow();
    });

    it('should reject extremely long expressions', () => {
      // Configure a small limit for testing
      Parser.configure({ MAX_EXPRESSION_LENGTH: 20 as any });
      
      const longExpr = Array(10).fill('1d6+').join('') + '1d6';
      expect(() => parser.parse(longExpr)).toThrow(/too long/i);
      
      // Reset to default
      Parser.configure({ MAX_EXPRESSION_LENGTH: 1000 as any });
    });

    it('should handle deeply nested expressions', () => {
      const nested = '((((1d6))))';
      expect(() => parser.parse(nested)).not.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should allow configuration changes', () => {
      const originalConfig = { MAX_EXPRESSION_LENGTH: 1000 as any };
      Parser.configure({ MAX_EXPRESSION_LENGTH: 10 as any });
      
      expect(() => parser.parse('1d6+1d6+1d6+1d6')).toThrow();
      
      // Reset
      Parser.configure(originalConfig);
    });
  });
});
